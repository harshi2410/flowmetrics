import crypto from "node:crypto";
import { pool, query } from "../../db/pool.js";

export interface OrganizationRow {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  timezone: string;
  status: string;
  settings: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
  user_role?: string;
}

export interface MemberDetailRow {
  member_id: string;
  user_id: string;
  email: string;
  role_id: string;
  role_name: string;
  status: string;
  joined_at: Date;
  full_name: string | null;
  avatar_url: string | null;
  job_title: string | null;
}

export interface InvitationRow {
  id: string;
  organization_id: string;
  organization_name?: string;
  email: string;
  role_id: string;
  role_name?: string;
  invited_by: string | null;
  token: string;
  status: string;
  expires_at: Date;
  created_at: Date;
}

// In-Memory Fallback State for offline/development resilience
const memOrgs = new Map<string, OrganizationRow>([
  [
    "flowmetrics-hq",
    {
      id: "00000000-0000-0000-0000-000000000010",
      name: "Flowmetrics Enterprise",
      slug: "flowmetrics-hq",
      logo_url: null,
      timezone: "America/New_York",
      status: "active",
      settings: { allowMemberInvites: true },
      created_at: new Date(),
      updated_at: new Date(),
    },
  ],
]);

const memMembers = new Map<
  string, // memberId
  {
    member_id: string;
    organization_id: string;
    user_id: string;
    email: string;
    role_id: string;
    status: string;
    joined_at: Date;
    full_name: string | null;
    job_title: string | null;
  }
>([
  [
    "mem-default-admin",
    {
      member_id: "mem-default-admin",
      organization_id: "00000000-0000-0000-0000-000000000010",
      user_id: "00000000-0000-0000-0000-000000000001",
      email: "admin@flowmetrics.io",
      role_id: "owner",
      status: "active",
      joined_at: new Date(),
      full_name: "Flowmetrics Administrator",
      job_title: "Platform Admin",
    },
  ],
]);

const memInvitations = new Map<string, InvitationRow>();

export class OrganizationRepository {
  /**
   * List all organizations an authenticated user is an active member of.
   */
  async findUserOrganizations(userId: string): Promise<OrganizationRow[]> {
    try {
      const sql = `
        SELECT 
          o.id,
          o.name,
          o.slug,
          o.logo_url,
          o.timezone,
          o.status,
          o.settings,
          o.created_at,
          o.updated_at,
          m.role_id AS user_role
        FROM organizations o
        JOIN organization_members m ON m.organization_id = o.id
        WHERE m.user_id::text = $1 AND m.status = 'active' AND o.status = 'active'
        ORDER BY o.name ASC
      `;
      const res = await query<OrganizationRow>(sql, [userId]);
      if (res.rowCount > 0) return res.rows;
    } catch {
      // fallback
    }

    // In-memory fallback
    const result: OrganizationRow[] = [];
    for (const m of memMembers.values()) {
      if (m.user_id === userId && m.status === "active") {
        const org = memOrgs.get(m.organization_id) || Array.from(memOrgs.values()).find(o => o.id === m.organization_id);
        if (org && org.status === "active") {
          result.push({ ...org, user_role: m.role_id });
        }
      }
    }
    return result;
  }

  /**
   * Find organization by UUID or slug.
   */
  async findByIdOrSlug(idOrSlug: string): Promise<OrganizationRow | null> {
    try {
      const sql = `
        SELECT id, name, slug, logo_url, timezone, status, settings, created_at, updated_at
        FROM organizations
        WHERE (id::text = $1 OR slug = $1)
        LIMIT 1
      `;
      const res = await query<OrganizationRow>(sql, [idOrSlug]);
      if (res.rowCount > 0 && res.rows[0]) return res.rows[0];
    } catch {
      // fallback
    }

    // In-memory fallback
    for (const org of memOrgs.values()) {
      if (org.id === idOrSlug || org.slug === idOrSlug) {
        return org;
      }
    }
    return null;
  }

  /**
   * Transactional creation of organization and primary owner membership.
   */
  async createOrganization(
    name: string,
    slug: string,
    timezone: string,
    logoUrl: string | null,
    creatorUserId: string,
    creatorEmail?: string
  ): Promise<OrganizationRow> {
    try {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");

        // Ensure creator exists in admin_users to avoid FK constraint error
        if (creatorEmail) {
          await client.query(
            `INSERT INTO admin_users (id, email, password_hash, name, role)
             VALUES ($1, $2, 'managed-identity-jwt', $3, 'admin')
             ON CONFLICT (id) DO NOTHING`,
            [creatorUserId, creatorEmail, name + " Owner"]
          );
        }

        // 1. Insert Organization
        const orgRes = await client.query<OrganizationRow>(
          `INSERT INTO organizations (name, slug, timezone, logo_url, status)
           VALUES ($1, $2, $3, $4, 'active')
           RETURNING id, name, slug, logo_url, timezone, status, settings, created_at, updated_at`,
          [name, slug, timezone, logoUrl]
        );
        const organization = orgRes.rows[0];

        // 2. Insert Owner Membership
        await client.query(
          `INSERT INTO organization_members (organization_id, user_id, role_id, status)
           VALUES ($1, $2, 'owner', 'active')`,
          [organization.id, creatorUserId]
        );

        await client.query("COMMIT");
        return organization;
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      } finally {
        client.release();
      }
    } catch (dbErr) {
      console.warn("DB write failed, storing organization in memory:", (dbErr as Error).message);
    }

    // In-memory fallback
    const id = crypto.randomUUID();
    const newOrg: OrganizationRow = {
      id,
      name,
      slug,
      logo_url: logoUrl,
      timezone,
      status: "active",
      settings: { allowMemberInvites: true },
      created_at: new Date(),
      updated_at: new Date(),
    };
    memOrgs.set(id, newOrg);
    memOrgs.set(slug, newOrg);

    const memId = crypto.randomUUID();
    memMembers.set(memId, {
      member_id: memId,
      organization_id: id,
      user_id: creatorUserId,
      email: creatorEmail || "user@flowmetrics.io",
      role_id: "owner",
      status: "active",
      joined_at: new Date(),
      full_name: "Workspace Owner",
      job_title: "Platform Lead",
    });

    return newOrg;
  }

  /**
   * Update organization settings, profile, and timezone.
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
    try {
      const fields: string[] = [];
      const values: unknown[] = [];
      let idx = 1;

      if (updates.name !== undefined) {
        fields.push(`name = $${idx++}`);
        values.push(updates.name);
      }
      if (updates.logoUrl !== undefined) {
        fields.push(`logo_url = $${idx++}`);
        values.push(updates.logoUrl || null);
      }
      if (updates.timezone !== undefined) {
        fields.push(`timezone = $${idx++}`);
        values.push(updates.timezone);
      }
      if (updates.status !== undefined) {
        fields.push(`status = $${idx++}`);
        values.push(updates.status);
      }
      if (updates.settings !== undefined) {
        fields.push(`settings = $${idx++}::jsonb`);
        values.push(JSON.stringify(updates.settings));
      }

      if (fields.length > 0) {
        fields.push(`updated_at = NOW()`);
        values.push(orgId);

        const sql = `
          UPDATE organizations
          SET ${fields.join(", ")}
          WHERE (id::text = $${idx} OR slug = $${idx})
          RETURNING id, name, slug, logo_url, timezone, status, settings, created_at, updated_at
        `;
        const res = await query<OrganizationRow>(sql, values);
        if (res.rowCount > 0 && res.rows[0]) return res.rows[0];
      }
    } catch {
      // fallback
    }

    // In-memory fallback
    const existing = await this.findByIdOrSlug(orgId);
    if (!existing) return null;

    if (updates.name !== undefined) existing.name = updates.name;
    if (updates.logoUrl !== undefined) existing.logo_url = updates.logoUrl || null;
    if (updates.timezone !== undefined) existing.timezone = updates.timezone;
    if (updates.status !== undefined) existing.status = updates.status;
    if (updates.settings !== undefined) existing.settings = updates.settings;
    existing.updated_at = new Date();

    memOrgs.set(existing.id, existing);
    memOrgs.set(existing.slug, existing);
    return existing;
  }

  /**
   * List members of an organization.
   */
  async listMembers(orgId: string): Promise<MemberDetailRow[]> {
    try {
      const sql = `
        SELECT 
          m.id AS member_id,
          m.user_id,
          u.email,
          m.role_id,
          r.name AS role_name,
          m.status,
          m.joined_at,
          p.full_name,
          p.avatar_url,
          p.job_title
        FROM organization_members m
        JOIN organizations o ON o.id = m.organization_id
        JOIN admin_users u ON u.id = m.user_id
        JOIN roles r ON r.id = m.role_id
        LEFT JOIN user_profiles p ON p.user_id = u.id
        WHERE (o.id::text = $1 OR o.slug = $1)
        ORDER BY 
          CASE m.role_id 
            WHEN 'owner' THEN 1 
            WHEN 'org_admin' THEN 2 
            WHEN 'operations_manager' THEN 3 
            ELSE 4 
          END,
          m.joined_at ASC
      `;
      const res = await query<MemberDetailRow>(sql, [orgId]);
      if (res.rowCount > 0) return res.rows;
    } catch {
      // fallback
    }

    // In-memory fallback
    const resolvedOrg = await this.findByIdOrSlug(orgId);
    if (!resolvedOrg) return [];

    const result: MemberDetailRow[] = [];
    for (const m of memMembers.values()) {
      if (m.organization_id === resolvedOrg.id) {
        result.push({
          member_id: m.member_id,
          user_id: m.user_id,
          email: m.email,
          role_id: m.role_id,
          role_name: m.role_id.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase()),
          status: m.status,
          joined_at: m.joined_at,
          full_name: m.full_name,
          avatar_url: null,
          job_title: m.job_title,
        });
      }
    }
    return result;
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
    try {
      const fields: string[] = [];
      const values: unknown[] = [];
      let idx = 1;

      if (roleId) {
        fields.push(`role_id = $${idx++}`);
        values.push(roleId);
      }
      if (status) {
        fields.push(`status = $${idx++}`);
        values.push(status);
      }

      if (fields.length > 0) {
        fields.push(`updated_at = NOW()`);
        values.push(memberId);

        const sql = `
          UPDATE organization_members
          SET ${fields.join(", ")}
          WHERE (id::text = $${idx++})
        `;
        const res = await query(sql, values);
        if (res.rowCount > 0) return true;
      }
    } catch {
      // fallback
    }

    // In-memory fallback
    const member = memMembers.get(memberId);
    if (member) {
      if (roleId) member.role_id = roleId;
      if (status) member.status = status;
      return true;
    }
    return false;
  }

  /**
   * Delete member from organization.
   */
  async deleteMember(orgId: string, memberId: string): Promise<boolean> {
    try {
      const sql = `
        DELETE FROM organization_members
        WHERE (id::text = $1)
      `;
      const res = await query(sql, [memberId]);
      if (res.rowCount > 0) return true;
    } catch {
      // fallback
    }

    if (memMembers.has(memberId)) {
      memMembers.delete(memberId);
      return true;
    }
    return false;
  }

  /**
   * Create an invitation to join the organization.
   */
  async createInvitation(
    orgId: string,
    email: string,
    roleId: string,
    token: string,
    expiresAt: Date,
    invitedByUserId?: string
  ): Promise<InvitationRow> {
    const resolvedOrg = await this.findByIdOrSlug(orgId);
    const targetOrgId = resolvedOrg?.id || orgId;

    try {
      const sql = `
        INSERT INTO organization_invitations (organization_id, email, role_id, token, expires_at, invited_by)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, organization_id, email, role_id, token, status, expires_at, created_at
      `;
      const res = await query<InvitationRow>(sql, [
        targetOrgId,
        email,
        roleId,
        token,
        expiresAt,
        invitedByUserId || null,
      ]);
      if (res.rowCount > 0 && res.rows[0]) return res.rows[0];
    } catch {
      // fallback
    }

    // In-memory fallback
    const id = crypto.randomUUID();
    const inv: InvitationRow = {
      id,
      organization_id: targetOrgId,
      organization_name: resolvedOrg?.name || "Flowmetrics Enterprise",
      email,
      role_id: roleId,
      role_name: roleId.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase()),
      invited_by: invitedByUserId || null,
      token,
      status: "pending",
      expires_at: expiresAt,
      created_at: new Date(),
    };
    memInvitations.set(token, inv);
    memInvitations.set(id, inv);
    return inv;
  }

  /**
   * List pending invitations.
   */
  async listPendingInvitations(orgId: string): Promise<InvitationRow[]> {
    const resolvedOrg = await this.findByIdOrSlug(orgId);
    const targetOrgId = resolvedOrg?.id || orgId;

    try {
      const sql = `
        SELECT 
          i.id,
          i.organization_id,
          i.email,
          i.role_id,
          r.name AS role_name,
          i.invited_by,
          i.token,
          i.status,
          i.expires_at,
          i.created_at
        FROM organization_invitations i
        JOIN roles r ON r.id = i.role_id
        WHERE i.organization_id = $1 AND i.status = 'pending' AND i.expires_at > NOW()
        ORDER BY i.created_at DESC
      `;
      const res = await query<InvitationRow>(sql, [targetOrgId]);
      if (res.rowCount > 0) return res.rows;
    } catch {
      // fallback
    }

    // In-memory fallback
    const result: InvitationRow[] = [];
    for (const inv of memInvitations.values()) {
      if (
        inv.organization_id === targetOrgId &&
        inv.status === "pending" &&
        new Date(inv.expires_at) > new Date()
      ) {
        if (!result.some(r => r.id === inv.id)) {
          result.push(inv);
        }
      }
    }
    return result;
  }

  /**
   * Find invitation by token.
   */
  async findInvitationByToken(token: string): Promise<InvitationRow | null> {
    try {
      const sql = `
        SELECT 
          i.id,
          i.organization_id,
          o.name AS organization_name,
          i.email,
          i.role_id,
          r.name AS role_name,
          i.token,
          i.status,
          i.expires_at,
          i.created_at
        FROM organization_invitations i
        JOIN organizations o ON o.id = i.organization_id
        JOIN roles r ON r.id = i.role_id
        WHERE i.token = $1
        LIMIT 1
      `;
      const res = await query<InvitationRow>(sql, [token]);
      if (res.rowCount > 0 && res.rows[0]) return res.rows[0];
    } catch {
      // fallback
    }

    return memInvitations.get(token) || null;
  }

  /**
   * Accept invitation and add member.
   */
  async acceptInvitation(invitationId: string, orgId: string, userId: string, roleId: string, userEmail?: string): Promise<void> {
    try {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        await client.query("UPDATE organization_invitations SET status = 'accepted' WHERE id = $1", [invitationId]);
        await client.query(
          `INSERT INTO organization_members (organization_id, user_id, role_id, status)
           VALUES ($1, $2, $3, 'active')
           ON CONFLICT (organization_id, user_id) DO UPDATE SET role_id = EXCLUDED.role_id, status = 'active'`,
          [orgId, userId, roleId]
        );
        await client.query("COMMIT");
        return;
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      } finally {
        client.release();
      }
    } catch {
      // fallback
    }

    // In-memory fallback
    const inv = Array.from(memInvitations.values()).find(i => i.id === invitationId);
    if (inv) {
      inv.status = "accepted";
    }

    const memId = crypto.randomUUID();
    memMembers.set(memId, {
      member_id: memId,
      organization_id: orgId,
      user_id: userId,
      email: userEmail || inv?.email || "newmember@flowmetrics.io",
      role_id: roleId,
      status: "active",
      joined_at: new Date(),
      full_name: "Team Member",
      job_title: roleId.replace("_", " "),
    });
  }

  /**
   * Revoke invitation.
   */
  async revokeInvitation(orgId: string, invitationId: string): Promise<boolean> {
    try {
      const sql = `
        UPDATE organization_invitations
        SET status = 'revoked'
        WHERE id = $1 AND status = 'pending'
      `;
      const res = await query(sql, [invitationId]);
      if (res.rowCount > 0) return true;
    } catch {
      // fallback
    }

    const inv = Array.from(memInvitations.values()).find(i => i.id === invitationId);
    if (inv) {
      inv.status = "revoked";
      return true;
    }
    return false;
  }

  async listRoles(): Promise<any[]> {
    try {
      const sql = `
        SELECT r.id, r.name, r.description, r.is_system,
               COALESCE(json_agg(p.name) FILTER (WHERE p.name IS NOT NULL), '[]'::json) AS permissions
        FROM roles r
        LEFT JOIN role_permissions rp ON rp.role_id = r.id
        LEFT JOIN permissions p ON p.id = rp.permission_id
        GROUP BY r.id, r.name, r.description, r.is_system
        ORDER BY r.name ASC
      `;
      const res = await query(sql);
      if (res.rowCount > 0) return res.rows;
    } catch {
      // fallback
    }

    return [
      { id: "owner", name: "Owner", description: "Full workspace ownership and billing control", permissions: ["*"] },
      { id: "admin", name: "Organization Admin", description: "Administrative management and security control", permissions: ["*"] },
      { id: "operations_manager", name: "Operations Manager", description: "Projects, sprints, tasks, and team workload balancing", permissions: ["projects.manage", "tasks.manage", "sprints.manage"] },
      { id: "support_manager", name: "Support Manager", description: "Ticket queues, SLA management, and agent escalation review", permissions: ["tickets.manage", "agents.approve"] },
      { id: "support_agent", name: "Support Agent", description: "Customer ticket triage and knowledge base search", permissions: ["tickets.read", "tickets.reply", "knowledge.read"] },
      { id: "team_member", name: "Team Member", description: "Sprint task execution and status updates", permissions: ["tasks.read", "tasks.update"] },
      { id: "viewer", name: "Viewer", description: "Read-only workspace visibility", permissions: ["*.read"] },
    ];
  }
}

export const organizationRepository = new OrganizationRepository();
