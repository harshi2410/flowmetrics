import { EvaluationsDeck } from "@/components/admin/EvaluationsDeck";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Evaluations — Flowmetrics",
  description: "Continuous agent benchmark evaluations, accuracy scores, and regression test suites.",
};

export default function AdminEvaluationsPage() {
  return (
    <div>
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-text">Evaluations</h1>
        <p className="text-sm text-muted">
          Agent regression evaluations, alignment metrics, and comparison against verified human baselines.
        </p>
      </div>

      <div className="mt-8">
        <EvaluationsDeck />
      </div>
    </div>
  );
}
