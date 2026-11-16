import { KnowledgeBaseManager } from "@/components/admin/KnowledgeBaseManager";

export default function KnowledgePage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-bold tracking-tight text-text">
          Enterprise Knowledge Base & Semantic RAG
        </h1>
        <p className="text-sm text-muted">
          Manage operational documentation, incident runbooks, and verify semantic retrieval accuracy.
        </p>
      </div>

      <KnowledgeBaseManager />
    </div>
  );
}
