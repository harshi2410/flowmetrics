import { operationsRepository } from "../operations/operations.repository.js";
import { supportRepository } from "../support/support.repository.js";
import { knowledgeRepository } from "../knowledge/knowledge.repository.js";

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, string>;
  riskLevel: "low" | "medium" | "high" | "critical";
  requiresApproval: boolean;
  execute: (orgId: string, args: Record<string, any>) => Promise<any>;
}

export class ToolRegistry {
  private tools = new Map<string, ToolDefinition>();

  constructor() {
    this.registerStandardTools();
  }

  private registerStandardTools() {
    // 1. get_ticket
    this.register({
      name: "get_ticket",
      description: "Fetches complete details and customer context for a specific support ticket.",
      parameters: { ticketId: "string (UUID of ticket)" },
      riskLevel: "low",
      requiresApproval: false,
      execute: async (orgId, args) => {
        const ticket = await supportRepository.getTicketById(orgId, args.ticketId);
        if (!ticket) throw new Error(`Ticket ${args.ticketId} not found`);
        return ticket;
      },
    });

    // 2. search_knowledge_base
    this.register({
      name: "search_knowledge_base",
      description: "Performs semantic vector search across organization runbooks and documentation.",
      parameters: { query: "string", limit: "number (optional, default 3)" },
      riskLevel: "low",
      requiresApproval: false,
      execute: async (orgId, args) => {
        return knowledgeRepository.queryKnowledge(orgId, args.query, args.limit || 3);
      },
    });

    // 3. update_ticket_status
    this.register({
      name: "update_ticket_status",
      description: "Modifies ticket status (e.g. in_progress, resolved).",
      parameters: { ticketId: "string", status: "string" },
      riskLevel: "medium",
      requiresApproval: false,
      execute: async (orgId, args) => {
        return supportRepository.updateTicket(orgId, args.ticketId, { status: args.status });
      },
    });

    // 4. escalate_ticket_priority
    this.register({
      name: "escalate_ticket_priority",
      description: "Escalates ticket priority to critical and triggers pager duty alerts.",
      parameters: { ticketId: "string", priority: "string", justification: "string" },
      riskLevel: "critical",
      requiresApproval: true, // High risk requires human approval!
      execute: async (orgId, args) => {
        return supportRepository.updateTicket(orgId, args.ticketId, { priority: args.priority });
      },
    });

    // 5. add_internal_note
    this.register({
      name: "add_internal_note",
      description: "Appends an internal engineering note or triage recommendation to a ticket.",
      parameters: { ticketId: "string", note: "string" },
      riskLevel: "low",
      requiresApproval: false,
      execute: async (orgId, args) => {
        return supportRepository.addComment(args.ticketId, null, "AI Operations Agent", args.note, true);
      },
    });

    // 6. create_operations_task
    this.register({
      name: "create_operations_task",
      description: "Creates a linked engineering task in the operations board.",
      parameters: { projectId: "string", title: "string", priority: "string", hours: "number" },
      riskLevel: "medium",
      requiresApproval: false,
      execute: async (orgId, args) => {
        return operationsRepository.createTask(
          orgId,
          args.projectId,
          args.title,
          args.description || "Created by AI Operations Orchestrator",
          "to_do",
          args.priority || "medium",
          undefined,
          args.hours || 4
        );
      },
    });
  }

  register(tool: ToolDefinition) {
    this.tools.set(tool.name, tool);
  }

  getTool(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  listTools(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }
}

export const toolRegistry = new ToolRegistry();
