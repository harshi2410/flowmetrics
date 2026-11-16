"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface ProjectItem {
  id: string;
  name: string;
  key: string;
  description: string | null;
  status: string;
  health: "healthy" | "at_risk" | "critical";
  health_reason: string | null;
  target_date: string | null;
  manager_name?: string;
  team_name?: string;
  task_count?: number;
  completed_task_count?: number;
  created_at: string;
}

export function ProjectManagement() {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [description, setDescription] = useState("");
  const [targetDate, setTargetDate] = useState("");
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

  const loadProjects = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/operations/projects", { headers: getHeaders() });
      if (res.ok) {
        const json = await res.json();
        setProjects(json.data || []);
      }
    } catch (err) {
      console.error("Failed to load projects:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !key.trim()) return;

    setCreating(true);
    try {
      const res = await fetch("/api/operations/projects", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          name: name.trim(),
          key: key.trim().toUpperCase(),
          description: description.trim() || undefined,
          targetDate: targetDate || undefined,
        }),
      });
      if (res.ok) {
        setName("");
        setKey("");
        setDescription("");
        setTargetDate("");
        setShowModal(false);
        loadProjects();
      }
    } catch (err) {
      console.error("Failed to create project:", err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-text">Active Engineering Projects</h2>
          <p className="text-xs text-muted">
            Track multi-project execution, delivery health markers, and milestone velocities.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 rounded-md bg-signal px-3.5 py-1.5 text-xs font-semibold text-signal-text transition-opacity hover:opacity-90 cursor-pointer"
        >
          <span>+</span> New Project
        </button>
      </div>

      {loading ? (
        <div className="rounded-xl border border-line bg-surface p-8 text-center text-sm text-muted animate-pulse">
          Loading projects from database…
        </div>
      ) : projects.length === 0 ? (
        <div className="rounded-xl border border-line bg-surface p-8 text-center text-sm text-muted">
          No projects found. Create your first engineering project above.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((proj) => {
            const total = Number(proj.task_count || 0);
            const done = Number(proj.completed_task_count || 0);
            const pct = total > 0 ? Math.round((done / total) * 100) : 0;

            return (
              <div
                key={proj.id}
                className="rounded-xl border border-line bg-surface p-5 space-y-4 hover:border-signal/40 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-[11px] font-semibold text-signal bg-signal/15 px-2 py-0.5 rounded">
                      {proj.key}
                    </span>
                    <h3 className="text-base font-semibold text-text mt-1">{proj.name}</h3>
                  </div>
                  <span
                    className={`tag ${
                      proj.health === "healthy" ? "" : proj.health === "at_risk" ? "w" : "d"
                    }`}
                  >
                    {proj.health.replace("_", " ")}
                  </span>
                </div>

                {proj.description && (
                  <p className="text-xs text-muted line-clamp-2">{proj.description}</p>
                )}

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-muted font-mono">
                    <span>Progress</span>
                    <span className="text-text font-medium">{pct}% ({done}/{total} tasks)</span>
                  </div>
                  <div className="bar w-full overflow-hidden">
                    <div
                      className="h-full bg-signal transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-line flex items-center justify-between text-xs text-muted">
                  <span>Target: {proj.target_date || "Continuous"}</span>
                  <Link
                    href={`/admin/tasks?project=${proj.key}`}
                    className="text-signal hover:underline font-medium"
                  >
                    View Tasks &rarr;
                  </Link>
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
            <h3 className="font-display text-lg font-semibold text-text">Create Operational Project</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="text-xs font-medium uppercase text-muted">Project Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ingress Gateway Modernization"
                  className="mt-1 w-full rounded-md border border-line bg-ink px-3 py-1.5 text-sm text-text outline-none focus:border-signal"
                />
              </div>
              <div>
                <label className="text-xs font-medium uppercase text-muted">Project Key (Short)</label>
                <input
                  type="text"
                  required
                  maxLength={10}
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  placeholder="e.g. INGRESS"
                  className="mt-1 w-full rounded-md border border-line bg-ink px-3 py-1.5 text-sm text-text font-mono uppercase outline-none focus:border-signal"
                />
              </div>
              <div>
                <label className="text-xs font-medium uppercase text-muted">Target Completion Date</label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="mt-1 w-full rounded-md border border-line bg-ink px-3 py-1.5 text-sm text-text outline-none focus:border-signal"
                />
              </div>
              <div>
                <label className="text-xs font-medium uppercase text-muted">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Goals, deliverables, and operational requirements..."
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
                  {creating ? "Creating…" : "Save Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
