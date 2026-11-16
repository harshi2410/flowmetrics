import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./auth.middleware.js";
import { query } from "../db/pool.js";
import { sendError } from "../utils/response.js";
import { organizationRepository } from "../modules/organizations/organization.repository.js";

export interface OrganizationMembership {
  id: string;
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  userId: string;
  roleId: string;
  roleName: string;
  status: string;
  permissions: string[];
}

export interface TenantRequest extends AuthenticatedRequest {
  organizationId?: string;
  membership?: OrganizationMembership;
  permissions?: string[];
}

/**
 * Validates that the authenticated user belongs to the requested organization
 * and attaches verified membership & permissions to the request.
 */
export async function tenantMiddleware(
  req: TenantRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.user) {
    sendError(res, "Unauthorized", "Authentication required before organization context verification.", 401);
    return;
  }

  // Resolve Organization ID from header, route parameter, or query string
  const rawOrgId =
    req.headers["x-organization-id"] ||
    req.params.orgId ||
    req.query.orgId;

  let orgId: string | undefined = undefined;
  if (typeof rawOrgId === "string" && rawOrgId.trim().length > 0) {
    orgId = rawOrgId.trim();
  } else if (Array.isArray(rawOrgId) && typeof rawOrgId[0] === "string") {
    orgId = rawOrgId[0].trim();
  }

  if (!orgId) {
    sendError(res, "Bad Request", "Missing required organization identifier (X-Organization-Id header or orgId parameter).", 400);
    return;
  }

  try {
    // 1. Parameterized query enforcing tenant ownership and loading assigned permissions
    let memberRow: {
      member_id: string;
      org_id: string;
      org_name: string;
      org_slug: string;
      user_id: string;
      role_id: string;
      role_name: string;
      status: string;
      permissions: string[];
    } | null = null;

    try {
      const memberRes = await query<{
        member_id: string;
        org_id: string;
        org_name: string;
        org_slug: string;
        user_id: string;
        role_id: string;
        role_name: string;
        status: string;
        permission_id: string | null;
      }>(
        `SELECT 
            m.id AS member_id,
            o.id AS org_id,
            o.name AS org_name,
            o.slug AS org_slug,
            m.user_id,
            r.id AS role_id,
            r.name AS role_name,
            m.status,
            rp.permission_id
         FROM organization_members m
         JOIN organizations o ON o.id = m.organization_id
         JOIN roles r ON r.id = m.role_id
         LEFT JOIN role_permissions rp ON rp.role_id = r.id
         WHERE (o.id::text = $1 OR o.slug = $1)
           AND m.user_id::text = $2
           AND m.status = 'active'
           AND o.status = 'active'`,
        [orgId, req.user.id]
      );

      if (memberRes.rowCount > 0) {
        const first = memberRes.rows[0];
        const permissions: string[] = [];
        if (first.role_id === "owner") permissions.push("*");
        for (const r of memberRes.rows) {
          if (r.permission_id && !permissions.includes(r.permission_id)) {
            permissions.push(r.permission_id);
          }
        }
        memberRow = {
          member_id: first.member_id,
          org_id: first.org_id,
          org_name: first.org_name,
          org_slug: first.org_slug,
          user_id: first.user_id,
          role_id: first.role_id,
          role_name: first.role_name,
          status: first.status,
          permissions,
        };
      }
    } catch {
      // Database offline/not yet migrated -> check fallback
    }

    // 2. In-Memory fallback check
    if (!memberRow) {
      const org = await organizationRepository.findByIdOrSlug(orgId);
      if (org) {
        const members = await organizationRepository.listMembers(org.id);
        const userMember = members.find((m) => m.user_id === req.user?.id && m.status === "active");
        if (userMember) {
          const perms: string[] = [];
          if (userMember.role_id === "owner") {
            perms.push("*");
          } else if (userMember.role_id === "org_admin" || userMember.role_id === "operations_manager") {
            perms.push("organization.read", "organization.manage", "members.read", "members.invite", "members.manage");
          } else {
            perms.push("organization.read", "members.read");
          }

          memberRow = {
            member_id: userMember.member_id,
            org_id: org.id,
            org_name: org.name,
            org_slug: org.slug,
            user_id: userMember.user_id,
            role_id: userMember.role_id,
            role_name: userMember.role_name,
            status: userMember.status,
            permissions: perms,
          };
        }
      }
    }

    if (!memberRow) {
      // User is not a member of this organization -> strictly isolate data
      sendError(
        res,
        "Forbidden",
        "Tenant isolation error: Access denied to the requested organization.",
        403
      );
      return;
    }

    req.organizationId = memberRow.org_id;
    req.permissions = memberRow.permissions;
    req.membership = {
      id: memberRow.member_id,
      organizationId: memberRow.org_id,
      organizationName: memberRow.org_name,
      organizationSlug: memberRow.org_slug,
      userId: memberRow.user_id,
      roleId: memberRow.role_id,
      roleName: memberRow.role_name,
      status: memberRow.status,
      permissions: memberRow.permissions,
    };

    next();
  } catch (error) {
    console.error("Tenant authorization verification error:", error);
    sendError(res, "Internal Server Error", "Failed to verify organization context.", 500);
  }
}

/**
 * Middleware factory enforcing granular permissions on routes.
 */
export function requirePermission(permission: string) {
  return (req: TenantRequest, res: Response, next: NextFunction): void => {
    if (!req.permissions) {
      sendError(res, "Forbidden", "Organization permissions context missing.", 403);
      return;
    }

    // Owner or superuser with wildcard permission
    if (req.permissions.includes("*") || req.permissions.includes(permission)) {
      return next();
    }

    sendError(
      res,
      "Forbidden",
      `Insufficient permissions. Required permission: '${permission}'.`,
      403,
      { requiredPermission: permission, assignedPermissions: req.permissions }
    );
  };
}
