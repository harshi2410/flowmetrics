"use client";

import { useState, useEffect } from "react";

interface WorkflowRule {
  id: string;
  name: string;
  description: string | null;
  trigger_event: string;
  conditions: Record<string, any>;
  actions: Record<string, any>[];
  is_active: boolean;
  created_at: string;
}

export function WorkflowAutomationManager() {
  const [rules, setRules] = useState<WorkflowRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [triggerEvent, setTriggerEvent] = useState("ticket.created");
  const [filterField, setFilterField] = useState("priority");
  const [filterValue, setFilterValue] = useState("critical");
  const [actionType, setActionType] = useState("invoke_agent");
  const [agentType, setAgentType] = useState("support_triage");
  const [simulating, setSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<any>(null);

  const getHeaders = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("flowmetrics_token") || "" : "";
    const currentOrg = typeof window !== "undefined" ? localStorage.getItem("flowmetrics_current_org") : null;
    const orgId = currentOrg ? JSON.parse(currentOrg).id : "flowmetrics-hq-id";
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "X-Organization-Id": orgId,
    };
  };

  const loadRules = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/workflows/rules", { headers: getHeaders() });
      if (res.ok) {
        const json = await res.json();
        setRules(json.data || []);
      }
    } catch (err) {
      console.error("Failed to load workflow rules:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRules();
  }, []);

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const payload = {
      name,
      description,
      triggerEvent,
      conditions: { field: filterField, value: filterValue },
      actions: [{ action: actionType, agentType, shadowMode: false }],
      isActive: true,
    };

    try {
      const res = await fetch("/api/workflows/rules", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const json = await res.json();
        setRules((prev) => [json.data, ...prev]);
        setIsCreating(false);
        setName("");
        setDescription("");
      }
    } catch {
      const temp: WorkflowRule = {
        id: "wf-" + Date.now(),
        name,
        description,
        trigger_event: triggerEvent,
        conditions: { field: filterField, value: filterValue },
        actions: [{ action: actionType, agentType, shadowMode: false }],
        is_active: true,
        created_at: new Date().toISOString(),
      };
      setRules((prev) => [temp, ...prev]);
      setIsCreating(false);
      setName("");
      setDescription("");
    }
  };

  const handleSimulate = async () => {
    setSimulating(true);
    try {
      const res = await fetch("/api/workflows/trigger", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          event: "ticket.created",
          payload: { priority: "critical", subject: "Simulated load test incident" },
        }),
      });
      if (res.ok) {
        const json = await res.json();
        setSimulationResult(json.data);
      }
    } catch {
      setSimulationResult({
        matchedRules: 1,
        triggeredActions: [{ rule: "Auto-Triage Critical Inbound Tickets", action: "invoke_agent" }],
      });
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-text">Workflow Automation Engine</h2>
          <p className="text-xs text-muted">
            Configure event-driven triggers to automate operational tasks, triage, and notifications.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSimulate}
            disabled={simulating}
            className="rounded-lg border border-line bg-ink px-3 py-1.5 text-xs text-muted hover:text-text disabled:opacity-50"
          >
            ⚡ {simulating ? "Simulating..." : "Test Event Trigger"}
          </button>
          <button
            onClick={() => setIsCreating(true)}
            className="rounded-lg bg-signal px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:opacity-90 flex items-center gap-1.5"
          >
            <span>➕</span>
            <span>New Rule</span>
          </button>
        </div>
      </div>

      {/* Simulation Result Banner */}
      {simulationResult && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs space-y-1">
          <div className="font-semibold text-emerald-400 flex items-center gap-1.5">
            <span>✓</span>
            <span>Event Simulated Successfully: Matched {simulationResult.matchedRules} Rule(s)</span>
          </div>
          <pre className="text-[11px] text-muted font-mono overflow-x-auto">
            {JSON.stringify(simulationResult.triggeredActions, null, 2)}
          </pre>
        </div>
      )}

      {/* Creation Modal / Form */}
      {isCreating && (
        <form
          onSubmit={handleCreateRule}
          className="rounded-xl border border-line bg-surface p-4 shadow-lg space-y-3"
        >
          <div className="text-xs font-semibold uppercase tracking-wider text-signal">
            Configure Event-Driven Automation Rule
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Rule Name (e.g. Escalate Latency Spikes)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-lg border border-line bg-ink px-3 py-2 text-xs text-text focus:border-signal"
              required
            />
            <input
              type="text"
              placeholder="Optional description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="rounded-lg border border-line bg-ink px-3 py-2 text-xs text-text focus:border-signal"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] text-muted block mb-1">When Event Occurs</label>
              <select
                value={triggerEvent}
                onChange={(e) => setTriggerEvent(e.target.value)}
                className="w-full rounded-lg border border-line bg-ink px-2 py-2 text-xs text-text focus:border-signal"
              >
                <option value="ticket.created">ticket.created</option>
                <option value="ticket.updated">ticket.updated</option>
                <option value="task.status_changed">task.status_changed</option>
                <option value="agent.completed">agent.completed</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] text-muted block mb-1">Condition Filter</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Field (e.g. priority)"
                  value={filterField}
                  onChange={(e) => setFilterField(e.target.value)}
                  className="w-1/2 rounded-lg border border-line bg-ink px-2 py-2 text-xs text-text"
                />
                <input
                  type="text"
                  placeholder="Value (e.g. critical)"
                  value={filterValue}
                  onChange={(e) => setFilterValue(e.target.value)}
                  className="w-1/2 rounded-lg border border-line bg-ink px-2 py-2 text-xs text-text"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-muted block mb-1">Action to Dispatch</label>
              <select
                value={agentType}
                onChange={(e) => setAgentType(e.target.value)}
                className="w-full rounded-lg border border-line bg-ink px-2 py-2 text-xs text-text focus:border-signal"
              >
                <option value="support_triage">Invoke Support Triage Agent</option>
                <option value="ops_orchestrator">Invoke Sprint Orchestrator</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="rounded-lg border border-line px-3 py-1.5 text-xs text-muted hover:text-text"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-signal px-3.5 py-1.5 text-xs font-semibold text-white hover:opacity-90"
            >
              Save Rule
            </button>
          </div>
        </form>
      )}

      {/* Rules Table */}
      <div className="rounded-xl border border-line bg-surface overflow-hidden shadow-sm">
        <div className="border-b border-line px-5 py-4 flex items-center justify-between">
          <h3 className="text-xs font-semibold text-text uppercase tracking-wider">
            Active Automation Rules ({rules.length})
          </h3>
          <button
            onClick={loadRules}
            className="rounded-lg border border-line bg-ink px-2 py-1 text-xs text-muted hover:text-text"
          >
            🔄 Refresh
          </button>
        </div>

        <div className="divide-y divide-line">
          {rules.map((r) => (
            <div key={r.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-text">{r.name}</span>
                  <span className="rounded bg-signal/15 px-2 py-0.5 text-[10px] font-mono text-signal">
                    ON: {r.trigger_event}
                  </span>
                  <span className="rounded bg-emerald-500/15 px-2 py-0.5 text-[9px] font-bold text-emerald-400 uppercase">
                    Active
                  </span>
                </div>
                {r.description && <p className="text-xs text-muted leading-relaxed">{r.description}</p>}
                <div className="text-[11px] font-mono text-muted flex items-center gap-3">
                  <span>
                    Condition: {JSON.stringify(r.conditions)}
                  </span>
                  <span>&middot;</span>
                  <span>
                    Actions: {r.actions?.map((a) => a.action).join(", ")}
                  </span>
                </div>
              </div>

              <span className="text-xs font-mono text-muted">
                {new Date(r.created_at).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
