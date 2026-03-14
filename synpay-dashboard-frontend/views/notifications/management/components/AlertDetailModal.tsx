import { X, AlertCircle, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert } from '../types'
import { Language, t } from '@/lib/translations'

type Props = {
  alert: Alert | null
  isOpen: boolean
  onClose: () => void
  onAcknowledge: (alertId: string) => void
  language?: Language
}

export default function AlertDetailModal({ alert, isOpen, onClose, onAcknowledge, language = 'vi' }: Props) {
  if (!isOpen || !alert) return null

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

    // Handle future dates or very recent ones
    if (diff < 60000) {
      return language === 'vi' ? 'Vừa xong' : 'Just now'
    }

    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)

    if (minutes < 60) {
      return language === 'vi' ? `${minutes} phút trước` : `${minutes} minutes ago`
    } else {
      return language === 'vi' ? `${hours} giờ trước` : `${hours} hours ago`
    }
  }

  const styles = getSeverityStyles(alert.severity)

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between sticky top-0 bg-white dark:bg-slate-800 z-10">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            {t('alertDetail.title', language)}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6">
          <div className="flex items-start gap-4 mb-6">
            <div className={`w-12 h-12 ${styles.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
              <AlertCircle className={`w-6 h-6 ${styles.icon}`} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{alert.title}</h3>
                <Badge className={`text-xs ${styles.badge}`}>
                  {t(`severity.${alert.severity}`, language)}
                </Badge>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                ID: {alert.id} • {getTimeAgo(alert.timestamp)}
              </p>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            <div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">
                {t('alertDetail.description', language)}
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">{alert.description}</p>
            </div>

            {(alert.employeeName || alert.employeeId || alert.department) && (
              <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">
                  {t('alertDetail.info', language)}
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  {alert.employeeName && (
                    <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                        {t('alertDetail.employee', language)}
                      </p>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {alert.employeeName}
                      </p>
                    </div>
                  )}
                  {alert.employeeId && (
                    <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                        {t('alertDetail.employeeId', language)}
                      </p>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{alert.employeeId}</p>
                    </div>
                  )}
                  {alert.department && (
                    <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                        {t('alertDetail.department', language)}
                      </p>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{alert.department}</p>
                    </div>
                  )}
                  {alert.metadata &&
                    Object.entries(alert.metadata).map(([key, value]) => (
                      <div key={key} className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </p>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{value}</p>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {alert.suggestedActions && alert.suggestedActions.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">
                  {t('alertDetail.suggestedActions', language)}
                </h4>
                <ul className="space-y-2">
                  {alert.suggestedActions.map((action, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => {
                onAcknowledge(alert.id)
                onClose()
              }}
              className="flex-1 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white"
            >
              {t('actions.acknowledgeProcessed', language)}
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600"
            >
              {t('actions.close', language)}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
