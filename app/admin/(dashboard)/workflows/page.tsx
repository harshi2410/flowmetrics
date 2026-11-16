import { WorkflowAutomationManager } from "@/components/admin/WorkflowAutomationManager";

export default function WorkflowsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-bold tracking-tight text-text">
          Workflow Automation Rules
        </h1>
        <p className="text-sm text-muted">
          Configure event triggers, conditional business logic, and automated operational actions.
        </p>
      </div>

      <WorkflowAutomationManager />
    </div>
  );
}
