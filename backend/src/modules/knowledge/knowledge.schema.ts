import { z } from "zod";

export const CreateDocumentSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(200),
  sourceType: z
    .enum(["runbook", "faq", "policy", "api_spec", "manual"])
    .default("runbook"),
  content: z.string().min(10, "Content must be at least 10 characters").max(100000),
  metadata: z.record(z.any()).default({}),
});

export const QueryKnowledgeSchema = z.object({
  query: z.string().min(2, "Query must be at least 2 characters").max(1000),
  limit: z.coerce.number().min(1).max(20).default(5),
  sourceType: z.string().optional(),
});
