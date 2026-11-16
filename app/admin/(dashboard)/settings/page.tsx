import { OrganizationSettings } from "@/components/admin/OrganizationSettings";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Settings & Appearance — Flowmetrics",
  description: "Configure workspace settings and organization preferences.",
};

export default function AdminSettingsPage() {
  return (
    <div>
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-text">Workspace Settings</h1>
        <p className="text-sm text-muted">
          Manage workspace identity, timezone, and organization settings.
        </p>
      </div>

      <div className="mt-8">
        <OrganizationSettings />
      </div>
    </div>
  );
}
