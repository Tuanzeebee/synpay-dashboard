package com.companyx.synpay_dashboard.dto.response;

import java.util.List;

/**
 * Paginated response wrapper for audit log listings.
 */
public class AuditLogPageResponse {

    private List<AuditLogResponse> content;
    private int page;
    private int size;
    private long totalElements;
    private int totalPages;

    public AuditLogPageResponse() {}

    public AuditLogPageResponse(List<AuditLogResponse> content,
                                int page, int size,
                                long totalElements, int totalPages) {
        this.content = content;
        this.page = page;
        this.size = size;
        this.totalElements = totalElements;
        this.totalPages = totalPages;
    }

    // ----- Getters & Setters -----

    public List<AuditLogResponse> getContent() { return content; }
    public void setContent(List<AuditLogResponse> content) { this.content = content; }

    public int getPage() { return page; }
    public void setPage(int page) { this.page = page; }

    public int getSize() { return size; }
    public void setSize(int size) { this.size = size; }

    public long getTotalElements() { return totalElements; }
    public void setTotalElements(long totalElements) { this.totalElements = totalElements; }

    public int getTotalPages() { return totalPages; }
    public void setTotalPages(int totalPages) { this.totalPages = totalPages; }
}
