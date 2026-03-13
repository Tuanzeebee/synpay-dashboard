package com.companyx.synpay_dashboard.dto.request;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Request to trigger a notification event.
 * 
 * Internal-only endpoint consumed by other services.
 * Triggered by business events (Payroll, Attendance, Security, User Management).
 */
public class NotificationEventRequest {

    private String triggerEvent;
    private java.util.Map<String, Object> contextData;

    @JsonCreator
    public NotificationEventRequest(
            @JsonProperty("trigger_event") String triggerEvent,
            @JsonProperty("context_data") java.util.Map<String, Object> contextData) {
        this.triggerEvent = triggerEvent;
        this.contextData = contextData;
    }

    public NotificationEventRequest() {
    }

    public String getTriggerEvent() {
        return triggerEvent;
    }

    public void setTriggerEvent(String triggerEvent) {
        this.triggerEvent = triggerEvent;
    }

    public java.util.Map<String, Object> getContextData() {
        return contextData;
    }

    public void setContextData(java.util.Map<String, Object> contextData) {
        this.contextData = contextData;
    }
}
