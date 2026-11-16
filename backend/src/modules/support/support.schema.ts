import { z } from "zod";

export const CreateTicketSchema = z.object({
  queueId: z.string().uuid().optional(),
  subject: z.string().min(3, "Subject must be at least 3 characters").max(200),
  description: z.string().min(5, "Description must be at least 5 characters").max(10000),
  requesterEmail: z.string().email("Valid requester email required"),
  requesterName: z.string().max(100).optional(),
  category: z.string().default("general"),
  priority: z.enum(["critical", "high", "medium", "low"]).default("medium"),
  assigneeId: z.string().uuid().optional(),
  metadata: z.record(z.any()).default({}),
});

export const UpdateTicketSchema = z.object({
  status: z
    .enum([
      "new",
      "open",
      "in_progress",
      "waiting_customer",
      "waiting_internal",
      "resolved",
      "closed",
    ])
    .optional(),
  priority: z.enum(["critical", "high", "medium", "low"]).optional(),
  assigneeId: z.string().uuid().nullable().optional(),
  queueId: z.string().uuid().nullable().optional(),
  category: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export const AddTicketCommentSchema = z.object({
  authorName: z.string().min(1).max(100),
  content: z.string().min(1, "Comment content cannot be empty").max(10000),
  isInternal: z.boolean().default(false),
});
