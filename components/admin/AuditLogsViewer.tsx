"use client";

import { useState, useEffect } from "react";
import { getAdminHeaders, getAdminAuthToken } from "@/lib/auth-client";

interface AuditLog {
  id: string;
  actor_email: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  metadata: Record<string, any>;
  ip_address: string | null;
  created_at: string;
}

export function AuditLogsViewer() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const loadLogs = async () => {
    const token = getAdminAuthToken();
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/audit/logs", { headers: getAdminHeaders() });
      if (res.ok) {
        const json = await res.json();
        setLogs(json.data || []);
      }
    } catch (err) {
      console.error("Failed to load audit logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filteredLogs = logs.filter(
    (l) =>
      l.actor_email.toLowerCase().includes(search.toLowerCase()) ||
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.resource_type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Filter and Search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-text">Enterprise Audit Trail & Compliance</h2>
          <p className="text-xs text-muted">
            Immutable log of all user actions, security modifications, and automated agent events.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search action, actor, resource..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-lg border border-line bg-ink px-3 py-1.5 text-xs text-text placeholder-muted focus:border-signal focus:outline-none"
          />
          <button
            onClick={loadLogs}
            className="rounded-lg border border-line bg-ink px-2.5 py-1.5 text-xs text-muted hover:text-text"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="rounded-xl border border-line bg-surface overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-line bg-ink/50 text-[11px] font-semibold text-muted uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Actor</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Resource</th>
                <th className="px-4 py-3">IP Address</th>
                <th className="px-4 py-3 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line font-mono text-[11px]">
              {filteredLogs.map((log) => (
                <tr
                  key={log.id}
                  onClick={() => setSelectedLog(log)}
                  className="hover:bg-ink/40 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 text-muted">
                    {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </td>
                  <td className="px-4 py-3 text-text font-sans font-medium">
                    {log.actor_email}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded bg-signal/15 px-2 py-0.5 text-signal font-semibold">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {log.resource_type}
                    {log.resource_id && <span className="text-text"> #{log.resource_id}</span>}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {log.ip_address || "internal"}
                  </td>
                  <td className="px-4 py-3 text-right font-sans">
                    <button className="text-xs text-signal hover:underline">
                      Inspect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Metadata Detail Drawer */}
      {selectedLog && (
        <div className="rounded-xl border border-line bg-surface p-5 shadow-lg space-y-3">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <div>
              <h3 className="text-xs font-semibold text-text uppercase tracking-wider">
                Audit Event Metadata & Context
              </h3>
              <div className="text-[11px] font-mono text-muted mt-0.5">
                {selectedLog.id} &middot; {selectedLog.action}
              </div>
            </div>
            <button
              onClick={() => setSelectedLog(null)}
              className="rounded-lg border border-line p-1 text-xs text-muted hover:text-text"
            >
              ✕ Close
            </button>
          </div>

          <pre className="rounded-lg bg-ink p-3 text-[11px] font-mono text-text overflow-x-auto">
            {JSON.stringify(
              {
                id: selectedLog.id,
                action: selectedLog.action,
                actor: selectedLog.actor_email,
                resource: selectedLog.resource_type,
                resourceId: selectedLog.resource_id,
                ip: selectedLog.ip_address,
                timestamp: selectedLog.created_at,
                metadata: selectedLog.metadata,
              },
              null,
              2
            )}
          </pre>
        </div>
      )}
    </div>
  );
}
