import { SlaManagement } from "@/components/admin/SlaManagement";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "SLA Policies — Flowmetrics",
  description: "Configure incident response and resolution time targets by priority.",
};

export default function AdminSlaPage() {
  return (
    <div>
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-text">SLA Policies</h1>
        <p className="text-sm text-muted">
          Enterprise response and resolution time obligations across incident priority tiers.
        </p>
      </div>

      <div className="mt-8">
        <SlaManagement />
      </div>
    </div>
  );
}
