import {
  supportRepository,
  SupportTicketRow,
  TicketCommentRow,
  SlaPolicyRow,
} from "./support.repository.js";
import {
  CreateTicketSchema,
  UpdateTicketSchema,
  AddTicketCommentSchema,
} from "./support.schema.js";
import { z } from "zod";

export class SupportService {
  async getTickets(
    orgId: string,
    status?: string,
    priority?: string
  ): Promise<SupportTicketRow[]> {
    return supportRepository.listTickets(orgId, status, priority);
  }

  async getTicket(orgId: string, ticketId: string): Promise<SupportTicketRow> {
    const ticket = await supportRepository.getTicketById(orgId, ticketId);
    if (!ticket) {
      throw new Error("Ticket not found or does not belong to this organization");
    }
    return ticket;
  }

  async createTicket(
    orgId: string,
    input: z.infer<typeof CreateTicketSchema>
  ): Promise<SupportTicketRow> {
    return supportRepository.createTicket(orgId, {
      queueId: input.queueId,
      subject: input.subject,
      description: input.description,
      requesterEmail: input.requesterEmail,
      requesterName: input.requesterName,
      category: input.category,
      priority: input.priority,
      assigneeId: input.assigneeId,
      metadata: input.metadata,
    });
  }

  async updateTicket(
    orgId: string,
    ticketId: string,
    input: z.infer<typeof UpdateTicketSchema>
  ): Promise<SupportTicketRow> {
    const updated = await supportRepository.updateTicket(orgId, ticketId, {
      status: input.status,
      priority: input.priority,
      assignee_id: input.assigneeId,
      metadata: input.metadata,
    });
    if (!updated) {
      throw new Error("Ticket not found or update unauthorized");
    }
    return updated;
  }

  async addComment(
    orgId: string,
    ticketId: string,
    userId: string | null,
    input: z.infer<typeof AddTicketCommentSchema>
  ): Promise<TicketCommentRow> {
    // Validate ticket ownership
    await this.getTicket(orgId, ticketId);
    return supportRepository.addComment(
      ticketId,
      userId,
      input.authorName,
      input.content,
      input.isInternal
    );
  }

  async getComments(orgId: string, ticketId: string): Promise<TicketCommentRow[]> {
    await this.getTicket(orgId, ticketId);
    return supportRepository.getComments(ticketId);
  }

  async getSlaPolicy(orgId: string, priority: string): Promise<SlaPolicyRow | null> {
    return supportRepository.getSlaPolicy(orgId, priority);
  }

  async listSlaPolicies(orgId: string): Promise<SlaPolicyRow[]> {
    return supportRepository.listSlaPolicies(orgId);
  }

  async updateSlaPolicy(orgId: string, policyId: string, input: { responseTimeHours: number; resolutionTimeHours: number; businessHoursOnly?: boolean }): Promise<any> {
    return supportRepository.updateSlaPolicy(orgId, policyId, input);
  }

  async listQueues(orgId: string): Promise<any[]> {
    return supportRepository.listQueues(orgId);
  }

  async createQueue(orgId: string, input: { name: string; description?: string; teamId?: string }): Promise<any> {
    return supportRepository.createQueue(orgId, input);
  }
}

export const supportService = new SupportService();
