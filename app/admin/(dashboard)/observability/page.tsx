import { ObservabilityViewer } from "@/components/admin/ObservabilityViewer";

export default function ObservabilityPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-bold tracking-tight text-text">
          Agent Observability & Automated Evaluations
        </h1>
        <p className="text-sm text-muted">
          Deep execution tracing, state transitions, tool call telemetry, and safety benchmark scorecards.
        </p>
      </div>

      <ObservabilityViewer />
    </div>
  );
}
