import { z } from "zod";

export const CreateWorkflowRuleSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().max(500).optional(),
  triggerEvent: z.enum([
    "ticket.created",
    "ticket.updated",
    "task.status_changed",
    "agent.completed",
  ]),
  conditions: z.record(z.any()).default({}),
  actions: z.array(z.record(z.any())).min(1, "At least one action is required"),
  isActive: z.boolean().default(true),
});

export const TriggerEventSchema = z.object({
  event: z.string(),
  payload: z.record(z.any()),
});
