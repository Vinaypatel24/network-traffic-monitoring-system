package com.networkmonitor.capture.event;

import com.networkmonitor.capture.dto.PacketDTO;
import lombok.Getter;
import org.springframework.context.ApplicationEvent;

import java.util.List;

@Getter
public class PacketBatchCapturedEvent extends ApplicationEvent {
    private final List<PacketDTO> packets;

    public PacketBatchCapturedEvent(Object source, List<PacketDTO> packets) {
        super(source);
        this.packets = packets;
    }
}
