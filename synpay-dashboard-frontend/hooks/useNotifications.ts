'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import {
  fetchNotifications,
  markNotificationAsRead,
  fetchAdminNotifications,
  fetchEmailQueue,
  retryFailedEmail,
  type NotificationPage,
  type NotificationItem,
  type EmailQueuePage,
  type EmailQueueItem,
  type NotificationListParams,
  type EmailQueueListParams,
} from '@/api/notifications'

// ── Notification Hook Types ────────────────────────────────────

export interface UseNotificationsState {
  notifications: NotificationItem[]
  unreadCount: number
  totalElements: number
  totalPages: number
  currentPage: number
  pageSize: number
  isLoading: boolean
  error: string | null
}

export interface UseNotificationsReturn extends UseNotificationsState {
  refresh: () => Promise<void>
  loadNotifications: (params?: NotificationListParams) => Promise<void>
  markAsRead: (notificationId: number) => Promise<void>
  getUnreadCount: () => number
}

export interface UseAdminNotificationsReturn extends UseNotificationsState {
  refresh: () => Promise<void>
  loadAdminNotifications: (params?: { page?: number; size?: number }) => Promise<void>
}

interface UseEmailQueueState {
  emails: EmailQueueItem[]
  totalElements: number
  totalPages: number
  currentPage: number
  pageSize: number
  isLoading: boolean
  error: string | null
}

export interface UseEmailQueueReturn extends UseEmailQueueState {
  loadQueue: (params: EmailQueueListParams) => Promise<void>
  retryEmail: (emailId: number) => Promise<void>
  refresh: (status: 'PENDING' | 'SENT' | 'FAILED') => Promise<void>
}

// ── Desktop Notifications Hook ──────────────────────────────────

/**
 * Custom hook for managing user notifications.
 * Handles fetching, pagination, and marking as read.
 */
export function useNotifications(): UseNotificationsReturn {
  const [state, setState] = useState<UseNotificationsState>({
    notifications: [],
    unreadCount: 0,
    totalElements: 0,
    totalPages: 0,
    currentPage: 0,
    pageSize: 20,
    isLoading: false,
    error: null,
  })

  const abortControllerRef = useRef<AbortController | null>(null)

  const loadNotifications = useCallback(
    async (params?: NotificationListParams) => {
      // Cancel previous request if still pending
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      abortControllerRef.current = new AbortController()

      setState((prev) => ({ ...prev, isLoading: true, error: null }))

      try {
        const response = await fetchNotifications({
          page: params?.page ?? 0,
          size: params?.size ?? 20,
          is_read: params?.is_read,
        })

        setState({
          notifications: response.content,
          unreadCount: response.unreadCount,
          totalElements: response.totalElements,
          totalPages: response.totalPages,
          currentPage: response.page,
          pageSize: response.size,
          isLoading: false,
          error: null,
        })
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to load notifications'
        setState((prev) => ({ ...prev, isLoading: false, error: errorMsg }))
      }
    },
    []
  )

  const markAsRead = useCallback(async (notificationId: number) => {
    try {
      await markNotificationAsRead(notificationId)

      // Update local state
      setState((prev) => ({
        ...prev,
        notifications: prev.notifications.map((n) =>
          n.notification_id === notificationId ? { ...n, is_read: true } : n
        ),
        unreadCount: Math.max(0, prev.unreadCount - 1),
      }))
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to mark notification as read'
      setState((prev) => ({ ...prev, error: errorMsg }))
    }
  }, [])

  const refresh = useCallback(async () => {
    await loadNotifications({ page: state.currentPage, size: state.pageSize })
  }, [loadNotifications, state.currentPage, state.pageSize])

  const getUnreadCount = useCallback(() => state.unreadCount, [state.unreadCount])

  // Load initial notifications on mount
  useEffect(() => {
    loadNotifications({ page: 0, size: 20 })
  }, [])

  return {
    ...state,
    refresh,
    loadNotifications,
    markAsRead,
    getUnreadCount,
  }
}

// ── Admin Notifications Hook ────────────────────────────────────

/**
 * Custom hook for admin view of all notifications.
 * Requires notification.admin permission.
 */
export function useAdminNotifications(): UseAdminNotificationsReturn {
  const [state, setState] = useState<UseNotificationsState>({
    notifications: [],
    unreadCount: 0,
    totalElements: 0,
    totalPages: 0,
    currentPage: 0,
    pageSize: 20,
    isLoading: false,
    error: null,
  })

  const loadAdminNotifications = useCallback(
    async (params?: { page?: number; size?: number }) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }))

      try {
        const response = await fetchAdminNotifications({
          page: params?.page ?? 0,
          size: params?.size ?? 20,
        })

        setState({
          notifications: response.content,
          unreadCount: response.unreadCount,
          totalElements: response.totalElements,
          totalPages: response.totalPages,
          currentPage: response.page,
          pageSize: response.size,
          isLoading: false,
          error: null,
        })
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to load admin view'
        setState((prev) => ({ ...prev, isLoading: false, error: errorMsg }))
      }
    },
    []
  )

  const refresh = useCallback(async () => {
    await loadAdminNotifications({ page: state.currentPage, size: state.pageSize })
  }, [loadAdminNotifications, state.currentPage, state.pageSize])

  useEffect(() => {
    loadAdminNotifications({ page: 0, size: 20 })
  }, [])

  return {
    ...state,
    refresh,
    loadAdminNotifications,
  }
}

// ── Email Queue Hook ───────────────────────────────────────────

/**
 * Custom hook for managing email queue (admin only).
 * Handles fetching emails by status and retrying failed emails.
 */
export function useEmailQueue(): UseEmailQueueReturn {
  const [state, setState] = useState<UseEmailQueueState>({
    emails: [],
    totalElements: 0,
    totalPages: 0,
    currentPage: 0,
    pageSize: 20,
    isLoading: false,
    error: null,
  })

  const currentStatusRef = useRef<'PENDING' | 'SENT' | 'FAILED'>('PENDING')

  const loadQueue = useCallback(
    async (params: EmailQueueListParams) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }))
      currentStatusRef.current = params.status

      try {
        const response = await fetchEmailQueue({
          status: params.status,
          page: params.page ?? 0,
          size: params.size ?? 20,
        })

        setState({
          emails: response.content,
          totalElements: response.totalElements,
          totalPages: response.totalPages,
          currentPage: response.page,
          pageSize: response.size,
          isLoading: false,
          error: null,
        })
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to load email queue'
        setState((prev) => ({ ...prev, isLoading: false, error: errorMsg }))
      }
    },
    []
  )

  const retryEmail = useCallback(async (emailId: number) => {
    try {
      await retryFailedEmail(emailId)

      // Update local state - remove from FAILED list
      setState((prev) => ({
        ...prev,
        emails: prev.emails.filter((e) => e.email_id !== emailId),
      }))
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to retry email'
      setState((prev) => ({ ...prev, error: errorMsg }))
    }
  }, [])

  const refresh = useCallback(async (status: 'PENDING' | 'SENT' | 'FAILED') => {
    await loadQueue({ status, page: state.currentPage, size: state.pageSize })
  }, [loadQueue, state.currentPage, state.pageSize])

  return {
    ...state,
    loadQueue,
    retryEmail,
    refresh,
  }
}

// ── Notification Bell Hook (for header) ────────────────────────

/**
 * Lightweight hook for notification bell in header.
 * Polls for unread count periodically.
 */
export function useNotificationBell(pollIntervalsMs: number = 30000) {
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const updateUnreadCount = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetchNotifications({ is_read: false, size: 1 })
      setUnreadCount(response.unreadCount)
      setError(null)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch unread count'
      setError(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    // Initial load
    updateUnreadCount()

    // Poll for updates
    intervalRef.current = setInterval(() => {
      updateUnreadCount()
    }, pollIntervalsMs)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [updateUnreadCount, pollIntervalsMs])

  return { unreadCount, isLoading, error, refresh: updateUnreadCount }
}
