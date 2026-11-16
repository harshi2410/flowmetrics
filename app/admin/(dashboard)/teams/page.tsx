import { TeamManagement } from "@/components/admin/TeamManagement";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Teams — Flowmetrics",
  description: "Manage cross-functional squads, engineering team leads, and operational ownership.",
};

export default function AdminTeamsPage() {
  return (
    <div>
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-text">Teams</h1>
        <p className="text-sm text-muted">
          Operational engineering teams, designated squad leads, and capacity allocation.
        </p>
      </div>

      <div className="mt-8">
        <TeamManagement />
      </div>
    </div>
  );
}
