import { PayrollData } from '../types'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertCircle, Edit } from 'lucide-react'

type Props = {
  data: PayrollData[]
  onRowClick: (employeeId: string) => void
  onAdjustClick: (employeeId: string) => void
  t: (key: string) => string
}

export default function PayrollTable({ data, onRowClick, onAdjustClick, t }: Props) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
  }

  const getAttendanceColor = (rate: number) => {
    if (rate >= 95) return 'text-emerald-600 dark:text-emerald-400'
    if (rate >= 85) return 'text-blue-600 dark:text-blue-400'
    if (rate >= 75) return 'text-amber-600 dark:text-amber-400'
    return 'text-red-600 dark:text-red-400'
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2)
  }

  return (
    <Card>
      <div className="p-6 border-b border-slate-200 dark:border-slate-700">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <span>{t('table.title')}</span>
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {t('table.employee')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {t('table.department')}
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {t('table.baseSalary')}
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {t('table.bonus')}
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {t('table.deductions')}
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {t('table.netSalary')}
              </th>
              <th className="px-6 py-3 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {t('table.attendance')}
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {t('table.actions')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {data.map((item) => (
              <tr
                key={item.employee.id}
                onClick={() => onRowClick(item.employee.id)}
                className={`cursor-pointer hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors ${
                  item.payroll.hasAnomaly ? 'bg-amber-50 dark:bg-amber-900/10' : ''
                }`}
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-semibold text-sm">
                      {getInitials(item.employee.fullName)}
                    </div>
                    <div>
                      <div className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                        {item.employee.fullName}
                        {item.payroll.hasAnomaly && (
                          <AlertCircle className="w-4 h-4 text-amber-500 animate-pulse" />
                        )}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{item.employee.position}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-slate-600 dark:text-slate-300">{item.employee.department}</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="text-sm font-medium text-slate-900 dark:text-white">
                    {formatCurrency(item.payroll.baseSalary)}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(item.payroll.bonus)}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="text-sm font-medium text-red-600 dark:text-red-400">
                    {formatCurrency(item.payroll.deductions)}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                    {formatCurrency(item.payroll.netSalary)}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <span className={`text-sm font-semibold ${getAttendanceColor(item.attendance.attendanceRate)}`}>
                      {item.attendance.attendanceRate.toFixed(1)}%
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation()
                      onAdjustClick(item.employee.id)
                    }}
                    className="hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400"
                    title="Điều chỉnh lương"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
