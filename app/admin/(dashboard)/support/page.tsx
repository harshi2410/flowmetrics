import { SupportTicketsTable } from "@/components/admin/SupportTicketsTable";

export default function SupportPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-bold tracking-tight text-text">
          Enterprise Support Operations
        </h1>
        <p className="text-sm text-muted">
          Manage production customer incidents, SLA policies, and AI-assisted triage workflows.
        </p>
      </div>

      <SupportTicketsTable />
    </div>
  );
}
