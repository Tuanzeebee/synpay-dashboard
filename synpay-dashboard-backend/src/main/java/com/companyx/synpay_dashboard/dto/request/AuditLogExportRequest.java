package com.companyx.synpay_dashboard.dto.request;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Request body for {@code POST /internal/audit-logs/export}.
 * All filter fields are optional — omit a field to skip that filter.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AuditLogExportRequest {

    /** Filter by actor email (partial match). */
    private String actorEmail;

    /** Filter by action verb — e.g. LOGIN_SUCCESS, USER_CREATE. */
    private String action;

    /** Filter by target resource type — e.g. "user", "role". */
    private String resource;

    /** ISO-8601 date-time string for the start of the range. */
    private String dateFrom;

    /** ISO-8601 date-time string for the end of the range. */
    private String dateTo;

    /** Export format: "csv" (default) or "json". */
    private String format;

    // ----- Getters & Setters -----

    public String getActorEmail() { return actorEmail; }
    public void setActorEmail(String actorEmail) { this.actorEmail = actorEmail; }

    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }

    public String getResource() { return resource; }
    public void setResource(String resource) { this.resource = resource; }

    public String getDateFrom() { return dateFrom; }
    public void setDateFrom(String dateFrom) { this.dateFrom = dateFrom; }

    public String getDateTo() { return dateTo; }
    public void setDateTo(String dateTo) { this.dateTo = dateTo; }

    public String getFormat() { return format; }
    public void setFormat(String format) { this.format = format; }
}
