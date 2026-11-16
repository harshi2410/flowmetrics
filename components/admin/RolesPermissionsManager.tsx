"use client";

import { useState, useEffect } from "react";

interface RoleItem {
  id: string;
  name: string;
  description: string;
  is_system?: boolean;
  permissions: string[];
}

export function RolesPermissionsManager() {
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<RoleItem | null>(null);

  const getHeaders = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("flowmetrics_token") || "" : "";
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  };

  const loadRoles = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/organizations/roles", { headers: getHeaders() });
      if (res.ok) {
        const json = await res.json();
        setRoles(json.data || []);
        if (json.data?.length > 0 && !selectedRole) {
          setSelectedRole(json.data[0]);
        }
      }
    } catch (err) {
      console.error("Failed to load roles:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoles();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-sm font-semibold text-text">Role-Based Access Control (RBAC) Matrix</h2>
        <p className="text-xs text-muted">
          Review system roles, granted capability permissions, and multi-tenant security boundaries.
        </p>
      </div>

      {loading ? (
        <div className="rounded-xl border border-line bg-surface p-8 text-center text-sm text-muted animate-pulse">
          Loading RBAC roles and permissions from database…
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Roles List */}
          <div className="space-y-3 lg:col-span-1">
            <h3 className="text-xs font-semibold uppercase text-muted tracking-wider">
              Configured Roles ({roles.length})
            </h3>
            <div className="space-y-2">
              {roles.map((r) => {
                const isSelected = selectedRole?.id === r.id;
                return (
                  <button
                    key={r.id}
                    onClick={() => setSelectedRole(r)}
                    className={`w-full text-left rounded-xl border p-4 transition-all cursor-pointer ${
                      isSelected
                        ? "border-signal bg-signal/5 ring-1 ring-signal shadow-sm"
                        : "border-line bg-surface hover:border-line hover:bg-surface-2/60"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-sm font-semibold text-text">{r.name}</h4>
                      <span className="font-mono text-[10px] text-muted uppercase bg-ink/60 px-1.5 py-0.5 rounded border border-line">
                        {r.id}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted line-clamp-2 leading-relaxed">{r.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Role Detail & Permissions */}
          <div className="lg:col-span-2 space-y-4">
            {selectedRole ? (
              <div className="rounded-xl border border-line bg-surface p-6 space-y-5">
                <div className="border-b border-line pb-4 flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-display text-lg font-semibold text-text">{selectedRole.name}</h3>
                      <span className="tag">System Role</span>
                    </div>
                    <p className="text-xs text-muted mt-1">{selectedRole.description}</p>
                  </div>
                  <span className="font-mono text-xs text-signal font-semibold">
                    {selectedRole.permissions?.length || 0} permissions
                  </span>
                </div>

                <div>
                  <h4 className="text-xs font-semibold uppercase text-muted tracking-wider mb-3">
                    Assigned Capability Grants
                  </h4>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {selectedRole.permissions && selectedRole.permissions.length > 0 ? (
                      selectedRole.permissions.map((perm, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 rounded-lg border border-line bg-ink/50 px-3 py-2 text-xs font-mono text-text"
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-signal shrink-0" />
                          <span className="truncate">{perm}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-muted italic col-span-2">No direct permissions assigned.</p>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-line text-xs text-muted flex items-center justify-between font-mono">
                  <span>Enforcement: PostgreSQL Scoped &bull; JWT Signed</span>
                  <span className="text-signal">Status: Active</span>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-line bg-surface p-12 text-center text-sm text-muted">
                Select a role from the list to inspect granted capabilities.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
