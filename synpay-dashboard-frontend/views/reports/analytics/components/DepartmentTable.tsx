import { Card } from '@/components/ui/card'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DepartmentData } from '../types'
import { Language, t } from '@/lib/translations'

type Props = {
  data: DepartmentData[]
  language?: Language
}

export default function DepartmentTable({ data, language = 'vi' }: Props) {
  // Only show departments that have employees
  const departments = data.filter((d) => d.employees > 0)

  const formatCurrency = (num: number): string => {
    if (language === 'vi') {
      if (num >= 1000) return `${(num / 1000).toFixed(2)} tỷ`
      return `${Math.round(num)} triệu`
    }
    if (num >= 1000) return `$${((num * 0.00033)).toFixed(2)}M`
    return `$${(num * 0.033).toFixed(1)}K`
  }

  const formatAvgSalary = (num: number): string => {
    if (language === 'vi') {
      return `${Math.round(num)} triệu`
    }
    return `$${(num * 0.033).toFixed(1)}K`
  }

  const getPerformanceBadgeColor = (score: number): string => {
    if (score >= 95) return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
    if (score >= 90) return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
    if (score >= 85) return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
    return 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
  }

  const totals = departments.reduce(
    (acc, dept) => ({
      employees: acc.employees + dept.employees,
      totalSalary: acc.totalSalary + dept.totalSalary,
      leaveDays: acc.leaveDays + dept.leaveDays,
    }),
    { employees: 0, totalSalary: 0, leaveDays: 0 }
  )

  const avgSalary = totals.employees > 0 ? totals.totalSalary / totals.employees : 0

  return (
    <Card className="shadow-md">
      <div className="p-6 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {t('reports.table.title', language)}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {t('reports.table.subtitle', language)}
            </p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600">
            <Download className="w-4 h-4 mr-2" />
            <span>{t('reports.table.download', language)}</span>
          </Button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700">
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                {t('reports.table.department', language)}
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                {t('reports.table.employees', language)}
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                {t('reports.table.totalSalary', language)}
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                {t('reports.table.avgSalary', language)}
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                {t('reports.table.leaveDays', language)}
              </th>
              <th className="px-6 py-4 text-center text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                {t('reports.table.performance', language)}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {departments.map((dept) => (
              <tr
                key={dept.id}
                className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
              >
                <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">
                  {language === 'vi' ? dept.name : t(`dept.${dept.id}`, language)}
                </td>
                <td className="px-6 py-4 text-sm text-right text-slate-900 dark:text-white">
                  {dept.employees}
                </td>
                <td className="px-6 py-4 text-sm text-right font-medium text-slate-900 dark:text-white">
                  {formatCurrency(dept.totalSalary)}
                </td>
                <td className="px-6 py-4 text-sm text-right text-slate-600 dark:text-slate-400">
                  {formatAvgSalary(dept.avgSalary)}
                </td>
                <td className="px-6 py-4 text-sm text-right text-slate-600 dark:text-slate-400">
                  {dept.leaveDays}
                </td>
                <td className="px-6 py-4 text-center">
                  <Badge className={getPerformanceBadgeColor(dept.performance)}>{dept.performance}%</Badge>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t-2 border-slate-300 dark:border-slate-600">
            <tr className="bg-slate-50 dark:bg-slate-700/50">
              <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-white">
                {t('reports.table.total', language)}
              </td>
              <td className="px-6 py-4 text-sm text-right font-bold text-slate-900 dark:text-white">
                {totals.employees}
              </td>
              <td className="px-6 py-4 text-sm text-right font-bold text-slate-900 dark:text-white">
                {formatCurrency(totals.totalSalary)}
              </td>
              <td className="px-6 py-4 text-sm text-right font-medium text-slate-600 dark:text-slate-400">
                {formatAvgSalary(avgSalary)}
              </td>
              <td className="px-6 py-4 text-sm text-right font-medium text-slate-600 dark:text-slate-400">
                {totals.leaveDays}
              </td>
              <td className="px-6 py-4"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </Card>
  )
}
