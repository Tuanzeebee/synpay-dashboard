import { Filter, Search, FileSpreadsheet, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ReportsFilter } from '../types'
import { Language, t } from '@/lib/translations'

type Props = {
  filters: ReportsFilter
  onFiltersChange: (filters: ReportsFilter) => void
  onApply: () => void
  onExportCSV: () => void
  onExportPDF: () => void
  language?: Language
}

export default function ReportsFiltersBar({
  filters,
  onFiltersChange,
  onApply,
  onExportCSV,
  onExportPDF,
  language = 'vi',
}: Props) {
  const departments = [
    { value: 'all', label: t('reports.allDepartments', language) },
    { value: 'tech', label: t('dept.engineering', language) },
    { value: 'sales', label: t('dept.sales', language) },
    { value: 'marketing', label: t('dept.marketing', language) },
    { value: 'hr', label: t('dept.hr', language) },
    { value: 'finance', label: t('dept.finance', language) },
    { value: 'operations', label: t('dept.operations', language) },
  ]

  const periods = [
    { value: 'month', label: t('reports.periodMonth', language) },
    { value: 'quarter', label: t('reports.periodQuarter', language) },
    { value: 'year', label: t('reports.periodYear', language) },
    { value: 'custom', label: t('reports.periodCustom', language) },
  ]

  return (
    <div className="px-4 md:px-8 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            {t('filters.label', language)}
          </span>
        </div>

        <select
          value={filters.department}
          onChange={(e) => onFiltersChange({ ...filters, department: e.target.value })}
          className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors"
        >
          {departments.map((dept) => (
            <option key={dept.value} value={dept.value}>
              {dept.label}
            </option>
          ))}
        </select>

        <select
          value={filters.period}
          onChange={(e) =>
            onFiltersChange({ ...filters, period: e.target.value as ReportsFilter['period'] })
          }
          className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors"
        >
          {periods.map((period) => (
            <option key={period.value} value={period.value}>
              {period.label}
            </option>
          ))}
        </select>

        <Input
          type="date"
          value={filters.startDate}
          onChange={(e) => onFiltersChange({ ...filters, startDate: e.target.value })}
          className="px-3 py-2 w-auto"
        />

        <span className="text-slate-500 dark:text-slate-400 text-sm">{t('reports.dateTo', language)}</span>

        <Input
          type="date"
          value={filters.endDate}
          onChange={(e) => onFiltersChange({ ...filters, endDate: e.target.value })}
          className="px-3 py-2 w-auto"
        />

        <Button onClick={onApply} className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600">
          <Search className="w-4 h-4 mr-2" />
          <span>{t('reports.apply', language)}</span>
        </Button>

        <div className="ml-auto flex items-center gap-2">
          <Button
            onClick={onExportCSV}
            className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white"
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">{t('reports.exportCSV', language)}</span>
          </Button>
          <Button
            onClick={onExportPDF}
            className="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white"
          >
            <FileText className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">{t('reports.exportPDF', language)}</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
