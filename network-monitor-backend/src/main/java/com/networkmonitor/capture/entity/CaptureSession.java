package com.networkmonitor.capture.entity;

import com.networkmonitor.capture.enums.CaptureStatus;
import com.networkmonitor.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "capture_sessions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CaptureSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "interface_id")
    private NetworkInterface networkInterface;

    @Column(name = "interface_name", length = 100)
    private String interfaceName;

    @Column(name = "start_time", nullable = false)
    @Builder.Default
    private Instant startTime = Instant.now();

    @Column(name = "end_time")
    private Instant endTime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private CaptureStatus status = CaptureStatus.RUNNING;

    @Column(name = "total_packets", nullable = false)
    @Builder.Default
    private long totalPackets = 0;

    @Column(name = "total_bytes", nullable = false)
    @Builder.Default
    private long totalBytes = 0;
}
