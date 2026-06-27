-- V8: Create audit_logs table for AOP-based audit trail
CREATE TABLE IF NOT EXISTS audit_logs (
    id          UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    entity      VARCHAR(100) NOT NULL,
    entity_id   VARCHAR(255) NOT NULL,
    action      VARCHAR(50)  NOT NULL,
    username    VARCHAR(255) NOT NULL,
    timestamp   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    details     TEXT
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity       ON audit_logs (entity);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_id    ON audit_logs (entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_username     ON audit_logs (username);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp    ON audit_logs (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action       ON audit_logs (action);
