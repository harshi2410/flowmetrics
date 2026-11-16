import { Response } from "express";
import { TenantRequest } from "../../middleware/tenant.middleware.js";
import { agentService } from "./agent.service.js";
import { toolRegistry } from "./tool.registry.js";
import {
  ExecuteAgentSchema,
  ReviewApprovalSchema,
  RunEvaluationsSchema,
} from "./agent.schema.js";
import { sendSuccess, sendError } from "../../utils/response.js";

export class AgentController {
  async executeAgent(req: TenantRequest, res: Response): Promise<void> {
    try {
      if (!req.organizationId) {
        sendError(res, "Forbidden", "Organization context missing", 403);
        return;
      }
      const validated = ExecuteAgentSchema.parse(req.body);
      const execution = await agentService.triggerAgent(
        req.organizationId,
        validated,
        req.user?.id
      );
      sendSuccess(res, execution, 201, { message: "Agent execution initiated" });
    } catch (err: any) {
      if (err.name === "ZodError") {
        sendError(res, "ValidationError", "Invalid agent request payload", 400, err.errors);
        return;
      }
      sendError(res, "ExecutionError", err.message || "Failed to execute agent", 500);
    }
  }

  async listExecutions(req: TenantRequest, res: Response): Promise<void> {
    try {
      if (!req.organizationId) {
        sendError(res, "Forbidden", "Organization context missing", 403);
        return;
      }
      const executions = await agentService.listExecutions(req.organizationId);
      sendSuccess(res, executions, 200, { message: "Executions retrieved" });
    } catch (err: any) {
      sendError(res, "FetchError", err.message || "Failed to list executions", 500);
    }
  }

  async getTrace(req: TenantRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const trace = await agentService.getExecutionTrace(id);
      if (!trace.execution) {
        sendError(res, "NotFound", "Execution not found", 404);
        return;
      }
      sendSuccess(res, trace, 200, { message: "Execution trace loaded" });
    } catch (err: any) {
      sendError(res, "TraceError", err.message || "Failed to load trace", 500);
    }
  }

  async listTools(req: TenantRequest, res: Response): Promise<void> {
    try {
      const tools = toolRegistry.listTools().map((t) => ({
        name: t.name,
        description: t.description,
        parameters: t.parameters,
        riskLevel: t.riskLevel,
        requiresApproval: t.requiresApproval,
      }));
      sendSuccess(res, tools, 200, { message: "Registered tools listed" });
    } catch (err: any) {
      sendError(res, "ToolsError", err.message || "Failed to list tools", 500);
    }
  }

  async listApprovals(req: TenantRequest, res: Response): Promise<void> {
    try {
      if (!req.organizationId) {
        sendError(res, "Forbidden", "Organization context missing", 403);
        return;
      }
      const { status } = req.query;
      const approvals = await agentService.listApprovals(
        req.organizationId,
        status ? String(status) : undefined
      );
      sendSuccess(res, approvals, 200, { message: "Approvals retrieved" });
    } catch (err: any) {
      sendError(res, "FetchError", err.message || "Failed to list approvals", 500);
    }
  }

  async resolveApproval(req: TenantRequest, res: Response): Promise<void> {
    try {
      if (!req.organizationId) {
        sendError(res, "Forbidden", "Organization context missing", 403);
        return;
      }
      const { id } = req.params;
      const validated = ReviewApprovalSchema.parse(req.body);
      const resolved = await agentService.resolveApproval(
        req.organizationId,
        id,
        req.user?.id || "admin-user",
        validated
      );
      sendSuccess(res, resolved, 200, { message: `Approval ${validated.action}ed successfully` });
    } catch (err: any) {
      if (err.name === "ZodError") {
        sendError(res, "ValidationError", "Invalid approval payload", 400, err.errors);
        return;
      }
      sendError(res, "ApprovalError", err.message || "Failed to resolve approval", 400);
    }
  }

  async runEvaluations(req: TenantRequest, res: Response): Promise<void> {
    try {
      if (!req.organizationId) {
        sendError(res, "Forbidden", "Organization context missing", 403);
        return;
      }
      const validated = RunEvaluationsSchema.parse(req.body || {});
      const results = await agentService.runEvaluations(req.organizationId, validated.suiteName);
      sendSuccess(res, results, 200, {
        message: "Evaluation suite finished",
        totalTests: results.length,
        passedTests: results.filter((r) => r.passed).length,
      });
    } catch (err: any) {
      sendError(res, "EvalError", err.message || "Failed to run evaluations", 500);
    }
  }

  async listEvaluations(req: TenantRequest, res: Response): Promise<void> {
    try {
      if (!req.organizationId) {
        sendError(res, "Forbidden", "Organization context missing", 403);
        return;
      }
      const evals = await agentService.listEvaluations(req.organizationId);
      sendSuccess(res, evals, 200, { message: "Evaluation history loaded" });
    } catch (err: any) {
      sendError(res, "FetchError", err.message || "Failed to list evaluations", 500);
    }
  }
}

export const agentController = new AgentController();
