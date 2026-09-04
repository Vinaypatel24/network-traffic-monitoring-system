package com.networkmonitor.capture.repository;

import com.networkmonitor.capture.entity.Packet;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface PacketRepository extends JpaRepository<Packet, Long>, JpaSpecificationExecutor<Packet> {
    
    Page<Packet> findByCaptureSessionId(Long captureSessionId, Pageable pageable);

    @Query("SELECT p FROM Packet p WHERE " +
           "(:protocol IS NULL OR :protocol = '' OR UPPER(p.protocol) = UPPER(:protocol)) AND " +
           "(:srcIp IS NULL OR :srcIp = '' OR p.srcIp LIKE CONCAT('%', :srcIp, '%'))")
    Page<Packet> findWithFilters(@Param("protocol") String protocol,
                                 @Param("srcIp") String srcIp,
                                 Pageable pageable);
}
