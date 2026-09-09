package com.networkmonitor.alert.dto;

import com.networkmonitor.alert.enums.AlertStatus;
import com.networkmonitor.alert.enums.AlertSeverity;
import lombok.Data;

import java.time.Instant;

@Data
public class AlertDTO {
    private Long id;
    private Long ruleId;
    private Long captureSessionId;
    private String alertType;
    private String sourceIp;
    private String destinationIp;
    private AlertSeverity severity;
    private String description;
    private AlertStatus status;
    private Instant detectedAt;
    private Instant resolvedAt;

    // Forensic Diagnosis & Heuristics
    private String forensicDetails;
    private Integer confidenceScore;
    private String verdict;
}
