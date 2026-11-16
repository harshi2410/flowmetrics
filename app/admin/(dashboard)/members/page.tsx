import { MemberManagement } from "@/components/admin/MemberManagement";

export const dynamic = "force-dynamic";

export default function AdminMembersPage() {
  return (
    <div>
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Members & Access</h1>
        <p className="text-sm text-muted">
          Manage team member roles, permissions, invitations, and workspace security.
        </p>
      </div>

      <div className="mt-8">
        <MemberManagement />
      </div>
    </div>
  );
}
