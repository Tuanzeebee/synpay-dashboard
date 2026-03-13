package com.companyx.synpay_dashboard.dto.response;

import java.util.List;

/**
 * Paginated response wrapper for notification listings.
 */
public class NotificationPageResponse {

    private List<NotificationResponse> content;
    private int page;
    private int size;
    private long totalElements;
    private int totalPages;
    private long unreadCount;

    public NotificationPageResponse() {}

    public NotificationPageResponse(List<NotificationResponse> content,
                                     int page, int size,
                                     long totalElements, int totalPages,
                                     long unreadCount) {
        this.content = content;
        this.page = page;
        this.size = size;
        this.totalElements = totalElements;
        this.totalPages = totalPages;
        this.unreadCount = unreadCount;
    }

    // Getters and Setters
    public List<NotificationResponse> getContent() { return content; }
    public void setContent(List<NotificationResponse> content) { this.content = content; }

    public int getPage() { return page; }
    public void setPage(int page) { this.page = page; }

    public int getSize() { return size; }
    public void setSize(int size) { this.size = size; }

    public long getTotalElements() { return totalElements; }
    public void setTotalElements(long totalElements) { this.totalElements = totalElements; }

    public int getTotalPages() { return totalPages; }
    public void setTotalPages(int totalPages) { this.totalPages = totalPages; }

    public long getUnreadCount() { return unreadCount; }
    public void setUnreadCount(long unreadCount) { this.unreadCount = unreadCount; }
}
