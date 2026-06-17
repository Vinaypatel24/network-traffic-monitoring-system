package com.networkmonitor.capture.repository;

import com.networkmonitor.capture.entity.Packet;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface PacketRepository extends JpaRepository<Packet, Long>, JpaSpecificationExecutor<Packet> {
    
    Page<Packet> findByCaptureSessionId(Long captureSessionId, Pageable pageable);
}
