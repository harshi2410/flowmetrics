import { RolesPermissionsManager } from "@/components/admin/RolesPermissionsManager";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Roles & Permissions — Flowmetrics",
  description: "Role-Based Access Control matrix, permission grants, and administrative authority.",
};

export default function AdminRolesPage() {
  return (
    <div>
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-text">Roles & Permissions</h1>
        <p className="text-sm text-muted">
          Multi-tenant role definitions, permission grants, and access authority boundaries.
        </p>
      </div>

      <div className="mt-8">
        <RolesPermissionsManager />
      </div>
    </div>
  );
}
