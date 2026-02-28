'use client'

import { useState, useCallback } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import KPICards from './components/KPICards'
import ReportsFiltersBar from './components/ReportsFiltersBar'
import ReportsCharts from './components/ReportsCharts'
import DepartmentTable from './components/DepartmentTable'
import { ReportsFilter } from './types'
import { getMockReportsData } from './data'
import { Language, t } from '@/lib/translations'
import { useLanguage } from '@/components/providers/LanguageProvider'

// Polyfill for requestIdleCallback (Safari doesn't support it)
const safeRequestIdleCallback = typeof requestIdleCallback === 'function'
  ? requestIdleCallback
  : (cb: () => void) => setTimeout(cb, 1)

export default function ReportsAnalytics() {
  const { language, toggleLanguage, t: translate } = useLanguage()
  const [data] = useState(() => getMockReportsData())
  const [filters, setFilters] = useState<ReportsFilter>({
    department: 'all',
    period: 'month',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
  })

  const handleApplyFilters = useCallback(() => {
    console.log('Applying filters:', filters)
    // In production, would fetch filtered data from API with caching
  }, [filters])

  const handleExportCSV = useCallback(() => {
    console.log('Exporting CSV...')
    // Create export in background without blocking UI
    safeRequestIdleCallback(() => {
      alert(language === 'vi' ? 'Đang xuất file CSV...' : 'Exporting CSV file...')
    })
  }, [language])

  const handleExportPDF = useCallback(() => {
    console.log('Exporting PDF...')
    // Create export in background without blocking UI
    safeRequestIdleCallback(() => {
      alert(language === 'vi' ? 'Đang xuất file PDF...' : 'Exporting PDF file...')
    })
  }, [language])

  const handleRefresh = useCallback(() => {
    console.log('Refreshing data...')
    // Would invalidate cache and refetch
  }, [])

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
        </div>
      </main>
    </div>
  )
}
