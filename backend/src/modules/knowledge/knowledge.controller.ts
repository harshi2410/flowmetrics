import { Response } from "express";
import { TenantRequest } from "../../middleware/tenant.middleware.js";
import { knowledgeService } from "./knowledge.service.js";
import { CreateDocumentSchema, QueryKnowledgeSchema } from "./knowledge.schema.js";
import { sendSuccess, sendError } from "../../utils/response.js";

export class KnowledgeController {
  async listDocuments(req: TenantRequest, res: Response): Promise<void> {
    try {
      if (!req.organizationId) {
        sendError(res, "Forbidden", "Organization context missing", 403);
        return;
      }
      const docs = await knowledgeService.getDocuments(req.organizationId);
      sendSuccess(res, docs, 200, { message: "Knowledge documents retrieved" });
    } catch (err: any) {
      sendError(res, "FetchError", err.message || "Failed to list knowledge documents", 500);
    }
  }

  async createDocument(req: TenantRequest, res: Response): Promise<void> {
    try {
      if (!req.organizationId) {
        sendError(res, "Forbidden", "Organization context missing", 403);
        return;
      }
      const validated = CreateDocumentSchema.parse(req.body);
      const doc = await knowledgeService.createDocument(req.organizationId, validated);
      sendSuccess(res, doc, 201, { message: "Document ingested and chunked successfully" });
    } catch (err: any) {
      if (err.name === "ZodError") {
        sendError(res, "ValidationError", "Invalid document format", 400, err.errors);
        return;
      }
      sendError(res, "IngestionError", err.message || "Failed to ingest document", 500);
    }
  }

  async query(req: TenantRequest, res: Response): Promise<void> {
    try {
      if (!req.organizationId) {
        sendError(res, "Forbidden", "Organization context missing", 403);
        return;
      }
      const validated = QueryKnowledgeSchema.parse(req.body);
      const results = await knowledgeService.queryKnowledge(req.organizationId, validated);
      sendSuccess(res, results, 200, {
        message: "Semantic search completed",
        query: validated.query,
        count: results.length,
      });
    } catch (err: any) {
      if (err.name === "ZodError") {
        sendError(res, "ValidationError", "Invalid search query", 400, err.errors);
        return;
      }
      sendError(res, "QueryError", err.message || "Failed to query knowledge base", 500);
    }
  }
}

export const knowledgeController = new KnowledgeController();
