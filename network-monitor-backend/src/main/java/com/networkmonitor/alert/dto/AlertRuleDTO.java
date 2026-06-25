package com.networkmonitor.alert.dto;

import lombok.Data;

@Data
public class AlertRuleDTO {
    private Long id;
    private String ruleType;
    private Double thresholdValue;
    private Integer timeWindowSeconds;
    private String severity;
    private Boolean enabled;
    private String description;
}
