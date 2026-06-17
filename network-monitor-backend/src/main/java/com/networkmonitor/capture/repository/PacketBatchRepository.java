package com.networkmonitor.capture.repository;

import com.networkmonitor.capture.dto.PacketDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.util.List;

@Slf4j
@Repository
@RequiredArgsConstructor
public class PacketBatchRepository {

    private final JdbcTemplate jdbcTemplate;

    /**
     * High-throughput JDBC batch insert.
     * Dramatically faster than JPA saveAll().
     */
    public void batchInsert(List<PacketDTO> packets) {
        if (packets == null || packets.isEmpty()) {
            return;
        }

        String sql = """
            INSERT INTO packets (
                capture_session_id, src_ip, dst_ip, src_port, dst_port, 
                protocol, packet_size, ttl, tcp_flags, captured_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """;

        jdbcTemplate.batchUpdate(sql, packets, packets.size(), (ps, packet) -> {
            ps.setLong(1, packet.getCaptureSessionId());
            ps.setString(2, packet.getSrcIp());
            ps.setString(3, packet.getDstIp());
            
            if (packet.getSrcPort() != null) ps.setInt(4, packet.getSrcPort()); else ps.setNull(4, java.sql.Types.INTEGER);
            if (packet.getDstPort() != null) ps.setInt(5, packet.getDstPort()); else ps.setNull(5, java.sql.Types.INTEGER);
            
            ps.setString(6, packet.getProtocol());
            ps.setInt(7, packet.getPacketSize());
            
            if (packet.getTtl() != null) ps.setInt(8, packet.getTtl()); else ps.setNull(8, java.sql.Types.INTEGER);
            if (packet.getTcpFlags() != null) ps.setString(9, packet.getTcpFlags()); else ps.setNull(9, java.sql.Types.VARCHAR);
            
            ps.setTimestamp(10, Timestamp.from(packet.getCapturedAt()));
        });
    }
}
