CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_key VARCHAR(64) NOT NULL,
    display_name VARCHAR(200) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_by VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(255),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_tenants_tenant_key UNIQUE (tenant_key),
    CONSTRAINT ck_tenants_tenant_key
        CHECK (tenant_key ~ '^[a-z][a-z0-9-]{1,62}[a-z0-9]$'),
    CONSTRAINT ck_tenants_status
        CHECK (status IN ('ACTIVE', 'INACTIVE'))
);

INSERT INTO tenants (
    id,
    tenant_key,
    display_name,
    status
)
VALUES (
    '00000000-0000-4000-8000-000000000100',
    'test-corporation',
    'Test Corporation',
    'ACTIVE'
);
