package com.companyx.synpay_dashboard.dto.response;

import java.util.List;

/**
 * Paginated response wrapper for employee list endpoints.
 */
public class EmployeePageResponse {

    private List<EmployeeResponse> content;
    private int page;
    private int size;
    private long totalElements;
    private int totalPages;

    public EmployeePageResponse() {}

    public EmployeePageResponse(List<EmployeeResponse> content, int page, int size,
                                long totalElements, int totalPages) {
        this.content = content;
        this.page = page;
        this.size = size;
        this.totalElements = totalElements;
        this.totalPages = totalPages;
    }

    // ----- Getters & Setters -----

    public List<EmployeeResponse> getContent() { return content; }
    public void setContent(List<EmployeeResponse> content) { this.content = content; }

    public int getPage() { return page; }
    public void setPage(int page) { this.page = page; }

    public int getSize() { return size; }
    public void setSize(int size) { this.size = size; }

    public long getTotalElements() { return totalElements; }
    public void setTotalElements(long totalElements) { this.totalElements = totalElements; }

    public int getTotalPages() { return totalPages; }
    public void setTotalPages(int totalPages) { this.totalPages = totalPages; }
}
