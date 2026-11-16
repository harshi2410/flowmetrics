import { z } from "zod";

export const ExecuteAgentSchema = z.object({
  agentType: z.enum(["support_triage", "ops_orchestrator", "evaluator"]),
  input: z.record(z.any()),
  shadowMode: z.boolean().default(false),
});

export const ReviewApprovalSchema = z.object({
  action: z.enum(["approve", "reject"]),
  comment: z.string().max(1000).optional(),
});

export const RunEvaluationsSchema = z.object({
  suiteName: z.string().default("Flowmetrics Agent Robustness Suite"),
});
