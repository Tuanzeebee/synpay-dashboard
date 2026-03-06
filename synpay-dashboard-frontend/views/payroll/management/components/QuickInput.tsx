'use client'

import { useState, useCallback, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { departments } from '../data'
import { fetchEmployees, type ApiEmployeeResponse } from '@/api/employees'
import { fetchPayrollList, type ApiSalaryResponse } from '@/api/payroll'
import type { SalaryItem } from '@/hooks/usePayroll'
import type { CreateSalaryPayload, AdjustSalaryPayload } from '@/api/payroll'
import {
  X, ChevronRight, ChevronLeft, Zap, CheckCircle2,
  AlertTriangle, SkipForward, ClipboardPaste, Users,
  Eye,
} from 'lucide-react'

// ── Currency formatter ───────────────────────────────────────────
const fmt = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })

// ── Row types ────────────────────────────────────────────────────

type RowMode = 'new' | 'adjust' | 'skip'
type RowValidation = 'valid' | 'warning' | 'error' | 'skip'

interface GridRow {
  employeeId: number
  employeeName: string
  departmentName: string
  positionName: string
  mode: RowMode
  existingSalaryId: number | null
  existingBaseSalary: number | null
  existingBonus: number | null
  existingDeductions: number | null
  existingNetSalary: number | null
  // editable
  baseSalary: string
  bonus: string
  deductions: string
  // computed
  checked: boolean
  dirty: boolean
}

// ── Props ────────────────────────────────────────────────────────

interface QuickInputProps {
  language: string
  salaryMonths: string[]
  onClose: () => void
  onCreateSalary: (payload: CreateSalaryPayload) => Promise<SalaryItem>
  onAdjustSalary: (salaryId: number, payload: AdjustSalaryPayload) => Promise<SalaryItem>
  onComplete: () => void
}

// ── Steps ────────────────────────────────────────────────────────
type Step = 'setup' | 'grid' | 'preview'

export default function QuickInput({
  language,
  salaryMonths,
  onClose,
  onCreateSalary,
  onAdjustSalary,
  onComplete,
}: QuickInputProps) {
  const vi = language === 'vi'

  // ── Step 1: Setup state ────────────────────────────────────
  const [step, setStep] = useState<Step>('setup')
  const [selectedMonth, setSelectedMonth] = useState('')
  const [selectedDepts, setSelectedDepts] = useState<number[]>([])
  const [scopeType, setScopeType] = useState<'all' | 'department'>('department')

  // ── Step 2: Grid state ─────────────────────────────────────
  const [rows, setRows] = useState<GridRow[]>([])
  const [gridLoading, setGridLoading] = useState(false)
  const [selectAll, setSelectAll] = useState(true)

  // Quick-apply state
  const [applyField, setApplyField] = useState<'bonus' | 'deductions'>('bonus')
  const [applyValue, setApplyValue] = useState('')

  // Paste state
  const [pasteOpen, setPasteOpen] = useState(false)
  const [pasteText, setPasteText] = useState('')

  // ── Step 3: Submit state ───────────────────────────────────
  const [submitting, setSubmitting] = useState(false)
  const [submitProgress, setSubmitProgress] = useState(0)
  const [submitTotal, setSubmitTotal] = useState(0)
  const [submitResults, setSubmitResults] = useState<{ success: number; failed: { name: string; error: string }[] } | null>(null)

  // ── Helpers ────────────────────────────────────────────────

  const calcNet = (base: string, bonus: string, deductions: string) => {
    const b = Number(base) || 0
    const bo = Number(bonus) || 0
    const d = Number(deductions) || 0
    return b + bo - d
  }

  const getValidation = useCallback((row: GridRow): RowValidation => {
    if (!row.checked) return 'skip'
    if (row.mode === 'new' && (!row.baseSalary || Number(row.baseSalary) < 0)) return 'error'
    if (Number(row.bonus) < 0 || Number(row.deductions) < 0) return 'error'
    const net = row.mode === 'new'
      ? calcNet(row.baseSalary, row.bonus, row.deductions)
      : calcNet(String(row.existingBaseSalary ?? 0), row.bonus, row.deductions)
    if (net < 0) return 'error'
    if (net === 0) return 'warning'
    if (!row.dirty) return 'skip'
    return 'valid'
  }, [])

  // ── Step 1 → Step 2: Load data ────────────────────────────

  const handleLoadGrid = useCallback(async () => {
    if (!selectedMonth) return
    setGridLoading(true)
    try {
      const deptIds = scopeType === 'all' ? departments.map(d => d.id) : selectedDepts

      // Load employees for selected departments in parallel
      const empPromises = deptIds.map(id =>
        fetchEmployees({ departmentId: id, size: 200 })
      )
      const empResults = await Promise.all(empPromises)
      const allEmployees: ApiEmployeeResponse[] = []
      empResults.forEach(page => {
        page.content.forEach(emp => {
          if (!allEmployees.find(e => e.employeeId === emp.employeeId)) {
            allEmployees.push(emp)
          }
        })
      })

      // Load existing salary records for this month + departments
      const salPromises = deptIds.map(id =>
        fetchPayrollList({ salary_month: selectedMonth, department_id: id, size: 200 })
      )
      const salResults = await Promise.all(salPromises)
      const existingSalaries: ApiSalaryResponse[] = []
      salResults.forEach(page => {
        page.content.forEach(sal => {
          if (!existingSalaries.find(s => s.salaryId === sal.salaryId)) {
            existingSalaries.push(sal)
          }
        })
      })

      // Build grid rows
      const salByEmp = new Map<number, ApiSalaryResponse>()
      existingSalaries.forEach(s => salByEmp.set(s.employeeId, s))

      const gridRows: GridRow[] = allEmployees
        .filter(emp => {
          const s = (emp.status ?? '').toLowerCase()
          return s === 'active' || s === 'đang làm việc' || s === 'thử việc'
        })
        .map(emp => {
          const existing = salByEmp.get(emp.employeeId)
          if (existing) {
            return {
              employeeId: emp.employeeId,
              employeeName: emp.fullName,
              departmentName: emp.departmentName ?? '',
              positionName: emp.positionName ?? '',
              mode: 'adjust' as RowMode,
              existingSalaryId: existing.salaryId,
              existingBaseSalary: existing.baseSalary,
              existingBonus: existing.bonus,
              existingDeductions: existing.deductions,
              existingNetSalary: existing.netSalary,
              baseSalary: '',
              bonus: String(existing.bonus ?? 0),
              deductions: String(existing.deductions ?? 0),
              checked: true,
              dirty: false,
            }
          }
          return {
            employeeId: emp.employeeId,
            employeeName: emp.fullName,
            departmentName: emp.departmentName ?? '',
            positionName: emp.positionName ?? '',
            mode: 'new' as RowMode,
            existingSalaryId: null,
            existingBaseSalary: null,
            existingBonus: null,
            existingDeductions: null,
            existingNetSalary: null,
            baseSalary: '',
            bonus: '0',
            deductions: '0',
            checked: true,
            dirty: false,
          }
        })
        .sort((a, b) => {
          if (a.mode === 'new' && b.mode === 'adjust') return -1
          if (a.mode === 'adjust' && b.mode === 'new') return 1
          return a.departmentName.localeCompare(b.departmentName) || a.employeeName.localeCompare(b.employeeName)
        })

      setRows(gridRows)
      setSelectAll(true)
      setStep('grid')
    } catch {
      /* errors handled by parent hook */
    } finally {
      setGridLoading(false)
    }
  }, [selectedMonth, scopeType, selectedDepts])

  // ── Grid cell update ───────────────────────────────────────

  const updateRow = useCallback((idx: number, field: 'baseSalary' | 'bonus' | 'deductions', value: string) => {
    setRows(prev => prev.map((r, i) => {
      if (i !== idx) return r
      const updated = { ...r, [field]: value, dirty: true }
      return updated
    }))
  }, [])

  const toggleRow = useCallback((idx: number) => {
    setRows(prev => prev.map((r, i) => i === idx ? { ...r, checked: !r.checked } : r))
  }, [])

  const handleSelectAll = useCallback((checked: boolean) => {
    setSelectAll(checked)
    setRows(prev => prev.map(r => ({ ...r, checked })))
  }, [])

  // ── Quick Apply ────────────────────────────────────────────

  const handleQuickApply = useCallback(() => {
    if (!applyValue) return
    setRows(prev => prev.map(r => {
      if (!r.checked) return r
      return { ...r, [applyField]: applyValue, dirty: true }
    }))
    setApplyValue('')
  }, [applyField, applyValue])

  // ── Paste from Excel ───────────────────────────────────────

  const handlePaste = useCallback(() => {
    if (!pasteText.trim()) return
    const lines = pasteText.trim().split('\n')
    const parsed = new Map<number, { bonus?: string; deductions?: string }>()

    for (const line of lines) {
      const cols = line.split('\t').map(c => c.trim())
      if (cols.length < 2) continue
      const empId = parseInt(cols[0], 10)
      if (isNaN(empId)) continue
      parsed.set(empId, {
        bonus: cols[1] || undefined,
        deductions: cols[2] || undefined,
      })
    }

    setRows(prev => prev.map(r => {
      const data = parsed.get(r.employeeId)
      if (!data) return r
      return {
        ...r,
        bonus: data.bonus ?? r.bonus,
        deductions: data.deductions ?? r.deductions,
        dirty: true,
      }
    }))

    setPasteOpen(false)
    setPasteText('')
  }, [pasteText])

  // ── Grid summary stats ─────────────────────────────────────

  const gridStats = useMemo(() => {
    let newCount = 0, adjustCount = 0, skipCount = 0, errorCount = 0, warningCount = 0
    let totalBonus = 0, totalDeductions = 0, totalNet = 0

    rows.forEach(r => {
      const v = getValidation(r)
      if (v === 'skip') { skipCount++; return }
      if (v === 'error') { errorCount++; return }
      if (v === 'warning') warningCount++

      if (r.mode === 'new') {
        newCount++
        const net = calcNet(r.baseSalary, r.bonus, r.deductions)
        totalBonus += Number(r.bonus) || 0
        totalDeductions += Number(r.deductions) || 0
        totalNet += net
      } else if (r.dirty) {
        adjustCount++
        totalBonus += Number(r.bonus) || 0
        totalDeductions += Number(r.deductions) || 0
        totalNet += calcNet(String(r.existingBaseSalary ?? 0), r.bonus, r.deductions)
      } else {
        skipCount++
      }
    })

    return { newCount, adjustCount, skipCount, errorCount, warningCount, totalBonus, totalDeductions, totalNet }
  }, [rows, getValidation])

  // ── Actionable rows for preview/submit ─────────────────────

  const actionableRows = useMemo(() => {
    return rows.filter(r => {
      const v = getValidation(r)
      return r.checked && r.dirty && (v === 'valid' || v === 'warning')
    })
  }, [rows, getValidation])

  // ── Submit ─────────────────────────────────────────────────

  const handleSubmit = useCallback(async () => {
    const toSubmit = actionableRows
    if (toSubmit.length === 0) return

    setSubmitting(true)
    setSubmitTotal(toSubmit.length)
    setSubmitProgress(0)
    const failed: { name: string; error: string }[] = []
    let success = 0

    for (let i = 0; i < toSubmit.length; i++) {
      const r = toSubmit[i]
      try {
        if (r.mode === 'new') {
          await onCreateSalary({
            employeeId: r.employeeId,
            salaryMonth: selectedMonth,
            baseSalary: Number(r.baseSalary),
            bonus: Number(r.bonus) || 0,
            deductions: Number(r.deductions) || 0,
          })
        } else if (r.existingSalaryId) {
          await onAdjustSalary(r.existingSalaryId, {
            bonus: Number(r.bonus),
            deductions: Number(r.deductions),
          })
        }
        success++
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error'
        failed.push({ name: r.employeeName, error: msg })
      }
      setSubmitProgress(i + 1)
    }

    setSubmitResults({ success, failed })
    setSubmitting(false)
  }, [actionableRows, selectedMonth, onCreateSalary, onAdjustSalary])

  // ── Month label ────────────────────────────────────────────

  const monthLabel = useMemo(() => {
    if (!selectedMonth) return ''
    const d = new Date(selectedMonth + 'T00:00:00')
    return `Tháng ${d.getMonth() + 1}/${d.getFullYear()}`
  }, [selectedMonth])

  // ── Dept toggle ────────────────────────────────────────────

  const toggleDept = useCallback((id: number) => {
    setSelectedDepts(prev =>
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    )
  }, [])

  // ── Validation icon ────────────────────────────────────────

  const ValidationBadge = ({ v }: { v: RowValidation }) => {
    if (v === 'valid') return <CheckCircle2 className="w-4 h-4 text-emerald-500" />
    if (v === 'warning') return <AlertTriangle className="w-4 h-4 text-amber-500" />
    if (v === 'error') return <X className="w-4 h-4 text-red-500" />
    return <SkipForward className="w-4 h-4 text-slate-400" />
  }

  // ═══════════════════════════════════════════════════════════
  //  RENDER
  // ═══════════════════════════════════════════════════════════

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 dark:bg-slate-900 flex flex-col overflow-hidden">
      {/* ── Header ───────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">
              {vi ? 'Nhập Nhanh Dữ Liệu Lương' : 'Quick Salary Input'}
            </h1>
            {selectedMonth && (
              <p className="text-xs text-slate-500">{monthLabel}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Step indicator */}
          <div className="hidden sm:flex items-center gap-1 text-xs">
            {(['setup', 'grid', 'preview'] as Step[]).map((s, i) => (
              <div key={s} className="flex items-center gap-1">
                {i > 0 && <ChevronRight className="w-3 h-3 text-slate-400" />}
                <span className={`px-2 py-0.5 rounded-full font-medium ${step === s ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : 'text-slate-400'}`}>
                  {i + 1}. {s === 'setup' ? (vi ? 'Thiết lập' : 'Setup') : s === 'grid' ? (vi ? 'Nhập liệu' : 'Input') : (vi ? 'Xác nhận' : 'Confirm')}
                </span>
              </div>
            ))}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">

        {/* ═══════ STEP 1: SETUP ═══════ */}
        {step === 'setup' && (
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Month selector */}
            <Card className="p-6">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-3 uppercase tracking-wider">
                {vi ? 'Bước 1 — Chọn kỳ lương' : 'Step 1 — Select payroll period'}
              </h2>
              <select
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{vi ? '-- Chọn tháng --' : '-- Select month --'}</option>
                {salaryMonths.map(m => {
                  const d = new Date(m + 'T00:00:00')
                  return <option key={m} value={m}>Tháng {d.getMonth() + 1}/{d.getFullYear()}</option>
                })}
                {/* Allow custom month input */}
                <option value="__custom">{vi ? '+ Nhập tháng mới...' : '+ Enter new month...'}</option>
              </select>
              {selectedMonth === '__custom' && (
                <div className="mt-3">
                  <Input
                    type="month"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const val = e.target.value
                      if (val) setSelectedMonth(`${val}-01`)
                    }}
                    className="w-full"
                  />
                </div>
              )}
            </Card>

            {/* Scope selector */}
            <Card className="p-6">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-3 uppercase tracking-wider">
                {vi ? 'Bước 2 — Chọn phạm vi' : 'Step 2 — Select scope'}
              </h2>

              <div className="flex gap-3 mb-4">
                <button
                  onClick={() => setScopeType('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    scopeType === 'all'
                      ? 'bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-900/30 dark:border-blue-600 dark:text-blue-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <Users className="w-4 h-4 inline mr-1.5" />
                  {vi ? 'Tất cả phòng ban' : 'All departments'}
                </button>
                <button
                  onClick={() => setScopeType('department')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    scopeType === 'department'
                      ? 'bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-900/30 dark:border-blue-600 dark:text-blue-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {vi ? 'Chọn phòng ban' : 'By department'}
                </button>
              </div>

              {scopeType === 'department' && (
                <div className="grid grid-cols-2 gap-2">
                  {departments.map(dept => (
                    <label
                      key={dept.id}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                        selectedDepts.includes(dept.id)
                          ? 'bg-blue-50 border-blue-300 dark:bg-blue-900/20 dark:border-blue-600'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedDepts.includes(dept.id)}
                        onChange={() => toggleDept(dept.id)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300">{dept.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </Card>

            {/* Action */}
            <div className="flex justify-end">
              <Button
                onClick={handleLoadGrid}
                disabled={!selectedMonth || selectedMonth === '__custom' || (scopeType === 'department' && selectedDepts.length === 0) || gridLoading}
                className="gap-2"
              >
                {gridLoading ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    {vi ? 'Đang tải...' : 'Loading...'}
                  </>
                ) : (
                  <>
                    {vi ? 'Tải danh sách' : 'Load employees'}
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* ═══════ STEP 2: GRID ═══════ */}
        {step === 'grid' && (
          <div className="space-y-4">
            {/* Toolbar */}
            <Card className="p-4">
              <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center justify-between">
                {/* Quick apply */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                    {vi ? 'Áp dụng nhanh:' : 'Quick apply:'}
                  </span>
                  <select
                    value={applyField}
                    onChange={e => setApplyField(e.target.value as 'bonus' | 'deductions')}
                    className="px-3 py-1.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  >
                    <option value="bonus">{vi ? 'Thưởng' : 'Bonus'}</option>
                    <option value="deductions">{vi ? 'Khấu trừ' : 'Deductions'}</option>
                  </select>
                  <Input
                    type="number"
                    min="0"
                    value={applyValue}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setApplyValue(e.target.value)}
                    placeholder="VND"
                    className="w-36 h-8 text-sm"
                  />
                  <Button size="sm" variant="outline" onClick={handleQuickApply} disabled={!applyValue}>
                    {vi ? 'Áp dụng' : 'Apply'}
                  </Button>
                </div>

                {/* Paste + Stats */}
                <div className="flex items-center gap-3">
                  <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setPasteOpen(true)}>
                    <ClipboardPaste className="w-3.5 h-3.5" />
                    {vi ? 'Paste Excel' : 'Paste Excel'}
                  </Button>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {rows.length} {vi ? 'nhân viên' : 'employees'}
                    {gridStats.newCount > 0 && <span className="ml-1 text-blue-600">• {gridStats.newCount} {vi ? 'mới' : 'new'}</span>}
                    {gridStats.adjustCount > 0 && <span className="ml-1 text-amber-600">• {gridStats.adjustCount} {vi ? 'cập nhật' : 'update'}</span>}
                    {gridStats.errorCount > 0 && <span className="ml-1 text-red-600">• {gridStats.errorCount} {vi ? 'lỗi' : 'errors'}</span>}
                  </div>
                </div>
              </div>
            </Card>

            {/* Data Grid */}
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="px-3 py-3 text-left w-10">
                        <input
                          type="checkbox"
                          checked={selectAll}
                          onChange={e => handleSelectAll(e.target.checked)}
                          className="rounded border-slate-300 text-blue-600"
                        />
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase w-8">#</th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase min-w-[180px]">
                        {vi ? 'Nhân viên' : 'Employee'}
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase min-w-[120px]">
                        {vi ? 'Phòng ban' : 'Department'}
                      </th>
                      <th className="px-3 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase min-w-[140px]">
                        {vi ? 'Lương CB' : 'Base Salary'}
                      </th>
                      <th className="px-3 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase min-w-[130px]">
                        {vi ? 'Thưởng' : 'Bonus'}
                      </th>
                      <th className="px-3 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase min-w-[130px]">
                        {vi ? 'Khấu trừ' : 'Deductions'}
                      </th>
                      <th className="px-3 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase min-w-[140px]">
                        {vi ? 'Thực lĩnh' : 'Net Salary'}
                      </th>
                      <th className="px-3 py-3 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase w-20">
                        {vi ? 'Loại' : 'Type'}
                      </th>
                      <th className="px-3 py-3 w-8"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                    {rows.map((row, idx) => {
                      const v = getValidation(row)
                      const net = row.mode === 'new'
                        ? calcNet(row.baseSalary, row.bonus, row.deductions)
                        : calcNet(String(row.existingBaseSalary ?? 0), row.bonus, row.deductions)

                      return (
                        <tr
                          key={row.employeeId}
                          className={`transition-colors ${
                            !row.checked ? 'opacity-40' :
                            v === 'error' ? 'bg-red-50/50 dark:bg-red-900/10' :
                            v === 'warning' ? 'bg-amber-50/50 dark:bg-amber-900/10' :
                            'hover:bg-slate-50/50 dark:hover:bg-slate-800/30'
                          }`}
                        >
                          <td className="px-3 py-2">
                            <input
                              type="checkbox"
                              checked={row.checked}
                              onChange={() => toggleRow(idx)}
                              className="rounded border-slate-300 text-blue-600"
                            />
                          </td>
                          <td className="px-3 py-2 text-xs text-slate-400">{idx + 1}</td>
                          <td className="px-3 py-2">
                            <div className="text-sm font-medium text-slate-900 dark:text-white">{row.employeeName}</div>
                            <div className="text-xs text-slate-500">ID: {row.employeeId}</div>
                          </td>
                          <td className="px-3 py-2 text-sm text-slate-600 dark:text-slate-400">{row.departmentName}</td>

                          {/* Base Salary */}
                          <td className="px-3 py-2 text-right">
                            {row.mode === 'new' ? (
                              <Input
                                type="number"
                                min="0"
                                value={row.baseSalary}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateRow(idx, 'baseSalary', e.target.value)}
                                className={`h-8 text-sm text-right w-32 ${!row.baseSalary && row.checked ? 'border-red-300 dark:border-red-700' : ''}`}
                                placeholder="Bắt buộc"
                                disabled={!row.checked}
                              />
                            ) : (
                              <span className="text-sm text-slate-600 dark:text-slate-300">
                                {fmt.format(row.existingBaseSalary ?? 0)}
                              </span>
                            )}
                          </td>

                          {/* Bonus */}
                          <td className="px-3 py-2 text-right">
                            <Input
                              type="number"
                              min="0"
                              value={row.bonus}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateRow(idx, 'bonus', e.target.value)}
                              className="h-8 text-sm text-right w-28"
                              placeholder="0"
                              disabled={!row.checked}
                            />
                          </td>

                          {/* Deductions */}
                          <td className="px-3 py-2 text-right">
                            <Input
                              type="number"
                              min="0"
                              value={row.deductions}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateRow(idx, 'deductions', e.target.value)}
                              className="h-8 text-sm text-right w-28"
                              placeholder="0"
                              disabled={!row.checked}
                            />
                          </td>

                          {/* Net (auto) */}
                          <td className={`px-3 py-2 text-right text-sm font-semibold ${
                            net < 0 ? 'text-red-600' : 'text-blue-600 dark:text-blue-400'
                          }`}>
                            {row.checked ? fmt.format(net) : '—'}
                          </td>

                          {/* Type badge */}
                          <td className="px-3 py-2 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                              row.mode === 'new'
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                            }`}>
                              {row.mode === 'new' ? (vi ? 'Mới' : 'New') : (vi ? 'Sửa' : 'Edit')}
                            </span>
                          </td>

                          {/* Validation */}
                          <td className="px-3 py-2"><ValidationBadge v={v} /></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {rows.length === 0 && (
                <div className="p-12 text-center text-slate-500">
                  {vi ? 'Không tìm thấy nhân viên nào.' : 'No employees found.'}
                </div>
              )}
            </Card>

            {/* Footer summary + nav */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> {gridStats.newCount + gridStats.adjustCount} {vi ? 'sẽ lưu' : 'will save'}</span>
                <span className="flex items-center gap-1"><SkipForward className="w-3.5 h-3.5 text-slate-400" /> {gridStats.skipCount} {vi ? 'bỏ qua' : 'skip'}</span>
                {gridStats.errorCount > 0 && <span className="flex items-center gap-1"><X className="w-3.5 h-3.5 text-red-500" /> {gridStats.errorCount} {vi ? 'lỗi' : 'errors'}</span>}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep('setup')} className="gap-1">
                  <ChevronLeft className="w-4 h-4" />
                  {vi ? 'Quay lại' : 'Back'}
                </Button>
                <Button
                  onClick={() => setStep('preview')}
                  disabled={actionableRows.length === 0}
                  className="gap-1"
                >
                  <Eye className="w-4 h-4" />
                  {vi ? `Xem trước (${actionableRows.length})` : `Preview (${actionableRows.length})`}
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ═══════ STEP 3: PREVIEW & SUBMIT ═══════ */}
        {step === 'preview' && !submitResults && (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Summary cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Card className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{gridStats.newCount}</div>
                <div className="text-xs text-slate-500 mt-1">{vi ? 'Tạo mới' : 'Create'}</div>
              </Card>
              <Card className="p-4 text-center">
                <div className="text-2xl font-bold text-amber-600">{gridStats.adjustCount}</div>
                <div className="text-xs text-slate-500 mt-1">{vi ? 'Cập nhật' : 'Update'}</div>
              </Card>
              <Card className="p-4 text-center">
                <div className="text-2xl font-bold text-emerald-600">{fmt.format(gridStats.totalBonus)}</div>
                <div className="text-xs text-slate-500 mt-1">{vi ? 'Tổng thưởng' : 'Total bonus'}</div>
              </Card>
              <Card className="p-4 text-center">
                <div className="text-2xl font-bold text-red-600">{fmt.format(gridStats.totalDeductions)}</div>
                <div className="text-xs text-slate-500 mt-1">{vi ? 'Tổng khấu trừ' : 'Total deductions'}</div>
              </Card>
            </div>

            {/* Warning */}
            {gridStats.warningCount > 0 && (
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="text-sm text-amber-700 dark:text-amber-300">
                  {gridStats.warningCount} {vi ? 'nhân viên có thực lĩnh = 0 VND' : 'employees with net salary = 0'}
                </span>
              </div>
            )}

            {/* Detail table */}
            <Card className="overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  {vi ? 'Chi tiết thay đổi' : 'Change details'} — {monthLabel}
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase">#</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase">{vi ? 'Nhân viên' : 'Employee'}</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase">{vi ? 'Phòng ban' : 'Department'}</th>
                      <th className="px-4 py-2.5 text-center text-xs font-semibold text-slate-500 uppercase">{vi ? 'Loại' : 'Type'}</th>
                      <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-500 uppercase">{vi ? 'Lương CB' : 'Base'}</th>
                      <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-500 uppercase">{vi ? 'Thưởng' : 'Bonus'}</th>
                      <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-500 uppercase">{vi ? 'Khấu trừ' : 'Deduct'}</th>
                      <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-500 uppercase">{vi ? 'Thực lĩnh' : 'Net'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                    {actionableRows.map((row, idx) => {
                      const base = row.mode === 'new' ? Number(row.baseSalary) : (row.existingBaseSalary ?? 0)
                      const net = calcNet(String(base), row.bonus, row.deductions)
                      return (
                        <tr key={row.employeeId} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="px-4 py-2.5 text-xs text-slate-400">{idx + 1}</td>
                          <td className="px-4 py-2.5 text-sm font-medium text-slate-900 dark:text-white">{row.employeeName}</td>
                          <td className="px-4 py-2.5 text-sm text-slate-600 dark:text-slate-400">{row.departmentName}</td>
                          <td className="px-4 py-2.5 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                              row.mode === 'new'
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                            }`}>
                              {row.mode === 'new' ? (vi ? 'Mới' : 'New') : (vi ? 'Sửa' : 'Edit')}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-right text-sm text-slate-900 dark:text-white">{fmt.format(base)}</td>
                          <td className="px-4 py-2.5 text-right text-sm text-emerald-600 dark:text-emerald-400">
                            {row.mode === 'adjust' && row.existingBonus !== Number(row.bonus) && (
                              <span className="line-through text-slate-400 mr-1 text-xs">{fmt.format(row.existingBonus ?? 0)}</span>
                            )}
                            {fmt.format(Number(row.bonus) || 0)}
                          </td>
                          <td className="px-4 py-2.5 text-right text-sm text-red-600 dark:text-red-400">
                            {row.mode === 'adjust' && row.existingDeductions !== Number(row.deductions) && (
                              <span className="line-through text-slate-400 mr-1 text-xs">{fmt.format(row.existingDeductions ?? 0)}</span>
                            )}
                            {fmt.format(Number(row.deductions) || 0)}
                          </td>
                          <td className="px-4 py-2.5 text-right text-sm font-bold text-blue-600 dark:text-blue-400">{fmt.format(net)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot className="border-t-2 border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50">
                    <tr>
                      <td colSpan={4} className="px-4 py-2.5 text-sm font-bold text-slate-900 dark:text-white">
                        {vi ? `Tổng (${actionableRows.length} bản ghi)` : `Total (${actionableRows.length} records)`}
                      </td>
                      <td className="px-4 py-2.5 text-right text-sm font-bold text-slate-900 dark:text-white">
                        {fmt.format(actionableRows.reduce((s, r) => s + (r.mode === 'new' ? Number(r.baseSalary) : (r.existingBaseSalary ?? 0)), 0))}
                      </td>
                      <td className="px-4 py-2.5 text-right text-sm font-bold text-emerald-600">{fmt.format(gridStats.totalBonus)}</td>
                      <td className="px-4 py-2.5 text-right text-sm font-bold text-red-600">{fmt.format(gridStats.totalDeductions)}</td>
                      <td className="px-4 py-2.5 text-right text-sm font-bold text-blue-600">{fmt.format(gridStats.totalNet)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </Card>

            {/* Submit progress */}
            {submitting && (
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full" />
                  <span className="text-sm font-medium text-slate-900 dark:text-white">
                    {vi ? `Đang lưu ${submitProgress}/${submitTotal}...` : `Saving ${submitProgress}/${submitTotal}...`}
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${submitTotal > 0 ? (submitProgress / submitTotal) * 100 : 0}%` }}
                  />
                </div>
              </Card>
            )}

            {/* Footer nav */}
            {!submitting && (
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep('grid')} className="gap-1">
                  <ChevronLeft className="w-4 h-4" />
                  {vi ? 'Quay lại sửa' : 'Back to edit'}
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={onClose}>
                    {vi ? 'Hủy' : 'Cancel'}
                  </Button>
                  <Button onClick={handleSubmit} className="gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    {vi ? `Xác nhận lưu (${actionableRows.length})` : `Confirm save (${actionableRows.length})`}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════ SUBMIT RESULTS ═══════ */}
        {submitResults && (
          <div className="max-w-lg mx-auto space-y-6">
            <Card className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                {vi ? 'Hoàn tất!' : 'Complete!'}
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                {vi
                  ? `Đã lưu thành công ${submitResults.success} bản ghi cho ${monthLabel}.`
                  : `Successfully saved ${submitResults.success} records for ${monthLabel}.`}
              </p>

              {submitResults.failed.length > 0 && (
                <div className="mt-4 text-left">
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <h4 className="text-sm font-semibold text-red-700 dark:text-red-300 mb-2">
                      {submitResults.failed.length} {vi ? 'bản ghi lỗi:' : 'failed:'}
                    </h4>
                    <ul className="space-y-1">
                      {submitResults.failed.map((f, i) => (
                        <li key={i} className="text-xs text-red-600 dark:text-red-400">
                          • {f.name}: {f.error}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              <div className="flex justify-center gap-3 mt-6">
                <Button variant="outline" onClick={() => { setSubmitResults(null); setStep('grid') }}>
                  {vi ? 'Tiếp tục nhập' : 'Continue editing'}
                </Button>
                <Button onClick={() => { onComplete(); onClose() }}>
                  {vi ? 'Đóng & Làm mới' : 'Close & Refresh'}
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* ── Paste Modal ──────────────────────────────────────── */}
      {pasteOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setPasteOpen(false)} />
          <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {vi ? 'Dán dữ liệu từ Excel' : 'Paste from Excel'}
              </h3>
              <button onClick={() => setPasteOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-3">
              {vi
                ? 'Dán dữ liệu từ Excel theo format: Mã NV [Tab] Thưởng [Tab] Khấu trừ. Mỗi nhân viên một dòng.'
                : 'Paste tab-separated data: EmployeeID [Tab] Bonus [Tab] Deductions. One row per employee.'}
            </p>

            <div className="p-2 mb-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
              <p className="text-xs font-mono text-slate-500">
                101{'\t'}2000000{'\t'}500000{'\n'}
                102{'\t'}1500000{'\t'}0{'\n'}
                103{'\t'}3000000{'\t'}200000
              </p>
            </div>

            <textarea
              value={pasteText}
              onChange={e => setPasteText(e.target.value)}
              rows={8}
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder={vi ? 'Dán dữ liệu vào đây...' : 'Paste data here...'}
            />

            <div className="flex justify-end gap-3 mt-4">
              <Button variant="outline" onClick={() => setPasteOpen(false)}>
                {vi ? 'Hủy' : 'Cancel'}
              </Button>
              <Button onClick={handlePaste} disabled={!pasteText.trim()}>
                {vi ? 'Áp dụng' : 'Apply'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
