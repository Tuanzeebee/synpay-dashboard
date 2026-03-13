'use client'

import { memo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Bell, Check, Trash2 } from 'lucide-react'
import { useNotificationBell, useNotifications } from '@/hooks'
import { useState, useEffect } from 'react'

interface NotificationBellProps {
  t?: (key: string) => string
}

/**
 * Notification Bell Component
 * Shows unread notification count and displays recent notifications in a dropdown.
 */
function NotificationBell({ t = (k) => k }: NotificationBellProps) {
  const router = useRouter()
  const { unreadCount, refresh: refreshBell } = useNotificationBell(30000) // Poll every 30 seconds
  const { notifications, markAsRead } = useNotifications()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleNotificationClick = useCallback(
    async (notificationId: number) => {
      try {
        await markAsRead(notificationId)
        // Navigate to notifications page
        router.push('/notifications')
      } catch (err) {
        console.error('Error handling notification:', err)
      }
    },
    [markAsRead, router]
  )

  const handleMarkAllAsRead = useCallback(async () => {
    try {
      const promises = notifications
        .filter((n) => !n.is_read)
        .map((n) => markAsRead(n.notification_id))
      await Promise.all(promises)
      await refreshBell()
    } catch (err) {
      console.error('Error marking all as read:', err)
    }
  }, [notifications, markAsRead, refreshBell])

  if (!mounted) return null

  // Show recent unread notifications (max 5)
  const recentNotifications = notifications.filter((n) => !n.is_read).slice(0, 5)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>
            {unreadCount > 0 ? `${unreadCount} ${t('notifications.unread') || 'Unread'}` : t('notifications.all_read') || 'All caught up'}
          </span>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              {t('actions.mark_all_read') || 'Mark all as read'}
            </button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {recentNotifications.length > 0 ? (
          <div className="max-h-96 overflow-y-auto">
            {recentNotifications.map((notification) => (
              <div
                key={notification.notification_id}
                className="px-2 py-2.5 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer transition-colors border-b border-slate-100 dark:border-slate-700 last:border-b-0"
                onClick={() => handleNotificationClick(notification.notification_id)}
              >
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {notification.title}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 truncate line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                      {new Date(notification.created_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-1" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-2 py-8 text-center">
            <Bell className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {t('notifications.no_new') || 'No new notifications'}
            </p>
          </div>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => router.push('/notifications')}
          className="text-center justify-center cursor-pointer"
        >
          {t('notifications.view_all') || 'View all notifications'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default memo(NotificationBell)
