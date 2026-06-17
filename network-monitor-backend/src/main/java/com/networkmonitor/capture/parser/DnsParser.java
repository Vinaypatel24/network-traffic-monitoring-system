package com.networkmonitor.capture.parser;

import com.networkmonitor.capture.dto.PacketDTO;
import org.pcap4j.packet.DnsPacket;
import org.pcap4j.packet.Packet;
import org.pcap4j.packet.UdpPacket;
import org.springframework.stereotype.Component;

@Component
public class DnsParser implements ProtocolParser {

    @Override
    public boolean parse(Packet rawPacket, PacketDTO dto) {
        if (rawPacket.contains(DnsPacket.class)) {
            dto.setProtocol("DNS");
            // If UDP packet, set the ports
            if (rawPacket.contains(UdpPacket.class)) {
                UdpPacket.UdpHeader header = rawPacket.get(UdpPacket.class).getHeader();
                dto.setSrcPort(header.getSrcPort().valueAsInt());
                dto.setDstPort(header.getDstPort().valueAsInt());
            }
            return true;
        }
        return false;
    }
}
