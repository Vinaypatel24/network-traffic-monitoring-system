package com.networkmonitor.statistics.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "traffic_statistics")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TrafficStatistics {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "capture_session_id", nullable = false)
    private Long captureSessionId;

    @Column(name = "window_start", nullable = false)
    private Instant windowStart;

    @Column(name = "window_end", nullable = false)
    private Instant windowEnd;

    @Column(length = 10)
    private String protocol;

    @Column(name = "packet_count", nullable = false)
    @Builder.Default
    private long packetCount = 0;

    @Column(name = "byte_count", nullable = false)
    @Builder.Default
    private long byteCount = 0;
}
