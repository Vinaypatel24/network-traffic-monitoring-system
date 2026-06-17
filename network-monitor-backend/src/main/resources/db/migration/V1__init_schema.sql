-- ============================================================
-- V1__init_schema.sql
-- Network Traffic Monitoring System — Full Database Schema
-- ============================================================

-- ─── ROLES & USERS ──────────────────────────────────────────
CREATE TABLE roles (
    id   BIGSERIAL    PRIMARY KEY,
    name VARCHAR(30)  UNIQUE NOT NULL   -- ROLE_ADMIN, ROLE_USER
);

CREATE TABLE users (
    id             BIGSERIAL    PRIMARY KEY,
    username       VARCHAR(50)  UNIQUE NOT NULL,
    email          VARCHAR(120) UNIQUE NOT NULL,
    password_hash  VARCHAR(255) NOT NULL,
    enabled        BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at     TIMESTAMP    NOT NULL DEFAULT now()
);

CREATE TABLE user_roles (
    user_id  BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id  BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- ─── REFRESH TOKENS (A8 — httpOnly cookie, hash stored) ─────
CREATE TABLE refresh_tokens (
    id          BIGSERIAL    PRIMARY KEY,
    user_id     BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  VARCHAR(64)  UNIQUE NOT NULL,    -- SHA-256 hex (64 chars)
    expires_at  TIMESTAMP    NOT NULL,
    revoked     BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP    NOT NULL DEFAULT now()
);
CREATE INDEX idx_refresh_token_hash ON refresh_tokens(token_hash);
CREATE INDEX idx_refresh_token_user ON refresh_tokens(user_id);

-- ─── NETWORK INTERFACES ─────────────────────────────────────
CREATE TABLE network_interfaces (
    id           BIGSERIAL    PRIMARY KEY,
    name         VARCHAR(100) NOT NULL,
    description  VARCHAR(255),
    is_loopback  BOOLEAN      NOT NULL DEFAULT FALSE,
    is_active    BOOLEAN      NOT NULL DEFAULT FALSE
);

-- ─── CAPTURE SESSIONS ───────────────────────────────────────
CREATE TABLE capture_sessions (
    id              BIGSERIAL   PRIMARY KEY,
    user_id         BIGINT      NOT NULL REFERENCES users(id),
    interface_id    BIGINT      REFERENCES network_interfaces(id),
    interface_name  VARCHAR(100),    -- snapshot of interface name for history
    start_time      TIMESTAMP   NOT NULL DEFAULT now(),
    end_time        TIMESTAMP,
    status          VARCHAR(20) NOT NULL DEFAULT 'RUNNING',  -- RUNNING / STOPPED / ERROR
    total_packets   BIGINT      NOT NULL DEFAULT 0,
    total_bytes     BIGINT      NOT NULL DEFAULT 0
);

-- Enforce one RUNNING session per user (A1)
-- A partial unique index is the cleanest DB-level enforcement
CREATE UNIQUE INDEX uq_one_active_session_per_user
    ON capture_sessions (user_id)
    WHERE status = 'RUNNING';

CREATE INDEX idx_sessions_user   ON capture_sessions(user_id);
CREATE INDEX idx_sessions_status ON capture_sessions(status);

-- ─── PACKETS (high-volume, cascade delete) ──────────────────
CREATE TABLE packets (
    id                  BIGSERIAL   PRIMARY KEY,
    capture_session_id  BIGINT      NOT NULL REFERENCES capture_sessions(id) ON DELETE CASCADE,
    src_ip              VARCHAR(45) NOT NULL,
    dst_ip              VARCHAR(45) NOT NULL,
    src_port            INTEGER,
    dst_port            INTEGER,
    protocol            VARCHAR(10) NOT NULL,   -- TCP / UDP / ICMP / DNS / HTTP / HTTPS / OTHER
    packet_size         INTEGER     NOT NULL,
    ttl                 INTEGER,
    tcp_flags           VARCHAR(20),
    captured_at         TIMESTAMP   NOT NULL DEFAULT now()
);
CREATE INDEX idx_packets_session_time ON packets(capture_session_id, captured_at);
CREATE INDEX idx_packets_src_ip       ON packets(src_ip);
CREATE INDEX idx_packets_dst_ip       ON packets(dst_ip);
CREATE INDEX idx_packets_protocol     ON packets(protocol);

-- ─── TRAFFIC STATISTICS (pre-aggregated) ────────────────────
CREATE TABLE traffic_statistics (
    id                  BIGSERIAL   PRIMARY KEY,
    capture_session_id  BIGINT      NOT NULL REFERENCES capture_sessions(id) ON DELETE CASCADE,
    window_start        TIMESTAMP   NOT NULL,
    window_end          TIMESTAMP   NOT NULL,
    protocol            VARCHAR(10),
    packet_count        BIGINT      NOT NULL DEFAULT 0,
    byte_count          BIGINT      NOT NULL DEFAULT 0
);
CREATE INDEX idx_traffic_stats_session ON traffic_statistics(capture_session_id);
CREATE INDEX idx_traffic_stats_window  ON traffic_statistics(window_start, window_end);

-- ─── IP STATISTICS (top talkers) ────────────────────────────
CREATE TABLE ip_statistics (
    id                  BIGSERIAL   PRIMARY KEY,
    capture_session_id  BIGINT      NOT NULL REFERENCES capture_sessions(id) ON DELETE CASCADE,
    ip_address          VARCHAR(45) NOT NULL,
    direction           VARCHAR(11) NOT NULL,   -- SOURCE / DESTINATION
    packet_count        BIGINT      NOT NULL DEFAULT 0,
    byte_count          BIGINT      NOT NULL DEFAULT 0,
    window_start        TIMESTAMP   NOT NULL,
    window_end          TIMESTAMP   NOT NULL
);
CREATE INDEX idx_ip_stats_session ON ip_statistics(capture_session_id);
CREATE INDEX idx_ip_stats_ip      ON ip_statistics(ip_address);

-- ─── ALERT RULES (tunable thresholds) ───────────────────────
CREATE TABLE alert_rules (
    id                   BIGSERIAL          PRIMARY KEY,
    rule_type            VARCHAR(40)        NOT NULL,
        -- PORT_SCAN / TRAFFIC_SPIKE / ABNORMAL_REQUEST_RATE / SUSPICIOUS_CONNECTION
    threshold_value      DOUBLE PRECISION   NOT NULL,
    time_window_seconds  INTEGER            NOT NULL,
    severity             VARCHAR(10)        NOT NULL,   -- LOW / MEDIUM / HIGH / CRITICAL
    enabled              BOOLEAN            NOT NULL DEFAULT TRUE,
    description          VARCHAR(255)
);

-- ─── BLACKLISTED IPs (A9 — admin-managed) ───────────────────
CREATE TABLE blacklisted_ips (
    id          BIGSERIAL    PRIMARY KEY,
    ip_address  VARCHAR(45)  UNIQUE NOT NULL,
    reason      VARCHAR(255),
    added_by    BIGINT       REFERENCES users(id) ON DELETE SET NULL,
    added_at    TIMESTAMP    NOT NULL DEFAULT now(),
    enabled     BOOLEAN      NOT NULL DEFAULT TRUE
);
-- Fast lookup for SuspiciousConnectionStrategy
CREATE INDEX idx_blacklisted_ip_active ON blacklisted_ips(ip_address) WHERE enabled = TRUE;

-- ─── ALERTS ─────────────────────────────────────────────────
CREATE TABLE alerts (
    id                  BIGSERIAL   PRIMARY KEY,
    rule_id             BIGINT      REFERENCES alert_rules(id),
    capture_session_id  BIGINT      REFERENCES capture_sessions(id),
    alert_type          VARCHAR(40) NOT NULL,
    source_ip           VARCHAR(45),
    destination_ip      VARCHAR(45),
    severity            VARCHAR(10) NOT NULL,
    description         TEXT,
    status              VARCHAR(20) NOT NULL DEFAULT 'NEW',  -- NEW / ACKNOWLEDGED / RESOLVED
    detected_at         TIMESTAMP   NOT NULL DEFAULT now(),
    resolved_at         TIMESTAMP
);
CREATE INDEX idx_alerts_status      ON alerts(status);
CREATE INDEX idx_alerts_time        ON alerts(detected_at);
CREATE INDEX idx_alerts_session     ON alerts(capture_session_id);
CREATE INDEX idx_alerts_severity    ON alerts(severity);
