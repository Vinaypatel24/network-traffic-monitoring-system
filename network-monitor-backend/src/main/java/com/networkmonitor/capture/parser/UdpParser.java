package com.networkmonitor.capture.parser;

import com.networkmonitor.capture.dto.PacketDTO;
import org.pcap4j.packet.Packet;
import org.pcap4j.packet.UdpPacket;
import org.springframework.stereotype.Component;

@Component
public class UdpParser implements ProtocolParser {

    @Override
    public boolean parse(Packet rawPacket, PacketDTO dto) {
        if (rawPacket.contains(UdpPacket.class)) {
            UdpPacket udpPacket = rawPacket.get(UdpPacket.class);
            UdpPacket.UdpHeader header = udpPacket.getHeader();
            
            dto.setProtocol("UDP");
            dto.setSrcPort(header.getSrcPort().valueAsInt());
            dto.setDstPort(header.getDstPort().valueAsInt());
            
            return true;
        }
        return false;
    }
}
