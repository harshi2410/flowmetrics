import { ProjectManagement } from "@/components/admin/ProjectManagement";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Projects — Flowmetrics",
  description: "Manage engineering projects, milestone health, and delivery timelines.",
};

export default function AdminProjectsPage() {
  return (
    <div>
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-text">Projects</h1>
        <p className="text-sm text-muted">
          Operational projects, cross-functional delivery streams, and health scores.
        </p>
      </div>

      <div className="mt-8">
        <ProjectManagement />
      </div>
    </div>
  );
}
