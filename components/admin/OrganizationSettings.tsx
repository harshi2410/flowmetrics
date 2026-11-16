"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";

interface OrgData {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  timezone: string;
  status: string;
  settings?: Record<string, unknown>;
  membership?: {
    roleName: string;
    roleId: string;
  };
}

export function OrganizationSettings() {
  const [org, setOrg] = useState<OrgData>({
    id: "default-org-id",
    name: "Flowmetrics Enterprise",
    slug: "flowmetrics-hq",
    logo_url: "",
    timezone: "America/New_York",
    status: "active",
    membership: { roleName: "Owner", roleId: "owner" },
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Form Fields
  const [name, setName] = useState(org.name);
  const [slug, setSlug] = useState(org.slug);
  const [timezone, setTimezone] = useState(org.timezone);
  const [logoUrl, setLogoUrl] = useState(org.logo_url || "");

  useEffect(() => {
    async function loadOrg() {
      setLoading(true);
      try {
        const token = localStorage.getItem("flowmetrics_admin_token");
        const res = await fetch("/api/organizations", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const json = await res.json();
          if (json.data && json.data.length > 0) {
            const first = json.data[0];
            setOrg(first);
            setName(first.name);
            setSlug(first.slug);
            setTimezone(first.timezone || "America/New_York");
            setLogoUrl(first.logo_url || "");
            localStorage.setItem(
              "flowmetrics_current_org",
              JSON.stringify({
                name: first.name,
                slug: first.slug,
                role: first.user_role || "Owner",
              })
            );
          }
        }
      } catch {
        // use default state
      } finally {
        setLoading(false);
      }
    }
    loadOrg();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMessage(null);

    try {
      const token = localStorage.getItem("flowmetrics_admin_token");
      const res = await fetch(`/api/organizations/${org.slug || org.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
          "X-Organization-Id": org.slug || org.id,
        },
        body: JSON.stringify({
          name: name.trim(),
          timezone,
          logoUrl: logoUrl.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.message || "Failed to update organization settings");
      }

      setStatusMessage({ text: "Organization profile updated successfully!", type: "success" });
      localStorage.setItem(
        "flowmetrics_current_org",
        JSON.stringify({
          name: name.trim(),
          slug,
          role: org.membership?.roleName || "Owner",
        })
      );
    } catch (err: unknown) {
      setStatusMessage({
        text: err instanceof Error ? err.message : "Failed to save settings.",
        type: "error",
      });
    } finally {
      setSaving(false);
      setTimeout(() => setStatusMessage(null), 3500);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Overview Card */}
      <div className="rounded-xl border border-line bg-surface p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-signal/15 text-2xl font-bold text-signal border border-signal/30 font-display">
            {name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-lg font-semibold text-text">{name}</h2>
              <span className="rounded-full bg-signal/15 px-2.5 py-0.5 text-xs font-semibold text-signal uppercase tracking-wider">
                {org.status}
              </span>
            </div>
            <p className="mt-0.5 font-mono text-xs text-muted">
              Tenant Slug: <span className="text-text font-medium">/{slug}</span> &middot; Your Role:{" "}
              <span className="text-signal font-semibold">{org.membership?.roleName || "Owner"}</span>
            </p>
          </div>
        </div>

        <div className="text-xs text-muted">
          Created: {new Date().toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
        </div>
      </div>

      {/* Settings Form */}
      <form onSubmit={handleSave} className="rounded-xl border border-line bg-surface p-5 sm:p-6 space-y-5">
        <div className="border-b border-line pb-4 flex items-center justify-between">
          <div>
            <h3 className="font-display text-base font-semibold text-text">Workspace Profile & General Settings</h3>
            <p className="text-xs text-muted">Configure your organization&apos;s identity and regional defaults.</p>
          </div>
          {loading && <span className="text-xs text-muted animate-pulse">Loading…</span>}
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="text-xs font-medium uppercase tracking-wider text-muted">Organization Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Acme Corporation"
              className="mt-1.5 w-full rounded-md border border-line bg-ink px-3.5 py-2 text-sm text-text outline-none focus:border-signal"
            />
          </div>

          <div>
            <label className="text-xs font-medium uppercase tracking-wider text-muted">Organization Slug (Fixed)</label>
            <input
              type="text"
              readOnly
              disabled
              value={slug}
              className="mt-1.5 w-full rounded-md border border-line bg-ink/50 px-3.5 py-2 text-sm text-muted font-mono cursor-not-allowed"
            />
            <p className="mt-1 text-[11px] text-muted">Slugs are uniquely immutable workspace identifiers.</p>
          </div>

          <div>
            <label className="text-xs font-medium uppercase tracking-wider text-muted">Default Timezone</label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="mt-1.5 w-full rounded-md border border-line bg-ink px-3.5 py-2 text-sm text-text outline-none focus:border-signal"
            >
              <option value="America/New_York">Eastern Time (US & Canada) - America/New_York</option>
              <option value="America/Chicago">Central Time (US & Canada) - America/Chicago</option>
              <option value="America/Denver">Mountain Time (US & Canada) - America/Denver</option>
              <option value="America/Los_Angeles">Pacific Time (US & Canada) - America/Los_Angeles</option>
              <option value="Europe/London">London (GMT / BST) - Europe/London</option>
              <option value="Europe/Berlin">Central European Time - Europe/Berlin</option>
              <option value="Asia/Tokyo">Japan Standard Time - Asia/Tokyo</option>
              <option value="Asia/Kolkata">India Standard Time - Asia/Kolkata</option>
              <option value="UTC">UTC (Universal Coordinated Time)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-medium uppercase tracking-wider text-muted">Brand Logo URL (Optional)</label>
            <input
              type="url"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://yourcompany.com/logo.png"
              className="mt-1.5 w-full rounded-md border border-line bg-ink px-3.5 py-2 text-sm text-text outline-none focus:border-signal"
            />
          </div>
        </div>

        {statusMessage && (
          <div
            className={`rounded-md p-3 text-xs font-medium ${
              statusMessage.type === "success"
                ? "border border-signal/40 bg-signal/10 text-signal"
                : "border border-danger/40 bg-danger/10 text-danger"
            }`}
          >
            {statusMessage.text}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-line">
          <Button type="submit" size="sm" disabled={saving}>
            {saving ? "Saving Changes…" : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}
