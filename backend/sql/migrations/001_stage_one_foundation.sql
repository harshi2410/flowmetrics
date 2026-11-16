-- =========================================================
-- Flowmetrics Migration 001: Security & Platform Foundation
-- Compatible with PostgreSQL 13+ / pgAdmin
-- =========================================================

-- 1. Enable Cryptographic Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Schema Migrations Ledger
CREATE TABLE IF NOT EXISTS schema_migrations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Core Admin Users Table
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'admin',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);

-- 4. Persistent Sessions Table
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_token VARCHAR(255) UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_agent TEXT,
    ip_address VARCHAR(45)
);

CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

-- 5. Pricing Plans Table (Preserved & Normalized)
CREATE TABLE IF NOT EXISTS pricing_plans (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    tagline TEXT,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0,
    period VARCHAR(20) NOT NULL DEFAULT 'month',
    billing_cycle VARCHAR(20) DEFAULT 'month',
    description TEXT,
    features JSONB NOT NULL DEFAULT '[]'::jsonb,
    highlighted BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pricing_sort ON pricing_plans(sort_order ASC, price ASC);

-- 6. Blog Posts Table (Preserved & Normalized)
CREATE TABLE IF NOT EXISTS blog_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(255) UNIQUE NOT NULL,
    title TEXT NOT NULL,
    excerpt TEXT NOT NULL,
    content JSONB NOT NULL DEFAULT '[]'::jsonb,
    author VARCHAR(255) NOT NULL DEFAULT 'Flowmetrics Team',
    read_time VARCHAR(50) NOT NULL DEFAULT '5 min read',
    featured BOOLEAN NOT NULL DEFAULT FALSE,
    published BOOLEAN NOT NULL DEFAULT TRUE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blog_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_published_date ON blog_posts(published, date DESC);

-- 7. Seed Initial Platform Admin if Not Exists
INSERT INTO admin_users (email, password_hash, name, role)
VALUES (
    'admin@flowmetrics.io',
    -- SHA-256 hash or standard hash for 'flowmetrics2026'
    '33a0bcf4e58db5469faee98436eb4a36f6d0f5e1dbfa38b1f5fe0ffadbb544f8',
    'Flowmetrics Administrator',
    'admin'
)
ON CONFLICT (email) DO NOTHING;

-- 8. Record Migration in Ledger
INSERT INTO schema_migrations (name)
VALUES ('001_stage_one_foundation')
ON CONFLICT (name) DO NOTHING;
