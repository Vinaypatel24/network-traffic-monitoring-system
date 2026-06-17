package com.networkmonitor.capture.repository;

import com.networkmonitor.capture.entity.NetworkInterface;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface NetworkInterfaceRepository extends JpaRepository<NetworkInterface, Long> {

    Optional<NetworkInterface> findByName(String name);
}
