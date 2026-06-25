package com.networkmonitor.alert.dto;

import lombok.Data;

import java.time.Instant;

@Data
public class BlacklistedIpDTO {
    private Long id;
    private String ipAddress;
    private String reason;
    private Long addedByUserId;
    private Instant addedAt;
    private Boolean enabled;
}
