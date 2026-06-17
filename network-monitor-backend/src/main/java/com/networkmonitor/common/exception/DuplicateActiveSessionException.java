package com.networkmonitor.common.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.CONFLICT)
public class DuplicateActiveSessionException extends RuntimeException {

    public DuplicateActiveSessionException(Long userId) {
        super("User " + userId + " already has an active capture session. Stop it before starting a new one.");
    }
}
