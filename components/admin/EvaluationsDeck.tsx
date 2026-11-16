"use client";

import { useState, useEffect } from "react";

interface EvalItem {
  id: string;
  suite_name: string;
  agent_type: string;
  score: number;
  passed: boolean;
  actual_output: Record<string, any>;
  expected_output: Record<string, any>;
  created_at: string;
}

export function EvaluationsDeck() {
  const [evals, setEvals] = useState<EvalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [suiteName, setSuiteName] = useState("Enterprise Benchmark Suite");

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

  const loadEvals = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/agents/evaluations", { headers: getHeaders() });
      if (res.ok) {
        const json = await res.json();
        setEvals(json.data || []);
      }
    } catch (err) {
      console.error("Failed to load evaluations:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvals();
  }, []);

  const handleRun = async () => {
    setRunning(true);
    try {
      const res = await fetch("/api/agents/evaluations/run", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ suiteName }),
      });
      if (res.ok) {
        const json = await res.json();
        setEvals(json.data || []);
      }
    } catch (err) {
      console.error("Failed to run benchmark suite:", err);
    } finally {
      setRunning(false);
    }
  };

  const passedCount = evals.filter((e) => e.passed).length;
  const passRate = evals.length > 0 ? Math.round((passedCount / evals.length) * 100) : 100;
  const avgScore =
    evals.length > 0
      ? (evals.reduce((acc, curr) => acc + (curr.score || 0), 0) / evals.length).toFixed(2)
      : "1.00";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-text">Agent Benchmark Evaluations</h2>
          <p className="text-xs text-muted">
            Continuous regression benchmarking comparing autonomous agent decisions against gold-standard baselines.
          </p>
        </div>

        <button
          onClick={handleRun}
          disabled={running}
          className="inline-flex items-center gap-2 rounded-md bg-signal px-3.5 py-1.5 text-xs font-semibold text-signal-text hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer"
        >
          {running ? "Executing Suite…" : "Run Evaluation Suite"}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-line bg-surface p-4 space-y-1">
          <span className="text-xs text-muted uppercase font-mono">Benchmark Pass Rate</span>
          <div className="text-2xl font-bold font-mono text-signal">{passRate}%</div>
          <p className="text-[11px] text-muted">{passedCount} of {evals.length} assertions verified</p>
        </div>
        <div className="rounded-xl border border-line bg-surface p-4 space-y-1">
          <span className="text-xs text-muted uppercase font-mono">Mean Reasoning Score</span>
          <div className="text-2xl font-bold font-mono text-text">{avgScore} / 1.00</div>
          <p className="text-[11px] text-muted">Cosine semantic and classification match</p>
        </div>
        <div className="rounded-xl border border-line bg-surface p-4 space-y-1">
          <span className="text-xs text-muted uppercase font-mono">Evaluated Suite</span>
          <div className="text-sm font-semibold text-text truncate mt-1">{suiteName}</div>
          <p className="text-[11px] text-muted font-mono">Regression test baseline</p>
        </div>
      </div>

      {loading ? (
        <div className="rounded-xl border border-line bg-surface p-8 text-center text-sm text-muted animate-pulse">
          Loading benchmark outcomes from database…
        </div>
      ) : evals.length === 0 ? (
        <div className="rounded-xl border border-line bg-surface p-8 text-center text-sm text-muted">
          No evaluations logged yet. Click &quot;Run Evaluation Suite&quot; above to run automated regression checks.
        </div>
      ) : (
        <div className="space-y-4">
          {evals.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-line bg-surface p-5 space-y-3 hover:border-signal/30 transition-colors"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <span className={`tag ${item.passed ? "" : "d"}`}>
                    {item.passed ? "PASSED" : "FAILED"}
                  </span>
                  <h3 className="text-sm font-semibold text-text font-mono">
                    {item.suite_name} &bull; {item.agent_type}
                  </h3>
                </div>
                <span className="font-mono text-xs text-muted">
                  Alignment Score: <span className="text-signal font-semibold">{(item.score * 100).toFixed(0)}%</span>
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 pt-2 text-xs font-mono">
                <div className="rounded-lg border border-line bg-ink/60 p-3 space-y-1">
                  <span className="text-muted block text-[11px] font-semibold uppercase">Actual Agent Decision</span>
                  <pre className="overflow-x-auto text-text text-[11px]">
                    {JSON.stringify(item.actual_output, null, 2)}
                  </pre>
                </div>
                <div className="rounded-lg border border-line bg-ink/60 p-3 space-y-1">
                  <span className="text-muted block text-[11px] font-semibold uppercase">Expected Gold Standard</span>
                  <pre className="overflow-x-auto text-text text-[11px]">
                    {JSON.stringify(item.expected_output, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
