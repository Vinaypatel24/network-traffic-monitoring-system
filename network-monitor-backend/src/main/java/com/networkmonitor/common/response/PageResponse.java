package com.networkmonitor.common.response;

import lombok.Getter;

import java.time.Instant;
import java.util.List;

/**
 * Paginated API response wrapper.
 */
@Getter
public class PageResponse<T> {

    private final boolean  success;
    private final String   message;
    private final List<T>  data;
    private final int      page;
    private final int      size;
    private final long     totalElements;
    private final int      totalPages;
    private final Instant  timestamp;

    public PageResponse(List<T> data, int page, int size, long totalElements) {
        this.success       = true;
        this.message       = "OK";
        this.data          = data;
        this.page          = page;
        this.size          = size;
        this.totalElements = totalElements;
        this.totalPages    = size == 0 ? 0 : (int) Math.ceil((double) totalElements / size);
        this.timestamp     = Instant.now();
    }
}
