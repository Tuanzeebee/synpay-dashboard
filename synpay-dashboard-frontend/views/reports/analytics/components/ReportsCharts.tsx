'use client'

import { Card } from '@/components/ui/card'
import { PieChart, UserCheck, TrendingUp, Calendar, Activity, DollarSign, BarChart2 } from 'lucide-react'
import { Language, t } from '@/lib/translations'
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  AreaChart,
  Area,
  BarChart,
  Bar,
} from 'recharts'
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
  const maxDeptEmployees = departments.length > 0 ? Math.max(...departments.map((d) => d.employees)) : 1
  const maxLeave = leaveTypes.length > 0 ? Math.max(...leaveTypes.map((l) => l.days), 1) : 1

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
    probation: colors.blue,
    intern: colors.purple,
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
          {(() => {
            const totalStatus = statusDistribution.reduce((sum, s) => sum + s.count, 0) || 1
            const statusIcons: Record<string, string> = {
              active: '🟢',
              onLeave: '🟡',
              probation: '🔵',
              intern: '🟣',
            }
            return (
              <div className="max-h-64 overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
                <div className="space-y-3">
                  {statusDistribution.map((status) => {
                    const pct = ((status.count / totalStatus) * 100).toFixed(1)
                    const color = statusColors[status.status] || colors.blue
                    const icon = statusIcons[status.status] || '⚪'
                    return (
                      <div
                        key={status.status}
                        className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                      >
                        <span className="text-lg flex-shrink-0">{icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                              {t(`reports.status.${status.status}`, language)}
                            </span>
                            <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                              <span className="text-xs text-slate-500 dark:text-slate-400">{pct}%</span>
                              <span className="text-sm font-bold text-slate-900 dark:text-white">{status.count}</span>
                            </div>
                          </div>
                          <div className="w-full h-2 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-700 ease-out"
                              style={{ width: `${pct}%`, backgroundColor: color }}
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
                {statusDistribution.length === 0 && (
                  <div className="flex items-center justify-center h-32 text-sm text-slate-400 dark:text-slate-500">
                    {language === 'vi' ? 'Chưa có dữ liệu' : 'No data'}
                  </div>
                )}
              </div>
            )
          })()}
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
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={salaryTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorSalary" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-slate-200, #e2e8f0)" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: 'var(--color-slate-500, #64748b)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'var(--color-slate-500, #64748b)' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => `${v}`}
              />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,.1)' }}
                formatter={(value: number) => [`${value.toFixed(1)} triệu`, language === 'vi' ? 'Lương' : 'Salary']}
                labelFormatter={(label: string) => `Tháng ${label}`}
              />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="#10b981"
                strokeWidth={2.5}
                fill="url(#colorSalary)"
                dot={{ r: 4, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
                activeDot={{ r: 6, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
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
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={attendance} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAttendance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-slate-200, #e2e8f0)" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: 'var(--color-slate-500, #64748b)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: 'var(--color-slate-500, #64748b)' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => `${v}%`}
                />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,.1)' }}
                  formatter={(value: number) => [`${value.toFixed(1)}%`, language === 'vi' ? 'Tỷ lệ' : 'Rate']}
                  labelFormatter={(label: string) => `Tháng ${label}`}
                />
                <Area
                  type="monotone"
                  dataKey="rate"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  fill="url(#colorAttendance)"
                  dot={{ r: 4, fill: '#06b6d4', stroke: '#fff', strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                />
              </AreaChart>
            </ResponsiveContainer>
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
          <div className="h-64">
            {dividends.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dividends} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorDividend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#a78bfa" stopOpacity={0.6} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-slate-200, #e2e8f0)" vertical={false} />
                  <XAxis
                    dataKey="quarter"
                    tick={{ fontSize: 12, fill: 'var(--color-slate-500, #64748b)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: 'var(--color-slate-500, #64748b)' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: number) => `${v}`}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,.1)' }}
                    formatter={(value: number) => [`${value.toFixed(1)} triệu`, language === 'vi' ? 'Cổ tức' : 'Dividend']}
                    cursor={{ fill: 'var(--color-slate-100, #f1f5f9)', opacity: 0.5 }}
                  />
                  <Bar
                    dataKey="amount"
                    fill="url(#colorDividend)"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={60}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-slate-400 dark:text-slate-500">
                {language === 'vi' ? 'Chưa có dữ liệu cổ tức' : 'No dividend data'}
              </div>
            )}
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
          <div
            className="max-h-64 overflow-y-auto space-y-3 pr-1
              [&::-webkit-scrollbar]:w-1.5
              [&::-webkit-scrollbar-track]:bg-transparent
              [&::-webkit-scrollbar-thumb]:bg-slate-300
              [&::-webkit-scrollbar-thumb]:rounded-full
              dark:[&::-webkit-scrollbar-thumb]:bg-slate-600
              hover:[&::-webkit-scrollbar-thumb]:bg-slate-400
              dark:hover:[&::-webkit-scrollbar-thumb]:bg-slate-500"
          >
            {performance
              .filter((p) => p.score > 0)
              .sort((a, b) => b.score - a.score)
              .map((perf, idx) => {
                const barColor =
                  perf.score >= 95
                    ? 'bg-emerald-500'
                    : perf.score >= 90
                      ? 'bg-blue-500'
                      : perf.score >= 80
                        ? 'bg-amber-500'
                        : 'bg-red-500'
                const badgeColor =
                  perf.score >= 95
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : perf.score >= 90
                      ? 'text-blue-600 dark:text-blue-400'
                      : perf.score >= 80
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-red-600 dark:text-red-400'
                return (
                  <div key={perf.department} className="flex items-center gap-3 group">
                    <div className="w-6 text-xs font-medium text-slate-400 dark:text-slate-500 text-center">
                      {idx + 1}
                    </div>
                    <div className="w-24 text-xs text-slate-600 dark:text-slate-400 truncate">
                      {t(`dept.${perf.department}`, language)}
                    </div>
                    <div className="flex-1 h-7 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${barColor} rounded-full transition-all duration-700 group-hover:opacity-80`}
                        style={{ width: `${perf.score}%` }}
                      />
                    </div>
                    <div className={`w-14 text-xs font-bold text-right ${badgeColor}`}>
                      {perf.score}%
                    </div>
                  </div>
                )
              })}
            {performance.filter((p) => p.score > 0).length === 0 && (
              <div className="flex items-center justify-center h-32 text-sm text-slate-400 dark:text-slate-500">
                {language === 'vi' ? 'Chưa có dữ liệu' : 'No data'}
              </div>
            )}
          </div>
        </Card>
      </div>
    </>
  )
}
