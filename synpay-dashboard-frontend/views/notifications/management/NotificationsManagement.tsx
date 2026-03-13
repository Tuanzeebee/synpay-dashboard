'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import StatisticsCards from './components/StatisticsCards'
import FiltersBar from './components/FiltersBar'
import AlertsList from './components/AlertsList'
import AlertDetailModal from './components/AlertDetailModal'
import NotificationSettings from './components/NotificationSettings'
import { Alert, FilterOptions, NotificationSettings as SettingsType } from './types'
import { Language, t } from '@/lib/translations'
import { useLanguage } from '@/components/providers/LanguageProvider'
import { useNotifications } from '@/hooks'
import type { NotificationItem, NotificationPage } from '@/api/notifications'

// ── Helper: Convert API NotificationItem to UI Alert ──────────────

function mapNotificationToAlert(notification: NotificationItem): Alert {
  // Parse severity from template_code if available, otherwise default to 'medium'
  let severity: 'critical' | 'high' | 'medium' | 'low' = 'medium'
  if (notification.template_code?.toLowerCase().includes('critical')) severity = 'critical'
  else if (notification.template_code?.toLowerCase().includes('high')) severity = 'high'
  else if (notification.template_code?.toLowerCase().includes('low')) severity = 'low'

  // Determine type from template_code
  let type: 'anniversary' | 'leave' | 'salary' | 'attendance' | 'system' = 'system'
  const code = notification.template_code?.toLowerCase() || ''
  if (code.includes('leave')) type = 'leave'
  else if (code.includes('salary')) type = 'salary'
  else if (code.includes('attendance')) type = 'attendance'
  else if (code.includes('anniversary')) type = 'anniversary'

  return {
    id: String(notification.notification_id),
    title: notification.title,
    description: notification.message,
    severity,
    type,
    status: notification.is_read ? 'read' : 'unread',
    timestamp: new Date(notification.created_at),
    employeeId: notification.related_resource_id,
    metadata: {
      templateCode: notification.template_code,
      relatedResource: notification.related_resource || 'N/A',
    },
  }
}

export default function NotificationsManagement() {
  const { language, toggleLanguage, t: translate } = useLanguage()
  
  // Use the real API hook
  const { notifications, unreadCount, refresh, markAsRead, isLoading, error } = useNotifications()
  
  const [filters, setFilters] = useState<FilterOptions>({
    severity: 'all',
    type: 'all',
    status: 'all',
    time: 'all',
  })
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [selectedAlerts, setSelectedAlerts] = useState<Set<string>>(new Set())
  const [selectAllChecked, setSelectAllChecked] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [settings, setSettings] = useState<SettingsType>({
    email: true,
    push: true,
    inApp: true,
    criticalOnly: false,
  })

  // Convert API notifications to UI alerts
  const alerts = useMemo(() => notifications.map(mapNotificationToAlert), [notifications])

  // Calculate statistics from alerts
  const statistics = useMemo(() => {
    return {
      critical: alerts.filter((a) => a.severity === 'critical').length,
      high: alerts.filter((a) => a.severity === 'high').length,
      info: alerts.filter((a) => a.severity === 'low' || a.severity === 'medium').length,
      acknowledged: alerts.filter((a) => a.status === 'acknowledged').length,
    }
  }, [alerts])

  // Optimized filter alerts
  const filteredAlerts = useMemo(() => {
    if (
      filters.severity === 'all' &&
      filters.type === 'all' &&
      filters.status === 'all' &&
      filters.time === 'all'
    ) {
      return alerts
    }

    const now = filters.time !== 'all' ? new Date() : null
    let timeThreshold: Date | null = null

    if (filters.time === 'today') {
      timeThreshold = new Date()
      timeThreshold.setHours(0, 0, 0, 0)
    } else if (filters.time === 'week') {
      timeThreshold = new Date(now!.getTime() - 7 * 24 * 60 * 60 * 1000)
    } else if (filters.time === 'month') {
      timeThreshold = new Date(now!.getTime() - 30 * 24 * 60 * 60 * 1000)
    }

    return alerts.filter((alert) => {
      if (filters.severity !== 'all' && alert.severity !== filters.severity) return false
      if (filters.type !== 'all' && alert.type !== filters.type) return false
      if (filters.status !== 'all' && alert.status !== filters.status) return false
      if (timeThreshold && alert.timestamp < timeThreshold) return false
      return true
    })
  }, [alerts, filters])

  const handleRefresh = useCallback(async () => {
    await refresh()
  }, [refresh])

  const handleToggleBulkActions = useCallback(() => {
    setShowBulkActions((prev) => {
      if (prev) {
        setSelectedAlerts(new Set())
        setSelectAllChecked(false)
      }
      return !prev
    })
  }, [])

  const handleSelectAll = useCallback(
    (checked: boolean) => {
      setSelectAllChecked(checked)
      if (checked) {
        setSelectedAlerts(new Set(filteredAlerts.map((a) => a.id)))
      } else {
        setSelectedAlerts(new Set())
      }
    },
    [filteredAlerts]
  )

  const handleAlertSelect = useCallback(
    (alertId: string, selected: boolean) => {
      setSelectedAlerts((prev) => {
        const newSelected = new Set(prev)
        if (selected) {
          newSelected.add(alertId)
        } else {
          newSelected.delete(alertId)
        }
        setSelectAllChecked(newSelected.size === filteredAlerts.length)
        return newSelected
      })
    },
    [filteredAlerts.length]
  )

  const handleBulkMarkAsRead = useCallback(async () => {
    // Mark all selected alerts as read via API
    try {
      const promises = Array.from(selectedAlerts).map((alertId) =>
        markAsRead(parseInt(alertId, 10))
      )
      await Promise.all(promises)
      setSelectedAlerts(new Set())
      setSelectAllChecked(false)
      await refresh()
    } catch (err) {
      console.error('Error marking alerts as read:', err)
    }
  }, [selectedAlerts, markAsRead, refresh])

  const handleBulkAcknowledge = useCallback(() => {
    // In a real app, this would call an API endpoint to acknowledge alerts
    // For now, just clear the selection
    setSelectedAlerts(new Set())
    setSelectAllChecked(false)
  }, [])

  const handleBulkDelete = useCallback(() => {
    if (confirm(translate('actions.delete', language) + '?')) {
      // In a real app, this would call an API endpoint to delete alerts
      setSelectedAlerts(new Set())
      setSelectAllChecked(false)
    }
  }, [selectedAlerts, language, translate])

  const handleAlertClick = useCallback(
    async (alert: Alert) => {
      setSelectedAlert(alert)
      setIsModalOpen(true)

      // Mark as read when clicked
      if (alert.status === 'unread') {
        try {
          await markAsRead(parseInt(alert.id, 10))
          await refresh()
        } catch (err) {
          console.error('Error marking alert as read:', err)
        }
      }
    },
    [markAsRead, refresh]
  )

  const handleAcknowledge = useCallback(
    (alertId: string) => {
      // In a real app, this would call an API endpoint to acknowledge a specific alert
      console.log('Acknowledged alert:', alertId)
    },
    []
  )

  return (
    <div className="flex w-full min-h-screen">
      <Sidebar language={language} t={translate} activeRoute="/notifications" />

      <main className="flex-1 flex flex-col min-w-0">
        <Header
          language={language}
          onLanguageToggle={toggleLanguage}
          onRefresh={handleRefresh}
          t={translate}
        />

        {/* Title Section */}
        <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 md:px-8 py-6">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
            {language === 'vi' ? 'Thông Báo & Cảnh Báo' : 'Notifications & Alerts'}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {language === 'vi' ? 'Trung tâm quản lý thông báo và cảnh báo hệ thống' : 'Notification and alert management center'}
          </p>
          {error && (
            <p className="text-xs text-red-600 dark:text-red-400 mt-2">Error: {error}</p>
          )}
          {isLoading && (
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
              {language === 'vi' ? 'Đang tải...' : 'Loading...'}
            </p>
          )}
        </div>

        <FiltersBar
          filters={filters}
          onFiltersChange={setFilters}
          onRefresh={handleRefresh}
          onToggleBulkActions={handleToggleBulkActions}
          showBulkActions={showBulkActions}
          selectedCount={selectedAlerts.size}
          onBulkMarkAsRead={handleBulkMarkAsRead}
          onBulkAcknowledge={handleBulkAcknowledge}
          onBulkDelete={handleBulkDelete}
          onSelectAll={handleSelectAll}
          selectAllChecked={selectAllChecked}
          language={language}
        />

        <div className="flex-1 p-4 md:p-8 overflow-y-auto">
          <StatisticsCards statistics={statistics} language={language} />

          <AlertsList
            alerts={filteredAlerts}
            onAlertClick={handleAlertClick}
            onAlertSelect={handleAlertSelect}
            selectedAlerts={selectedAlerts}
            showCheckboxes={showBulkActions}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            language={language}
          />

          <NotificationSettings
            settings={settings}
            onSettingsChange={setSettings}
            language={language}
          />
        </div>
      </main>

      <AlertDetailModal
        alert={selectedAlert}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAcknowledge={handleAcknowledge}
        language={language}
      />
    </div>
  )
}
