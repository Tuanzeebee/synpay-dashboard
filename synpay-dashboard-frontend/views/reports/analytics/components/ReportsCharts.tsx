'use client'

import { Card } from '@/components/ui/card'
import { PieChart, UserCheck, TrendingUp, Calendar, Activity, DollarSign, BarChart2 } from 'lucide-react'
import { Language, t } from '@/lib/translations'
import {
  SalaryTrendData,
  StatusDistribution,
  LeaveTypeData,
  AttendanceData,
  DividendData,
  PerformanceData,
  DepartmentData,
} from '../types'

type Props = {
  departments: DepartmentData[]
  salaryTrend: SalaryTrendData[]
  statusDistribution: StatusDistribution[]
  leaveTypes: LeaveTypeData[]
  attendance: AttendanceData[]
  dividends: DividendData[]
  performance: PerformanceData[]
  language?: Language
}

export default function ReportsCharts({
  departments,
  salaryTrend,
  statusDistribution,
  leaveTypes,
  attendance,
  dividends,
  performance,
  language = 'vi',
}: Props) {
  // Simple bar chart using CSS for demo - in production use recharts
  const maxDeptEmployees = Math.max(...departments.map((d) => d.employees))
  const maxLeave = Math.max(...leaveTypes.map((l) => l.days))
  const maxPerformance = Math.max(...performance.map((p) => p.score))

  const colors = {
    blue: '#3b82f6',
    emerald: '#10b981',
    amber: '#f59e0b',
    red: '#ef4444',
    purple: '#8b5cf6',
    cyan: '#06b6d4',
  }

  const statusColors: Record<string, string> = {
    active: colors.emerald,
    onLeave: colors.amber,
    businessTrip: colors.blue,
    suspended: colors.red,
  }

  const leaveColors: Record<string, string> = {
    annual: colors.blue,
    sick: colors.amber,
    maternity: colors.purple,
    unpaid: colors.red,
    other: colors.cyan,
  }

  return (
    <>
      {/* Row 1: Department Distribution & Employee Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card className="shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {t('reports.chart.deptDistribution', language)}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {t('reports.chart.deptSubtitle', language)}
              </p>
            </div>
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <PieChart className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="h-64 flex items-center justify-center">
            <div className="space-y-2 w-full">
              {departments.slice(0, 6).map((dept, idx) => (
                <div key={dept.id} className="flex items-center gap-3">
                  <div className="w-24 text-xs text-slate-600 dark:text-slate-400 truncate">
                    {language === 'vi' ? dept.name : t(`dept.${dept.id}`, language)}
                  </div>
                  <div className="flex-1 h-6 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${idx % 2 === 0 ? 'bg-blue-500' : 'bg-emerald-500'} transition-all duration-500`}
                      style={{ width: `${(dept.employees / maxDeptEmployees) * 100}%` }}
                    />
                  </div>
                  <div className="w-8 text-xs font-semibold text-slate-900 dark:text-white">{dept.employees}</div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card className="shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {t('reports.chart.employeeStatus', language)}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {t('reports.chart.statusSubtitle', language)}
              </p>
            </div>
            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <div className="h-64">
            <div className="grid grid-cols-2 gap-4 h-full">
              {statusDistribution.map((status) => (
                <div
                  key={status.status}
                  className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-700/30 rounded-lg"
                >
                  <div className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{status.count}</div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 text-center">
                    {t(`reports.status.${status.status}`, language)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Row 2: Salary Trend */}
      <Card className="shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {t('reports.chart.salaryTrend', language)}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {t('reports.chart.salarySubtitle', language)}
            </p>
          </div>
          <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
        </div>
        <div className="h-80">
          <div className="flex items-end justify-between h-full gap-2">
            {salaryTrend.map((data) => {
              const height = (data.amount / 8.5) * 100
              return (
                <div key={data.month} className="flex-1 flex flex-col items-center gap-2">
                  <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    {data.amount.toFixed(1)}
                  </div>
                  <div
                    className="w-full bg-emerald-500 dark:bg-emerald-600 rounded-t transition-all duration-500 hover:bg-emerald-600"
                    style={{ height: `${height}%` }}
                  />
                  <div className="text-xs text-slate-600 dark:text-slate-400">{data.month}</div>
                </div>
              )
            })}
          </div>
        </div>
      </Card>

      {/* Row 3: Leave Types & Attendance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card className="shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {t('reports.chart.leaveTypes', language)}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {t('reports.chart.leaveSubtitle', language)}
              </p>
            </div>
            <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          <div className="h-64 space-y-3">
            {leaveTypes.map((leave) => (
              <div key={leave.type} className="flex items-center gap-3">
                <div className="w-20 text-xs text-slate-600 dark:text-slate-400">
                  {t(`reports.leave.${leave.type}`, language)}
                </div>
                <div className="flex-1 h-8 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 transition-all duration-500"
                    style={{ width: `${(leave.days / maxLeave) * 100}%` }}
                  />
                </div>
                <div className="w-12 text-xs font-semibold text-slate-900 dark:text-white text-right">
                  {leave.days}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {t('reports.chart.attendanceRate', language)}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {t('reports.chart.attendanceSubtitle', language)}
              </p>
            </div>
            <div className="w-10 h-10 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            </div>
          </div>
          <div className="h-64 flex items-end justify-between gap-2">
            {attendance.map((data) => {
              const height = ((data.rate - 90) / 10) * 100
              return (
                <div key={data.month} className="flex-1 flex flex-col items-center gap-2">
                  <div className="text-xs font-semibold text-cyan-600 dark:text-cyan-400">{data.rate}%</div>
                  <div
                    className="w-full bg-cyan-500 dark:bg-cyan-600 rounded-t transition-all duration-500"
                    style={{ height: `${height}%` }}
                  />
                  <div className="text-xs text-slate-600 dark:text-slate-400">{data.month}</div>
                </div>
              )
            })}
          </div>
        </Card>
      </div>

      {/* Row 4: Dividends & Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card className="shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {t('reports.chart.dividendTrend', language)}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {t('reports.chart.dividendSubtitle', language)}
              </p>
            </div>
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <div className="h-64 flex items-end justify-between gap-4">
            {dividends.map((data) => {
              const height = (data.amount / 2.2) * 100
              return (
                <div key={data.quarter} className="flex-1 flex flex-col items-center gap-2">
                  <div className="text-xs font-semibold text-purple-600 dark:text-purple-400">
                    {data.amount}
                  </div>
                  <div
                    className="w-full bg-purple-500 dark:bg-purple-600 rounded-t transition-all duration-500"
                    style={{ height: `${height}%` }}
                  />
                  <div className="text-xs text-slate-600 dark:text-slate-400">{data.quarter}</div>
                </div>
              )
            })}
          </div>
        </Card>

        <Card className="shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {t('reports.chart.performance', language)}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {t('reports.chart.performanceSubtitle', language)}
              </p>
            </div>
            <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
              <BarChart2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
          <div className="h-64 space-y-3">
            {performance.map((perf) => (
              <div key={perf.department} className="flex items-center gap-3">
                <div className="w-20 text-xs text-slate-600 dark:text-slate-400">
                  {t(`dept.${perf.department}`, language)}
                </div>
                <div className="flex-1 h-8 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 transition-all duration-500"
                    style={{ width: `${perf.score}%` }}
                  />
                </div>
                <div className="w-12 text-xs font-semibold text-slate-900 dark:text-white text-right">
                  {perf.score}%
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  )
}
