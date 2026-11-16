import { OrganizationSettings } from "@/components/admin/OrganizationSettings";

export const dynamic = "force-dynamic";

export default function AdminOrganizationPage() {
  return (
    <div>
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Organization Profile</h1>
        <p className="text-sm text-muted">
          Manage workspace settings, domain slug, timezones, and enterprise identity.
        </p>
      </div>

      <div className="mt-8">
        <OrganizationSettings />
      </div>
    </div>
  );
}
