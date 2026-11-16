import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { tenantMiddleware, requirePermission } from "../../middleware/tenant.middleware.js";
import { organizationController } from "./organization.controller.js";
import { writeRateLimiter } from "../../middleware/rateLimit.middleware.js";

export const organizationRouter = Router();

// All organization operations require authenticated user
organizationRouter.use(authMiddleware);

// Organization creation & listing (across user's memberships)
organizationRouter.post("/", writeRateLimiter, (req, res) =>
  organizationController.createOrganization(req, res)
);
organizationRouter.get("/", (req, res) =>
  organizationController.listUserOrganizations(req, res)
);

// Accept invitation token (global token action)
organizationRouter.post("/invitations/:token/accept", writeRateLimiter, (req, res) =>
  organizationController.acceptInvitation(req, res)
);

// Scoped Tenant Routes (Requires Tenant Membership verification)
organizationRouter.get("/:orgId", tenantMiddleware, requirePermission("organization.read"), (req, res) =>
  organizationController.getOrganization(req, res)
);

organizationRouter.put("/:orgId", tenantMiddleware, requirePermission("organization.manage"), writeRateLimiter, (req, res) =>
  organizationController.updateOrganization(req, res)
);

// Member Management
organizationRouter.get("/:orgId/members", tenantMiddleware, requirePermission("members.read"), (req, res) =>
  organizationController.listMembers(req, res)
);

organizationRouter.patch("/:orgId/members/:memberId", tenantMiddleware, requirePermission("members.manage"), writeRateLimiter, (req, res) =>
  organizationController.updateMember(req, res)
);

organizationRouter.delete("/:orgId/members/:memberId", tenantMiddleware, requirePermission("members.manage"), writeRateLimiter, (req, res) =>
  organizationController.removeMember(req, res)
);

// Member Invitations
organizationRouter.get("/:orgId/invitations", tenantMiddleware, requirePermission("members.read"), (req, res) =>
  organizationController.listPendingInvitations(req, res)
);

organizationRouter.post("/:orgId/invitations", tenantMiddleware, requirePermission("members.invite"), writeRateLimiter, (req, res) =>
  organizationController.inviteMember(req, res)
);

organizationRouter.delete("/:orgId/invitations/:inviteId", tenantMiddleware, requirePermission("members.manage"), writeRateLimiter, (req, res) =>
  organizationController.revokeInvitation(req, res)
);
