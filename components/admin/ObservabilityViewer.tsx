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

interface StepItem {
  id: string;
  step_number: number;
  state: string;
  description: string;
  duration_ms: number;
}

interface ToolCallItem {
  id: string;
  tool_name: string;
  arguments: any;
  result: any;
  duration_ms: number;
  is_error: boolean;
}

interface EvaluationItem {
  id: string;
  test_scenario: string;
  passed: boolean;
  score: number;
  reasoning: string;
  created_at: string;
}

export function ObservabilityViewer() {
  const [executions, setExecutions] = useState<ExecutionItem[]>([]);
  const [selectedExecId, setSelectedExecId] = useState<string | null>(null);
  const [traceSteps, setTraceSteps] = useState<StepItem[]>([]);
  const [toolCalls, setToolCalls] = useState<ToolCallItem[]>([]);
  const [evaluations, setEvaluations] = useState<EvaluationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningEval, setRunningEval] = useState(false);

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

  const loadData = async () => {
    setLoading(true);
    try {
      const [execRes, evalRes] = await Promise.all([
        fetch("/api/agents/executions", { headers: getHeaders() }),
        fetch("/api/agents/evaluations", { headers: getHeaders() }),
      ]);

      if (execRes.ok) {
        const json = await execRes.json();
        setExecutions(json.data || []);
        if (json.data?.length > 0 && !selectedExecId) {
          loadTrace(json.data[0].id);
        }
      }
      if (evalRes.ok) {
        const json = await evalRes.json();
        setEvaluations(json.data || []);
      }
    } catch (err) {
      console.error("Failed to load observability data:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadTrace = async (id: string) => {
    setSelectedExecId(id);
    try {
      const res = await fetch(`/api/agents/executions/${id}/trace`, { headers: getHeaders() });
      if (res.ok) {
        const json = await res.json();
        setTraceSteps(json.data?.steps || []);
        setToolCalls(json.data?.toolCalls || []);
      } else {
        setTraceSteps([]);
        setToolCalls([]);
      }
    } catch (err) {
      console.error("Failed to load execution trace:", err);
      setTraceSteps([]);
      setToolCalls([]);
    }
  };

  const handleRunEvaluations = async () => {
    setRunningEval(true);
    try {
      const res = await fetch("/api/agents/evaluations/run", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ suiteName: "Enterprise Benchmark Suite" }),
      });
      if (res.ok) {
        const json = await res.json();
        setEvaluations(json.data || []);
      }
    } catch (err) {
      console.error("Failed to run evaluations:", err);
    } finally {
      setRunningEval(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-text">Agent Observability & Evaluation Deck</h2>
          <p className="text-xs text-muted">
            End-to-end execution tracing, step latency, tool telemetry, and regression benchmarks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="rounded-lg border border-line bg-ink px-3 py-1.5 text-xs text-muted hover:text-text"
          >
            🔄 Refresh
          </button>
          <button
            onClick={handleRunEvaluations}
            disabled={runningEval}
            className="rounded-lg bg-signal px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5"
          >
            <span>📈</span>
            <span>{runningEval ? "Evaluating Models..." : "Run Evaluation Suite"}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Executions List & Trace Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Executions */}
        <div className="rounded-xl border border-line bg-surface overflow-hidden shadow-sm flex flex-col">
          <div className="border-b border-line px-4 py-3 text-xs font-semibold text-text uppercase tracking-wider">
            Execution Traces ({executions.length})
          </div>

          <div className="divide-y divide-line overflow-y-auto max-h-[600px]">
            {executions.map((e) => {
              const active = selectedExecId === e.id;
              return (
                <div
                  key={e.id}
                  onClick={() => loadTrace(e.id)}
                  className={`p-3.5 cursor-pointer transition-colors ${
                    active ? "bg-signal/15 border-l-2 border-signal" : "hover:bg-ink/50"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-text">{e.agent_type}</span>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                        e.status === "completed"
                          ? "bg-emerald-500/15 text-emerald-400"
                          : e.status === "awaiting_approval"
                          ? "bg-amber-500/15 text-amber-400"
                          : "bg-blue-500/15 text-blue-400"
                      }`}
                    >
                      {e.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-muted mt-1.5 font-mono">
                    <span>{e.duration_ms}ms &middot; {e.tokens_used} tokens</span>
                    <span>{new Date(e.created_at).toLocaleTimeString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Columns: Step-by-Step State Flow & Tool Calls */}
        <div className="lg:col-span-2 space-y-6">
          {/* Step Timeline */}
          <div className="rounded-xl border border-line bg-surface p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="text-xs font-semibold text-text uppercase tracking-wider">
                Execution State Machine Timeline
              </h3>
              <span className="font-mono text-[10px] text-muted">{selectedExecId}</span>
            </div>

            {traceSteps.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted">
                Select an execution trace to inspect fine-grained state transitions.
              </div>
            ) : (
              <div className="space-y-3">
                {traceSteps.map((step) => (
                  <div
                    key={step.id}
                    className="rounded-lg border border-line bg-ink/40 p-3.5 flex items-start justify-between gap-4"
                  >
                    <div className="flex items-start gap-3">
                      <span className="inline-block h-6 w-6 rounded-full bg-signal/20 text-center font-bold text-signal text-xs leading-6 shrink-0">
                        {step.step_number}
                      </span>
                      <div>
                        <div className="text-xs font-semibold text-text uppercase tracking-wider flex items-center gap-2">
                          <span>{step.state}</span>
                        </div>
                        <p className="text-xs text-muted leading-relaxed mt-0.5 font-sans">
                          {step.description}
                        </p>
                      </div>
                    </div>
                    <span className="font-mono text-[10px] text-muted shrink-0">
                      {step.duration_ms}ms
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recorded Tool Calls */}
          <div className="rounded-xl border border-line bg-surface p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-semibold text-text uppercase tracking-wider">
              Tool Telemetry & Arguments ({toolCalls.length})
            </h3>

            {toolCalls.length === 0 ? (
              <div className="text-xs text-muted">No external tools invoked for this execution.</div>
            ) : (
              <div className="space-y-3">
                {toolCalls.map((tc) => (
                  <div key={tc.id} className="rounded-lg border border-line bg-ink/60 p-3 font-mono text-xs space-y-1">
                    <div className="flex items-center justify-between text-signal font-bold">
                      <span>{tc.tool_name}()</span>
                      <span className="text-[10px] text-muted">{tc.duration_ms}ms</span>
                    </div>
                    <pre className="text-[11px] text-muted overflow-x-auto p-2 bg-ink rounded">
                      {JSON.stringify(tc.arguments, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Evaluation Suite Benchmark Scorecards */}
      <div className="rounded-xl border border-line bg-surface overflow-hidden shadow-sm">
        <div className="border-b border-line px-5 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-text">Agent Safety & Robustness Benchmark Results</h3>
            <p className="text-xs text-muted">
              Evaluations across classification accuracy, outage triage, and prompt injection defense.
            </p>
          </div>
          <span className="rounded bg-signal/15 px-2.5 py-1 text-xs font-mono font-bold text-signal">
            {evaluations.filter(e => e.passed).length}/{evaluations.length} Passed
          </span>
        </div>

        <div className="divide-y divide-line">
          {evaluations.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted">
              No evaluations recorded. Click &quot;Run Evaluation Suite&quot; to test model robustness.
            </div>
          ) : (
            evaluations.map((ev) => (
              <div key={ev.id} className="p-4 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                        ev.passed ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400"
                      }`}
                    >
                      {ev.passed ? "PASS" : "FAIL"}
                    </span>
                    <span className="text-xs font-semibold text-text">{ev.test_scenario}</span>
                  </div>
                  <p className="text-xs text-muted">{ev.reasoning}</p>
                </div>

                <div className="text-right font-mono text-xs">
                  <div className={`font-bold ${ev.score >= 80 ? "text-emerald-400" : "text-amber-400"}`}>
                    {ev.score}/100
                  </div>
                  <div className="text-[10px] text-muted">Score</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
