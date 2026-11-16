import { knowledgeRepository, KnowledgeDocumentRow, KnowledgeChunkRow } from "./knowledge.repository.js";
import { CreateDocumentSchema, QueryKnowledgeSchema } from "./knowledge.schema.js";
import { z } from "zod";

export class KnowledgeService {
  async getDocuments(orgId: string): Promise<KnowledgeDocumentRow[]> {
    return knowledgeRepository.listDocuments(orgId);
  }

  async createDocument(orgId: string, input: z.infer<typeof CreateDocumentSchema>): Promise<KnowledgeDocumentRow> {
    return knowledgeRepository.createDocument(
      orgId,
      input.title,
      input.sourceType,
      input.content,
      input.metadata
    );
  }

  async queryKnowledge(orgId: string, input: z.infer<typeof QueryKnowledgeSchema>): Promise<KnowledgeChunkRow[]> {
    return knowledgeRepository.queryKnowledge(orgId, input.query, input.limit);
  }
}

export const knowledgeService = new KnowledgeService();
