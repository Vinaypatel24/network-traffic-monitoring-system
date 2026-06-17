-- ============================================================
-- V2__seed_roles.sql
-- Seeds the two application roles
-- ============================================================

INSERT INTO roles (name) VALUES
    ('ROLE_ADMIN'),
    ('ROLE_USER')
ON CONFLICT (name) DO NOTHING;
