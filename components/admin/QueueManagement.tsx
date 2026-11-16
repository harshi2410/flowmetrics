"use client";

import { useState, useEffect } from "react";

interface QueueItem {
  id: string;
  name: string;
  description: string | null;
  team_id: string | null;
  team_name?: string;
  ticket_count?: number;
  created_at: string;
}

export function QueueManagement() {
  const [queues, setQueues] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
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

  const loadQueues = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/support/queues", { headers: getHeaders() });
      if (res.ok) {
        const json = await res.json();
        setQueues(json.data || []);
      }
    } catch (err) {
      console.error("Failed to load queues:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueues();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setCreating(true);
    try {
      const res = await fetch("/api/support/queues", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
        }),
      });
      if (res.ok) {
        setName("");
        setDescription("");
        setShowModal(false);
        loadQueues();
      }
    } catch (err) {
      console.error("Failed to create queue:", err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-text">Support Routing Queues</h2>
          <p className="text-xs text-muted">
            Configure inbound ticket routing pipelines, triage queues, and triage assignments.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 rounded-md bg-signal px-3.5 py-1.5 text-xs font-semibold text-signal-text transition-opacity hover:opacity-90 cursor-pointer"
        >
          <span>+</span> Create Queue
        </button>
      </div>

      {loading ? (
        <div className="rounded-xl border border-line bg-surface p-8 text-center text-sm text-muted animate-pulse">
          Loading support queues from database…
        </div>
      ) : queues.length === 0 ? (
        <div className="rounded-xl border border-line bg-surface p-8 text-center text-sm text-muted">
          No support queues found. Create an incoming routing queue above.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {queues.map((q) => (
            <div
              key={q.id}
              className="rounded-xl border border-line bg-surface p-5 space-y-4 hover:border-signal/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-base font-semibold text-text">{q.name}</h3>
                  <p className="text-xs text-muted">Routing Team: {q.team_name || "Enterprise Tier 1"}</p>
                </div>
                <span className="tag">{Number(q.ticket_count || 0)} active</span>
              </div>

              {q.description && (
                <p className="text-xs text-muted line-clamp-3 leading-relaxed">{q.description}</p>
              )}

              <div className="pt-3 border-t border-line flex items-center justify-between text-xs text-muted">
                <span>Created {new Date(q.created_at).toLocaleDateString()}</span>
                <span className="text-signal font-medium">Automatic Routing Active</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-line bg-surface p-6 shadow-2xl space-y-4">
            <h3 className="font-display text-lg font-semibold text-text">Create Support Queue</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="text-xs font-medium uppercase text-muted">Queue Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Security & Vulnerability Ingestion"
                  className="mt-1 w-full rounded-md border border-line bg-ink px-3 py-1.5 text-sm text-text outline-none focus:border-signal"
                />
              </div>
              <div>
                <label className="text-xs font-medium uppercase text-muted">Routing Purpose</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Inbound criteria, triage playbook, and SLA expectations..."
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
                  {creating ? "Creating…" : "Save Queue"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
