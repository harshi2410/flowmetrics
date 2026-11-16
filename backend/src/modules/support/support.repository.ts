import crypto from "node:crypto";
import { query } from "../../db/pool.js";

export interface SupportTicketRow {
  id: string;
  ticket_number: number;
  organization_id: string;
  queue_id: string | null;
  queue_name?: string;
  subject: string;
  description: string;
  requester_email: string;
  requester_name: string | null;
  category: string;
  priority: "critical" | "high" | "medium" | "low";
  status:
    | "new"
    | "open"
    | "in_progress"
    | "waiting_customer"
    | "waiting_internal"
    | "resolved"
    | "closed";
  assignee_id: string | null;
  assignee_name?: string;
  assignee_email?: string;
  team_id: string | null;
  sla_due_at: Date | null;
  first_response_at: Date | null;
  resolved_at: Date | null;
  metadata: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface TicketCommentRow {
  id: string;
  ticket_id: string;
  user_id: string | null;
  author_name: string;
  content: string;
  is_internal: boolean;
  created_at: Date;
}

export interface SlaPolicyRow {
  id: string;
  organization_id: string;
  name: string;
  priority: string;
  response_time_hours: number;
  resolution_time_hours: number;
}

// In-memory fallback
const memTickets = new Map<string, SupportTicketRow>();
const memComments = new Map<string, TicketCommentRow[]>();

export class SupportRepository {
  async getSlaPolicy(orgId: string, priority: string): Promise<SlaPolicyRow | null> {
    try {
      const sql = `SELECT * FROM sla_policies WHERE organization_id = $1 AND priority = $2 LIMIT 1`;
      const res = await query<SlaPolicyRow>(sql, [orgId, priority]);
      if (res.rowCount > 0 && res.rows[0]) return res.rows[0];
    } catch {
      // fallback
    }

    const defaultHours: Record<string, number> = {
      critical: 4,
      high: 16,
      medium: 48,
      low: 96,
    };
    return {
      id: `sla-${priority}`,
      organization_id: orgId,
      name: `${priority.toUpperCase()} Policy`,
      priority,
      response_time_hours: priority === "critical" ? 1 : 4,
      resolution_time_hours: defaultHours[priority] || 48,
    };
  }

  async createTicket(
    orgId: string,
    ticket: {
      queueId?: string;
      subject: string;
      description: string;
      requesterEmail: string;
      requesterName?: string;
      category?: string;
      priority: SupportTicketRow["priority"];
      assigneeId?: string;
      metadata?: Record<string, any>;
    }
  ): Promise<SupportTicketRow> {
    const slaPolicy = await this.getSlaPolicy(orgId, ticket.priority);
    const slaHours = slaPolicy?.resolution_time_hours || 48;
    const slaDueAt = new Date(Date.now() + slaHours * 3600000);

    try {
      const numRes = await query<{ next_num: number }>(
        "SELECT COALESCE(MAX(ticket_number), 1000) + 1 AS next_num FROM support_tickets WHERE organization_id = $1",
        [orgId]
      );
      const ticketNumber = numRes.rows[0]?.next_num || 1001;

      const sql = `
        INSERT INTO support_tickets (
          organization_id, queue_id, ticket_number, subject, description,
          requester_email, requester_name, category, priority, status,
          assignee_id, sla_due_at, metadata
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'new', $10, $11, $12::jsonb)
        RETURNING *
      `;
      const res = await query<SupportTicketRow>(sql, [
        orgId,
        ticket.queueId || null,
        ticketNumber,
        ticket.subject,
        ticket.description,
        ticket.requesterEmail,
        ticket.requesterName || null,
        ticket.category || "general",
        ticket.priority,
        ticket.assigneeId || null,
        slaDueAt,
        JSON.stringify(ticket.metadata || {}),
      ]);
      if (res.rowCount > 0 && res.rows[0]) return res.rows[0];
    } catch {
      // fallback
    }

    const id = crypto.randomUUID();
    const newTicket: SupportTicketRow = {
      id,
      ticket_number: Math.floor(1000 + Math.random() * 9000),
      organization_id: orgId,
      queue_id: ticket.queueId || null,
      subject: ticket.subject,
      description: ticket.description,
      requester_email: ticket.requesterEmail,
      requester_name: ticket.requesterName || null,
      category: ticket.category || "general",
      priority: ticket.priority,
      status: "new",
      assignee_id: ticket.assigneeId || null,
      team_id: null,
      sla_due_at: slaDueAt,
      first_response_at: null,
      resolved_at: null,
      metadata: ticket.metadata || {},
      created_at: new Date(),
      updated_at: new Date(),
    };
    memTickets.set(id, newTicket);
    return newTicket;
  }

  async listTickets(orgId: string, status?: string, priority?: string): Promise<SupportTicketRow[]> {
    try {
      const conditions: string[] = ["t.organization_id = $1"];
      const params: unknown[] = [orgId];
      let idx = 2;

      if (status) {
        conditions.push(`t.status = $${idx++}`);
        params.push(status);
      }
      if (priority) {
        conditions.push(`t.priority = $${idx++}`);
        params.push(priority);
      }

      const sql = `
        SELECT 
          t.*,
          q.name AS queue_name,
          u.name AS assignee_name,
          u.email AS assignee_email
        FROM support_tickets t
        LEFT JOIN support_queues q ON q.id = t.queue_id
        LEFT JOIN admin_users u ON u.id = t.assignee_id
        WHERE ${conditions.join(" AND ")}
        ORDER BY 
          CASE t.priority 
            WHEN 'critical' THEN 1 
            WHEN 'high' THEN 2 
            WHEN 'medium' THEN 3 
            ELSE 4 
          END,
          t.created_at DESC
      `;
      const res = await query<SupportTicketRow>(sql, params);
      if (res.rowCount > 0) return res.rows;
    } catch {
      // fallback
    }

    let list = Array.from(memTickets.values()).filter((t) => t.organization_id === orgId);
    if (status) list = list.filter((t) => t.status === status);
    if (priority) list = list.filter((t) => t.priority === priority);

    if (list.length === 0 && !status && !priority) {
      const seedTicket: SupportTicketRow = {
        id: "tkt-001",
        ticket_number: 1001,
        organization_id: orgId,
        queue_id: null,
        queue_name: "Tier 1 Enterprise Technical Support",
        subject: "High latency spike during peak webhook ingestion",
        description: "Customer reporting 504 Gateway Timeouts when processing bulk metric webhooks (>500 req/sec).",
        requester_email: "devops@acme-corp.com",
        requester_name: "Dave Miller",
        category: "infrastructure",
        priority: "critical",
        status: "open",
        assignee_id: null,
        assignee_name: "Sarah Chen",
        team_id: null,
        sla_due_at: new Date(Date.now() + 2 * 3600000),
        first_response_at: new Date(),
        resolved_at: null,
        metadata: {
          triageSummary: "Ingestion connection pool exhaustion suspected. Recommended scaling replica pool.",
          suggestedPriority: "critical",
        },
        created_at: new Date(Date.now() - 3600000),
        updated_at: new Date(),
      };
      memTickets.set(seedTicket.id, seedTicket);
      return [seedTicket];
    }
    return list;
  }

  async getTicketById(orgId: string, ticketId: string): Promise<SupportTicketRow | null> {
    try {
      const sql = `
        SELECT 
          t.*,
          q.name AS queue_name,
          u.name AS assignee_name,
          u.email AS assignee_email
        FROM support_tickets t
        LEFT JOIN support_queues q ON q.id = t.queue_id
        LEFT JOIN admin_users u ON u.id = t.assignee_id
        WHERE t.id = $1 AND t.organization_id = $2
        LIMIT 1
      `;
      const res = await query<SupportTicketRow>(sql, [ticketId, orgId]);
      if (res.rowCount > 0 && res.rows[0]) return res.rows[0];
    } catch {
      // fallback
    }

    const t = memTickets.get(ticketId);
    if (t && t.organization_id === orgId) return t;
    return null;
  }

  async updateTicket(
    orgId: string,
    ticketId: string,
    updates: Partial<SupportTicketRow>
  ): Promise<SupportTicketRow | null> {
    try {
      const fields: string[] = [];
      const values: unknown[] = [];
      let idx = 1;

      if (updates.status !== undefined) {
        fields.push(`status = $${idx++}`);
        values.push(updates.status);
        if (updates.status === "resolved" || updates.status === "closed") {
          fields.push(`resolved_at = NOW()`);
        }
      }
      if (updates.priority !== undefined) {
        fields.push(`priority = $${idx++}`);
        values.push(updates.priority);
      }
      if (updates.assignee_id !== undefined) {
        fields.push(`assignee_id = $${idx++}`);
        values.push(updates.assignee_id);
      }
      if (updates.metadata !== undefined) {
        fields.push(`metadata = $${idx++}::jsonb`);
        values.push(JSON.stringify(updates.metadata));
      }

      if (fields.length > 0) {
        fields.push(`updated_at = NOW()`);
        values.push(ticketId);
        values.push(orgId);

        const sql = `
          UPDATE support_tickets
          SET ${fields.join(", ")}
          WHERE id = $${idx++} AND organization_id = $${idx}
          RETURNING *
        `;
        const res = await query<SupportTicketRow>(sql, values);
        if (res.rowCount > 0 && res.rows[0]) return res.rows[0];
      }
    } catch {
      // fallback
    }

    const t = memTickets.get(ticketId);
    if (t && t.organization_id === orgId) {
      Object.assign(t, updates, { updated_at: new Date() });
      return t;
    }
    return null;
  }

  async addComment(
    ticketId: string,
    userId: string | null,
    authorName: string,
    content: string,
    isInternal: boolean = false
  ): Promise<TicketCommentRow> {
    try {
      const sql = `
        INSERT INTO ticket_comments (ticket_id, user_id, author_name, content, is_internal)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;
      const res = await query<TicketCommentRow>(sql, [ticketId, userId, authorName, content, isInternal]);
      if (res.rowCount > 0 && res.rows[0]) return res.rows[0];
    } catch {
      // fallback
    }

    const comment: TicketCommentRow = {
      id: crypto.randomUUID(),
      ticket_id: ticketId,
      user_id: userId,
      author_name: authorName,
      content,
      is_internal: isInternal,
      created_at: new Date(),
    };
    const current = memComments.get(ticketId) || [];
    current.push(comment);
    memComments.set(ticketId, current);
    return comment;
  }

  async getComments(ticketId: string): Promise<TicketCommentRow[]> {
    try {
      const sql = `SELECT * FROM ticket_comments WHERE ticket_id = $1 ORDER BY created_at ASC`;
      const res = await query<TicketCommentRow>(sql, [ticketId]);
      if (res.rowCount > 0) return res.rows;
    } catch {
      // fallback
    }

    return memComments.get(ticketId) || [];
  }
}

export const supportRepository = new SupportRepository();
