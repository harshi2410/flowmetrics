import { SprintManagement } from "@/components/admin/SprintManagement";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Sprints — Flowmetrics",
  description: "Plan agile sprint iterations, delivery goals, and track completion velocity.",
};

export default function AdminSprintsPage() {
  return (
    <div>
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-text">Sprints</h1>
        <p className="text-sm text-muted">
          Iteration cycles, sprint goal checkpoints, and team delivery velocity.
        </p>
      </div>

      <div className="mt-8">
        <SprintManagement />
      </div>
    </div>
  );
}
