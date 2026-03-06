'use client'

import { useState, useCallback } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import KPICards from './components/KPICards'
import ReportsFiltersBar from './components/ReportsFiltersBar'
import ReportsCharts from './components/ReportsCharts'
import DepartmentTable from './components/DepartmentTable'
import { ReportsFilter } from './types'
import { useReports } from '@/hooks/useReports'
import { useLanguage } from '@/components/providers/LanguageProvider'

// Polyfill for requestIdleCallback (Safari doesn't support it)
const safeRequestIdleCallback = typeof requestIdleCallback === 'function'
  ? requestIdleCallback
  : (cb: () => void) => setTimeout(cb, 1)

export default function ReportsAnalytics() {
  const { language, toggleLanguage, t: translate } = useLanguage()
  const [filters, setFilters] = useState<ReportsFilter>({
    department: 'all',
    period: 'month',
    startDate: '2024-01-01',
    endDate: new Date().toISOString().slice(0, 10),
  })

  const { data, isLoading, error, refresh, loadReports, exportData } = useReports({
    department: filters.department,
    startDate: filters.startDate,
    endDate: filters.endDate,
  })

  const handleApplyFilters = useCallback(() => {
    loadReports({
      department: filters.department,
      startDate: filters.startDate,
      endDate: filters.endDate,
    })
  }, [filters, loadReports])

  const handleExportCSV = useCallback(() => {
    exportData({
      department: filters.department,
      startDate: filters.startDate,
      endDate: filters.endDate,
    }).then((exportedData) => {
      // Convert to CSV
      const headers = ['Department', 'Employees', 'Total Salary', 'Avg Salary', 'Leave Days', 'Performance']
      const rows = exportedData.departments.map((d) =>
        [d.name, d.employees, d.totalSalary, d.avgSalary, d.leaveDays, d.performance].join(',')
      )
      const csv = [headers.join(','), ...rows].join('\n')
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `reports_${filters.startDate}_${filters.endDate}.csv`
      link.click()
      URL.revokeObjectURL(url)
    }).catch(() => {
      alert(language === 'vi' ? 'Không thể xuất dữ liệu. Vui lòng thử lại.' : 'Failed to export data. Please try again.')
    })
  }, [filters, exportData, language])

  const handleExportPDF = useCallback(() => {
    safeRequestIdleCallback(() => {
      alert(language === 'vi' ? 'Tính năng xuất PDF đang phát triển...' : 'PDF export is under development...')
    })
  }, [language])

  const handleRefresh = useCallback(() => {
    refresh()
  }, [refresh])

  return (
    <div className="flex w-full min-h-screen">
      <Sidebar language={language} t={translate} activeRoute="/reports" />

      <main className="flex-1 flex flex-col min-w-0">
        <Header
          language={language}
          onLanguageToggle={toggleLanguage}
          onRefresh={handleRefresh}
          t={translate}
        />

        <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 md:px-8 py-6">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
            {language === 'vi' ? 'Báo Cáo & Phân Tích' : 'Reports & Analytics'}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {language === 'vi' ? 'Tổng quan dữ liệu và xu hướng kinh doanh' : 'Data overview and business trends'}
          </p>
        </div>

        <ReportsFiltersBar
          filters={filters}
          onFiltersChange={setFilters}
          onApply={handleApplyFilters}
          onExportCSV={handleExportCSV}
          onExportPDF={handleExportPDF}
          language={language}
        />

        <div className="flex-1 p-4 md:p-8 overflow-y-auto">
          {error && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  {language === 'vi' ? 'Đang tải dữ liệu báo cáo...' : 'Loading report data...'}
                </span>
              </div>
            </div>
          ) : (
            <>
              <KPICards data={data.kpis} language={language} />

              <ReportsCharts
                departments={data.departments}
                salaryTrend={data.salaryTrend}
                statusDistribution={data.statusDistribution}
                leaveTypes={data.leaveTypes}
                attendance={data.attendance}
                dividends={data.dividends}
                performance={data.performance}
                language={language}
              />

              <DepartmentTable data={data.departments} language={language} />
            </>
          )}
        </div>
      </main>
    </div>
  )
}
