'use client'

import { useState, useMemo, memo, useCallback } from 'react'
import { Sidebar, Header } from '@/components/layout'
import { translations, t as translateFn, type Language } from '@/lib/translations'
import { useLanguage } from '@/components/providers/LanguageProvider'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import PayrollTable from './components/PayrollTable'
import { mockEmployees, generatePayrollData, generateAttendanceData, departments, months } from './data'
import type { PayrollFilters, PayrollData } from './types'
import { DollarSign, TrendingUp, CalendarCheck, AlertTriangle, Download, Search } from 'lucide-react'

// Module-level currency formatter — created once, reused across all renders
const currencyFormatter = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
const formatCurrency = (amount: number) => currencyFormatter.format(amount)

// Memoized stat card component
const StatCard = memo(({ title, value, subtitle, icon: Icon, subtitleColor = 'text-slate-500' }: {
  title: string
  value: string | React.ReactNode
  subtitle: string
  icon: any
  subtitleColor?: string
}) => (
  <Card className="p-5">
    <div className="flex justify-between items-start mb-3">
      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
        {title}
      </span>
      <Icon className="w-4 h-4 text-blue-500 dark:text-blue-400" />
    </div>
    <div className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
      {value}
    </div>
    <div className={`text-xs ${subtitleColor} font-medium`}>
      {subtitle}
    </div>
  </Card>
))
StatCard.displayName = 'StatCard'

type Props = {}

export default function PayrollManagement({}: Props) {
  const { language, toggleLanguage, t } = useLanguage()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [filters, setFilters] = useState<PayrollFilters>({
    search: '',
    month: '2024-01',
    department: ''
  })

  const [employees] = useState(mockEmployees)
  const [payrollRecords] = useState(() => generatePayrollData())
  const [attendanceRecords] = useState(() => generateAttendanceData())

  const refreshPage = useCallback(() => {
    setFilters({ search: '', month: '2024-01', department: '' })
  }, [])

  const filteredData = useMemo(() => {
    let filtered = employees

    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(emp =>
        emp.fullName.toLowerCase().includes(searchLower) ||
        emp.email.toLowerCase().includes(searchLower) ||
        emp.id.toLowerCase().includes(searchLower)
      )
    }

    if (filters.department) {
      filtered = filtered.filter(emp => emp.department === filters.department)
    }

    return filtered.map(emp => {
      const payroll = payrollRecords.find(p =>
        p.employeeId === emp.id && p.month === filters.month
      )!
      const attendance = attendanceRecords.find(a =>
        a.employeeId === emp.id && a.month === filters.month
      )!

      return { employee: emp, payroll, attendance }
    })
  }, [employees, payrollRecords, attendanceRecords, filters])

  // Memoized expensive calculation with better performance
  const stats = useMemo(() => {
    if (filteredData.length === 0) {
      return { totalPayroll: 0, avgSalary: 0, avgAttendance: 0, anomalies: 0 }
    }
    
    let totalPayroll = 0
    let totalAttendance = 0
    let anomalies = 0
    
    // Single pass through data for better performance
    filteredData.forEach(item => {
      totalPayroll += item.payroll.netSalary
      totalAttendance += item.attendance.attendanceRate
      if (item.payroll.hasAnomaly) anomalies++
    })
    
    const avgSalary = totalPayroll / filteredData.length
    const avgAttendance = totalAttendance / filteredData.length

    return { totalPayroll, avgSalary, avgAttendance, anomalies }
  }, [filteredData])

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900">
      <Sidebar language={language} t={t} activeRoute="/payroll" />

      <main className="flex-1 flex flex-col min-w-0">
        <Header
          language={language}
          onLanguageToggle={toggleLanguage}
          onRefresh={refreshPage}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          t={t}
        />

        <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 md:px-8 py-6">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
            {language === 'vi' ? 'Bảng Lương & Chấm Công' : 'Payroll & Attendance'}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {language === 'vi' ? 'Quản lý lương và theo dõi chuyên cần' : 'Manage payroll and track attendance'}
          </p>
        </div>

        <div className="flex-1 p-4 md:p-8 overflow-y-auto">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard 
              title="Tổng Lương Tháng Này"
              value={formatCurrency(stats.totalPayroll)}
              subtitle="+8.2% so với tháng trước"
              icon={DollarSign}
              subtitleColor="text-emerald-600 dark:text-emerald-400"
            />

            <StatCard 
              title="Trung Bình Lương"
              value={formatCurrency(stats.avgSalary)}
              subtitle="Per employee"
              icon={TrendingUp}
            />

            <StatCard 
              title="Tỷ Lệ Chuyên Cần"
              value={`${stats.avgAttendance.toFixed(1)}%`}
              subtitle="Xuất sắc"
              icon={CalendarCheck}
              subtitleColor="text-emerald-600 dark:text-emerald-400"
            />

            <StatCard 
              title="Bất Thường"
              value={stats.anomalies}
              subtitle="Cần xem xét"
              icon={AlertTriangle}
              subtitleColor="text-amber-600 dark:text-amber-400"
            />
          </div>

          {/* Filters */}
          <Card className="p-4 md:p-6 mb-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Tìm kiếm nhân viên..."
                    value={filters.search}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilters({ ...filters, search: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <select
                  value={filters.month}
                  onChange={(e) => setFilters({ ...filters, month: e.target.value })}
                  className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {months.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>

                <select
                  value={filters.department}
                  onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                  className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Tất cả phòng ban</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>

                <Button className="gap-2">
                  <Download className="w-4 h-4" />
                  Xuất Excel
                </Button>
              </div>
            </div>
          </Card>

          {/* Table */}
          <PayrollTable
            data={filteredData}
            onRowClick={(id) => console.log('Open drawer:', id)}
            onAdjustClick={(id) => console.log('Open adjustment:', id)}
            t={t}
          />
        </div>
      </main>
    </div>
  )
}
