package com.networkmonitor.websocket.event;

import com.networkmonitor.alert.entity.Alert;
import org.springframework.context.ApplicationEvent;

public class ThreatDetectedEvent extends ApplicationEvent {
    private final Alert alert;

    public ThreatDetectedEvent(Object source, Alert alert) {
        super(source);
        this.alert = alert;
    }

    public Alert getAlert() {
        return alert;
    }
}
