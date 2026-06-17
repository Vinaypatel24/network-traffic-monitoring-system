package com.networkmonitor.capture.parser;

import com.networkmonitor.capture.dto.PacketDTO;
import org.pcap4j.packet.Packet;

/**
 * Interface for parsing specific protocols from a raw Pcap4J packet.
 */
public interface ProtocolParser {
    
    /**
     * Parses the packet and populates the relevant fields in the PacketDTO.
     * 
     * @param rawPacket The original Pcap4J packet
     * @param dto       The DTO to populate
     * @return true if the parser successfully processed the packet, false otherwise
     */
    boolean parse(Packet rawPacket, PacketDTO dto);
}
