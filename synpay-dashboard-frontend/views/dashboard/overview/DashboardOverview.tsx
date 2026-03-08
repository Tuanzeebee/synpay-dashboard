"use client"

import { useState, useMemo, memo, useCallback } from "react"
import { useDashboard } from "@/hooks/useDashboard"
import {
  Download,
  ArrowUp,
  CheckCircle,
  DollarSign,
  BarChart2,
  Calendar,
  AlertTriangle,
  MoreHorizontal,
  UserPlus,
  Play,
  CheckSquare,
  FileBarChart,
  Users,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sidebar, Header } from "@/components/layout"
import { translations, t as translateFn, type Language } from "@/lib/translations"
import { useLanguage } from "@/components/providers/LanguageProvider"
import dynamic from "next/dynamic"

// Lazy load heavy chart components
const DashboardCharts = dynamic(() => import('./components/DashboardCharts'), {
  loading: () => <div className="h-64 animate-pulse bg-slate-100 dark:bg-slate-800 rounded-lg" />,
  ssr: false
})

// Vietnamese number formatting helpers
function fmtNum(n: number): string {
  return n.toLocaleString('vi-VN')
}

function fmtPercent(n: number): string {
  return n.toLocaleString('vi-VN', { minimumFractionDigits: 0, maximumFractionDigits: 1 })
}

// Memoized KPI card component
const KPICard = memo(({ title, value, change, icon: Icon, trend }: {
  title: string
  value: string
  change?: string
  icon: any
  trend?: 'up' | 'down' | 'neutral'
}) => (
  <Card className="hover:shadow-md transition-shadow cursor-pointer">
    <CardContent className="p-5">
      <div className="flex justify-between items-start mb-3">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          {title}
        </span>
        <Icon className="w-4 h-4 text-blue-500 opacity-60" />
      </div>
      <div className="text-2xl font-bold mb-2">{value}</div>
      {change && (
        <div className={`flex items-center gap-1 text-xs font-medium ${
          trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-rose-600' : 'text-slate-500'
        }`}>
          {trend === 'up' && <ArrowUp className="w-3 h-3" />}
          <span>{change}</span>
        </div>
      )}
    </CardContent>
  </Card>
))
KPICard.displayName = 'KPICard'

// Memoized Alert Item Component
const AlertItem = memo(({ 
  severity, 
  category, 
  title, 
  description, 
  time, 
  borderColor 
}: {
  severity: string
  category: string
  title: string
  description: string
  time: string
  borderColor: string
}) => (
  <div className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 border-l-4 ${borderColor}`}>
    <div className="flex justify-between items-start">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <Badge variant={severity === 'Nghiêm Trọng' ? 'destructive' : 'secondary'} className="text-xs">
            {severity}
          </Badge>
          <Badge variant="outline" className="text-xs">{category}</Badge>
        </div>
        <h4 className="font-semibold text-slate-900 dark:text-white mb-1">{title}</h4>
        <p className="text-sm text-slate-600 dark:text-slate-400">{description}</p>
      </div>
      <span className="text-xs text-slate-400">{time}</span>
    </div>
  </div>
))
AlertItem.displayName = 'AlertItem'

// Memoized Quick Action Button
const QuickActionButton = memo(({ 
  icon: Icon, 
  label, 
  colorClass,
  bgClass,
  hoverClass 
}: {
  icon: any
  label: string
  colorClass: string
  bgClass: string
  hoverClass: string
}) => (
  <Button variant="outline" className={`h-auto flex-col gap-2 py-4 ${hoverClass}`}>
    <div className={`w-10 h-10 ${bgClass} ${colorClass} rounded-full flex items-center justify-center`}>
      <Icon className="w-5 h-5" />
    </div>
    <span className="text-xs font-semibold">{label}</span>
  </Button>
))
QuickActionButton.displayName = 'QuickActionButton'

type Props = {}

function DashboardOverview({}: Props) {
  const { language, toggleLanguage, t } = useLanguage()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { overview, isLoading } = useDashboard()

  const kpis = overview?.kpis
  const deptData = overview?.deptData ?? []
  const headcountData = overview?.headcountData ?? []
  const payrollData = overview?.payrollData ?? []
  const payrollDonutData = overview?.payrollDonutData ?? []
  const alerts = overview?.alerts ?? []

  const refreshPage = useCallback(() => {
    window.location.reload()
  }, [])

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Sidebar */}
      <Sidebar language={language} t={t} activeRoute="/dashboard" />

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <Header 
          language={language} 
          onLanguageToggle={toggleLanguage} 
          onRefresh={refreshPage}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          t={t}
        />

        {/* Content */}
        <div className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t("page.title")}</h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">{t("page.subtitle")}</p>
            </div>
            <Button className="gap-2">
              <Download className="w-4 h-4" />
              {t("page.export")}
            </Button>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
            <KPICard 
              title={t("kpi.totalEmployees")}
              value={kpis ? fmtNum(kpis.totalEmployees) : "--"}
              change={kpis ? `${fmtPercent(kpis.employeeGrowthPercent)}% ${t("kpi.vsLastMonth")}` : undefined}
              icon={Users}
              trend="up"
            />
            <KPICard 
              title={t("kpi.active")}
              value={kpis ? fmtNum(kpis.activeEmployees) : "--"}
              change={kpis ? `${fmtPercent(kpis.activePercent)}% ${t("kpi.ofTotal")}` : undefined}
              icon={CheckCircle}
              trend="neutral"
            />
            <KPICard 
              title={t("kpi.monthlyPayroll")}
              value={kpis ? `${fmtNum(kpis.monthlyPayroll)} ${t("currency.billion")}` : "--"}
              change={kpis ? `${fmtPercent(kpis.payrollGrowthPercent)}% ${t("kpi.vsLastMonth")}` : undefined}
              icon={DollarSign}
              trend="up"
            />
            <KPICard 
              title={t("kpi.avgSalary")}
              value={kpis ? `${fmtNum(kpis.avgSalary)} ${t("currency.million")}` : "--"}
              change={t("kpi.annually")}
              icon={BarChart2}
              trend="neutral"
            />
            <KPICard 
              title={t("kpi.leaveDays")}
              value={kpis ? fmtNum(kpis.leaveDays) : "--"}
              change={kpis ? `${fmtPercent(kpis.leaveGrowthPercent)}% ${t("kpi.vsLastMonth")}` : undefined}
              icon={Calendar}
              trend="up"
            />
            <KPICard 
              title={t("kpi.alerts")}
              value={kpis ? fmtNum(kpis.alertCount) : "--"}
              change={t("kpi.needsAction")}
              icon={AlertTriangle}
              trend="down"
            />
          </div>

          {/* Charts - Lazy loaded */}
          <DashboardCharts 
            deptData={deptData}
            headcountData={headcountData}
            payrollData={payrollData}
            payrollDonutData={payrollDonutData}
            totalPayroll={kpis?.monthlyPayroll}
            payrollChangePercent={kpis?.payrollGrowthPercent}
            t={t}
          />

          {/* Alerts & Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                  <CardTitle>{t("alerts.title")}</CardTitle>
                  <div className="flex gap-2">
                    <Badge variant="destructive">{t("alerts.critical")}</Badge>
                    <Badge variant="secondary">{t("alerts.warning")}</Badge>
                  </div>
                </div>
                <Button variant="link">{t("alerts.viewAll")}</Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-100 dark:divide-slate-700">
                  {alerts.map((alert, i) => (
                    <AlertItem
                      key={i}
                      severity={alert.severity}
                      category={alert.category}
                      title={alert.title}
                      description={alert.description}
                      time={alert.time}
                      borderColor={alert.severity === 'Nghiêm Trọng' ? 'border-l-rose-500' : 'border-l-amber-500'}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("quickActions.title")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <QuickActionButton 
                    icon={UserPlus}
                    label={t("quickActions.addEmployee")}
                    colorClass="text-blue-600"
                    bgClass="bg-blue-100 dark:bg-blue-900/50"
                    hoverClass="hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  />
                  <QuickActionButton 
                    icon={Play}
                    label={t("quickActions.runPayroll")}
                    colorClass="text-emerald-600"
                    bgClass="bg-emerald-100 dark:bg-emerald-900/50"
                    hoverClass="hover:border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                  />
                  <QuickActionButton 
                    icon={CheckSquare}
                    label={t("quickActions.approveLeave")}
                    colorClass="text-amber-600"
                    bgClass="bg-amber-100 dark:bg-amber-900/50"
                    hoverClass="hover:border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                  />
                  <QuickActionButton 
                    icon={FileBarChart}
                    label={t("quickActions.createReport")}
                    colorClass="text-purple-600"
                    bgClass="bg-purple-100 dark:bg-purple-900/50"
                    hoverClass="hover:border-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

export default DashboardOverview
