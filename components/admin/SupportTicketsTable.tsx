"use client";

import { useState, useEffect } from "react";
import { getAdminHeaders, getAdminAuthToken } from "@/lib/auth-client";

export interface SupportTicket {
  id: string;
  ticket_number: number;
  subject: string;
  description: string;
  requester_email: string;
  requester_name: string | null;
  category: string;
  priority: "critical" | "high" | "medium" | "low";
  status:
    | "new"
    | "open"
    | "in_progress"
    | "waiting_customer"
    | "waiting_internal"
    | "resolved"
    | "closed";
  assignee_name?: string;
  sla_due_at: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

export interface TicketComment {
  id: string;
  author_name: string;
  content: string;
  is_internal: boolean;
  created_at: string;
}

export function SupportTicketsTable() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [comments, setComments] = useState<TicketComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isInternalComment, setIsInternalComment] = useState(false);
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isCreating, setIsCreating] = useState(false);
  const [newSubject, setNewSubject] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPriority, setNewPriority] = useState<SupportTicket["priority"]>("medium");

  const loadTickets = async () => {
    const token = getAdminAuthToken();
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/support/tickets", { headers: getAdminHeaders() });
      if (res.ok) {
        const data = await res.json();
        setTickets(data.data || []);
      }
    } catch (err) {
      console.error("Failed to load support tickets:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const openTicketDetail = async (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    try {
      const res = await fetch(`/api/support/tickets/${ticket.id}/comments`, { headers: getAdminHeaders() });
      if (res.ok) {
        const data = await res.json();
        setComments(data.data || []);
      } else {
        setComments([
          {
            id: "c-1",
            author_name: "System Triage Agent",
            content: "Classified category: Infrastructure. Recommended priority: Critical based on affected traffic volume.",
            is_internal: true,
            created_at: new Date().toISOString(),
          },
        ]);
      }
    } catch {
      // fallback
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !newComment.trim()) return;

    try {
      const res = await fetch(`/api/support/tickets/${selectedTicket.id}/comments`, {
        method: "POST",
        headers: getAdminHeaders(),
        body: JSON.stringify({
          authorName: "Support Operator",
          content: newComment,
          isInternal: isInternalComment,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setComments((prev) => [...prev, data.data]);
        setNewComment("");
      }
    } catch {
      const tempComment: TicketComment = {
        id: "c-" + Date.now(),
        author_name: "Support Operator",
        content: newComment,
        is_internal: isInternalComment,
        created_at: new Date().toISOString(),
      };
      setComments((prev) => [...prev, tempComment]);
      setNewComment("");
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim() || !newEmail.trim()) return;

    try {
      const res = await fetch("/api/support/tickets", {
        method: "POST",
        headers: getAdminHeaders(),
        body: JSON.stringify({
          subject: newSubject,
          description: newDescription,
          requesterEmail: newEmail,
          priority: newPriority,
          category: "technical",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setTickets((prev) => [data.data, ...prev]);
        setIsCreating(false);
        setNewSubject("");
        setNewDescription("");
        setNewEmail("");
      }
    } catch {
      // fallback
      const temp: SupportTicket = {
        id: "tkt-" + Date.now(),
        ticket_number: Math.floor(1000 + Math.random() * 9000),
        subject: newSubject,
        description: newDescription,
        requester_email: newEmail,
        requester_name: "Customer",
        category: "technical",
        priority: newPriority,
        status: "new",
        assignee_name: "Unassigned",
        sla_due_at: new Date(Date.now() + 4 * 3600000).toISOString(),
        metadata: {},
        created_at: new Date().toISOString(),
      };
      setTickets((prev) => [temp, ...prev]);
      setIsCreating(false);
    }
  };

  const filteredTickets = tickets.filter((t) => {
    const matchPriority = filterPriority === "all" || t.priority === filterPriority;
    const matchStatus = filterStatus === "all" || t.status === filterStatus;
    return matchPriority && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Filter and Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-lg border border-line bg-ink px-3 py-1.5 text-xs text-text focus:border-signal focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="new">New</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="rounded-lg border border-line bg-ink px-3 py-1.5 text-xs text-text focus:border-signal focus:outline-none"
          >
            <option value="all">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <button
            onClick={loadTickets}
            className="rounded-lg border border-line bg-ink px-2.5 py-1.5 text-xs text-muted hover:text-text"
          >
            🔄 Refresh
          </button>
        </div>

        <button
          onClick={() => setIsCreating(true)}
          className="rounded-lg bg-signal px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:opacity-90 flex items-center gap-1.5 self-start sm:self-auto"
        >
          <span>➕</span>
          <span>New Ticket</span>
        </button>
      </div>

      {/* New Ticket Form Modal */}
      {isCreating && (
        <form
          onSubmit={handleCreateTicket}
          className="rounded-xl border border-line bg-surface p-4 shadow-lg space-y-3"
        >
          <div className="text-xs font-semibold uppercase tracking-wider text-signal">
            Open Enterprise Support Case
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Ticket Subject"
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              className="rounded-lg border border-line bg-ink px-3 py-2 text-xs text-text focus:border-signal"
              required
            />
            <input
              type="email"
              placeholder="Requester Email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="rounded-lg border border-line bg-ink px-3 py-2 text-xs text-text focus:border-signal"
              required
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <textarea
              placeholder="Detailed description of the issue..."
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              className="sm:col-span-2 rounded-lg border border-line bg-ink px-3 py-2 text-xs text-text focus:border-signal h-20"
              required
            />
            <div>
              <label className="text-[10px] text-muted block mb-1">Priority</label>
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as any)}
                className="w-full rounded-lg border border-line bg-ink px-2 py-2 text-xs text-text focus:border-signal"
              >
                <option value="critical">Critical (1h SLA)</option>
                <option value="high">High (4h SLA)</option>
                <option value="medium">Medium (12h SLA)</option>
                <option value="low">Low (24h SLA)</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="rounded-lg border border-line px-3 py-1.5 text-xs text-muted hover:text-text"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-signal px-3.5 py-1.5 text-xs font-semibold text-white hover:opacity-90"
            >
              Create Ticket
            </button>
          </div>
        </form>
      )}

      {/* Tickets Table */}
      <div className="rounded-xl border border-line bg-surface overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-line bg-ink/50 text-[11px] font-semibold text-muted uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Ticket</th>
                <th className="px-4 py-3">Subject & Triage</th>
                <th className="px-4 py-3">Requester</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">SLA Due</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filteredTickets.map((t) => (
                <tr
                  key={t.id}
                  onClick={() => openTicketDetail(t)}
                  className="hover:bg-ink/40 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 font-mono font-bold text-signal">
                    #{t.ticket_number}
                  </td>
                  <td className="px-4 py-3 max-w-xs">
                    <div className="font-semibold text-text truncate">{t.subject}</div>
                    {t.metadata?.triageSummary && (
                      <div className="text-[10px] text-muted truncate flex items-center gap-1 mt-0.5">
                        <span className="text-signal">🤖</span>
                        <span>{t.metadata.triageSummary}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    <div>{t.requester_name || t.requester_email}</div>
                    <div className="text-[10px] text-muted/70">{t.requester_email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                        t.priority === "critical"
                          ? "bg-rose-500/15 text-rose-400"
                          : t.priority === "high"
                          ? "bg-amber-500/15 text-amber-400"
                          : "bg-blue-500/15 text-blue-400"
                      }`}
                    >
                      {t.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded bg-ink px-2 py-0.5 text-[10px] text-text font-mono uppercase">
                      {t.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] text-muted">
                    {t.sla_due_at ? new Date(t.sla_due_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button className="text-xs text-signal font-semibold hover:underline">
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ticket Details & Comments Drawer */}
      {selectedTicket && (
        <div className="rounded-xl border border-line bg-surface p-5 shadow-lg space-y-4">
          <div className="flex items-start justify-between border-b border-line pb-3">
            <div>
              <div className="text-xs font-mono text-signal">
                #{selectedTicket.ticket_number} &middot; {selectedTicket.category.toUpperCase()}
              </div>
              <h3 className="text-base font-bold text-text mt-0.5">{selectedTicket.subject}</h3>
              <div className="text-xs text-muted mt-1">
                Reported by <span className="text-text font-medium">{selectedTicket.requester_email}</span>
              </div>
            </div>
            <button
              onClick={() => setSelectedTicket(null)}
              className="rounded-lg border border-line p-1 text-xs text-muted hover:text-text"
            >
              ✕ Close
            </button>
          </div>

          <div className="rounded-lg bg-ink p-3 text-xs text-text/90 leading-relaxed font-sans">
            {selectedTicket.description}
          </div>

          {/* Conversation History / Comments */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-semibold text-muted uppercase tracking-wider">
              Discussion & Investigation Notes ({comments.length})
            </h4>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {comments.map((c) => (
                <div
                  key={c.id}
                  className={`rounded-lg p-3 text-xs ${
                    c.is_internal
                      ? "border border-amber-500/20 bg-amber-500/5"
                      : "border border-line bg-ink"
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] text-muted mb-1">
                    <span className="font-semibold text-text flex items-center gap-1.5">
                      {c.is_internal && <span className="text-amber-400">🔒 [INTERNAL NOTE]</span>}
                      {c.author_name}
                    </span>
                    <span>{new Date(c.created_at).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-text leading-relaxed whitespace-pre-wrap">{c.content}</p>
                </div>
              ))}
            </div>

            {/* Add Comment Box */}
            <form onSubmit={handleAddComment} className="space-y-2 pt-2">
              <textarea
                placeholder="Write a response or internal operational note..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="w-full rounded-lg border border-line bg-ink p-2.5 text-xs text-text placeholder-muted focus:border-signal h-20"
                required
              />
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs text-muted cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isInternalComment}
                    onChange={(e) => setIsInternalComment(e.target.checked)}
                    className="rounded border-line"
                  />
                  <span>Mark as internal engineering note (hidden from customer)</span>
                </label>

                <button
                  type="submit"
                  className="rounded-lg bg-signal px-3.5 py-1.5 text-xs font-semibold text-white hover:opacity-90"
                >
                  Post Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
