import { AgentOpsDashboard } from "@/components/admin/AgentOpsDashboard";

export default function AgentsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-bold tracking-tight text-text">
          AI Operations & Human-in-the-Loop Approvals
        </h1>
        <p className="text-sm text-muted">
          Execute controlled operational agents with verified tool boundaries, shadow execution, and approval inboxes.
        </p>
      </div>

      <AgentOpsDashboard />
    </div>
  );
}
