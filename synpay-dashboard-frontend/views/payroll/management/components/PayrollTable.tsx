import type { SalaryItem } from '../types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Edit } from 'lucide-react'

type Props = {
  data: SalaryItem[]
  isLoading?: boolean
  onRowClick: (salaryId: number) => void
  onAdjustClick: (salaryId: number) => void
  t: (key: string) => string
}

export default function PayrollTable({ data, isLoading, onRowClick, onAdjustClick, t }: Props) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2)
  }

  if (isLoading) {
    return (
      <Card>
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t('table.title')}</h2>
        </div>
        <div className="p-12 text-center text-slate-500 dark:text-slate-400">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
          Đang tải dữ liệu...
        </div>
      </Card>
    )
  }

  if (data.length === 0) {
    return (
      <Card>
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t('table.title')}</h2>
        </div>
        <div className="p-12 text-center text-slate-500 dark:text-slate-400">
          Không tìm thấy dữ liệu lương.
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <div className="p-6 border-b border-slate-200 dark:border-slate-700">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <span>{t('table.title')}</span>
          <span className="text-sm font-normal text-slate-500">({data.length} bản ghi)</span>
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
              <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {t('table.actions')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {data.map((item) => (
              <tr
                key={item.salaryId}
                onClick={() => onRowClick(item.salaryId)}
                className="cursor-pointer hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-semibold text-sm">
                      {getInitials(item.employeeName)}
                    </div>
                    <div>
                      <div className="font-medium text-slate-900 dark:text-white">
                        {item.employeeName}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{item.positionName}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-slate-600 dark:text-slate-300">{item.departmentName}</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="text-sm font-medium text-slate-900 dark:text-white">
                    {formatCurrency(item.baseSalary)}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(item.bonus)}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="text-sm font-medium text-red-600 dark:text-red-400">
                    {formatCurrency(item.deductions)}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                    {formatCurrency(item.netSalary)}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation()
                        onAdjustClick(item.salaryId)
                      }}
                      className="hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400"
                      title="Điều chỉnh lương"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
