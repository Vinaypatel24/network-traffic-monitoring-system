package com.networkmonitor.threat.model;

import java.time.Instant;

/**
 * Immutable alert event produced by threat detection strategies
 * and forwarded to the engine for persistence + broadcasting.
 */
public record ThreatAlert(
        Long captureSessionId,
        String alertType,       // PORT_SCAN / TRAFFIC_SPIKE / ABNORMAL_REQUEST_RATE / SUSPICIOUS_CONNECTION
        String sourceIp,
        String destinationIp,
        String severity,        // LOW / MEDIUM / HIGH / CRITICAL
        String description,
        Instant detectedAt
) {
    public ThreatAlert {
        if (detectedAt == null) detectedAt = Instant.now();
    }
}
