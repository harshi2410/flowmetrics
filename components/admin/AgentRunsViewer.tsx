"use client";

import { useState, useEffect } from "react";

interface ExecutionItem {
  id: string;
  agent_type: string;
  status: string;
  tokens_used: number;
  duration_ms: number;
  created_at: string;
}

export function AgentRunsViewer() {
  const [runs, setRuns] = useState<ExecutionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRun, setSelectedRun] = useState<any | null>(null);
  const [traceSteps, setTraceSteps] = useState<any[]>([]);
  const [toolCalls, setToolCalls] = useState<any[]>([]);
  const [loadingTrace, setLoadingTrace] = useState(false);

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

  const loadRuns = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/agents/executions", { headers: getHeaders() });
      if (res.ok) {
        const json = await res.json();
        setRuns(json.data || []);
      }
    } catch (err) {
      console.error("Failed to load agent runs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRuns();
  }, []);

  const openTrace = async (run: ExecutionItem) => {
    setSelectedRun(run);
    setLoadingTrace(true);
    try {
      const res = await fetch(`/api/agents/executions/${run.id}/trace`, { headers: getHeaders() });
      if (res.ok) {
        const json = await res.json();
        setTraceSteps(json.data?.steps || []);
        setToolCalls(json.data?.toolCalls || []);
      }
    } catch (err) {
      console.error("Failed to load trace:", err);
    } finally {
      setLoadingTrace(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-text">Agent Execution Runs</h2>
          <p className="text-xs text-muted">
            Chronological audit of autonomous AI agent dispatches, tokens consumed, and step telemetry.
          </p>
        </div>
        <button
          onClick={loadRuns}
          className="rounded-md border border-line px-3 py-1.5 text-xs text-muted hover:text-text cursor-pointer"
        >
          Refresh Runs
        </button>
      </div>

      {loading ? (
        <div className="rounded-xl border border-line bg-surface p-8 text-center text-sm text-muted animate-pulse">
          Loading agent execution logs from database…
        </div>
      ) : runs.length === 0 ? (
        <div className="rounded-xl border border-line bg-surface p-8 text-center text-sm text-muted">
          No agent runs recorded yet. Dispatches from the Agent Control Deck will appear here.
        </div>
      ) : (
        <div className="rounded-xl border border-line bg-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-line bg-surface-2 text-muted uppercase tracking-wider font-mono">
                <tr>
                  <th className="px-4 py-3">Run ID</th>
                  <th className="px-4 py-3">Agent Type</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Tokens Used</th>
                  <th className="px-4 py-3">Latency</th>
                  <th className="px-4 py-3">Executed At</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line font-mono">
                {runs.map((r) => (
                  <tr key={r.id} className="hover:bg-surface-2/40 transition-colors">
                    <td className="px-4 py-3 text-text font-medium">{r.id.slice(0, 8)}…</td>
                    <td className="px-4 py-3 text-signal">{r.agent_type}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`tag ${
                          r.status === "completed"
                            ? ""
                            : r.status === "awaiting_approval"
                            ? "w"
                            : r.status === "running"
                            ? "m"
                            : "d"
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted">{r.tokens_used || 0} tok</td>
                    <td className="px-4 py-3 text-muted">{r.duration_ms || 0} ms</td>
                    <td className="px-4 py-3 text-muted font-sans">
                      {new Date(r.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => openTrace(r)}
                        className="text-signal hover:underline font-medium cursor-pointer"
                      >
                        Inspect Trace &rarr;
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Trace Drawer / Modal */}
      {selectedRun && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-xl border border-line bg-surface p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div>
                <h3 className="font-display text-base font-semibold text-text">
                  Execution Trace &bull; {selectedRun.agent_type}
                </h3>
                <p className="font-mono text-xs text-muted">ID: {selectedRun.id}</p>
              </div>
              <button
                onClick={() => setSelectedRun(null)}
                className="text-muted hover:text-text cursor-pointer font-bold text-lg"
              >
                &times;
              </button>
            </div>

            {loadingTrace ? (
              <div className="py-8 text-center text-sm text-muted animate-pulse">
                Fetching trace telemetry…
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-2 rounded-lg bg-surface-2 p-3 text-xs font-mono">
                  <div>
                    <span className="text-muted block">Status</span>
                    <span className="text-text font-medium">{selectedRun.status}</span>
                  </div>
                  <div>
                    <span className="text-muted block">Duration</span>
                    <span className="text-text font-medium">{selectedRun.duration_ms} ms</span>
                  </div>
                  <div>
                    <span className="text-muted block">Tokens Consumed</span>
                    <span className="text-text font-medium">{selectedRun.tokens_used}</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-semibold uppercase text-muted tracking-wider mb-2">
                    Execution Steps ({traceSteps.length})
                  </h4>
                  {traceSteps.length === 0 ? (
                    <p className="text-xs text-muted italic">No step records captured for this run.</p>
                  ) : (
                    <div className="space-y-2">
                      {traceSteps.map((s, idx) => (
                        <div
                          key={s.id || idx}
                          className="rounded-lg border border-line bg-ink/50 p-3 space-y-1 text-xs"
                        >
                          <div className="flex justify-between items-center font-mono">
                            <span className="text-signal font-semibold">
                              Step {s.step_number || idx + 1}: {s.state}
                            </span>
                            <span className="text-muted">{s.duration_ms || 0} ms</span>
                          </div>
                          {s.description && <p className="text-muted">{s.description}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {toolCalls.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold uppercase text-muted tracking-wider mb-2">
                      Executed Tools ({toolCalls.length})
                    </h4>
                    <div className="space-y-2">
                      {toolCalls.map((tc, idx) => (
                        <div
                          key={tc.id || idx}
                          className="rounded-lg border border-line bg-ink/50 p-3 space-y-1 font-mono text-xs"
                        >
                          <div className="flex justify-between text-text font-semibold">
                            <span>{tc.tool_name}</span>
                            <span className="text-muted">{tc.duration_ms} ms</span>
                          </div>
                          <pre className="text-[11px] text-muted overflow-x-auto p-1.5 bg-surface rounded">
                            {JSON.stringify(tc.arguments, null, 2)}
                          </pre>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
