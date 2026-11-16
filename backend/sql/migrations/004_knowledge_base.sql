-- ==============================================================================
-- 004_knowledge_base.sql
-- Flowmetrics Enterprise Knowledge Base & Semantic Retrieval (RAG)
-- ==============================================================================

-- 1. Knowledge Documents Table
CREATE TABLE IF NOT EXISTS knowledge_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    source_type VARCHAR(50) NOT NULL DEFAULT 'runbook', -- 'runbook', 'faq', 'policy', 'api_spec', 'manual'
    content TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'indexed', -- 'indexed', 'processing', 'failed'
    chunk_count INT NOT NULL DEFAULT 0,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kdocs_org ON knowledge_documents(organization_id);
CREATE INDEX IF NOT EXISTS idx_kdocs_status ON knowledge_documents(status);

-- 2. Knowledge Chunks Table
CREATE TABLE IF NOT EXISTS knowledge_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES knowledge_documents(id) ON DELETE CASCADE,
    chunk_index INT NOT NULL,
    content TEXT NOT NULL,
    token_count INT NOT NULL DEFAULT 0,
    embedding JSONB NOT NULL DEFAULT '[]'::jsonb, -- vector embedding representation
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kchunks_org ON knowledge_chunks(organization_id);
CREATE INDEX IF NOT EXISTS idx_kchunks_doc ON knowledge_chunks(document_id);

-- 3. Seed Standard Runbooks for Flowmetrics HQ
DO $$
DECLARE
    v_org_id UUID;
    v_doc1_id UUID;
    v_doc2_id UUID;
BEGIN
    SELECT id INTO v_org_id FROM organizations WHERE slug = 'flowmetrics-hq' LIMIT 1;

    IF v_org_id IS NOT NULL THEN
        -- Runbook 1: Ingress Gateway & 504 Timeout Resolution
        INSERT INTO knowledge_documents (organization_id, title, source_type, content, status, chunk_count, metadata)
        VALUES (
            v_org_id,
            'RUNBOOK-101: Webhook Ingress Gateway 504 Timeout Troubleshooting',
            'runbook',
            'When high webhook volume causes 504 Gateway Timeouts, investigate Redis connection pool saturation and Envoy ingress worker thread exhaustion. Steps: 1. Verify Redis cluster CPU and memory headroom. 2. Scale up replica pods using kubectl scale deployment webhook-receiver --replicas=12. 3. Check client connection keep-alive headers. 4. If error rate > 5%, enable fallback rate limiting.',
            'indexed',
            1,
            '{"category": "infrastructure", "tags": ["envoy", "redis", "gateway", "504"]}'::jsonb
        )
        ON CONFLICT DO NOTHING
        RETURNING id INTO v_doc1_id;

        IF v_doc1_id IS NOT NULL THEN
            INSERT INTO knowledge_chunks (organization_id, document_id, chunk_index, content, token_count, metadata)
            VALUES (
                v_org_id,
                v_doc1_id,
                0,
                'When high webhook volume causes 504 Gateway Timeouts, investigate Redis connection pool saturation and Envoy ingress worker thread exhaustion. Steps: 1. Verify Redis cluster CPU and memory headroom. 2. Scale up replica pods using kubectl scale deployment webhook-receiver --replicas=12. 3. Check client connection keep-alive headers. 4. If error rate > 5%, enable fallback rate limiting.',
                68,
                '{"keywords": ["webhook", "504", "gateway", "redis", "envoy", "replicas"]}'::jsonb
            )
            ON CONFLICT DO NOTHING;
        END IF;

        -- Runbook 2: Organization Access & Invitation Token Reset
        INSERT INTO knowledge_documents (organization_id, title, source_type, content, status, chunk_count, metadata)
        VALUES (
            v_org_id,
            'RUNBOOK-204: Enterprise Invitation and Token Revocation SOP',
            'runbook',
            'Enterprise organization invitations are signed with HMAC-SHA256 and expire in 48 hours. If a customer reports premature expiration: 1. Check if the user was already registered under another workspace. 2. Re-issue invitation from the Members & Access dashboard. 3. Ensure browser clock skew is within 5 minutes.',
            'indexed',
            1,
            '{"category": "auth", "tags": ["invitation", "token", "sso", "jwt"]}'::jsonb
        )
        ON CONFLICT DO NOTHING
        RETURNING id INTO v_doc2_id;

        IF v_doc2_id IS NOT NULL THEN
            INSERT INTO knowledge_chunks (organization_id, document_id, chunk_index, content, token_count, metadata)
            VALUES (
                v_org_id,
                v_doc2_id,
                0,
                'Enterprise organization invitations are signed with HMAC-SHA256 and expire in 48 hours. If a customer reports premature expiration: 1. Check if the user was already registered under another workspace. 2. Re-issue invitation from the Members & Access dashboard. 3. Ensure browser clock skew is within 5 minutes.',
                52,
                '{"keywords": ["invitation", "token", "expiration", "auth", "jwt"]}'::jsonb
            )
            ON CONFLICT DO NOTHING;
        END IF;
    END IF;
END $$;

INSERT INTO schema_migrations (name)
VALUES ('004_knowledge_base')
ON CONFLICT (name) DO NOTHING;
