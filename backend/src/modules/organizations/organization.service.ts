import crypto from "node:crypto";
import { organizationRepository, OrganizationRow, MemberDetailRow, InvitationRow } from "./organization.repository.js";

export class OrganizationService {
  /**
   * Register a new organization and assign creator as Owner.
   */
  async registerOrganization(
    name: string,
    providedSlug: string | undefined,
    timezone: string,
    logoUrl: string | null | undefined,
    creatorUserId: string,
    creatorEmail?: string
  ): Promise<OrganizationRow> {
    let slug = (providedSlug || name)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    if (!slug) {
      slug = `org-${Date.now().toString(36)}`;
    }

    // Check slug uniqueness; append random suffix if collision occurs
    const existing = await organizationRepository.findByIdOrSlug(slug);
    if (existing) {
      slug = `${slug}-${crypto.randomBytes(3).toString("hex")}`;
    }

    return organizationRepository.createOrganization(
      name.trim(),
      slug,
      timezone || "UTC",
      logoUrl || null,
      creatorUserId,
      creatorEmail
    );
  }

  /**
   * List organizations for a user.
   */
  async getUserOrganizations(userId: string): Promise<OrganizationRow[]> {
    return organizationRepository.findUserOrganizations(userId);
  }

  /**
   * Get organization profile by ID or slug.
   */
  async getOrganization(idOrSlug: string): Promise<OrganizationRow | null> {
    return organizationRepository.findByIdOrSlug(idOrSlug);
  }

  /**
   * Update organization settings.
   */
  async updateOrganization(
    orgId: string,
    updates: {
      name?: string;
      logoUrl?: string;
      timezone?: string;
      status?: string;
      settings?: Record<string, unknown>;
    }
  ): Promise<OrganizationRow | null> {
    return organizationRepository.updateOrganization(orgId, updates);
  }

  /**
   * List members of an organization.
   */
  async getMembers(orgId: string): Promise<MemberDetailRow[]> {
    return organizationRepository.listMembers(orgId);
  }

  /**
   * Invite a new member to the organization.
   */
  async inviteMember(
    orgId: string,
    email: string,
    roleId: string,
    invitedByUserId?: string
  ): Promise<InvitationRow> {
    // Generate secure 32-byte hex token
    const token = crypto.randomBytes(32).toString("hex");
    // 7-day expiration
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    return organizationRepository.createInvitation(
      orgId,
      email.toLowerCase().trim(),
      roleId,
      token,
      expiresAt,
      invitedByUserId
    );
  }

  /**
   * List pending invitations.
   */
  async getPendingInvitations(orgId: string): Promise<InvitationRow[]> {
    return organizationRepository.listPendingInvitations(orgId);
  }

  /**
   * Accept an invitation token.
   */
  async acceptInvitation(token: string, userId: string): Promise<{ organizationId: string; roleId: string }> {
    const invite = await organizationRepository.findInvitationByToken(token);
    if (!invite) {
      throw new Error("Invalid invitation token.");
    }

    if (invite.status !== "pending") {
      throw new Error(`Invitation has already been ${invite.status}.`);
    }

    if (new Date(invite.expires_at) < new Date()) {
      throw new Error("Invitation token has expired.");
    }

    await organizationRepository.acceptInvitation(
      invite.id,
      invite.organization_id,
      userId,
      invite.role_id
    );

    return {
      organizationId: invite.organization_id,
      roleId: invite.role_id,
    };
  }

  /**
   * Revoke a pending invitation.
   */
  async revokeInvitation(orgId: string, invitationId: string): Promise<boolean> {
    return organizationRepository.revokeInvitation(orgId, invitationId);
  }

  /**
   * Update member role or status.
   */
  async updateMember(
    orgId: string,
    memberId: string,
    roleId?: string,
    status?: string
  ): Promise<boolean> {
    return organizationRepository.updateMember(orgId, memberId, roleId, status);
  }

  /**
   * Remove member from organization.
   */
  async removeMember(orgId: string, memberId: string): Promise<boolean> {
    // Ensure we are not removing the last remaining owner
    const members = await organizationRepository.listMembers(orgId);
    const targetMember = members.find((m) => m.member_id === memberId);

    if (targetMember?.role_id === "owner") {
      const ownerCount = members.filter((m) => m.role_id === "owner" && m.status === "active").length;
      if (ownerCount <= 1) {
        throw new Error("Cannot remove the sole active Owner of the organization. Transfer ownership first.");
      }
    }

    return organizationRepository.deleteMember(orgId, memberId);
  }
}

export const organizationService = new OrganizationService();
