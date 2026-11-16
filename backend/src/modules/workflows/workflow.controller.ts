import { Response } from "express";
import { TenantRequest } from "../../middleware/tenant.middleware.js";
import { workflowService } from "./workflow.service.js";
import { CreateWorkflowRuleSchema, TriggerEventSchema } from "./workflow.schema.js";
import { sendSuccess, sendError } from "../../utils/response.js";

export class WorkflowController {
  async listRules(req: TenantRequest, res: Response): Promise<void> {
    try {
      if (!req.organizationId) {
        sendError(res, "Forbidden", "Organization context missing", 403);
        return;
      }
      const rules = await workflowService.getRules(req.organizationId);
      sendSuccess(res, rules, 200, { message: "Workflow rules retrieved" });
    } catch (err: any) {
      sendError(res, "FetchError", err.message || "Failed to list workflow rules", 500);
    }
  }

  async createRule(req: TenantRequest, res: Response): Promise<void> {
    try {
      if (!req.organizationId) {
        sendError(res, "Forbidden", "Organization context missing", 403);
        return;
      }
      const validated = CreateWorkflowRuleSchema.parse(req.body);
      const rule = await workflowService.createRule(req.organizationId, validated);
      sendSuccess(res, rule, 201, { message: "Workflow rule configured successfully" });
    } catch (err: any) {
      if (err.name === "ZodError") {
        sendError(res, "ValidationError", "Invalid workflow rule schema", 400, err.errors);
        return;
      }
      sendError(res, "CreateError", err.message || "Failed to create workflow rule", 500);
    }
  }

  async triggerEvent(req: TenantRequest, res: Response): Promise<void> {
    try {
      if (!req.organizationId) {
        sendError(res, "Forbidden", "Organization context missing", 403);
        return;
      }
      const validated = TriggerEventSchema.parse(req.body);
      const result = await workflowService.triggerEvent(
        req.organizationId,
        validated.event,
        validated.payload
      );
      sendSuccess(res, result, 200, { message: "Workflow event processed" });
    } catch (err: any) {
      if (err.name === "ZodError") {
        sendError(res, "ValidationError", "Invalid trigger event payload", 400, err.errors);
        return;
      }
      sendError(res, "TriggerError", err.message || "Failed to trigger workflow", 500);
    }
  }
}

export const workflowController = new WorkflowController();
