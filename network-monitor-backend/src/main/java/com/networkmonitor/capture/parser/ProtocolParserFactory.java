package com.networkmonitor.capture.parser;

import com.networkmonitor.capture.dto.PacketDTO;
import lombok.RequiredArgsConstructor;
import org.pcap4j.packet.IpV4Packet;
import org.pcap4j.packet.IpV6Packet;
import org.pcap4j.packet.Packet;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;

/**
 * Factory that processes raw Pcap4J packets into PacketDTOs.
 */
@Component
@RequiredArgsConstructor
public class ProtocolParserFactory {

    private final DnsParser  dnsParser;
    private final TcpParser  tcpParser;
    private final UdpParser  udpParser;
    private final IcmpParser icmpParser;

    public PacketDTO parse(Long captureSessionId, Packet rawPacket) {
        PacketDTO dto = PacketDTO.builder()
                .captureSessionId(captureSessionId)
                .packetSize(rawPacket.length())
                .capturedAt(Instant.now())
                .build();

        // 1. Extract IP info
        if (rawPacket.contains(IpV4Packet.class)) {
            IpV4Packet.IpV4Header ipHeader = rawPacket.get(IpV4Packet.class).getHeader();
            dto.setSrcIp(ipHeader.getSrcAddr().getHostAddress());
            dto.setDstIp(ipHeader.getDstAddr().getHostAddress());
            dto.setTtl((int) ipHeader.getTtlAsInt());
        } else if (rawPacket.contains(IpV6Packet.class)) {
            IpV6Packet.IpV6Header ipHeader = rawPacket.get(IpV6Packet.class).getHeader();
            dto.setSrcIp(ipHeader.getSrcAddr().getHostAddress());
            dto.setDstIp(ipHeader.getDstAddr().getHostAddress());
            dto.setTtl((int) ipHeader.getHopLimitAsInt());
        } else {
            // Not IP packet (e.g. ARP), skip or handle
            dto.setSrcIp("UNKNOWN");
            dto.setDstIp("UNKNOWN");
            dto.setProtocol("OTHER");
            return dto;
        }

        // 2. Determine inner protocol in priority order
        if (dnsParser.parse(rawPacket, dto)) return dto;
        if (tcpParser.parse(rawPacket, dto)) return dto;
        if (udpParser.parse(rawPacket, dto)) return dto;
        if (icmpParser.parse(rawPacket, dto)) return dto;

        // Fallback
        dto.setProtocol("OTHER");
        return dto;
    }
}
