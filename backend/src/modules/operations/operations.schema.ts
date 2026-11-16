import { z } from "zod";

export const CreateTeamSchema = z.object({
  name: z.string().min(2, "Team name must be at least 2 characters").max(100),
  description: z.string().max(500).optional(),
  leadUserId: z.string().uuid().optional(),
});

export const AddTeamMemberSchema = z.object({
  userId: z.string().uuid("Valid user ID required"),
  weeklyCapacityHours: z.coerce.number().min(1).max(100).default(40),
  role: z.string().default("member"),
});

export const CreateProjectSchema = z.object({
  name: z.string().min(2, "Project name required").max(100),
  key: z
    .string()
    .min(2)
    .max(10)
    .regex(/^[A-Z0-9]+$/, "Project key must be uppercase alphanumeric (e.g. FLOW, ENG)"),
  description: z.string().max(1000).optional(),
  teamId: z.string().uuid().optional(),
  managerId: z.string().uuid().optional(),
  targetDate: z.string().optional(),
});

export const UpdateProjectSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(1000).optional(),
  status: z.enum(["planning", "active", "on_hold", "completed", "archived"]).optional(),
  health: z.enum(["healthy", "at_risk", "critical"]).optional(),
  healthReason: z.string().optional(),
  targetDate: z.string().optional(),
});

export const CreateTaskSchema = z.object({
  projectId: z.string().uuid("Valid project ID required"),
  sprintId: z.string().uuid().optional(),
  title: z.string().min(3, "Task title must be at least 3 characters").max(200),
  description: z.string().max(5000).optional(),
  status: z
    .enum(["backlog", "to_do", "in_progress", "in_review", "blocked", "done"])
    .default("to_do"),
  priority: z.enum(["critical", "high", "medium", "low"]).default("medium"),
  assigneeId: z.string().uuid().optional(),
  estimatedHours: z.coerce.number().min(0).max(1000).default(0),
  dueDate: z.string().optional(),
  labels: z.array(z.string()).default([]),
});

export const UpdateTaskSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().max(5000).optional(),
  status: z.enum(["backlog", "to_do", "in_progress", "in_review", "blocked", "done"]).optional(),
  priority: z.enum(["critical", "high", "medium", "low"]).optional(),
  assigneeId: z.string().uuid().nullable().optional(),
  estimatedHours: z.coerce.number().min(0).optional(),
  actualHours: z.coerce.number().min(0).optional(),
  dueDate: z.string().nullable().optional(),
  labels: z.array(z.string()).optional(),
  sprintId: z.string().uuid().nullable().optional(),
});

export const CreateSprintSchema = z.object({
  projectId: z.string().uuid(),
  name: z.string().min(2).max(100),
  goal: z.string().max(500).optional(),
  startDate: z.string(),
  endDate: z.string(),
});
