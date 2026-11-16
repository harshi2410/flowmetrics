import { KanbanBoard } from "@/components/admin/KanbanBoard";

export default function TasksPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-bold tracking-tight text-text">
          Operations & Tasks Board
        </h1>
        <p className="text-sm text-muted">
          Track sprint execution, task velocity, and assign operational workloads.
        </p>
      </div>

      <KanbanBoard />
    </div>
  );
}
