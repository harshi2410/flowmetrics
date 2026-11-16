-- ==============================================================================
-- 006_workflows_and_audit.sql
-- Workflow Automation Rules and Enterprise Audit Logging
-- ==============================================================================

-- 1. Workflow Automation Rules
CREATE TABLE IF NOT EXISTS workflow_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    trigger_event VARCHAR(100) NOT NULL, -- 'ticket.created', 'ticket.updated', 'task.status_changed', 'agent.completed'
    conditions JSONB NOT NULL DEFAULT '{}'::jsonb,
    actions JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workflow_org ON workflow_rules(organization_id);
CREATE INDEX IF NOT EXISTS idx_workflow_trigger ON workflow_rules(trigger_event);

-- 2. Enterprise Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    actor_email VARCHAR(255) NOT NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(255),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_org ON audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);

-- 3. Seed Default Workflow Rule for Flowmetrics HQ
DO $$
DECLARE
    v_org_id UUID;
BEGIN
    SELECT id INTO v_org_id FROM organizations WHERE slug = 'flowmetrics-hq' LIMIT 1;
    IF v_org_id IS NOT NULL THEN
        INSERT INTO workflow_rules (organization_id, name, description, trigger_event, conditions, actions, is_active)
        VALUES (
            v_org_id,
            'Auto-Triage Critical Inbound Tickets',
            'Triggers AI Support Triage Agent upon creation of tickets marked with critical or infrastructure tags.',
            'ticket.created',
            '{"field": "priority", "operator": "equals", "value": "critical"}'::jsonb,
            '[{"action": "invoke_agent", "agentType": "support_triage", "shadowMode": false}]'::jsonb,
            true
        )
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

INSERT INTO schema_migrations (name)
VALUES ('006_workflows_and_audit')
ON CONFLICT (name) DO NOTHING;
