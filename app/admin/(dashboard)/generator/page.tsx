import { ContentGenerator } from "@/components/admin/ContentGenerator";

export const dynamic = "force-dynamic";

export default function AdminContentGeneratorPage() {
  return (
    <div>
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-semibold tracking-tight">AI Content Studio</h1>
        <p className="text-sm text-muted">
          Create high-converting social media captions, long-form blog articles, and executive summaries powered by AI.
        </p>
      </div>

      <div className="mt-8">
        <ContentGenerator />
      </div>
    </div>
  );
}
