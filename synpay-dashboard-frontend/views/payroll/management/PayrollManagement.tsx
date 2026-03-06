'use client'

import { useState, useMemo, memo, useCallback } from 'react'
import { Sidebar, Header } from '@/components/layout'
import { useLanguage } from '@/components/providers/LanguageProvider'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import PayrollTable from './components/PayrollTable'
import QuickInput from './components/QuickInput'
import ImportExcel from './components/ImportExcel'
import { departments } from './data'
import { usePayroll, type SalaryItem } from '@/hooks/usePayroll'
import { fetchEmployees, type ApiEmployeeResponse } from '@/api/employees'
import type { PayrollFilters } from './types'
import {
  DollarSign, TrendingUp, Users, Download, Search,
  X, ChevronLeft, ChevronRight, Plus, Zap, FileSpreadsheet,
} from 'lucide-react'

// Module-level currency formatter
const currencyFormatter = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
const formatCurrency = (amount: number) => currencyFormatter.format(amount)

// Stat card
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

export default function PayrollManagement() {
  const { language, toggleLanguage, t } = useLanguage()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Filters
  const [filters, setFilters] = useState<PayrollFilters>({
    search: '',
    salaryMonth: '',
    departmentId: '',
  })

  // API hook
  const {
    salaries, salaryMonths, totalElements, totalPages, currentPage, pageSize,
    isLoading, error, isSaving,
    loadSalaries, getEmployeeHistory, adjust, create, exportExcel, clearError,
  } = usePayroll({
    page: 0,
    size: 20,
  })

  // Detail drawer state
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailEmployee, setDetailEmployee] = useState<{ name: string; department: string; position: string } | null>(null)
  const [detailHistory, setDetailHistory] = useState<SalaryItem[]>([])

  // Adjust modal state
  const [adjustOpen, setAdjustOpen] = useState(false)
  const [adjustSalaryId, setAdjustSalaryId] = useState<number | null>(null)
  const [adjustBaseSalary, setAdjustBaseSalary] = useState('')
  const [adjustBonus, setAdjustBonus] = useState('')
  const [adjustDeductions, setAdjustDeductions] = useState('')
  const [adjustNetSalary, setAdjustNetSalary] = useState('')

  // Quick Input state
  const [quickInputOpen, setQuickInputOpen] = useState(false)

  // Import Excel state
  const [importExcelOpen, setImportExcelOpen] = useState(false)

  // Create modal state
  const [createOpen, setCreateOpen] = useState(false)
  const [createDeptId, setCreateDeptId] = useState('')
  const [createEmployees, setCreateEmployees] = useState<ApiEmployeeResponse[]>([])
  const [createEmployeesLoading, setCreateEmployeesLoading] = useState(false)
  const [createEmployeeId, setCreateEmployeeId] = useState('')
  const [createSalaryMonth, setCreateSalaryMonth] = useState('')
  const [createBaseSalary, setCreateBaseSalary] = useState('')
  const [createBonus, setCreateBonus] = useState('')
  const [createDeductions, setCreateDeductions] = useState('')
  const [createNetSalary, setCreateNetSalary] = useState('')

  // ── Filter handler (calls API) ─────────────────────────────

  const applyFilters = useCallback((newFilters: PayrollFilters, page = 0) => {
    setFilters(newFilters)
    loadSalaries({
      page,
      size: pageSize,
      salary_month: newFilters.salaryMonth || undefined,
      department_id: newFilters.departmentId ? Number(newFilters.departmentId) : undefined,
    })
  }, [loadSalaries, pageSize])

  const handlePageChange = useCallback((page: number) => {
    applyFilters(filters, page)
  }, [applyFilters, filters])

  // ── Row click → detail drawer with full salary history ───

  const handleRowClick = useCallback(async (salaryId: number) => {
    const clicked = salaries.find(s => s.salaryId === salaryId)
    if (!clicked) return
    setDetailEmployee({
      name: clicked.employeeName,
      department: clicked.departmentName,
      position: clicked.positionName,
    })
    setDetailHistory([])
    setDetailOpen(true)
    setDetailLoading(true)
    try {
      const history = await getEmployeeHistory(clicked.employeeId)
      setDetailHistory(history)
    } catch {
      setDetailHistory([])
    } finally {
      setDetailLoading(false)
    }
  }, [salaries, getEmployeeHistory])

  // ── Adjust modal ───────────────────────────────────────────

  const handleAdjustOpen = useCallback((salaryId: number) => {
    const sal = salaries.find(s => s.salaryId === salaryId)
    setAdjustSalaryId(salaryId)
    setAdjustBaseSalary(sal ? String(sal.baseSalary) : '')
    setAdjustBonus(sal ? String(sal.bonus) : '')
    setAdjustDeductions(sal ? String(sal.deductions) : '')
    setAdjustNetSalary(sal ? String(sal.netSalary) : '')
    setAdjustOpen(true)
  }, [salaries])

  const handleAdjustSubmit = useCallback(async () => {
    if (adjustSalaryId === null) return
    try {
      await adjust(adjustSalaryId, {
        baseSalary: adjustBaseSalary !== '' ? Number(adjustBaseSalary) : undefined,
        bonus: adjustBonus !== '' ? Number(adjustBonus) : undefined,
        deductions: adjustDeductions !== '' ? Number(adjustDeductions) : undefined,
        netSalary: adjustNetSalary !== '' ? Number(adjustNetSalary) : undefined,
      })
      setAdjustOpen(false)
    } catch { /* error is set in hook state */ }
  }, [adjustSalaryId, adjustBaseSalary, adjustBonus, adjustDeductions, adjustNetSalary, adjust])


  // ── Export ─────────────────────────────────────────────────

  const handleExport = useCallback(async () => {
    await exportExcel({
      salary_month: filters.salaryMonth || undefined,
      department_id: filters.departmentId ? Number(filters.departmentId) : undefined,
    })
  }, [exportExcel, filters])

  // ── Create modal handlers ──────────────────────────────────

  const handleCreateOpen = useCallback(() => {
    setCreateDeptId('')
    setCreateEmployees([])
    setCreateEmployeeId('')
    setCreateSalaryMonth('')
    setCreateBaseSalary('')
    setCreateBonus('')
    setCreateDeductions('')
    setCreateNetSalary('')
    setCreateOpen(true)
  }, [])

  const handleCreateDeptChange = useCallback(async (deptId: string) => {
    setCreateDeptId(deptId)
    setCreateEmployeeId('')
    setCreateEmployees([])
    if (!deptId) return
    setCreateEmployeesLoading(true)
    try {
      const page = await fetchEmployees({ departmentId: Number(deptId), size: 200 })
      setCreateEmployees(page.content)
    } catch {
      setCreateEmployees([])
    } finally {
      setCreateEmployeesLoading(false)
    }
  }, [])

  const handleCreateSubmit = useCallback(async () => {
    if (!createEmployeeId || !createSalaryMonth || !createBaseSalary) return
    try {
      await create({
        employeeId: Number(createEmployeeId),
        salaryMonth: createSalaryMonth,
        baseSalary: Number(createBaseSalary),
        bonus: createBonus !== '' ? Number(createBonus) : undefined,
        deductions: createDeductions !== '' ? Number(createDeductions) : undefined,
        netSalary: createNetSalary !== '' ? Number(createNetSalary) : undefined,
      })
      setCreateOpen(false)
    } catch { /* error is set in hook state */ }
  }, [createEmployeeId, createSalaryMonth, createBaseSalary, createBonus, createDeductions, createNetSalary, create])

  // ── Client-side search filter ──────────────────────────────

  const displayedSalaries = useMemo(() => {
    if (!filters.search) return salaries
    const searchLower = filters.search.toLowerCase()
    return salaries.filter(s =>
      s.employeeName.toLowerCase().includes(searchLower) ||
      s.departmentName.toLowerCase().includes(searchLower) ||
      s.positionName.toLowerCase().includes(searchLower)
    )
  }, [salaries, filters.search])

  // ── Stats ──────────────────────────────────────────────────

  const stats = useMemo(() => {
    if (displayedSalaries.length === 0) {
      return { totalPayroll: 0, avgSalary: 0, count: 0 }
    }
    let totalPayroll = 0
    displayedSalaries.forEach(s => { totalPayroll += s.netSalary })
    return {
      totalPayroll,
      avgSalary: totalPayroll / displayedSalaries.length,
      count: displayedSalaries.length,
    }
  }, [displayedSalaries])

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900">
      <Sidebar language={language} t={t} activeRoute="/payroll" />

      <main className="flex-1 flex flex-col min-w-0">
        <Header
          language={language}
          onLanguageToggle={toggleLanguage}
          onRefresh={() => applyFilters(filters, currentPage)}
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
          {/* Error Banner */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center justify-between">
              <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
              <button onClick={clearError} className="text-red-500 hover:text-red-700">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <StatCard
              title={language === 'vi' ? 'Tổng Chi Lương' : 'Total Payroll'}
              value={formatCurrency(stats.totalPayroll)}
              subtitle={`${stats.count} bản ghi`}
              icon={DollarSign}
              subtitleColor="text-emerald-600 dark:text-emerald-400"
            />
            <StatCard
              title={language === 'vi' ? 'Trung Bình Lương' : 'Avg Salary'}
              value={formatCurrency(stats.avgSalary)}
              subtitle="Per employee"
              icon={TrendingUp}
            />
            <StatCard
              title={language === 'vi' ? 'Tổng Nhân Viên' : 'Total Records'}
              value={totalElements}
              subtitle={`${totalPages} trang`}
              icon={Users}
            />
          </div>

          {/* Filters */}
          <Card className="p-4 md:p-6 mb-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder={language === 'vi' ? 'Tìm kiếm nhân viên...' : 'Search employees...'}
                    value={filters.search}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilters({ ...filters, search: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <select
                  value={filters.salaryMonth}
                  onChange={(e) => applyFilters({ ...filters, salaryMonth: e.target.value })}
                  className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">{language === 'vi' ? 'Tất cả tháng' : 'All months'}</option>
                  {salaryMonths.map(m => {
                    const d = new Date(m + 'T00:00:00')
                    const label = `Tháng ${d.getMonth() + 1}/${d.getFullYear()}`
                    return <option key={m} value={m}>{label}</option>
                  })}
                </select>

                <select
                  value={filters.departmentId}
                  onChange={(e) => applyFilters({ ...filters, departmentId: e.target.value })}
                  className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">{language === 'vi' ? 'Tất cả phòng ban' : 'All departments'}</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>

                <Button className="gap-2" onClick={handleExport}>
                  <Download className="w-4 h-4" />
                  {language === 'vi' ? 'Xuất Excel' : 'Export Excel'}
                </Button>

                <Button className="gap-2" onClick={handleCreateOpen}>
                  <Plus className="w-4 h-4" />
                  {language === 'vi' ? 'Thêm lương' : 'Add Salary'}
                </Button>

                <Button className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white" onClick={() => setQuickInputOpen(true)}>
                  <Zap className="w-4 h-4" />
                  {language === 'vi' ? 'Nhập nhanh' : 'Quick Input'}
                </Button>

                <Button className="gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white" onClick={() => setImportExcelOpen(true)}>
                  <FileSpreadsheet className="w-4 h-4" />
                  {language === 'vi' ? 'Import Excel' : 'Import Excel'}
                </Button>
              </div>
            </div>
          </Card>

          {/* Table */}
          <PayrollTable
            data={displayedSalaries}
            isLoading={isLoading}
            onRowClick={handleRowClick}
            onAdjustClick={handleAdjustOpen}
            t={t}
          />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <span className="text-sm text-slate-600 dark:text-slate-400">
                Trang {currentPage + 1} / {totalPages} ({totalElements} bản ghi)
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 0}
                  onClick={() => handlePageChange(currentPage - 1)}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage + 1 >= totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ── Detail Drawer (slide-over) ───────────────────────── */}
      {detailOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDetailOpen(false)} />
          <div className="relative w-full max-w-3xl bg-white dark:bg-slate-800 shadow-xl overflow-y-auto">
            <div className="sticky top-0 z-10 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-6 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {language === 'vi' ? 'Lịch Sử Lương' : 'Salary History'}
                </h2>
                {detailEmployee && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    {detailEmployee.name} &middot; {detailEmployee.department} &middot; {detailEmployee.position}
                  </p>
                )}
              </div>
              <button onClick={() => setDetailOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {detailLoading ? (
              <div className="p-12 text-center">
                <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
                <p className="text-sm text-slate-500">{language === 'vi' ? 'Đang tải dữ liệu...' : 'Loading...'}</p>
              </div>
            ) : detailHistory.length > 0 ? (
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          {language === 'vi' ? 'Tháng' : 'Month'}
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          {language === 'vi' ? 'Lương cơ bản' : 'Base Salary'}
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          {language === 'vi' ? 'Thưởng' : 'Bonus'}
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          {language === 'vi' ? 'Khấu trừ' : 'Deductions'}
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          {language === 'vi' ? 'Thực nhận' : 'Net Salary'}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      {detailHistory.map((row) => {
                        const d = new Date(row.salaryMonth + 'T00:00:00')
                        const label = `Tháng ${d.getMonth() + 1}/${d.getFullYear()}`
                        return (
                          <tr key={row.salaryId} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                            <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-white">{label}</td>
                            <td className="px-4 py-3 text-sm text-right text-slate-900 dark:text-white">{formatCurrency(row.baseSalary)}</td>
                            <td className="px-4 py-3 text-sm text-right text-emerald-600 dark:text-emerald-400">{formatCurrency(row.bonus)}</td>
                            <td className="px-4 py-3 text-sm text-right text-red-600 dark:text-red-400">{formatCurrency(row.deductions)}</td>
                            <td className="px-4 py-3 text-sm text-right font-bold text-blue-600 dark:text-blue-400">{formatCurrency(row.netSalary)}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                    <tfoot className="border-t-2 border-slate-300 dark:border-slate-600">
                      <tr className="bg-slate-50 dark:bg-slate-900">
                        <td className="px-4 py-3 text-sm font-bold text-slate-900 dark:text-white">
                          {language === 'vi' ? `Tổng (${detailHistory.length} tháng)` : `Total (${detailHistory.length} months)`}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-bold text-slate-900 dark:text-white">
                          {formatCurrency(detailHistory.reduce((sum, r) => sum + r.baseSalary, 0))}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-bold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(detailHistory.reduce((sum, r) => sum + r.bonus, 0))}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-bold text-red-600 dark:text-red-400">
                          {formatCurrency(detailHistory.reduce((sum, r) => sum + r.deductions, 0))}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-bold text-blue-600 dark:text-blue-400">
                          {formatCurrency(detailHistory.reduce((sum, r) => sum + r.netSalary, 0))}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500">Không tìm thấy dữ liệu lương.</div>
            )}
          </div>
        </div>
      )}

      {/* ── Adjust Modal ─────────────────────────────────────── */}
      {adjustOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setAdjustOpen(false)} />
          <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {language === 'vi' ? 'Điều Chỉnh Lương' : 'Adjust Salary'}
              </h2>
              <button onClick={() => setAdjustOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'vi' ? 'Lương cơ bản (VND)' : 'Base Salary (VND)'}
                </label>
                <Input
                  type="number"
                  min="0"
                  value={adjustBaseSalary}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAdjustBaseSalary(e.target.value)}
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'vi' ? 'Thưởng (VND)' : 'Bonus (VND)'}
                </label>
                <Input
                  type="number"
                  min="0"
                  value={adjustBonus}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAdjustBonus(e.target.value)}
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'vi' ? 'Khấu trừ (VND)' : 'Deductions (VND)'}
                </label>
                <Input
                  type="number"
                  min="0"
                  value={adjustDeductions}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAdjustDeductions(e.target.value)}
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'vi' ? 'Thực lĩnh (VND)' : 'Net Salary (VND)'}
                </label>
                <Input
                  type="number"
                  min="0"
                  value={adjustNetSalary}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAdjustNetSalary(e.target.value)}
                  placeholder="Tự động tính nếu để trống"
                />
                <p className="text-xs text-slate-500 mt-1">
                  {language === 'vi' ? 'Để trống để tự động tính: Lương CB + Thưởng - Khấu trừ' : 'Leave empty to auto-calculate: Base + Bonus - Deductions'}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setAdjustOpen(false)}>
                {language === 'vi' ? 'Hủy' : 'Cancel'}
              </Button>
              <Button onClick={handleAdjustSubmit} disabled={isSaving}>
                {isSaving
                  ? (language === 'vi' ? 'Đang lưu...' : 'Saving...')
                  : (language === 'vi' ? 'Lưu thay đổi' : 'Save Changes')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Create Salary Modal ──────────────────────────────── */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setCreateOpen(false)} />
          <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {language === 'vi' ? 'Thêm Dữ Liệu Lương' : 'Add Salary Record'}
              </h2>
              <button onClick={() => setCreateOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Department */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'vi' ? 'Phòng ban' : 'Department'} <span className="text-red-500">*</span>
                </label>
                <select
                  value={createDeptId}
                  onChange={(e) => handleCreateDeptChange(e.target.value)}
                  className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">{language === 'vi' ? '-- Chọn phòng ban --' : '-- Select department --'}</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>

              {/* Employee */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'vi' ? 'Nhân viên' : 'Employee'} <span className="text-red-500">*</span>
                </label>
                <select
                  value={createEmployeeId}
                  onChange={(e) => setCreateEmployeeId(e.target.value)}
                  disabled={!createDeptId || createEmployeesLoading}
                  className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  <option value="">
                    {createEmployeesLoading
                      ? (language === 'vi' ? 'Đang tải...' : 'Loading...')
                      : !createDeptId
                        ? (language === 'vi' ? '-- Chọn phòng ban trước --' : '-- Select department first --')
                        : (language === 'vi' ? '-- Chọn nhân viên --' : '-- Select employee --')}
                  </option>
                  {createEmployees.map(emp => (
                    <option key={emp.employeeId} value={emp.employeeId}>
                      {emp.fullName} (ID: {emp.employeeId})
                    </option>
                  ))}
                </select>
              </div>

              {/* Salary Month */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'vi' ? 'Tháng lương' : 'Salary Month'} <span className="text-red-500">*</span>
                </label>
                <Input
                  type="month"
                  value={createSalaryMonth ? createSalaryMonth.substring(0, 7) : ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const val = e.target.value
                    setCreateSalaryMonth(val ? `${val}-01` : '')
                  }}
                />
              </div>

              {/* Base Salary */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'vi' ? 'Lương cơ bản (VND)' : 'Base Salary (VND)'} <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  min="0"
                  value={createBaseSalary}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCreateBaseSalary(e.target.value)}
                  placeholder="0"
                />
              </div>

              {/* Bonus */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'vi' ? 'Thưởng (VND)' : 'Bonus (VND)'}
                </label>
                <Input
                  type="number"
                  min="0"
                  value={createBonus}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCreateBonus(e.target.value)}
                  placeholder="0"
                />
              </div>

              {/* Deductions */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'vi' ? 'Khấu trừ (VND)' : 'Deductions (VND)'}
                </label>
                <Input
                  type="number"
                  min="0"
                  value={createDeductions}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCreateDeductions(e.target.value)}
                  placeholder="0"
                />
              </div>

              {/* Net Salary */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'vi' ? 'Thực lĩnh (VND)' : 'Net Salary (VND)'}
                </label>
                <Input
                  type="number"
                  min="0"
                  value={createNetSalary}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCreateNetSalary(e.target.value)}
                  placeholder={language === 'vi' ? 'Tự động tính nếu để trống' : 'Auto-calculated if empty'}
                />
                <p className="text-xs text-slate-500 mt-1">
                  {language === 'vi' ? 'Để trống để tự động tính: Lương CB + Thưởng - Khấu trừ' : 'Leave empty to auto-calculate: Base + Bonus - Deductions'}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setCreateOpen(false)}>
                {language === 'vi' ? 'Hủy' : 'Cancel'}
              </Button>
              <Button
                onClick={handleCreateSubmit}
                disabled={isSaving || !createEmployeeId || !createSalaryMonth || !createBaseSalary}
              >
                {isSaving
                  ? (language === 'vi' ? 'Đang lưu...' : 'Saving...')
                  : (language === 'vi' ? 'Tạo mới' : 'Create')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Input overlay */}
      {quickInputOpen && (
        <QuickInput
          language={language}
          salaryMonths={salaryMonths}
          onClose={() => setQuickInputOpen(false)}
          onCreateSalary={create}
          onAdjustSalary={adjust}
          onComplete={() => applyFilters(filters, currentPage)}
        />
      )}

      {/* Import Excel modal */}
      {importExcelOpen && (
        <ImportExcel
          language={language}
          salaryMonths={salaryMonths}
          onClose={() => setImportExcelOpen(false)}
          onCreateSalary={create}
          onAdjustSalary={adjust}
          onComplete={() => applyFilters(filters, currentPage)}
        />
      )}
    </div>
  )
}
