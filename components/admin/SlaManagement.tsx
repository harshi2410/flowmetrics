"use client";

import { useState, useEffect } from "react";
import { getAdminHeaders, getAdminAuthToken } from "@/lib/auth-client";

interface SlaPolicyItem {
  id: string;
  name: string;
  priority: string;
  response_time_hours: number;
  resolution_time_hours: number;
  business_hours_only: boolean;
}

export function SlaManagement() {
  const [policies, setPolicies] = useState<SlaPolicyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPolicy, setEditingPolicy] = useState<SlaPolicyItem | null>(null);
  const [responseHours, setResponseHours] = useState<number>(1);
  const [resolutionHours, setResolutionHours] = useState<number>(4);
  const [businessOnly, setBusinessOnly] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadPolicies = async () => {
    const token = getAdminAuthToken();
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/support/sla", { headers: getAdminHeaders() });
      if (res.ok) {
        const json = await res.json();
        setPolicies(json.data || []);
      }
    } catch (err) {
      console.error("Failed to load SLA policies:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPolicies();
  }, []);

  const openEdit = (p: SlaPolicyItem) => {
    setEditingPolicy(p);
    setResponseHours(p.response_time_hours);
    setResolutionHours(p.resolution_time_hours);
    setBusinessOnly(p.business_hours_only);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPolicy) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/support/sla/${editingPolicy.id}`, {
        method: "PUT",
        headers: getAdminHeaders(),
        body: JSON.stringify({
          responseTimeHours: Number(responseHours),
          resolutionTimeHours: Number(resolutionHours),
          businessHoursOnly: businessOnly,
        }),
      });
      if (res.ok) {
        setEditingPolicy(null);
        loadPolicies();
      }
    } catch (err) {
      console.error("Failed to update SLA:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-sm font-semibold text-text">Service Level Agreement (SLA) Targets</h2>
        <p className="text-xs text-muted">
          Define contractual response and resolution response thresholds enforced by the automated triage engine.
        </p>
      </div>

      {loading ? (
        <div className="rounded-xl border border-line bg-surface p-8 text-center text-sm text-muted animate-pulse">
          Loading SLA policies from database…
        </div>
      ) : policies.length === 0 ? (
        <div className="rounded-xl border border-line bg-surface p-8 text-center text-sm text-muted">
          No SLA policies defined for this organization.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {policies.map((p) => {
            const isCrit = p.priority === "critical";
            const isHigh = p.priority === "high";

            return (
              <div
                key={p.id}
                className="rounded-xl border border-line bg-surface p-5 space-y-4 hover:border-signal/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-base font-semibold text-text">{p.name}</h3>
                  <span className={`tag ${isCrit ? "d" : isHigh ? "w" : ""}`}>
                    {p.priority.toUpperCase()}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between border-b border-line pb-1.5">
                    <span className="text-muted">First Response Target:</span>
                    <span className="font-mono font-medium text-text">{p.response_time_hours} hr</span>
                  </div>
                  <div className="flex justify-between border-b border-line pb-1.5">
                    <span className="text-muted">Target Resolution:</span>
                    <span className="font-mono font-medium text-text">{p.resolution_time_hours} hr</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Operating Hours:</span>
                    <span className="font-medium text-text">
                      {p.business_hours_only ? "Business Hours (9am-6pm)" : "24/7 Continuous"}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-line flex justify-end">
                  <button
                    onClick={() => openEdit(p)}
                    className="rounded-md border border-line px-3 py-1 text-xs text-muted hover:text-signal hover:border-signal/40 transition-colors cursor-pointer"
                  >
                    Adjust Thresholds
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {editingPolicy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-line bg-surface p-6 shadow-2xl space-y-4">
            <h3 className="font-display text-lg font-semibold text-text">
              Adjust {editingPolicy.name} Thresholds
            </h3>
            <form onSubmit={handleUpdate} className="space-y-3">
              <div>
                <label className="text-xs font-medium uppercase text-muted">First Response Target (Hours)</label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  required
                  value={responseHours}
                  onChange={(e) => setResponseHours(Number(e.target.value))}
                  className="mt-1 w-full rounded-md border border-line bg-ink px-3 py-1.5 text-sm text-text outline-none focus:border-signal font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-medium uppercase text-muted">Target Resolution Window (Hours)</label>
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  required
                  value={resolutionHours}
                  onChange={(e) => setResolutionHours(Number(e.target.value))}
                  className="mt-1 w-full rounded-md border border-line bg-ink px-3 py-1.5 text-sm text-text outline-none focus:border-signal font-mono"
                />
              </div>
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="bizHours"
                  checked={businessOnly}
                  onChange={(e) => setBusinessOnly(e.target.checked)}
                  className="rounded border-line bg-ink text-signal"
                />
                <label htmlFor="bizHours" className="text-xs text-text">
                  Enforce strictly during Standard Business Hours (Exclude weekends & holidays)
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingPolicy(null)}
                  className="rounded-md border border-line px-3.5 py-1.5 text-xs text-muted hover:text-text cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-md bg-signal px-4 py-1.5 text-xs font-semibold text-signal-text hover:opacity-90 disabled:opacity-50 cursor-pointer"
                >
                  {saving ? "Updating…" : "Save Policy"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
