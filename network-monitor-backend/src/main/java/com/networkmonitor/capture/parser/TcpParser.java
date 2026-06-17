package com.networkmonitor.capture.parser;

import com.networkmonitor.capture.dto.PacketDTO;
import org.pcap4j.packet.Packet;
import org.pcap4j.packet.TcpPacket;
import org.springframework.stereotype.Component;

@Component
public class TcpParser implements ProtocolParser {

    @Override
    public boolean parse(Packet rawPacket, PacketDTO dto) {
        if (rawPacket.contains(TcpPacket.class)) {
            TcpPacket tcpPacket = rawPacket.get(TcpPacket.class);
            TcpPacket.TcpHeader header = tcpPacket.getHeader();
            
            dto.setProtocol("TCP");
            dto.setSrcPort(header.getSrcPort().valueAsInt());
            dto.setDstPort(header.getDstPort().valueAsInt());
            
            // Extract TCP flags
            StringBuilder flags = new StringBuilder();
            if (header.getSyn()) flags.append("SYN ");
            if (header.getAck()) flags.append("ACK ");
            if (header.getFin()) flags.append("FIN ");
            if (header.getRst()) flags.append("RST ");
            if (header.getPsh()) flags.append("PSH ");
            if (header.getUrg()) flags.append("URG ");
            
            dto.setTcpFlags(flags.toString().trim());
            return true;
        }
        return false;
    }
}
