"use client"

import { memo } from "react"
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, ArrowUp } from "lucide-react"

interface ChartData {
  deptData: readonly { name: string; value: number }[]
  headcountData: readonly { month: string; value: number }[]
  payrollData: readonly { month: string; value: number }[]
  payrollDonutData: readonly { name: string; value: number; color: string }[]
  totalPayroll?: number
  payrollChangePercent?: number
  t: (key: string) => string
}

const DashboardCharts = memo(({ deptData, headcountData, payrollData, payrollDonutData, totalPayroll, payrollChangePercent, t }: ChartData) => {
  return (
    <>
      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{t("chart.deptDistribution")}</CardTitle>
              <CardDescription>{t("chart.deptDistributionDesc")}</CardDescription>
            </div>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="w-5 h-5" />
            </Button>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={deptData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                <XAxis dataKey="name" tickFormatter={(value) => t(`dept.${value}`)} className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{t("chart.headcountTrend")}</CardTitle>
              <CardDescription>{t("chart.headcountTrendDesc")}</CardDescription>
            </div>
            <Badge variant="secondary">{t("chart.headcountPeriod")}</Badge>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={headcountData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                <Area type="monotone" dataKey="value" stroke="#3b82f6" fill="rgba(59, 130, 246, 0.1)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t("chart.payrollTrend")}</CardTitle>
            <CardDescription>{t("chart.payrollTrendDesc")}</CardDescription>
            <div className="flex items-baseline gap-3 mt-4">
              <div className="text-3xl font-bold">{totalPayroll != null ? totalPayroll.toLocaleString('vi-VN', { maximumFractionDigits: 1 }) : '--'} {t("currency.billion")}</div>
              {payrollChangePercent != null && (
                <div className="flex items-center gap-1 text-sm font-semibold text-emerald-600">
                  <ArrowUp className="w-4 h-4" />
                  <span>+{payrollChangePercent.toLocaleString('vi-VN', { maximumFractionDigits: 1 })}%</span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={payrollData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                <Area type="monotone" dataKey="value" stroke="#10b981" fill="rgba(16, 185, 129, 0.1)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("chart.payrollByDept")}</CardTitle>
            <CardDescription>{t("chart.payrollByDeptDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={payrollDonutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {payrollDonutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="w-full space-y-2 mt-4">
              {payrollDonutData.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-600 dark:text-slate-300">{item.name}</span>
                  </div>
                  <span className="font-semibold">{item.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
})

DashboardCharts.displayName = 'DashboardCharts'

export default DashboardCharts
