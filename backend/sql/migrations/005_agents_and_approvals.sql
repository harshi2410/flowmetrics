-- ==============================================================================
-- 005_agents_and_approvals.sql
-- AI Agent Orchestration, Tool Registry, Human-in-the-Loop Approvals & Tracing
-- ==============================================================================

-- 1. Agent Executions Table
CREATE TABLE IF NOT EXISTS agent_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    agent_type VARCHAR(100) NOT NULL, -- 'support_triage', 'ops_orchestrator', 'evaluator'
    status VARCHAR(50) NOT NULL DEFAULT 'queued', -- 'queued', 'planning', 'retrieving_context', 'reasoning', 'awaiting_approval', 'executing', 'completed', 'failed'
    input JSONB NOT NULL DEFAULT '{}'::jsonb,
    output JSONB,
    tokens_used INT NOT NULL DEFAULT 0,
    duration_ms INT NOT NULL DEFAULT 0,
    error_message TEXT,
    created_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_exec_org ON agent_executions(organization_id);
CREATE INDEX IF NOT EXISTS idx_agent_exec_status ON agent_executions(status);
CREATE INDEX IF NOT EXISTS idx_agent_exec_type ON agent_executions(agent_type);

-- 2. Agent Execution Steps Table (Fine-grained state trace)
CREATE TABLE IF NOT EXISTS agent_execution_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    execution_id UUID NOT NULL REFERENCES agent_executions(id) ON DELETE CASCADE,
    step_number INT NOT NULL,
    state VARCHAR(50) NOT NULL,
    description TEXT,
    input_data JSONB,
    output_data JSONB,
    duration_ms INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_steps_exec ON agent_execution_steps(execution_id);

-- 3. Agent Tool Calls Table
CREATE TABLE IF NOT EXISTS agent_tool_calls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    execution_id UUID NOT NULL REFERENCES agent_executions(id) ON DELETE CASCADE,
    tool_name VARCHAR(100) NOT NULL,
    arguments JSONB NOT NULL DEFAULT '{}'::jsonb,
    result JSONB,
    is_error BOOLEAN NOT NULL DEFAULT false,
    duration_ms INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_tools_exec ON agent_tool_calls(execution_id);

-- 4. Human-In-The-Loop Approvals Table
CREATE TABLE IF NOT EXISTS agent_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    execution_id UUID NOT NULL REFERENCES agent_executions(id) ON DELETE CASCADE,
    tool_name VARCHAR(100) NOT NULL,
    proposed_action TEXT NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    risk_level VARCHAR(50) NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    reviewed_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    reviewer_comment TEXT,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_approvals_org ON agent_approvals(organization_id);
CREATE INDEX IF NOT EXISTS idx_agent_approvals_status ON agent_approvals(status);

-- 5. Agent Evaluations Table
CREATE TABLE IF NOT EXISTS agent_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    test_suite_name VARCHAR(255) NOT NULL,
    test_scenario VARCHAR(255) NOT NULL,
    passed BOOLEAN NOT NULL DEFAULT true,
    score NUMERIC(5, 2) NOT NULL DEFAULT 100.0,
    actual_output JSONB NOT NULL,
    expected_output JSONB NOT NULL,
    reasoning TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_evals_org ON agent_evaluations(organization_id);

INSERT INTO schema_migrations (name)
VALUES ('005_agents_and_approvals')
ON CONFLICT (name) DO NOTHING;
