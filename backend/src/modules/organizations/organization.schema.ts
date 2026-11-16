import { z } from "zod";

export const CreateOrganizationSchema = z.object({
  name: z.string().min(2, "Organization name must be at least 2 characters").max(100),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .max(50)
    .regex(/^[a-z0-9-]+$/, "Slug must only contain lowercase letters, numbers, and hyphens")
    .optional(),
  timezone: z.string().max(50).default("UTC"),
  logoUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

export const UpdateOrganizationSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  logoUrl: z.string().url().optional().or(z.literal("")),
  timezone: z.string().max(50).optional(),
  status: z.enum(["active", "suspended", "archived"]).optional(),
  settings: z.record(z.unknown()).optional(),
});

export const InviteMemberSchema = z.object({
  email: z.string().email("Valid email address required").toLowerCase(),
  roleId: z.enum([
    "owner",
    "org_admin",
    "operations_manager",
    "project_manager",
    "support_manager",
    "support_agent",
    "team_member",
    "viewer",
  ]),
});

export const UpdateMemberSchema = z.object({
  roleId: z
    .enum([
      "owner",
      "org_admin",
      "operations_manager",
      "project_manager",
      "support_manager",
      "support_agent",
      "team_member",
      "viewer",
    ])
    .optional(),
  status: z.enum(["active", "inactive", "suspended"]).optional(),
});

export const AcceptInvitationSchema = z.object({
  token: z.string().min(10, "Invitation token is required"),
});
