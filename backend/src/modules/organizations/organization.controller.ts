import { Request as ExpressRequest, Response } from "express";
import { TenantRequest } from "../../middleware/tenant.middleware.js";
import { organizationService } from "./organization.service.js";
import { organizationRepository } from "./organization.repository.js";
import { sendSuccess, sendError } from "../../utils/response.js";
import {
  CreateOrganizationSchema,
  UpdateOrganizationSchema,
  InviteMemberSchema,
  UpdateMemberSchema,
  AcceptInvitationSchema,
} from "./organization.schema.js";

export class OrganizationController {
  /**
   * POST /api/organizations
   * Register a new workspace / organization.
   */
  async createOrganization(req: TenantRequest, res: Response): Promise<void> {
    const parse = CreateOrganizationSchema.safeParse(req.body);
    if (!parse.success) {
      sendError(res, "Validation Error", "Invalid organization data", 400, parse.error.issues);
      return;
    }

    try {
      const org = await organizationService.registerOrganization(
        parse.data.name,
        parse.data.slug,
        parse.data.timezone,
        parse.data.logoUrl,
        req.user!.id,
        req.user?.email
      );

      sendSuccess(res, org, 201);
    } catch (error) {
      console.error("Create organization error:", error);
      sendError(res, "Internal Server Error", "Failed to create organization", 500);
    }
  }

  /**
   * GET /api/organizations
   * List organizations for the authenticated user.
   */
  async listUserOrganizations(req: TenantRequest, res: Response): Promise<void> {
    try {
      const orgs = await organizationService.getUserOrganizations(req.user!.id);
      sendSuccess(res, orgs);
    } catch (error) {
      console.error("List user organizations error:", error);
      sendError(res, "Internal Server Error", "Failed to list user organizations", 500);
    }
  }

  /**
   * GET /api/organizations/:orgId
   * Get current organization profile and settings.
   */
  async getOrganization(req: TenantRequest, res: Response): Promise<void> {
    try {
      const org = await organizationService.getOrganization(req.organizationId!);
      if (!org) {
        sendError(res, "Not Found", "Organization not found", 404);
        return;
      }
      sendSuccess(res, {
        ...org,
        membership: req.membership,
      });
    } catch (error) {
      console.error("Get organization error:", error);
      sendError(res, "Internal Server Error", "Failed to get organization details", 500);
    }
  }

  /**
   * PUT /api/organizations/:orgId
   * Update organization settings (requires organization.manage).
   */
  async updateOrganization(req: TenantRequest, res: Response): Promise<void> {
    const parse = UpdateOrganizationSchema.safeParse(req.body);
    if (!parse.success) {
      sendError(res, "Validation Error", "Invalid organization update data", 400, parse.error.issues);
      return;
    }

    try {
      const updated = await organizationService.updateOrganization(
        req.organizationId!,
        parse.data
      );
      sendSuccess(res, updated);
    } catch (error) {
      console.error("Update organization error:", error);
      sendError(res, "Internal Server Error", "Failed to update organization", 500);
    }
  }

  /**
   * GET /api/organizations/:orgId/members
   * List members of the organization.
   */
  async listMembers(req: TenantRequest, res: Response): Promise<void> {
    try {
      const members = await organizationService.getMembers(req.organizationId!);
      sendSuccess(res, members);
    } catch (error) {
      console.error("List members error:", error);
      sendError(res, "Internal Server Error", "Failed to list organization members", 500);
    }
  }

  /**
   * POST /api/organizations/:orgId/invitations
   * Invite member by email (requires members.invite).
   */
  async inviteMember(req: TenantRequest, res: Response): Promise<void> {
    const parse = InviteMemberSchema.safeParse(req.body);
    if (!parse.success) {
      sendError(res, "Validation Error", "Invalid invitation parameters", 400, parse.error.issues);
      return;
    }

    try {
      const invitation = await organizationService.inviteMember(
        req.organizationId!,
        parse.data.email,
        parse.data.roleId,
        req.user?.id
      );

      sendSuccess(res, invitation, 201);
    } catch (error) {
      console.error("Invite member error:", error);
      sendError(res, "Internal Server Error", "Failed to send member invitation", 500);
    }
  }

  /**
   * GET /api/organizations/:orgId/invitations
   * List pending invitations.
   */
  async listPendingInvitations(req: TenantRequest, res: Response): Promise<void> {
    try {
      const invitations = await organizationService.getPendingInvitations(req.organizationId!);
      sendSuccess(res, invitations);
    } catch (error) {
      console.error("List pending invitations error:", error);
      sendError(res, "Internal Server Error", "Failed to list pending invitations", 500);
    }
  }

  /**
   * POST /api/organizations/invitations/:token/accept
   * Accept an invitation token.
   */
  async acceptInvitation(req: TenantRequest, res: Response): Promise<void> {
    const parse = AcceptInvitationSchema.safeParse({ token: req.params.token });
    if (!parse.success) {
      sendError(res, "Validation Error", "Invalid invitation token", 400);
      return;
    }

    try {
      const result = await organizationService.acceptInvitation(parse.data.token, req.user!.id);
      sendSuccess(res, {
        message: "Invitation accepted successfully.",
        ...result,
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to accept invitation";
      sendError(res, "Bad Request", msg, 400);
    }
  }

  /**
   * DELETE /api/organizations/:orgId/invitations/:inviteId
   * Revoke invitation.
   */
  async revokeInvitation(req: TenantRequest, res: Response): Promise<void> {
    try {
      const revoked = await organizationService.revokeInvitation(req.organizationId!, req.params.inviteId);
      if (!revoked) {
        sendError(res, "Not Found", "Invitation not found or already processed", 404);
        return;
      }
      sendSuccess(res, { revoked: true });
    } catch (error) {
      console.error("Revoke invitation error:", error);
      sendError(res, "Internal Server Error", "Failed to revoke invitation", 500);
    }
  }

  /**
   * PATCH /api/organizations/:orgId/members/:memberId
   * Update member role or status (requires members.manage).
   */
  async updateMember(req: TenantRequest, res: Response): Promise<void> {
    const parse = UpdateMemberSchema.safeParse(req.body);
    if (!parse.success) {
      sendError(res, "Validation Error", "Invalid member update data", 400, parse.error.issues);
      return;
    }

    try {
      const updated = await organizationService.updateMember(
        req.organizationId!,
        req.params.memberId,
        parse.data.roleId,
        parse.data.status
      );

      if (!updated) {
        sendError(res, "Not Found", "Member not found in organization", 404);
        return;
      }
      sendSuccess(res, { updated: true });
    } catch (error) {
      console.error("Update member error:", error);
      sendError(res, "Internal Server Error", "Failed to update member", 500);
    }
  }

  /**
   * DELETE /api/organizations/:orgId/members/:memberId
   * Remove member from organization (requires members.manage).
   */
  async removeMember(req: TenantRequest, res: Response): Promise<void> {
    try {
      const deleted = await organizationService.removeMember(req.organizationId!, req.params.memberId);
      if (!deleted) {
        sendError(res, "Not Found", "Member not found in organization", 404);
        return;
      }
      sendSuccess(res, { deleted: true });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to remove member";
      sendError(res, "Bad Request", msg, 400);
    }
  }

  /**
   * GET /api/organizations/roles
   * List system roles and associated permissions.
   */
  async listRoles(req: ExpressRequest, res: Response): Promise<void> {
    try {
      const roles = await organizationRepository.listRoles();
      sendSuccess(res, roles, 200, { message: "Roles fetched successfully" });
    } catch (error) {
      sendError(res, "Internal Server Error", "Failed to fetch roles", 500);
    }
  }
}

export const organizationController = new OrganizationController();
