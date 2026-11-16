"use client";

import { useState, useEffect } from "react";

interface SprintItem {
  id: string;
  project_id: string;
  project_name?: string;
  project_key?: string;
  name: string;
  goal: string | null;
  start_date: string;
  end_date: string;
  status: "active" | "planned" | "completed";
  task_count?: number;
  completed_task_count?: number;
  created_at: string;
}

export function SprintManagement() {
  const [sprints, setSprints] = useState<SprintItem[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [projectId, setProjectId] = useState("");
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [creating, setCreating] = useState(false);

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
      const [sprintsRes, projRes] = await Promise.all([
        fetch("/api/operations/sprints", { headers: getHeaders() }),
        fetch("/api/operations/projects", { headers: getHeaders() }),
      ]);
      if (sprintsRes.ok) {
        const json = await sprintsRes.json();
        setSprints(json.data || []);
      }
      if (projRes.ok) {
        const json = await projRes.json();
        setProjects(json.data || []);
        if (json.data?.length > 0 && !projectId) {
          setProjectId(json.data[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load sprints:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !projectId || !startDate || !endDate) return;

    setCreating(true);
    try {
      const res = await fetch("/api/operations/sprints", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          projectId,
          name: name.trim(),
          goal: goal.trim() || undefined,
          startDate,
          endDate,
        }),
      });
      if (res.ok) {
        setName("");
        setGoal("");
        setStartDate("");
        setEndDate("");
        setShowModal(false);
        loadData();
      }
    } catch (err) {
      console.error("Failed to create sprint:", err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-text">Sprint Cadence & Delivery</h2>
          <p className="text-xs text-muted">
            Manage agile iteration cycles, sprint goals, and delivery timelines across projects.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 rounded-md bg-signal px-3.5 py-1.5 text-xs font-semibold text-signal-text transition-opacity hover:opacity-90 cursor-pointer"
        >
          <span>+</span> Plan Sprint
        </button>
      </div>

      {loading ? (
        <div className="rounded-xl border border-line bg-surface p-8 text-center text-sm text-muted animate-pulse">
          Loading sprint cycles from database…
        </div>
      ) : sprints.length === 0 ? (
        <div className="rounded-xl border border-line bg-surface p-8 text-center text-sm text-muted">
          No sprints planned yet. Create a sprint to organize engineering workflows.
        </div>
      ) : (
        <div className="space-y-4">
          {sprints.map((sprint) => {
            const total = Number(sprint.task_count || 0);
            const done = Number(sprint.completed_task_count || 0);
            const pct = total > 0 ? Math.round((done / total) * 100) : 0;

            return (
              <div
                key={sprint.id}
                className="rounded-xl border border-line bg-surface p-5 space-y-3 hover:border-signal/30 transition-colors"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-semibold text-signal bg-signal/15 px-2 py-0.5 rounded">
                      {sprint.project_key || "PROJ"}
                    </span>
                    <h3 className="text-base font-semibold text-text">{sprint.name}</h3>
                    <span
                      className={`tag ${
                        sprint.status === "active" ? "" : sprint.status === "planned" ? "m" : "w"
                      }`}
                    >
                      {sprint.status}
                    </span>
                  </div>

                  <div className="text-xs text-muted font-mono">
                    {new Date(sprint.start_date).toLocaleDateString()} &mdash;{" "}
                    {new Date(sprint.end_date).toLocaleDateString()}
                  </div>
                </div>

                {sprint.goal && (
                  <p className="text-xs text-text/90 italic bg-ink/50 p-2.5 rounded-lg border border-line">
                    Goal: {sprint.goal}
                  </p>
                )}

                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-xs text-muted font-mono">
                    <span>Sprint Velocity & Completion</span>
                    <span className="text-text font-medium">{pct}% ({done}/{total} tasks complete)</span>
                  </div>
                  <div className="bar w-full overflow-hidden">
                    <div
                      className="h-full bg-signal transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-line bg-surface p-6 shadow-2xl space-y-4">
            <h3 className="font-display text-lg font-semibold text-text">Plan New Sprint</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="text-xs font-medium uppercase text-muted">Project</label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="mt-1 w-full rounded-md border border-line bg-ink px-3 py-1.5 text-sm text-text outline-none focus:border-signal"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.key})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium uppercase text-muted">Sprint Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sprint 26: Observability Instrumentation"
                  className="mt-1 w-full rounded-md border border-line bg-ink px-3 py-1.5 text-sm text-text outline-none focus:border-signal"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium uppercase text-muted">Start Date</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="mt-1 w-full rounded-md border border-line bg-ink px-3 py-1.5 text-sm text-text outline-none focus:border-signal"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium uppercase text-muted">End Date</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="mt-1 w-full rounded-md border border-line bg-ink px-3 py-1.5 text-sm text-text outline-none focus:border-signal"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium uppercase text-muted">Sprint Goal</label>
                <textarea
                  rows={3}
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="Key deliverables and business objectives for this cycle..."
                  className="mt-1 w-full rounded-md border border-line bg-ink px-3 py-1.5 text-sm text-text outline-none focus:border-signal"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-md border border-line px-3.5 py-1.5 text-xs text-muted hover:text-text cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="rounded-md bg-signal px-4 py-1.5 text-xs font-semibold text-signal-text hover:opacity-90 disabled:opacity-50 cursor-pointer"
                >
                  {creating ? "Saving…" : "Create Sprint"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
