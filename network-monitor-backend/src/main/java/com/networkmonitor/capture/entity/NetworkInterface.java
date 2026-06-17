package com.networkmonitor.capture.entity;

import com.networkmonitor.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "network_interfaces")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NetworkInterface {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 255)
    private String description;

    @Column(name = "is_loopback", nullable = false)
    @Builder.Default
    private boolean loopback = false;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean active = false;
}
