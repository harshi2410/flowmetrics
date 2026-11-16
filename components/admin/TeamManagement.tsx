"use client";

import { useState, useEffect } from "react";

interface TeamItem {
  id: string;
  name: string;
  description: string | null;
  lead_name?: string;
  member_count?: number;
  created_at: string;
}

export function TeamManagement() {
  const [teams, setTeams] = useState<TeamItem[]>([]);
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

  const loadTeams = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/operations/teams", { headers: getHeaders() });
      if (res.ok) {
        const json = await res.json();
        setTeams(json.data || []);
      }
    } catch (err) {
      console.error("Failed to load teams:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeams();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setCreating(true);
    try {
      const res = await fetch("/api/operations/teams", {
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
        loadTeams();
      }
    } catch (err) {
      console.error("Failed to create team:", err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-text">Operational Teams</h2>
          <p className="text-xs text-muted">
            Manage engineering squads, designated team leads, and cross-functional responsibilities.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 rounded-md bg-signal px-3.5 py-1.5 text-xs font-semibold text-signal-text transition-opacity hover:opacity-90 cursor-pointer"
        >
          <span>+</span> Create Team
        </button>
      </div>

      {loading ? (
        <div className="rounded-xl border border-line bg-surface p-8 text-center text-sm text-muted animate-pulse">
          Loading teams from database…
        </div>
      ) : teams.length === 0 ? (
        <div className="rounded-xl border border-line bg-surface p-8 text-center text-sm text-muted">
          No operational teams found. Create your first team squad above.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <div
              key={team.id}
              className="rounded-xl border border-line bg-surface p-5 space-y-4 hover:border-signal/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-2 border border-line text-signal font-bold">
                    {team.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-text">{team.name}</h3>
                    <p className="text-xs text-muted">Lead: {team.lead_name || "Unassigned"}</p>
                  </div>
                </div>
                <span className="tag">{team.member_count || 1} members</span>
              </div>

              {team.description && (
                <p className="text-xs text-muted line-clamp-3 leading-relaxed">{team.description}</p>
              )}

              <div className="pt-3 border-t border-line flex items-center justify-between text-xs text-muted">
                <span>Created {new Date(team.created_at).toLocaleDateString()}</span>
                <span className="text-signal font-medium">Active Squad</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-line bg-surface p-6 shadow-2xl space-y-4">
            <h3 className="font-display text-lg font-semibold text-text">Create Operational Team</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="text-xs font-medium uppercase text-muted">Team Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Platform Core SRE"
                  className="mt-1 w-full rounded-md border border-line bg-ink px-3 py-1.5 text-sm text-text outline-none focus:border-signal"
                />
              </div>
              <div>
                <label className="text-xs font-medium uppercase text-muted">Mission & Scope</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Operational responsibilities, systems owned, and support escalation..."
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
                  {creating ? "Creating…" : "Save Team"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
