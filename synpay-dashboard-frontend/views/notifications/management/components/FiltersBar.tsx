import { Filter, RefreshCw, CheckSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FilterOptions, AlertSeverity, AlertType, AlertStatus, TimeFilter } from '../types'
import { Language, t } from '@/lib/translations'

type Props = {
  filters: FilterOptions
  onFiltersChange: (filters: FilterOptions) => void
  onRefresh: () => void
  onToggleBulkActions: () => void
  showBulkActions: boolean
  selectedCount: number
  onBulkMarkAsRead: () => void
  onBulkAcknowledge: () => void
  onBulkDelete: () => void
  onSelectAll: (checked: boolean) => void
  selectAllChecked: boolean
  language?: Language
}

export default function FiltersBar({
  filters,
  onFiltersChange,
  onRefresh,
  onToggleBulkActions,
  showBulkActions,
  selectedCount,
  onBulkMarkAsRead,
  onBulkAcknowledge,
  onBulkDelete,
  onSelectAll,
  selectAllChecked,
  language = 'vi',
}: Props) {
  const severityOptions: Array<{ value: AlertSeverity | 'all'; label: string }> = [
    { value: 'all', label: t('filters.allSeverities', language) },
    { value: 'critical', label: t('severity.critical', language) },
    { value: 'high', label: t('severity.high', language) },
    { value: 'medium', label: t('severity.medium', language) },
    { value: 'low', label: t('severity.low', language) },
  ]

  const typeOptions: Array<{ value: AlertType | 'all'; label: string }> = [
    { value: 'all', label: t('filters.allTypes', language) },
    { value: 'anniversary', label: t('alertType.anniversary', language) },
    { value: 'leave', label: t('alertType.leave', language) },
    { value: 'salary', label: t('alertType.salary', language) },
    { value: 'attendance', label: t('alertType.attendance', language) },
    { value: 'system', label: t('alertType.system', language) },
  ]

  const statusOptions: Array<{ value: AlertStatus | 'all'; label: string }> = [
    { value: 'all', label: t('filters.allStatuses', language) },
    { value: 'unread', label: t('alertStatus.unread', language) },
    { value: 'read', label: t('alertStatus.read', language) },
    { value: 'acknowledged', label: t('alertStatus.acknowledged', language) },
  ]

  const timeOptions: Array<{ value: TimeFilter; label: string }> = [
    { value: 'all', label: t('filters.allTime', language) },
    { value: 'today', label: t('filters.today', language) },
    { value: 'week', label: t('filters.week', language) },
    { value: 'month', label: t('filters.month', language) },
  ]

  return (
    <>
      <div className="px-4 md:px-8 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              {t('filters.label', language)}
            </span>
          </div>

          <select
            value={filters.severity}
            onChange={(e) =>
              onFiltersChange({ ...filters, severity: e.target.value as AlertSeverity | 'all' })
            }
            className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors"
          >
            {severityOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={filters.type}
            onChange={(e) => onFiltersChange({ ...filters, type: e.target.value as AlertType | 'all' })}
            className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors"
          >
            {typeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={filters.status}
            onChange={(e) =>
              onFiltersChange({ ...filters, status: e.target.value as AlertStatus | 'all' })
            }
            className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={filters.time}
            onChange={(e) => onFiltersChange({ ...filters, time: e.target.value as TimeFilter })}
            className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors"
          >
            {timeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <div className="ml-auto flex items-center gap-2">
            <Button
              onClick={onToggleBulkActions}
              variant="outline"
              className="bg-slate-600 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-white border-0"
            >
              <CheckSquare className="w-4 h-4 mr-2" />
              <span>{t('actions.bulkActions', language)}</span>
            </Button>
            <Button onClick={onRefresh} className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600">
              <RefreshCw className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">{t('actions.refresh', language)}</span>
            </Button>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {showBulkActions && (
          <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={selectAllChecked}
                  onChange={(e) => onSelectAll(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  <span className="font-semibold">{selectedCount}</span> {t('actions.itemsSelected', language)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={onBulkMarkAsRead}
                  variant="outline"
                  size="sm"
                  className="bg-white dark:bg-slate-800"
                >
                  {t('actions.markAsRead', language)}
                </Button>
                <Button
                  onClick={onBulkAcknowledge}
                  variant="outline"
                  size="sm"
                  className="bg-white dark:bg-slate-800"
                >
                  {t('actions.acknowledge', language)}
                </Button>
                <Button
                  onClick={onBulkDelete}
                  size="sm"
                  className="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white"
                >
                  {t('actions.delete', language)}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
