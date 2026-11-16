import { Response } from "express";
import { TenantRequest } from "../../middleware/tenant.middleware.js";
import { supportService } from "./support.service.js";
import {
  CreateTicketSchema,
  UpdateTicketSchema,
  AddTicketCommentSchema,
} from "./support.schema.js";
import { sendSuccess, sendError } from "../../utils/response.js";

export class SupportController {
  async listTickets(req: TenantRequest, res: Response): Promise<void> {
    try {
      if (!req.organizationId) {
        sendError(res, "Forbidden", "Organization context missing", 403);
        return;
      }
      const { status, priority } = req.query;
      const tickets = await supportService.getTickets(
        req.organizationId,
        status ? String(status) : undefined,
        priority ? String(priority) : undefined
      );
      sendSuccess(res, tickets, 200, { message: "Tickets fetched successfully" });
    } catch (err: any) {
      sendError(res, "FetchError", err.message || "Failed to fetch tickets", 500);
    }
  }

  async getTicket(req: TenantRequest, res: Response): Promise<void> {
    try {
      if (!req.organizationId) {
        sendError(res, "Forbidden", "Organization context missing", 403);
        return;
      }
      const { id } = req.params;
      const ticket = await supportService.getTicket(req.organizationId, id);
      sendSuccess(res, ticket, 200, { message: "Ticket details fetched" });
    } catch (err: any) {
      sendError(res, "NotFound", err.message || "Ticket not found", 404);
    }
  }

  async createTicket(req: TenantRequest, res: Response): Promise<void> {
    try {
      if (!req.organizationId) {
        sendError(res, "Forbidden", "Organization context missing", 403);
        return;
      }
      const validated = CreateTicketSchema.parse(req.body);
      const ticket = await supportService.createTicket(req.organizationId, validated);
      sendSuccess(res, ticket, 201, { message: "Ticket created successfully" });
    } catch (err: any) {
      if (err.name === "ZodError") {
        sendError(res, "ValidationError", "Invalid ticket parameters", 400, err.errors);
        return;
      }
      sendError(res, "CreateError", err.message || "Failed to create ticket", 500);
    }
  }

  async updateTicket(req: TenantRequest, res: Response): Promise<void> {
    try {
      if (!req.organizationId) {
        sendError(res, "Forbidden", "Organization context missing", 403);
        return;
      }
      const { id } = req.params;
      const validated = UpdateTicketSchema.parse(req.body);
      const updated = await supportService.updateTicket(req.organizationId, id, validated);
      sendSuccess(res, updated, 200, { message: "Ticket updated successfully" });
    } catch (err: any) {
      if (err.name === "ZodError") {
        sendError(res, "ValidationError", "Invalid update parameters", 400, err.errors);
        return;
      }
      sendError(res, "UpdateError", err.message || "Failed to update ticket", 400);
    }
  }

  async addComment(req: TenantRequest, res: Response): Promise<void> {
    try {
      if (!req.organizationId) {
        sendError(res, "Forbidden", "Organization context missing", 403);
        return;
      }
      const { id } = req.params;
      const validated = AddTicketCommentSchema.parse(req.body);
      const comment = await supportService.addComment(
        req.organizationId,
        id,
        req.user?.id || null,
        validated
      );
      sendSuccess(res, comment, 201, { message: "Comment added successfully" });
    } catch (err: any) {
      if (err.name === "ZodError") {
        sendError(res, "ValidationError", "Invalid comment parameters", 400, err.errors);
        return;
      }
      sendError(res, "CommentError", err.message || "Failed to add comment", 400);
    }
  }

  async listComments(req: TenantRequest, res: Response): Promise<void> {
    try {
      if (!req.organizationId) {
        sendError(res, "Forbidden", "Organization context missing", 403);
        return;
      }
      const { id } = req.params;
      const comments = await supportService.getComments(req.organizationId, id);
      sendSuccess(res, comments, 200, { message: "Comments fetched successfully" });
    } catch (err: any) {
      sendError(res, "FetchError", err.message || "Failed to fetch comments", 404);
    }
  }

  // Queues
  async listQueues(req: TenantRequest, res: Response): Promise<void> {
    try {
      if (!req.organizationId) {
        sendError(res, "Forbidden", "Organization context missing", 403);
        return;
      }
      const queues = await supportService.listQueues(req.organizationId);
      sendSuccess(res, queues, 200, { message: "Queues fetched successfully" });
    } catch (err: any) {
      sendError(res, "FetchError", err.message || "Failed to fetch queues", 500);
    }
  }

  async createQueue(req: TenantRequest, res: Response): Promise<void> {
    try {
      if (!req.organizationId) {
        sendError(res, "Forbidden", "Organization context missing", 403);
        return;
      }
      const { name, description, teamId } = req.body;
      if (!name) {
        sendError(res, "ValidationError", "Queue name is required", 400);
        return;
      }
      const queue = await supportService.createQueue(req.organizationId, { name, description, teamId });
      sendSuccess(res, queue, 201, { message: "Queue created successfully" });
    } catch (err: any) {
      sendError(res, "CreateError", err.message || "Failed to create queue", 500);
    }
  }

  // SLA
  async listSlaPolicies(req: TenantRequest, res: Response): Promise<void> {
    try {
      if (!req.organizationId) {
        sendError(res, "Forbidden", "Organization context missing", 403);
        return;
      }
      const policies = await supportService.listSlaPolicies(req.organizationId);
      sendSuccess(res, policies, 200, { message: "SLA policies fetched" });
    } catch (err: any) {
      sendError(res, "FetchError", err.message || "Failed to fetch SLA policies", 500);
    }
  }

  async updateSlaPolicy(req: TenantRequest, res: Response): Promise<void> {
    try {
      if (!req.organizationId) {
        sendError(res, "Forbidden", "Organization context missing", 403);
        return;
      }
      const { id } = req.params;
      const { responseTimeHours, resolutionTimeHours, businessHoursOnly } = req.body;
      const updated = await supportService.updateSlaPolicy(req.organizationId, id, {
        responseTimeHours: Number(responseTimeHours),
        resolutionTimeHours: Number(resolutionTimeHours),
        businessHoursOnly,
      });
      sendSuccess(res, updated, 200, { message: "SLA policy updated" });
    } catch (err: any) {
      sendError(res, "UpdateError", err.message || "Failed to update SLA policy", 400);
    }
  }
}

export const supportController = new SupportController();
