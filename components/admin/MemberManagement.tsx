"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";

interface Member {
  member_id: string;
  user_id: string;
  email: string;
  role_id: string;
  role_name: string;
  status: string;
  joined_at: string;
  full_name: string | null;
  job_title: string | null;
}

interface Invitation {
  id: string;
  email: string;
  role_id: string;
  role_name: string;
  token: string;
  status: string;
  expires_at: string;
  created_at: string;
}

const ROLES_LIST = [
  { id: "org_admin", name: "Organization Administrator", desc: "Full administrative access" },
  { id: "operations_manager", name: "Operations Manager", desc: "Teams & workload management" },
  { id: "project_manager", name: "Project Manager", desc: "Sprints, projects & tasks" },
  { id: "support_manager", name: "Support Manager", desc: "Support queues & SLA" },
  { id: "support_agent", name: "Support Agent", desc: "Ticket handling & triage" },
  { id: "team_member", name: "Team Member", desc: "Assigned tasks contributor" },
  { id: "viewer", name: "Viewer", desc: "Read-only access" },
];

export function MemberManagement() {
  const [members, setMembers] = useState<Member[]>([
    {
      member_id: "m-1",
      user_id: "u-1",
      email: "admin@flowmetrics.io",
      role_id: "owner",
      role_name: "Owner",
      status: "active",
      joined_at: new Date().toISOString(),
      full_name: "Flowmetrics Platform Administrator",
      job_title: "Principal Architect",
    },
  ]);

  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("team_member");
  const [sendingInvite, setSendingInvite] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const getOrgSlug = (): string => {
    try {
      const saved = localStorage.getItem("flowmetrics_current_org");
      if (saved) {
        return JSON.parse(saved).slug || "flowmetrics-hq";
      }
    } catch {
      // ignore
    }
    return "flowmetrics-hq";
  };

  const loadData = async () => {
    setLoading(true);
    const orgSlug = getOrgSlug();
    const token = localStorage.getItem("flowmetrics_admin_token");
    const headers: Record<string, string> = {
      "X-Organization-Id": orgSlug,
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    try {
      // Load members
      const mRes = await fetch(`/api/organizations/${orgSlug}/members`, { headers });
      if (mRes.ok) {
        const mJson = await mRes.json();
        if (mJson.data) setMembers(mJson.data);
      }

      // Load pending invitations
      const iRes = await fetch(`/api/organizations/${orgSlug}/invitations`, { headers });
      if (iRes.ok) {
        const iJson = await iRes.json();
        if (iJson.data) setInvitations(iJson.data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendingInvite(true);
    setFeedback(null);

    const orgSlug = getOrgSlug();
    const token = localStorage.getItem("flowmetrics_admin_token");

    try {
      const res = await fetch(`/api/organizations/${orgSlug}/invitations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
          "X-Organization-Id": orgSlug,
        },
        body: JSON.stringify({ email: inviteEmail.trim(), roleId: inviteRole }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || "Failed to send invitation.");
      }

      setFeedback({ text: `Invitation sent to ${inviteEmail}!`, type: "success" });
      setInviteEmail("");
      setShowInviteModal(false);
      loadData();
    } catch (err: unknown) {
      setFeedback({
        text: err instanceof Error ? err.message : "Failed to invite member.",
        type: "error",
      });
    } finally {
      setSendingInvite(false);
    }
  };

  const handleRoleChange = async (memberId: string, newRoleId: string) => {
    const orgSlug = getOrgSlug();
    const token = localStorage.getItem("flowmetrics_admin_token");

    try {
      const res = await fetch(`/api/organizations/${orgSlug}/members/${memberId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
          "X-Organization-Id": orgSlug,
        },
        body: JSON.stringify({ roleId: newRoleId }),
      });

      if (res.ok) {
        setMembers((prev) =>
          prev.map((m) => (m.member_id === memberId ? { ...m, role_id: newRoleId, role_name: newRoleId } : m))
        );
        setFeedback({ text: "Member role updated.", type: "success" });
      }
    } catch {
      // ignore
    }
  };

  const handleRemoveMember = async (memberId: string, email: string) => {
    if (!window.confirm(`Are you sure you want to remove ${email} from this organization?`)) {
      return;
    }

    const orgSlug = getOrgSlug();
    const token = localStorage.getItem("flowmetrics_admin_token");

    try {
      const res = await fetch(`/api/organizations/${orgSlug}/members/${memberId}`, {
        method: "DELETE",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "X-Organization-Id": orgSlug,
        },
      });

      if (res.ok) {
        setMembers((prev) => prev.filter((m) => m.member_id !== memberId));
        setFeedback({ text: "Member removed from organization.", type: "success" });
      } else {
        const errJson = await res.json();
        alert(errJson.message || "Failed to remove member.");
      }
    } catch {
      // ignore
    }
  };

  const handleRevokeInvite = async (inviteId: string) => {
    const orgSlug = getOrgSlug();
    const token = localStorage.getItem("flowmetrics_admin_token");

    try {
      const res = await fetch(`/api/organizations/${orgSlug}/invitations/${inviteId}`, {
        method: "DELETE",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "X-Organization-Id": orgSlug,
        },
      });

      if (res.ok) {
        setInvitations((prev) => prev.filter((i) => i.id !== inviteId));
        setFeedback({ text: "Invitation revoked.", type: "success" });
      }
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-semibold text-text">Team Members & Role Access</h2>
          <p className="text-xs sm:text-sm text-muted">
            Manage who has access to this workspace and enforce role-based permissions.
          </p>
        </div>

        <Button size="sm" onClick={() => setShowInviteModal(true)}>
          <span>✉️</span>
          <span>Invite Member</span>
        </Button>
      </div>

      {feedback && (
        <div
          className={`rounded-md p-3 text-xs font-medium flex items-center justify-between ${
            feedback.type === "success"
              ? "border border-signal/40 bg-signal/10 text-signal"
              : "border border-danger/40 bg-danger/10 text-danger"
          }`}
        >
          <span>{feedback.text}</span>
          <button type="button" onClick={() => setFeedback(null)} className="text-muted hover:text-text ml-2">
            ✕
          </button>
        </div>
      )}

      {/* Active Members Table */}
      <div className="rounded-xl border border-line bg-surface overflow-hidden">
        <div className="border-b border-line p-4 sm:px-6 flex items-center justify-between">
          <h3 className="font-display text-sm font-semibold text-text">
            Active Members ({members.length})
          </h3>
          {loading && <span className="text-xs text-muted animate-pulse">Syncing…</span>}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-ink/30 text-xs text-muted uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3 font-medium">User</th>
                <th className="px-6 py-3 font-medium">Role</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Joined</th>
                <th className="px-6 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {members.map((member) => (
                <tr key={member.member_id} className="hover:bg-ink/20 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-signal/15 text-xs font-bold text-signal border border-signal/30">
                        {(member.full_name || member.email).slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-text truncate">
                          {member.full_name || member.email}
                        </div>
                        <div className="text-xs text-muted truncate">{member.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {member.role_id === "owner" ? (
                      <span className="rounded-full bg-signal/15 px-2.5 py-0.5 text-xs font-semibold text-signal uppercase tracking-wider">
                        Owner
                      </span>
                    ) : (
                      <select
                        value={member.role_id}
                        onChange={(e) => handleRoleChange(member.member_id, e.target.value)}
                        className="rounded border border-line bg-ink px-2 py-1 text-xs text-text outline-none focus:border-signal"
                      >
                        {ROLES_LIST.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 text-xs text-text">
                      <span className="h-1.5 w-1.5 rounded-full bg-signal" />
                      {member.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-muted">
                    {new Date(member.joined_at).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {member.role_id !== "owner" && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(member.member_id, member.email)}
                        className="text-xs font-medium text-muted hover:text-danger transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pending Invitations Table */}
      {invitations.length > 0 && (
        <div className="rounded-xl border border-line bg-surface overflow-hidden">
          <div className="border-b border-line p-4 sm:px-6">
            <h3 className="font-display text-sm font-semibold text-text">
              Pending Invitations ({invitations.length})
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line bg-ink/30 text-xs text-muted uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3 font-medium">Invited Email</th>
                  <th className="px-6 py-3 font-medium">Assigned Role</th>
                  <th className="px-6 py-3 font-medium">Expires</th>
                  <th className="px-6 py-3 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {invitations.map((inv) => (
                  <tr key={inv.id} className="hover:bg-ink/20">
                    <td className="px-6 py-3 font-medium text-text">{inv.email}</td>
                    <td className="px-6 py-3 text-xs text-muted">{inv.role_name || inv.role_id}</td>
                    <td className="px-6 py-3 text-xs text-muted">
                      {new Date(inv.expires_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleRevokeInvite(inv.id)}
                        className="text-xs text-danger hover:underline"
                      >
                        Revoke
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-line bg-surface p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="font-display text-base font-semibold text-text">Invite Team Member</h3>
              <button
                type="button"
                onClick={() => setShowInviteModal(false)}
                className="text-muted hover:text-text text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendInvite} className="space-y-4">
              <div>
                <label className="text-xs font-medium uppercase tracking-wider text-muted">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@yourcompany.com"
                  className="mt-1.5 w-full rounded-md border border-line bg-ink px-3.5 py-2 text-sm text-text outline-none focus:border-signal"
                />
              </div>

              <div>
                <label className="text-xs font-medium uppercase tracking-wider text-muted">
                  Select Role & Permissions
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="mt-1.5 w-full rounded-md border border-line bg-ink px-3 py-2 text-sm text-text outline-none focus:border-signal"
                >
                  {ROLES_LIST.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} — {r.desc}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-line">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="rounded-md border border-line bg-ink px-3 py-1.5 text-xs text-muted hover:text-text"
                >
                  Cancel
                </button>
                <Button type="submit" size="sm" disabled={sendingInvite || !inviteEmail.trim()}>
                  {sendingInvite ? "Sending…" : "Send Invitation"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
