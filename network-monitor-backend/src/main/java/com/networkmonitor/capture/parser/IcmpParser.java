package com.networkmonitor.capture.parser;

import com.networkmonitor.capture.dto.PacketDTO;
import org.pcap4j.packet.IcmpV4CommonPacket;
import org.pcap4j.packet.IcmpV6CommonPacket;
import org.pcap4j.packet.Packet;
import org.springframework.stereotype.Component;

@Component
public class IcmpParser implements ProtocolParser {

    @Override
    public boolean parse(Packet rawPacket, PacketDTO dto) {
        if (rawPacket.contains(IcmpV4CommonPacket.class)) {
            dto.setProtocol("ICMP");
            return true;
        } else if (rawPacket.contains(IcmpV6CommonPacket.class)) {
            dto.setProtocol("ICMPv6");
            return true;
        }
        return false;
    }
}
