'use client'

import { useState, useMemo, useCallback } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import StatisticsCards from './components/StatisticsCards'
import FiltersBar from './components/FiltersBar'
import AlertsList from './components/AlertsList'
import AlertDetailModal from './components/AlertDetailModal'
import NotificationSettings from './components/NotificationSettings'
import { Alert, FilterOptions, NotificationSettings as SettingsType } from './types'
import { getMockNotificationsData } from './data'
import { Language, t } from '@/lib/translations'
import { useLanguage } from '@/components/providers/LanguageProvider'

export default function NotificationsManagement() {
  const { language, toggleLanguage, t: translate } = useLanguage()
  
  const [data] = useState(() => getMockNotificationsData())
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
  const [settings, setSettings] = useState<SettingsType>(data.settings)
  const [alerts, setAlerts] = useState<Alert[]>(data.alerts)

  // Optimized filter alerts - early returns for better performance
  const filteredAlerts = useMemo(() => {
    if (filters.severity === 'all' && filters.type === 'all' && 
        filters.status === 'all' && filters.time === 'all') {
      return alerts // No filtering needed
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

  const handleRefresh = useCallback(() => {
    // In real app, would fetch new data from API
    console.log('Refreshing alerts...')
  }, [])

  const handleToggleBulkActions = useCallback(() => {
    setShowBulkActions(prev => {
      if (prev) {
        setSelectedAlerts(new Set())
        setSelectAllChecked(false)
      }
      return !prev
    })
  }, [])

  const handleSelectAll = useCallback((checked: boolean) => {
    setSelectAllChecked(checked)
    if (checked) {
      setSelectedAlerts(new Set(filteredAlerts.map((a) => a.id)))
    } else {
      setSelectedAlerts(new Set())
    }
  }, [filteredAlerts])

  const handleAlertSelect = useCallback((alertId: string, selected: boolean) => {
    setSelectedAlerts(prev => {
      const newSelected = new Set(prev)
      if (selected) {
        newSelected.add(alertId)
      } else {
        newSelected.delete(alertId)
      }
      setSelectAllChecked(newSelected.size === filteredAlerts.length)
      return newSelected
    })
  }, [filteredAlerts.length])

  const handleBulkMarkAsRead = useCallback(() => {
    setAlerts((prev) =>
      prev.map((alert) => (selectedAlerts.has(alert.id) ? { ...alert, status: 'read' as const } : alert))
    )
    setSelectedAlerts(new Set())
    setSelectAllChecked(false)
  }, [selectedAlerts])

  const handleBulkAcknowledge = useCallback(() => {
    setAlerts((prev) =>
      prev.map((alert) =>
        selectedAlerts.has(alert.id) ? { ...alert, status: 'acknowledged' as const } : alert
      )
    )
    setSelectedAlerts(new Set())
    setSelectAllChecked(false)
  }, [selectedAlerts])

  const handleBulkDelete = useCallback(() => {
    if (confirm(t('actions.delete', language) + '?')) {
      setAlerts((prev) => prev.filter((alert) => !selectedAlerts.has(alert.id)))
      setSelectedAlerts(new Set())
      setSelectAllChecked(false)
    }
  }, [selectedAlerts, language])

  const handleAlertClick = useCallback((alert: Alert) => {
    setSelectedAlert(alert)
    setIsModalOpen(true)
    
    // Mark as read when clicked
    if (alert.status === 'unread') {
      setAlerts((prev) =>
        prev.map((a) => (a.id === alert.id ? { ...a, status: 'read' as const } : a))
      )
    }
  }, [])

  const handleAcknowledge = useCallback((alertId: string) => {
    setAlerts((prev) =>
      prev.map((alert) => (alert.id === alertId ? { ...alert, status: 'acknowledged' as const } : alert))
    )
  }, [])

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
          <StatisticsCards statistics={data.statistics} language={language} />

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
