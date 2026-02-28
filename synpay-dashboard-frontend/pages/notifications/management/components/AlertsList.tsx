import { AlertCircle, DollarSign, Cake, Clock, AlertTriangle, Settings, List, Grid, Inbox } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert } from '../types'
import { Language, t } from '@/lib/translations'

type Props = {
  alerts: Alert[]
  onAlertClick: (alert: Alert) => void
  onAlertSelect: (alertId: string, selected: boolean) => void
  selectedAlerts: Set<string>
  showCheckboxes: boolean
  viewMode: 'list' | 'grid'
  onViewModeChange: (mode: 'list' | 'grid') => void
  language?: Language
}

export default function AlertsList({
  alerts,
  onAlertClick,
  onAlertSelect,
  selectedAlerts,
  showCheckboxes,
  viewMode,
  onViewModeChange,
  language = 'vi',
}: Props) {
  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'leave':
      case 'salary':
        return DollarSign
      case 'anniversary':
        return Cake
      case 'attendance':
        return Clock
      case 'system':
        return Settings
      default:
        return AlertCircle
    }
  }

  const getSeverityStyles = (severity: Alert['severity']) => {
    switch (severity) {
      case 'critical':
        return {
          bg: 'bg-red-100 dark:bg-red-900/30',
          icon: 'text-red-600 dark:text-red-400',
          badge: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
        }
      case 'high':
        return {
          bg: 'bg-amber-100 dark:bg-amber-900/30',
          icon: 'text-amber-600 dark:text-amber-400',
          badge: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
        }
      case 'medium':
        return {
          bg: 'bg-orange-100 dark:bg-orange-900/30',
          icon: 'text-orange-600 dark:text-orange-400',
          badge: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
        }
      case 'low':
        return {
          bg: 'bg-blue-100 dark:bg-blue-900/30',
          icon: 'text-blue-600 dark:text-blue-400',
          badge: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
        }
    }
  }

  const getTimeAgo = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 60) {
      return language === 'vi' ? `${minutes} phút trước` : `${minutes} minutes ago`
    } else if (hours < 24) {
      return language === 'vi' ? `${hours} giờ trước` : `${hours} hours ago`
    } else {
      return language === 'vi' ? `${days} ngày trước` : `${days} days ago`
    }
  }

  const groupAlertsByDate = (alerts: Alert[]) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const weekAgo = new Date(today)
    weekAgo.setDate(weekAgo.getDate() - 7)

    const groups: { label: string; alerts: Alert[] }[] = []

    const todayAlerts = alerts.filter((a) => a.timestamp >= today)
    const yesterdayAlerts = alerts.filter((a) => a.timestamp >= yesterday && a.timestamp < today)
    const weekAlerts = alerts.filter((a) => a.timestamp >= weekAgo && a.timestamp < yesterday)

    if (todayAlerts.length > 0) {
      groups.push({ label: t('alertList.today', language), alerts: todayAlerts })
    }
    if (yesterdayAlerts.length > 0) {
      groups.push({ label: t('alertList.yesterday', language), alerts: yesterdayAlerts })
    }
    if (weekAlerts.length > 0) {
      groups.push({ label: t('alertList.thisWeek', language), alerts: weekAlerts })
    }

    return groups
  }

  const groups = groupAlertsByDate(alerts)

  if (alerts.length === 0) {
    return (
      <Card className="shadow-md">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {t('alertList.title', language)}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {t('alertList.subtitle', language)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onViewModeChange('list')}
                className={viewMode === 'list' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : ''}
              >
                <List className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onViewModeChange('grid')}
                className={viewMode === 'grid' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : ''}
              >
                <Grid className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
        <div className="p-12 text-center">
          <div className="w-20 h-20 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Inbox className="w-10 h-10 text-slate-400 dark:text-slate-500" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            {t('alertList.empty', language)}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t('alertList.emptyDescription', language)}
          </p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="shadow-md">
      <div className="p-6 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {t('alertList.title', language)}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {t('alertList.subtitle', language)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onViewModeChange('list')}
              className={viewMode === 'list' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : ''}
            >
              <List className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onViewModeChange('grid')}
              className={viewMode === 'grid' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : ''}
            >
              <Grid className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="divide-y divide-slate-200 dark:divide-slate-700">
        {groups.map((group, groupIndex) => (
          <div key={groupIndex}>
            <div className="p-4 bg-slate-50 dark:bg-slate-900/50">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                {group.label}
              </h3>
            </div>
            {group.alerts.map((alert) => {
              const Icon = getAlertIcon(alert.type)
              const styles = getSeverityStyles(alert.severity)
              const isSelected = selectedAlerts.has(alert.id)
              const isRead = alert.status === 'read' || alert.status === 'acknowledged'

              return (
                <div
                  key={alert.id}
                  onClick={() => onAlertClick(alert)}
                  className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors cursor-pointer ${
                    isRead ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {showCheckboxes && (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          e.stopPropagation()
                          onAlertSelect(alert.id, e.target.checked)
                        }}
                        className="mt-1 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                        onClick={(e) => e.stopPropagation()}
                      />
                    )}
                    <div className={`w-10 h-10 ${styles.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-5 h-5 ${styles.icon}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold text-slate-900 dark:text-white">{alert.title}</h4>
                          <Badge className={`text-xs ${styles.badge}`}>
                            {t(`severity.${alert.severity}`, language)}
                          </Badge>
                          {alert.status === 'acknowledged' && (
                            <Badge className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                              {t('alertStatus.acknowledged', language)}
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {getTimeAgo(alert.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{alert.description}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs">
                          ID: {alert.id}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {t(`alertType.${alert.type}`, language)}
                        </Badge>
                        {alert.employeeName && (
                          <Badge variant="outline" className="text-xs">
                            {alert.employeeName}
                          </Badge>
                        )}
                        {alert.department && (
                          <Badge variant="outline" className="text-xs">
                            {alert.department}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
        <div className="text-sm text-slate-500 dark:text-slate-400">
          {t('alertList.showing', language)} <strong>1-{alerts.length}</strong> {t('alertList.of', language)}{' '}
          <strong>{alerts.length}</strong> {t('alertList.notifications', language)}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled>
            {t('alertList.previous', language)}
          </Button>
          <Button size="sm" className="bg-blue-600 text-white hover:bg-blue-700">
            1
          </Button>
          <Button variant="outline" size="sm">
            {t('alertList.next', language)}
          </Button>
        </div>
      </div>
    </Card>
  )
}
