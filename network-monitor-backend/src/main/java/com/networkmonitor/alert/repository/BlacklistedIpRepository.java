package com.networkmonitor.alert.repository;

import com.networkmonitor.alert.entity.BlacklistedIp;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface BlacklistedIpRepository extends JpaRepository<BlacklistedIp, Long> {
    Optional<BlacklistedIp> findByIpAddress(String ipAddress);
    boolean existsByIpAddressAndEnabledTrue(String ipAddress);
}
