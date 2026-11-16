"use client";

import { useState, useEffect } from "react";
import { getAdminHeaders, getAdminAuthToken } from "@/lib/auth-client";

interface ApprovalItem {
  id: string;
  execution_id: string;
  tool_name: string;
  proposed_action: string;
  payload: Record<string, any>;
  risk_level: string;
  status: string;
  created_at: string;
}

interface ToolItem {
  name: string;
  description: string;
  parameters: Record<string, string>;
  riskLevel: string;
  requiresApproval: boolean;
}

export function AgentOpsDashboard() {
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [tools, setTools] = useState<ToolItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [agentType, setAgentType] = useState<"support_triage" | "ops_orchestrator">("support_triage");
  const [shadowMode, setShadowMode] = useState(true);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [lastExecution, setLastExecution] = useState<any>(null);

  const loadData = async () => {
    const token = getAdminAuthToken();
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [appRes, toolsRes] = await Promise.all([
        fetch("/api/agents/approvals", { headers: getAdminHeaders() }),
        fetch("/api/agents/tools", { headers: getAdminHeaders() }),
      ]);

      if (appRes.ok) {
        const appJson = await appRes.json();
        setApprovals(appJson.data || []);
      }
      if (toolsRes.ok) {
        const toolsJson = await toolsRes.json();
        setTools(toolsJson.data || []);
      }
    } catch (err) {
      console.error("Failed to load agent approvals or tools:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTriggerAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) return;

    setTriggering(true);
    try {
      const res = await fetch("/api/agents/execute", {
        method: "POST",
        headers: getAdminHeaders(),
        body: JSON.stringify({
          agentType,
          input: { subject, description },
          shadowMode,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setLastExecution(data.data);
        loadData();
      } else {
        alert(data.error?.message || "Failed to trigger agent execution.");
      }
    } catch (err) {
      console.error("Error triggering agent execution:", err);
      alert("Network error connecting to agent execution engine.");
    } finally {
      setTriggering(false);
    }
  };

  const handleReviewApproval = async (approvalId: string, action: "approve" | "reject") => {
    try {
      await fetch(`/api/agents/approvals/${approvalId}/review`, {
        method: "POST",
        headers: getAdminHeaders(),
        body: JSON.stringify({
          action,
          comment: `Operator clicked ${action} from control deck.`,
        }),
      });
      loadData();
    } catch {
      setApprovals((prev) =>
        prev.map((a) => (a.id === approvalId ? { ...a, status: action === "approve" ? "approved" : "rejected" } : a))
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Trigger Console */}
      <div className="rounded-xl border border-line bg-surface p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-line pb-3">
          <div>
            <h2 className="text-sm font-semibold text-text flex items-center gap-2">
              <span>🤖</span>
              <span>Autonomous AI Operations Controller</span>
            </h2>
            <p className="text-xs text-muted">
              Trigger controlled operational agents with verified tool boundaries and human review gates.
            </p>
          </div>

          {/* Shadow Mode Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted">Execution Mode:</span>
            <button
              type="button"
              onClick={() => setShadowMode(!shadowMode)}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                shadowMode
                  ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                  : "bg-signal text-white"
              }`}
            >
              {shadowMode ? "🛡️ Shadow Mode (Audit Only)" : "⚡ Live Execution"}
            </button>
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleTriggerAgent} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <select
              value={agentType}
              onChange={(e) => setAgentType(e.target.value as any)}
              className="rounded-lg border border-line bg-ink px-3 py-2 text-xs text-text focus:border-signal"
            >
              <option value="support_triage">Support Triage & SLA Agent</option>
              <option value="ops_orchestrator">Operations Sprint Orchestrator</option>
            </select>
            <input
              type="text"
              placeholder="Incident Subject / Operational Request..."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="sm:col-span-2 rounded-lg border border-line bg-ink px-3 py-2 text-xs text-text placeholder-muted focus:border-signal"
              required
            />
          </div>

          <textarea
            placeholder="Detailed description, symptoms, logs, or customer context..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-lg border border-line bg-ink p-3 text-xs text-text focus:border-signal h-20"
          />

          <div className="flex justify-between items-center pt-1">
            <span className="text-[11px] text-muted">
              {shadowMode
                ? "Safe: Agent will synthesize decisions without altering database records."
                : "Active: High-risk operations will automatically pause for approval."}
            </span>
            <button
              type="submit"
              disabled={triggering}
              className="rounded-lg bg-signal px-4 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
            >
              {triggering ? "Executing Engine..." : "Execute Agent"}
            </button>
          </div>
        </form>

        {/* Last Execution Output */}
        {lastExecution && (
          <div className="rounded-lg border border-line bg-ink/70 p-4 space-y-2 animate-in fade-in">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-text flex items-center gap-1.5">
                <span className="text-signal">✓</span>
                <span>Execution Result [{lastExecution.status?.toUpperCase()}]</span>
              </span>
              <span className="font-mono text-[10px] text-muted">{lastExecution.id}</span>
            </div>

            {lastExecution.output?.recommendation && (
              <div className="space-y-1 text-xs">
                <div className="text-text">
                  <span className="text-muted">Recommended Priority:</span>{" "}
                  <span className="font-bold text-signal">
                    {lastExecution.output.recommendation.recommendedPriority?.toUpperCase()}
                  </span>{" "}
                  &middot; <span className="text-muted">Category:</span>{" "}
                  <span className="font-bold text-text">
                    {lastExecution.output.recommendation.category}
                  </span>
                </div>
                <div className="text-xs text-muted leading-relaxed">
                  {lastExecution.output.recommendation.reasoning}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Human-in-the-Loop Approvals Inbox */}
      <div className="rounded-xl border border-line bg-surface overflow-hidden shadow-sm">
        <div className="border-b border-line px-5 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-text flex items-center gap-2">
              <span>🛡️</span>
              <span>Human-in-the-Loop Approvals Inbox ({approvals.filter(a => a.status === "pending").length} Pending)</span>
            </h3>
            <p className="text-xs text-muted">
              High-risk actions require human authorization before execution.
            </p>
          </div>
          <button
            onClick={loadData}
            className="rounded-lg border border-line bg-ink px-2.5 py-1 text-xs text-muted hover:text-text"
          >
            🔄 Refresh
          </button>
        </div>

        <div className="divide-y divide-line">
          {approvals.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted">
              No pending approvals. All autonomous agent actions are within safe operating bounds.
            </div>
          ) : (
            approvals.map((app) => (
              <div key={app.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-signal">{app.tool_name}</span>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                        app.risk_level === "critical"
                          ? "bg-rose-500/15 text-rose-400"
                          : "bg-amber-500/15 text-amber-400"
                      }`}
                    >
                      {app.risk_level} RISK
                    </span>
                    <span className="rounded bg-ink px-2 py-0.5 text-[10px] font-mono text-text">
                      {app.status}
                    </span>
                  </div>
                  <p className="text-xs text-text leading-relaxed">{app.proposed_action}</p>
                  <div className="font-mono text-[10px] text-muted">
                    Execution ID: {app.execution_id} &middot; {new Date(app.created_at).toLocaleTimeString()}
                  </div>
                </div>

                {app.status === "pending" ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleReviewApproval(app.id, "reject")}
                      className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-400 hover:bg-rose-500/20"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleReviewApproval(app.id, "approve")}
                      className="rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500"
                    >
                      Approve & Execute
                    </button>
                  </div>
                ) : (
                  <span className="text-xs font-mono text-muted uppercase">{app.status}</span>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Registered Tools Catalog */}
      <div className="rounded-xl border border-line bg-surface p-5 shadow-sm space-y-4">
        <div>
          <h3 className="text-xs font-semibold text-text uppercase tracking-wider">
            Approved Tool Registry ({tools.length} Tools)
          </h3>
          <p className="text-xs text-muted">
            Strict tool boundaries with schema validation preventing arbitrary SQL or shell execution.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {tools.map((t) => (
            <div key={t.name} className="rounded-lg border border-line bg-ink/40 p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-signal">{t.name}</span>
                <span
                  className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                    t.requiresApproval ? "bg-rose-500/15 text-rose-400" : "bg-emerald-500/15 text-emerald-400"
                  }`}
                >
                  {t.requiresApproval ? "Approval Req." : "Autonomous"}
                </span>
              </div>
              <p className="text-xs text-muted leading-relaxed line-clamp-2">{t.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
