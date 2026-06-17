package com.networkmonitor.capture.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PacketDTO {
    private Long id;
    private Long captureSessionId;
    private String srcIp;
    private String dstIp;
    private Integer srcPort;
    private Integer dstPort;
    private String protocol;
    private Integer packetSize;
    private Integer ttl;
    private String tcpFlags;
    private Instant capturedAt;
}
