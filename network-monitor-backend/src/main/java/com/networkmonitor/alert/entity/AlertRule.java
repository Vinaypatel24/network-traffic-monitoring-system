package com.networkmonitor.alert.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "alert_rules")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AlertRule {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "rule_type", nullable = false, length = 40)
    private String ruleType;

    @Column(name = "threshold_value", nullable = false)
    private Double thresholdValue;

    @Column(name = "time_window_seconds", nullable = false)
    private Integer timeWindowSeconds;

    @Column(nullable = false, length = 10)
    private String severity;

    @Column(nullable = false)
    @Builder.Default
    private Boolean enabled = true;

    @Column(length = 255)
    private String description;
}
