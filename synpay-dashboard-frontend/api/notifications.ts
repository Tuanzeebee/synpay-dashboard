/**
 * Notification & Email Queue API Client
 *
 * Calls the FastAPI gateway at /api/notifications, which forwards
 * all requests to the Spring Boot Integration Core.
 *
 * RBAC is enforced server-side — this layer only handles HTTP transport
 * and type-safe response mapping.
 */

import { authHeader } from '@/lib/auth'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

// ── API Envelope ─────────────────────────────────────────────────

export interface ApiEnvelope<T> {
  success: boolean
  message?: string
  data?: T
}

// ── Notification Response Types (mirror Spring Boot DTOs) ────────

/** Single notification item */
export interface NotificationItem {
  notification_id: number
  account_id: number
  template_code: string
  title: string
  message: string
  is_read: boolean
  related_resource?: string | null
  related_resource_id?: string | null
  created_at: string
}

/** Paginated notifications response */
export interface NotificationPage {
  content: NotificationItem[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  unreadCount: number
}

/** Single email queue entry */
export interface EmailQueueItem {
  email_id: number
  to_email: string
  subject: string
  status: 'PENDING' | 'SENT' | 'FAILED'
  retry_count: number
  last_error?: string | null
  created_at: string
  sent_at?: string | null
}

/** Paginated email queue response */
export interface EmailQueuePage {
  content: EmailQueueItem[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

// ── Query Filters ────────────────────────────────────────────────

export interface NotificationListParams {
  page?: number
  size?: number
  is_read?: boolean // undefined = all, true = read, false = unread
}

export interface EmailQueueListParams {
  status: 'PENDING' | 'SENT' | 'FAILED'
  page?: number
  size?: number
}

// ── Helpers ──────────────────────────────────────────────────────

async function get<T>(path: string, params?: Record<string, any>): Promise<T> {
  const url = new URL(`${API_BASE}${path}`)
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value))
      }
    })
  }

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.message ?? `Notification API error: ${res.status}`)
  }
  const envelope: ApiEnvelope<T> = await res.json()
  if (!envelope.success || !envelope.data) {
    throw new Error(envelope.message ?? 'Failed to fetch notification data')
  }
  return envelope.data
}

async function patch<T>(path: string): Promise<T> {
  const url = `${API_BASE}${path}`
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.message ?? `Notification API error: ${res.status}`)
  }
  const envelope: ApiEnvelope<T> = await res.json()
  if (!envelope.success || !envelope.data) {
    throw new Error(envelope.message ?? 'Failed to update notification')
  }
  return envelope.data
}

async function post<T>(path: string): Promise<T> {
  const url = `${API_BASE}${path}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.message ?? `Notification API error: ${res.status}`)
  }
  const envelope: ApiEnvelope<T> = await res.json()
  if (!envelope.success || !envelope.data) {
    throw new Error(envelope.message ?? 'Failed to perform action')
  }
  return envelope.data
}

// ── Notification API Functions ───────────────────────────────────

/**
 * Get paginated list of notifications for current user.
 * Optional filter by read status.
 * Requires: notification.read
 */
export function fetchNotifications(
  params?: NotificationListParams,
): Promise<NotificationPage> {
  const queryParams: Record<string, any> = {
    page: params?.page ?? 0,
    size: params?.size ?? 20,
  }
  if (params?.is_read !== undefined) {
    queryParams.is_read = params.is_read
  }
  return get<NotificationPage>('/api/notifications', queryParams)
}

/**
 * Mark a specific notification as read.
 * Current user must own the notification.
 * Requires: notification.mark_read
 */
export function markNotificationAsRead(
  notificationId: number,
): Promise<NotificationItem> {
  return patch<NotificationItem>(`/api/notifications/${notificationId}/read`)
}

/**
 * Get admin view of all notifications.
 * Requires: notification.admin
 */
export function fetchAdminNotifications(
  params?: { page?: number; size?: number },
): Promise<NotificationPage> {
  const queryParams: Record<string, any> = {
    page: params?.page ?? 0,
    size: params?.size ?? 20,
  }
  return get<NotificationPage>('/api/notifications/admin', queryParams)
}

// ── Email Queue API Functions ────────────────────────────────────

/**
 * Get paginated email queue entries filtered by status.
 * Requires: email_queue.view (admin only)
 */
export function fetchEmailQueue(
  params: EmailQueueListParams,
): Promise<EmailQueuePage> {
  const queryParams: Record<string, any> = {
    status: params.status,
    page: params.page ?? 0,
    size: params.size ?? 20,
  }
  return get<EmailQueuePage>('/api/email-queue', queryParams)
}

/**
 * Retry a failed email (move back to PENDING status).
 * Only applies to FAILED emails.
 * Requires: email_queue.view (admin only)
 */
export function retryFailedEmail(emailId: number): Promise<EmailQueueItem> {
  return post<EmailQueueItem>(`/api/email-queue/${emailId}/retry`)
}

// ── Notification Service Helper ──────────────────────────────────

/**
 * Get unread notification count.
 * Convenience helper that fetches all unread notifications.
 */
export async function getUnreadNotificationCount(): Promise<number> {
  const page = await fetchNotifications({ is_read: false, size: 1 })
  return page.unreadCount
}
