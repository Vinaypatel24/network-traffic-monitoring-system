-- ============================================================
-- V2__seed_roles.sql  (H2-compatible version)
-- Seeds the two application roles and a default admin user
-- Password: 'admin' encoded with BCrypt
-- ============================================================

INSERT INTO roles (name) VALUES
    ('ROLE_ADMIN'),
    ('ROLE_USER');

-- Default admin user (password = 'admin')
-- BCrypt hash generated for 'admin'
INSERT INTO users (username, email, password_hash, enabled)
VALUES (
    'admin',
    'admin@networkmonitor.local',
    '$2a$10$Q.l/ZtjQs7uIn3AzX.DkReRdQ1zVIiE95l6/9krD7itWH49w3ddrm',
    TRUE
);

-- Assign ROLE_ADMIN to the admin user
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r
WHERE u.username = 'admin' AND r.name = 'ROLE_ADMIN';
