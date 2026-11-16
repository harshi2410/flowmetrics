import { ApprovalsInbox } from "@/components/admin/ApprovalsInbox";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Approvals — Flowmetrics",
  description: "Human-in-the-Loop review queue for high-risk agent actions and operations.",
};

export default function AdminApprovalsPage() {
  return (
    <div>
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-text">Approvals</h1>
        <p className="text-sm text-muted">
          Human-in-the-Loop authorization queue for high-risk autonomous agent operations.
        </p>
      </div>

      <div className="mt-8">
        <ApprovalsInbox />
      </div>
    </div>
  );
}
