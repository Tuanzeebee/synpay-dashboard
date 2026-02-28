import { Card, CardContent } from '@/components/ui/card'
import { Building2, Briefcase, Users, CheckCircle } from 'lucide-react'
import type { DepartmentStats } from '../types'

type Props = {
  stats: DepartmentStats
  language: 'vi' | 'en'
}

export default function StatsCards({ stats, language }: Props) {
  const t = {
    totalDepartments: language === 'vi' ? 'Tổng Phòng Ban' : 'Total Departments',
    totalPositions: language === 'vi' ? 'Tổng Chức Vụ' : 'Total Positions',
    employees: language === 'vi' ? 'Nhân Viên' : 'Employees',
    sync: language === 'vi' ? 'Đồng Bộ' : 'Sync',
    active: language === 'vi' ? 'Đang hoạt động' : 'Active',
    positions: language === 'vi' ? 'Vị trí công việc' : 'Job positions',
    allocated: language === 'vi' ? 'Đã phân bổ' : 'Allocated',
    updatedAgo: language === 'vi' ? 'Cập nhật 5 phút trước' : 'Updated 5 minutes ago',
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardContent className="p-5">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              {t.totalDepartments}
            </span>
            <Building2 className="w-4 h-4 text-blue-500 dark:text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
            {stats.totalDepartments}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">{t.active}</div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              {t.totalPositions}
            </span>
            <Briefcase className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
            {stats.totalPositions}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">{t.positions}</div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              {t.employees}
            </span>
            <Users className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
            {stats.totalEmployees}
          </div>
          <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">{t.allocated}</div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              {t.sync}
            </span>
            <CheckCircle className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
            {stats.syncPercentage}%
          </div>
          <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">{t.updatedAgo}</div>
        </CardContent>
      </Card>
    </div>
  )
}
