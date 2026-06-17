package com.networkmonitor.capture.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "packets")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Packet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "capture_session_id", nullable = false)
    private Long captureSessionId;

    @Column(name = "src_ip", nullable = false, length = 45)
    private String srcIp;

    @Column(name = "dst_ip", nullable = false, length = 45)
    private String dstIp;

    @Column(name = "src_port")
    private Integer srcPort;

    @Column(name = "dst_port")
    private Integer dstPort;

    @Column(nullable = false, length = 10)
    private String protocol;

    @Column(name = "packet_size", nullable = false)
    private Integer packetSize;

    @Column(name = "ttl")
    private Integer ttl;

    @Column(name = "tcp_flags", length = 20)
    private String tcpFlags;

    @Column(name = "captured_at", nullable = false)
    @Builder.Default
    private Instant capturedAt = Instant.now();
}
