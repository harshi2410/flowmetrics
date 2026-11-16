import crypto from "node:crypto";
import { query } from "../../db/pool.js";

export interface WorkflowRuleRow {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  trigger_event: string;
  conditions: Record<string, any>;
  actions: Record<string, any>[];
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

// In-Memory Fallback
const memRules = new Map<string, WorkflowRuleRow>();

export class WorkflowRepository {
  async createRule(
    orgId: string,
    name: string,
    triggerEvent: string,
    conditions: Record<string, any>,
    actions: Record<string, any>[],
    description?: string,
    isActive: boolean = true
  ): Promise<WorkflowRuleRow> {
    const id = crypto.randomUUID();
    try {
      const sql = `
        INSERT INTO workflow_rules (id, organization_id, name, description, trigger_event, conditions, actions, is_active)
        VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8)
        RETURNING *
      `;
      const res = await query<WorkflowRuleRow>(sql, [
        id,
        orgId,
        name,
        description || null,
        triggerEvent,
        JSON.stringify(conditions),
        JSON.stringify(actions),
        isActive,
      ]);
      if (res.rowCount > 0 && res.rows[0]) return res.rows[0];
    } catch {
      // fallback
    }

    const row: WorkflowRuleRow = {
      id,
      organization_id: orgId,
      name,
      description: description || null,
      trigger_event: triggerEvent,
      conditions,
      actions,
      is_active: isActive,
      created_at: new Date(),
      updated_at: new Date(),
    };
    memRules.set(id, row);
    return row;
  }

  async listRules(orgId: string): Promise<WorkflowRuleRow[]> {
    try {
      const sql = `SELECT * FROM workflow_rules WHERE organization_id = $1 ORDER BY created_at DESC`;
      const res = await query<WorkflowRuleRow>(sql, [orgId]);
      if (res.rowCount > 0) return res.rows;
    } catch {
      // fallback
    }

    let list = Array.from(memRules.values()).filter((r) => r.organization_id === orgId);
    if (list.length === 0) {
      const defaultRule: WorkflowRuleRow = {
        id: "wf-1",
        organization_id: orgId,
        name: "Auto-Triage Critical Inbound Tickets",
        description: "Triggers AI Support Triage Agent upon creation of tickets marked with critical or infrastructure tags.",
        trigger_event: "ticket.created",
        conditions: { field: "priority", operator: "equals", value: "critical" },
        actions: [{ action: "invoke_agent", agentType: "support_triage", shadowMode: false }],
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      };
      memRules.set(defaultRule.id, defaultRule);
      return [defaultRule];
    }
    return list;
  }

  async getMatchingRules(orgId: string, event: string): Promise<WorkflowRuleRow[]> {
    const all = await this.listRules(orgId);
    return all.filter((r) => r.is_active && r.trigger_event === event);
  }
}

export const workflowRepository = new WorkflowRepository();
