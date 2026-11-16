import { AgentRunsViewer } from "@/components/admin/AgentRunsViewer";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Agent Runs — Flowmetrics",
  description: "Chronological log of autonomous AI agent executions, tokens used, and trace latency.",
};

export default function AdminAgentRunsPage() {
  return (
    <div>
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-text">Agent Runs</h1>
        <p className="text-sm text-muted">
          Chronological execution logs, step latency breakdowns, and tool invocation telemetry.
        </p>
      </div>

      <div className="mt-8">
        <AgentRunsViewer />
      </div>
    </div>
  );
}
