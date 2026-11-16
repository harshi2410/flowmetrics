import { WorkloadTracker } from "@/components/admin/WorkloadTracker";

export default function WorkloadPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-bold tracking-tight text-text">
          Team Capacity & Workload Balance
        </h1>
        <p className="text-sm text-muted">
          Real-time visibility into engineering capacity, sprint allocation, and burnout prevention.
        </p>
      </div>

      <WorkloadTracker />
    </div>
  );
}
