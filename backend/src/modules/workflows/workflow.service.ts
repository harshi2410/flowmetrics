import { workflowRepository, WorkflowRuleRow } from "./workflow.repository.js";
import { CreateWorkflowRuleSchema } from "./workflow.schema.js";
import { agentService } from "../agents/agent.service.js";
import { auditRepository } from "../audit/audit.repository.js";
import { z } from "zod";

export class WorkflowService {
  async getRules(orgId: string): Promise<WorkflowRuleRow[]> {
    return workflowRepository.listRules(orgId);
  }

  async createRule(orgId: string, input: z.infer<typeof CreateWorkflowRuleSchema>): Promise<WorkflowRuleRow> {
    return workflowRepository.createRule(
      orgId,
      input.name,
      input.triggerEvent,
      input.conditions,
      input.actions,
      input.description,
      input.isActive
    );
  }

  async triggerEvent(orgId: string, event: string, payload: Record<string, any>) {
    const rules = await workflowRepository.getMatchingRules(orgId, event);
    const triggeredActions: any[] = [];

    for (const rule of rules) {
      // Evaluate condition
      const cond = rule.conditions;
      let matched = true;
      if (cond && cond.field && cond.value) {
        matched = payload[cond.field] === cond.value;
      }

      if (matched) {
        for (const act of rule.actions) {
          if (act.action === "invoke_agent") {
            const result = await agentService.triggerAgent(orgId, {
              agentType: act.agentType || "support_triage",
              input: payload,
              shadowMode: Boolean(act.shadowMode),
            });
            triggeredActions.push({ rule: rule.name, action: act.action, executionId: result.id });
          }
        }
      }
    }

    await auditRepository.logAction({
      orgId,
      actorEmail: "workflow-engine@system",
      action: "workflow.triggered",
      resourceType: "workflow",
      resourceId: event,
      metadata: { triggeredRulesCount: rules.length, triggeredActions },
    });

    return { matchedRules: rules.length, triggeredActions };
  }
}

export const workflowService = new WorkflowService();
