import { QueueManagement } from "@/components/admin/QueueManagement";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Support Queues — Flowmetrics",
  description: "Configure inbound support queues, triage routing pipelines, and team assignment.",
};

export default function AdminSupportQueuesPage() {
  return (
    <div>
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-text">Support Queues</h1>
        <p className="text-sm text-muted">
          Inbound ticket intake channels, specialized triage queues, and routing pipelines.
        </p>
      </div>

      <div className="mt-8">
        <QueueManagement />
      </div>
    </div>
  );
}
