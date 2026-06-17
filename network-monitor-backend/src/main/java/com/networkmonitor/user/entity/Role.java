package com.networkmonitor.user.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * Application role — seeds: ROLE_ADMIN, ROLE_USER.
 */
@Entity
@Table(name = "roles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Role {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 30)
    private String name;
}
