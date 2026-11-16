-- =========================================================
-- Flowmetrics Migration 003: Enterprise Operations & Support
-- Compatible with PostgreSQL 13+ / pgAdmin
-- =========================================================

-- 1. Teams Table
CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    lead_user_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_teams_org ON teams(organization_id);

-- 2. Team Members Table
CREATE TABLE IF NOT EXISTS team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
    weekly_capacity_hours NUMERIC(5, 2) NOT NULL DEFAULT 40.00,
    role VARCHAR(50) NOT NULL DEFAULT 'member',
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(team_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_team_members_team ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON team_members(user_id);

-- 3. Projects Table
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    key VARCHAR(20) NOT NULL,
    description TEXT,
    manager_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'active', -- 'planning', 'active', 'on_hold', 'completed', 'archived'
    start_date DATE,
    target_date DATE,
    health VARCHAR(50) NOT NULL DEFAULT 'healthy', -- 'healthy', 'at_risk', 'critical'
    health_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(organization_id, key)
);

CREATE INDEX IF NOT EXISTS idx_projects_org ON projects(organization_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_health ON projects(health);

-- 4. Project Milestones Table
CREATE TABLE IF NOT EXISTS project_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    due_date DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'open', -- 'open', 'completed'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Sprints Table
CREATE TABLE IF NOT EXISTS sprints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    goal TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'planned', -- 'planned', 'active', 'completed'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sprints_project ON sprints(project_id);

-- 6. Tasks Table
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    sprint_id UUID REFERENCES sprints(id) ON DELETE SET NULL,
    task_number INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'to_do', -- 'backlog', 'to_do', 'in_progress', 'in_review', 'blocked', 'done'
    priority VARCHAR(50) NOT NULL DEFAULT 'medium', -- 'critical', 'high', 'medium', 'low'
    assignee_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    reporter_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    estimated_hours NUMERIC(6, 2) DEFAULT 0,
    actual_hours NUMERIC(6, 2) DEFAULT 0,
    due_date DATE,
    labels JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(project_id, task_number)
);

CREATE INDEX IF NOT EXISTS idx_tasks_org ON tasks(organization_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_sprint ON tasks(sprint_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee_id);

-- 7. Task Comments Table
CREATE TABLE IF NOT EXISTS task_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Support Queues Table
CREATE TABLE IF NOT EXISTS support_queues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. SLA Policies Table
CREATE TABLE IF NOT EXISTS sla_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    priority VARCHAR(50) NOT NULL, -- 'critical', 'high', 'medium', 'low'
    response_time_hours NUMERIC(5, 2) NOT NULL,
    resolution_time_hours NUMERIC(5, 2) NOT NULL,
    business_hours_only BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(organization_id, priority)
);

-- 10. Support Tickets Table
CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_number INT NOT NULL,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    queue_id UUID REFERENCES support_queues(id) ON DELETE SET NULL,
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    requester_email VARCHAR(255) NOT NULL,
    requester_name VARCHAR(255),
    category VARCHAR(100) NOT NULL DEFAULT 'general',
    priority VARCHAR(50) NOT NULL DEFAULT 'medium', -- 'critical', 'high', 'medium', 'low'
    status VARCHAR(50) NOT NULL DEFAULT 'new', -- 'new', 'open', 'in_progress', 'waiting_customer', 'waiting_internal', 'resolved', 'closed'
    assignee_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    sla_due_at TIMESTAMPTZ,
    first_response_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(organization_id, ticket_number)
);

CREATE INDEX IF NOT EXISTS idx_tickets_org ON support_tickets(organization_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON support_tickets(priority);
CREATE INDEX IF NOT EXISTS idx_tickets_assignee ON support_tickets(assignee_id);

-- 11. Ticket Comments Table
CREATE TABLE IF NOT EXISTS ticket_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
    user_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    author_name VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    is_internal BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ticket_comments_ticket ON ticket_comments(ticket_id);

-- 12. Seed Default SLAs and Sample Operations for Flowmetrics HQ
DO $$
DECLARE
    v_org_id UUID;
    v_admin_id UUID;
    v_team_id UUID;
    v_proj_id UUID;
BEGIN
    SELECT id INTO v_org_id FROM organizations WHERE slug = 'flowmetrics-hq' LIMIT 1;
    SELECT id INTO v_admin_id FROM admin_users WHERE email = 'admin@flowmetrics.io' LIMIT 1;

    IF v_org_id IS NOT NULL THEN
        -- Seed Default SLA Policies
        INSERT INTO sla_policies (organization_id, name, priority, response_time_hours, resolution_time_hours)
        VALUES
            (v_org_id, 'Critical P1 SLA', 'critical', 1.0, 4.0),
            (v_org_id, 'High P2 SLA', 'high', 4.0, 16.0),
            (v_org_id, 'Medium P3 SLA', 'medium', 12.0, 48.0),
            (v_org_id, 'Low P4 SLA', 'low', 24.0, 96.0)
        ON CONFLICT DO NOTHING;

        -- Seed Default Engineering Team
        INSERT INTO teams (organization_id, name, description, lead_user_id)
        VALUES (v_org_id, 'Core Platform Engineering', 'Responsible for backend architecture, cloud infrastructure, and flow metrics telemetry.', v_admin_id)
        ON CONFLICT DO NOTHING
        RETURNING id INTO v_team_id;

        IF v_team_id IS NOT NULL AND v_admin_id IS NOT NULL THEN
            INSERT INTO team_members (team_id, user_id, weekly_capacity_hours, role)
            VALUES (v_team_id, v_admin_id, 40.0, 'lead')
            ON CONFLICT DO NOTHING;
        END IF;

        -- Seed Flagship Project
        INSERT INTO projects (organization_id, name, key, description, manager_id, team_id, status, target_date, health, health_reason)
        VALUES (
            v_org_id,
            'Flowmetrics 2.0 Core Modernization',
            'FLOW',
            'Comprehensive migration to multi-tenant operations, automated AI triage, and agent observability.',
            v_admin_id,
            v_team_id,
            'active',
            CURRENT_DATE + INTERVAL '60 days',
            'healthy',
            'Velocity is tracking within normal parameters. Sprints are 85% staffed.'
        )
        ON CONFLICT DO NOTHING
        RETURNING id INTO v_proj_id;

        -- Seed Tasks
        IF v_proj_id IS NOT NULL THEN
            INSERT INTO tasks (organization_id, project_id, task_number, title, description, status, priority, assignee_id, estimated_hours, actual_hours, due_date, labels)
            VALUES
                (v_org_id, v_proj_id, 101, 'Implement strict multi-tenant authorization middleware', 'Enforce tenant isolation on every SQL query and API route.', 'done', 'high', v_admin_id, 8.0, 8.0, CURRENT_DATE - INTERVAL '1 day', '["security", "backend"]'::jsonb),
                (v_org_id, v_proj_id, 102, 'Build interactive Kanban operations view', 'Deliver drag-and-drop task workflow boards for sprint coordination.', 'in_progress', 'high', v_admin_id, 12.0, 4.0, CURRENT_DATE + INTERVAL '5 days', '["frontend", "operations"]'::jsonb),
                (v_org_id, v_proj_id, 103, 'Support triage agent shadow mode implementation', 'Run automated classification without altering business records.', 'to_do', 'critical', v_admin_id, 16.0, 0.0, CURRENT_DATE + INTERVAL '12 days', '["ai", "agent"]'::jsonb)
            ON CONFLICT DO NOTHING;
        END IF;

        -- Seed Support Queue
        INSERT INTO support_queues (organization_id, name, description, team_id)
        VALUES (v_org_id, 'Tier 1 Enterprise Technical Support', 'High-priority enterprise production tickets and SLA-governed requests.', v_team_id)
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

INSERT INTO schema_migrations (name)
VALUES ('003_operations_and_support')
ON CONFLICT (name) DO NOTHING;
