-- =========================================================
-- Flowmetrics Migration 002: Multi-Tenant SaaS Foundation
-- Compatible with PostgreSQL 13+ / pgAdmin
-- =========================================================

-- 1. Organizations Table
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    logo_url TEXT,
    timezone VARCHAR(50) NOT NULL DEFAULT 'UTC',
    status VARCHAR(50) NOT NULL DEFAULT 'active', -- 'active', 'suspended', 'archived'
    settings JSONB NOT NULL DEFAULT '{"allowMemberInvites": true, "defaultRole": "team_member"}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_status ON organizations(status);

-- 2. Roles Table
CREATE TABLE IF NOT EXISTS roles (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Permissions Table
CREATE TABLE IF NOT EXISTS permissions (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'general'
);

-- 4. Role Permissions Mapping
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id VARCHAR(50) NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id VARCHAR(100) NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- 5. User Profiles Table
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
    full_name VARCHAR(255),
    avatar_url TEXT,
    job_title VARCHAR(100),
    phone VARCHAR(50),
    preferences JSONB NOT NULL DEFAULT '{"theme": "system", "emailNotifications": true}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

-- 6. Organization Members Table
CREATE TABLE IF NOT EXISTS organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
    role_id VARCHAR(50) NOT NULL REFERENCES roles(id) DEFAULT 'team_member',
    status VARCHAR(50) NOT NULL DEFAULT 'active', -- 'active', 'inactive', 'suspended'
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(organization_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_org_members_org ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_role ON organization_members(role_id);

-- 7. Organization Invitations Table
CREATE TABLE IF NOT EXISTS organization_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    role_id VARCHAR(50) NOT NULL REFERENCES roles(id) DEFAULT 'team_member',
    invited_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'expired', 'revoked'
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_org_invitations_token ON organization_invitations(token);
CREATE INDEX IF NOT EXISTS idx_org_invitations_org_email ON organization_invitations(organization_id, email);

-- 8. Seed Predefined Enterprise Roles
INSERT INTO roles (id, name, description)
VALUES
    ('owner', 'Owner', 'Complete authority across organization, billing, and members.'),
    ('org_admin', 'Organization Administrator', 'Full administrative authority excluding ownership transfer.'),
    ('operations_manager', 'Operations Manager', 'Oversees teams, workload distribution, and operational metrics.'),
    ('project_manager', 'Project Manager', 'Manages projects, sprints, milestones, and task assignments.'),
    ('support_manager', 'Support Manager', 'Oversees support queues, SLA policies, and customer tickets.'),
    ('support_agent', 'Support Agent', 'Triages, updates, and resolves customer support tickets.'),
    ('team_member', 'Team Member', 'Executes assigned tasks, contributes to projects, and logs work.'),
    ('viewer', 'Viewer', 'Read-only access across approved organization views.')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description;

-- 9. Seed Standard Granular Permissions
INSERT INTO permissions (id, name, description, category)
VALUES
    ('organization.read', 'Read Organization', 'View organization details and public profile', 'organization'),
    ('organization.manage', 'Manage Organization', 'Update organization settings, profile, and timezone', 'organization'),
    ('members.read', 'Read Members', 'View member list, roles, and profiles', 'members'),
    ('members.invite', 'Invite Members', 'Send invitation emails to join organization', 'members'),
    ('members.manage', 'Manage Members', 'Change member roles, deactivate, or remove members', 'members'),
    ('projects.read', 'Read Projects', 'View projects, milestones, and health metrics', 'operations'),
    ('projects.create', 'Create Projects', 'Create new engineering projects and define goals', 'operations'),
    ('projects.update', 'Update Projects', 'Modify projects, assign teams, and archive projects', 'operations'),
    ('tasks.read', 'Read Tasks', 'View tasks, comments, and attachments', 'operations'),
    ('tasks.create', 'Create Tasks', 'Create new tasks and backlogs', 'operations'),
    ('tasks.assign', 'Assign Tasks', 'Assign tasks to team members and adjust priority', 'operations'),
    ('tasks.update', 'Update Tasks', 'Update task statuses, effort estimates, and details', 'operations'),
    ('tickets.read', 'Read Tickets', 'View support tickets, customer notes, and histories', 'support'),
    ('tickets.manage', 'Manage Tickets', 'Assign, update status, prioritize, and resolve tickets', 'support'),
    ('knowledge.read', 'Read Knowledge', 'Query internal knowledge base and documentation', 'knowledge'),
    ('knowledge.manage', 'Manage Knowledge', 'Upload, edit, chunk, and index company documents', 'knowledge'),
    ('agents.read', 'Read Agents', 'View AI agent configurations, runs, and traces', 'ai'),
    ('agents.configure', 'Configure Agents', 'Create and tune agent prompts, models, and tools', 'ai'),
    ('agents.approve', 'Approve Agent Actions', 'Review and approve high-risk human-in-the-loop actions', 'ai'),
    ('agents.execute', 'Execute Agents', 'Trigger agent workflows and triage runs', 'ai'),
    ('workflows.manage', 'Manage Workflows', 'Design, publish, and test automated business workflows', 'automation'),
    ('audit.read', 'Read Audit Logs', 'Inspect enterprise activity logs and execution histories', 'governance'),
    ('billing.manage', 'Manage Billing', 'Manage subscriptions, invoices, and payment methods', 'billing')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    category = EXCLUDED.category;

-- 10. Map Roles to Permissions
-- Helper: Assign all permissions to Owner & Org Admin
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'owner', id FROM permissions
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT 'org_admin', id FROM permissions
WHERE id != 'organization.transfer'
ON CONFLICT DO NOTHING;

-- Operations Manager
INSERT INTO role_permissions (role_id, permission_id)
VALUES
    ('operations_manager', 'organization.read'),
    ('operations_manager', 'members.read'),
    ('operations_manager', 'members.invite'),
    ('operations_manager', 'projects.read'),
    ('operations_manager', 'projects.create'),
    ('operations_manager', 'projects.update'),
    ('operations_manager', 'tasks.read'),
    ('operations_manager', 'tasks.create'),
    ('operations_manager', 'tasks.assign'),
    ('operations_manager', 'tasks.update'),
    ('operations_manager', 'tickets.read'),
    ('operations_manager', 'knowledge.read'),
    ('operations_manager', 'agents.read'),
    ('operations_manager', 'agents.approve'),
    ('operations_manager', 'agents.execute'),
    ('operations_manager', 'workflows.manage'),
    ('operations_manager', 'audit.read')
ON CONFLICT DO NOTHING;

-- Project Manager
INSERT INTO role_permissions (role_id, permission_id)
VALUES
    ('project_manager', 'organization.read'),
    ('project_manager', 'members.read'),
    ('project_manager', 'projects.read'),
    ('project_manager', 'projects.create'),
    ('project_manager', 'projects.update'),
    ('project_manager', 'tasks.read'),
    ('project_manager', 'tasks.create'),
    ('project_manager', 'tasks.assign'),
    ('project_manager', 'tasks.update'),
    ('project_manager', 'knowledge.read'),
    ('project_manager', 'agents.read'),
    ('project_manager', 'agents.execute')
ON CONFLICT DO NOTHING;

-- Support Manager
INSERT INTO role_permissions (role_id, permission_id)
VALUES
    ('support_manager', 'organization.read'),
    ('support_manager', 'members.read'),
    ('support_manager', 'tickets.read'),
    ('support_manager', 'tickets.manage'),
    ('support_manager', 'knowledge.read'),
    ('support_manager', 'knowledge.manage'),
    ('support_manager', 'agents.read'),
    ('support_manager', 'agents.approve'),
    ('support_manager', 'agents.execute'),
    ('support_manager', 'audit.read')
ON CONFLICT DO NOTHING;

-- Support Agent
INSERT INTO role_permissions (role_id, permission_id)
VALUES
    ('support_agent', 'organization.read'),
    ('support_agent', 'tickets.read'),
    ('support_agent', 'tickets.manage'),
    ('support_agent', 'knowledge.read'),
    ('support_agent', 'agents.read'),
    ('support_agent', 'agents.execute')
ON CONFLICT DO NOTHING;

-- Team Member
INSERT INTO role_permissions (role_id, permission_id)
VALUES
    ('team_member', 'organization.read'),
    ('team_member', 'members.read'),
    ('team_member', 'projects.read'),
    ('team_member', 'tasks.read'),
    ('team_member', 'tasks.create'),
    ('team_member', 'tasks.update'),
    ('team_member', 'knowledge.read')
ON CONFLICT DO NOTHING;

-- Viewer
INSERT INTO role_permissions (role_id, permission_id)
VALUES
    ('viewer', 'organization.read'),
    ('viewer', 'members.read'),
    ('viewer', 'projects.read'),
    ('viewer', 'tasks.read'),
    ('viewer', 'tickets.read'),
    ('viewer', 'knowledge.read')
ON CONFLICT DO NOTHING;

-- 11. Seed Default Primary Organization & Link to Primary Admin
DO $$
DECLARE
    v_admin_id UUID;
    v_org_id UUID;
BEGIN
    SELECT id INTO v_admin_id FROM admin_users WHERE email = 'admin@flowmetrics.io' LIMIT 1;

    IF v_admin_id IS NOT NULL THEN
        -- Ensure user profile exists
        INSERT INTO user_profiles (user_id, full_name, job_title)
        VALUES (v_admin_id, 'Flowmetrics Platform Administrator', 'Principal Architect & Admin')
        ON CONFLICT (user_id) DO NOTHING;

        -- Create Default Organization
        INSERT INTO organizations (name, slug, timezone, status)
        VALUES ('Flowmetrics Enterprise', 'flowmetrics-hq', 'America/New_York', 'active')
        ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
        RETURNING id INTO v_org_id;

        IF v_org_id IS NULL THEN
            SELECT id INTO v_org_id FROM organizations WHERE slug = 'flowmetrics-hq';
        END IF;

        -- Link Admin as Owner
        INSERT INTO organization_members (organization_id, user_id, role_id, status)
        VALUES (v_org_id, v_admin_id, 'owner', 'active')
        ON CONFLICT (organization_id, user_id) DO UPDATE SET role_id = 'owner', status = 'active';
    END IF;
END $$;

-- 12. Record Migration in Ledger
INSERT INTO schema_migrations (name)
VALUES ('002_multi_tenant_saas_foundation')
ON CONFLICT (name) DO NOTHING;
