"use client";

import { useState, useEffect } from "react";

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

export function ApprovalsInbox() {
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "resolved">("pending");

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

  const loadApprovals = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/agents/approvals", { headers: getHeaders() });
      if (res.ok) {
        const json = await res.json();
        setApprovals(json.data || []);
      }
    } catch (err) {
      console.error("Failed to load approvals:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApprovals();
  }, []);

  const handleReview = async (id: string, action: "approve" | "reject") => {
    try {
      const res = await fetch(`/api/agents/approvals/${id}/review`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          action,
          comment: `Operator reviewed and marked as ${action} from Approvals Inbox.`,
        }),
      });
      if (res.ok) {
        loadApprovals();
      }
    } catch (err) {
      console.error("Failed to review approval:", err);
    }
  };

  const filtered = approvals.filter((a) => {
    if (filter === "pending") return a.status === "pending";
    if (filter === "resolved") return a.status !== "pending";
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-text">Human-in-the-Loop Review Queue</h2>
          <p className="text-xs text-muted">
            High-risk autonomous agent operations requiring explicit authorization before execution.
          </p>
        </div>

        <div className="flex gap-2">
          {(["pending", "resolved", "all"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setFilter(mode)}
              className={`rounded-md px-3 py-1 text-xs capitalize transition-colors cursor-pointer ${
                filter === mode
                  ? "bg-signal text-signal-text font-semibold"
                  : "border border-line bg-surface text-muted hover:text-text"
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="rounded-xl border border-line bg-surface p-8 text-center text-sm text-muted animate-pulse">
          Loading approval requests from database…
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-line bg-surface p-8 text-center text-sm text-muted">
          No approval requests matching filter &quot;{filter}&quot;. All operations are currently clear.
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((item) => {
            const isCrit = item.risk_level === "critical";
            const isHigh = item.risk_level === "high";

            return (
              <div
                key={item.id}
                className="rounded-xl border border-line bg-surface p-5 space-y-4 hover:border-signal/30 transition-colors"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <span
                      className={`tag ${isCrit ? "d" : isHigh ? "w" : ""}`}
                    >
                      {item.risk_level.toUpperCase()} RISK
                    </span>
                    <span className="font-mono text-xs text-text font-semibold">
                      Tool: {item.tool_name}
                    </span>
                  </div>

                  <span className="text-xs text-muted font-mono">
                    Requested {new Date(item.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>

                <div className="rounded-lg border border-line bg-ink/50 p-3 space-y-2">
                  <p className="text-sm font-medium text-text">{item.proposed_action}</p>
                  {item.payload && (
                    <div className="text-xs font-mono text-muted">
                      <span className="text-text font-semibold">Action Payload: </span>
                      <pre className="mt-1 overflow-x-auto rounded bg-surface p-2 text-[11px] text-text">
                        {JSON.stringify(item.payload, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-muted font-mono">
                    Status: <span className="text-text capitalize font-semibold">{item.status}</span>
                  </span>

                  {item.status === "pending" && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleReview(item.id, "reject")}
                        className="rounded-md border border-danger/40 bg-danger/10 px-3.5 py-1.5 text-xs font-semibold text-danger hover:bg-danger/20 transition-colors cursor-pointer"
                      >
                        Reject Action
                      </button>
                      <button
                        onClick={() => handleReview(item.id, "approve")}
                        className="rounded-md bg-signal px-4 py-1.5 text-xs font-semibold text-signal-text hover:opacity-90 transition-opacity cursor-pointer"
                      >
                        Authorize & Execute
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
