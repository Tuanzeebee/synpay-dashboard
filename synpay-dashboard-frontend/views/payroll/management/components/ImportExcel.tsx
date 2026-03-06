'use client'

import { useState, useCallback, useRef, useMemo } from 'react'
import * as XLSX from 'xlsx'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { departments } from '../data'
import { fetchEmployees, type ApiEmployeeResponse } from '@/api/employees'
import { fetchPayrollList, type ApiSalaryResponse } from '@/api/payroll'
import type { SalaryItem } from '@/hooks/usePayroll'
import type { CreateSalaryPayload, AdjustSalaryPayload } from '@/api/payroll'
import {
  X, FileSpreadsheet, Download, Upload, CheckCircle2,
  AlertTriangle, FileWarning, ChevronRight, ChevronLeft,
  Eye, HelpCircle,
} from 'lucide-react'

// ── Currency formatter ───────────────────────────────────────────
const fmt = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })

// ── Parsed row from Excel ────────────────────────────────────────

interface ParsedRow {
  rowIndex: number       // original row # in Excel (1-based, after header)
  employeeId: number
  salaryMonth: string
  baseSalary: number
  bonus: number
  deductions: number
}

// ── Matched row ready for submit ─────────────────────────────────

interface MatchedRow {
  parsed: ParsedRow
  employeeName: string
  departmentName: string
  mode: 'create' | 'adjust'
  existingSalaryId: number | null
  existingBaseSalary: number | null
  existingBonus: number | null
  existingDeductions: number | null
  netSalary: number
  error: string | null
}

// ── Props ────────────────────────────────────────────────────────

interface ImportExcelProps {
  language: string
  salaryMonths: string[]
  onClose: () => void
  onCreateSalary: (payload: CreateSalaryPayload) => Promise<SalaryItem>
  onAdjustSalary: (salaryId: number, payload: AdjustSalaryPayload) => Promise<SalaryItem>
  onComplete: () => void
}

// ── Steps ────────────────────────────────────────────────────────
type Step = 'ask-template' | 'upload' | 'preview' | 'result'

// ── Template columns (for reference & validation) ────────────────
const TEMPLATE_HEADERS = [
  'Mã NV (employeeId)',
  'Tháng lương (salaryMonth)',
  'Lương cơ bản (baseSalary)',
  'Thưởng (bonus)',
  'Khấu trừ (deductions)',
]

export default function ImportExcel({
  language,
  salaryMonths,
  onClose,
  onCreateSalary,
  onAdjustSalary,
  onComplete,
}: ImportExcelProps) {
  const vi = language === 'vi'
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── State ──────────────────────────────────────────────────
  const [step, setStep] = useState<Step>('ask-template')

  // Upload / parse state
  const [fileName, setFileName] = useState('')
  const [parseError, setParseError] = useState<string | null>(null)
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([])

  // Matching state
  const [matchedRows, setMatchedRows] = useState<MatchedRow[]>([])
  const [matching, setMatching] = useState(false)

  // Submit state
  const [submitting, setSubmitting] = useState(false)
  const [submitProgress, setSubmitProgress] = useState(0)
  const [submitTotal, setSubmitTotal] = useState(0)
  const [submitResults, setSubmitResults] = useState<{
    success: number
    failed: { name: string; error: string }[]
  } | null>(null)

  // ── Download template ──────────────────────────────────────

  const handleDownloadTemplate = useCallback(() => {
    const wsData = [
      TEMPLATE_HEADERS,
      [101, '2026-03-01', 15000000, 2000000, 500000],
      [102, '2026-03-01', 12000000, 1500000, 300000],
      [103, '2026-03-01', 18000000, 0, 0],
    ]
    const ws = XLSX.utils.aoa_to_sheet(wsData)

    // Column widths
    ws['!cols'] = [
      { wch: 22 }, { wch: 28 }, { wch: 24 }, { wch: 18 }, { wch: 22 },
    ]

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Mẫu Lương')
    XLSX.writeFile(wb, 'mau_nhap_luong.xlsx')
  }, [])

  // ── Parse uploaded file ────────────────────────────────────

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFileName(file.name)
    setParseError(null)
    setParsedRows([])
    setMatchedRows([])

    // Validate extension
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (!ext || !['xlsx', 'xls', 'csv'].includes(ext)) {
      setParseError(
        vi
          ? 'File không hợp lệ. Chỉ chấp nhận .xlsx, .xls hoặc .csv'
          : 'Invalid file. Only .xlsx, .xls or .csv accepted'
      )
      return
    }

    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        if (!sheetName) {
          setParseError(vi ? 'File không có sheet dữ liệu' : 'No sheet found in file')
          return
        }

        const sheet = workbook.Sheets[sheetName]
        const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' })

        if (json.length === 0) {
          setParseError(vi ? 'File không có dữ liệu (chỉ có header hoặc trống)' : 'No data rows in file')
          return
        }

        // Try to map columns — support both Vietnamese and English headers
        const rows: ParsedRow[] = []
        const errors: string[] = []

        json.forEach((row, idx) => {
          const rowNum = idx + 2 // Excel row = data index + 2 (1 for header, 1 for 0-index)

          // Find employeeId column
          const empId = findColumn(row, ['Mã NV (employeeId)', 'employeeId', 'Mã NV', 'Employee ID', 'MaNV', 'mã nv', 'employee_id'])
          const month = findColumn(row, ['Tháng lương (salaryMonth)', 'salaryMonth', 'Tháng lương', 'Salary Month', 'salary_month', 'thang_luong'])
          const base = findColumn(row, ['Lương cơ bản (baseSalary)', 'baseSalary', 'Lương cơ bản', 'Base Salary', 'base_salary', 'luong_co_ban'])
          const bonus = findColumn(row, ['Thưởng (bonus)', 'bonus', 'Thưởng', 'Bonus', 'thuong'])
          const deductions = findColumn(row, ['Khấu trừ (deductions)', 'deductions', 'Khấu trừ', 'Deductions', 'khau_tru'])

          const employeeId = Number(empId)
          if (!employeeId || isNaN(employeeId)) {
            errors.push(`${vi ? 'Dòng' : 'Row'} ${rowNum}: ${vi ? 'Mã NV không hợp lệ' : 'Invalid Employee ID'} "${empId}"`)
            return
          }

          const salaryMonth = normalizeMonth(String(month))
          if (!salaryMonth) {
            errors.push(`${vi ? 'Dòng' : 'Row'} ${rowNum}: ${vi ? 'Tháng lương không hợp lệ' : 'Invalid Salary Month'} "${month}"`)
            return
          }

          const baseSalary = Number(base) || 0
          const bonusVal = Number(bonus) || 0
          const deductionsVal = Number(deductions) || 0

          if (baseSalary < 0 || bonusVal < 0 || deductionsVal < 0) {
            errors.push(`${vi ? 'Dòng' : 'Row'} ${rowNum}: ${vi ? 'Giá trị lương không được âm' : 'Salary values cannot be negative'}`)
            return
          }

          rows.push({
            rowIndex: rowNum,
            employeeId,
            salaryMonth,
            baseSalary,
            bonus: bonusVal,
            deductions: deductionsVal,
          })
        })

        if (rows.length === 0) {
          setParseError(
            (vi ? 'Không phân tích được dữ liệu hợp lệ.\n' : 'No valid data parsed.\n') +
            errors.slice(0, 5).join('\n') +
            (errors.length > 5 ? `\n... ${vi ? 'và' : 'and'} ${errors.length - 5} ${vi ? 'lỗi khác' : 'more errors'}` : '')
          )
          return
        }

        // Warnings for partial errors
        if (errors.length > 0) {
          setParseError(
            `${errors.length} ${vi ? 'dòng bị bỏ qua' : 'rows skipped'}:\n` +
            errors.slice(0, 3).join('\n') +
            (errors.length > 3 ? `\n... +${errors.length - 3}` : '')
          )
        }

        setParsedRows(rows)
      } catch {
        setParseError(vi ? 'Không thể đọc file. Vui lòng kiểm tra định dạng.' : 'Cannot read file. Please check the format.')
      }
    }
    reader.readAsArrayBuffer(file)
  }, [vi])

  // ── Column finder ──────────────────────────────────────────

  function findColumn(row: Record<string, unknown>, possibleNames: string[]): unknown {
    for (const name of possibleNames) {
      if (row[name] !== undefined && row[name] !== '') return row[name]
    }
    // Also try case-insensitive partial match
    const keys = Object.keys(row)
    for (const name of possibleNames) {
      const lower = name.toLowerCase()
      const found = keys.find(k => k.toLowerCase().includes(lower))
      if (found && row[found] !== undefined && row[found] !== '') return row[found]
    }
    return ''
  }

  // ── Month normalizer ───────────────────────────────────────

  function normalizeMonth(val: string): string | null {
    const trimmed = val.trim()

    // Already yyyy-MM-dd format
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed

    // yyyy-MM format → append -01
    if (/^\d{4}-\d{2}$/.test(trimmed)) return `${trimmed}-01`

    // MM/yyyy format
    const mmYYYY = trimmed.match(/^(\d{1,2})[/\-.](\d{4})$/)
    if (mmYYYY) {
      return `${mmYYYY[2]}-${mmYYYY[1].padStart(2, '0')}-01`
    }

    // yyyy/MM/dd format
    const fullSlash = trimmed.match(/^(\d{4})[/.](\d{1,2})[/.](\d{1,2})$/)
    if (fullSlash) {
      return `${fullSlash[1]}-${fullSlash[2].padStart(2, '0')}-${fullSlash[3].padStart(2, '0')}`
    }

    // dd/MM/yyyy format
    const ddmmyyyy = trimmed.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/)
    if (ddmmyyyy) {
      return `${ddmmyyyy[3]}-${ddmmyyyy[2].padStart(2, '0')}-${ddmmyyyy[1].padStart(2, '0')}`
    }

    // Excel numeric date
    const num = Number(trimmed)
    if (!isNaN(num) && num > 40000 && num < 60000) {
      const d = new Date((num - 25569) * 86400 * 1000)
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${y}-${m}-${day}`
    }

    return null
  }

  // ── Match parsed rows with DB ──────────────────────────────

  const handleMatchRows = useCallback(async () => {
    if (parsedRows.length === 0) return
    setMatching(true)
    setMatchedRows([])

    try {
      // Collect unique months and employee IDs
      const months = [...new Set(parsedRows.map(r => r.salaryMonth))]
      const deptIds = departments.map(d => d.id)

      // Load all employees from all departments
      const empPromises = deptIds.map(id => fetchEmployees({ departmentId: id, size: 200 }))
      const empResults = await Promise.all(empPromises)
      const empMap = new Map<number, ApiEmployeeResponse>()
      empResults.forEach(page => {
        page.content.forEach(emp => {
          if (!empMap.has(emp.employeeId)) empMap.set(emp.employeeId, emp)
        })
      })

      // Load existing salary records for each month
      const existingSalaries = new Map<string, ApiSalaryResponse>() // key = empId-month
      for (const month of months) {
        const salPromises = deptIds.map(id =>
          fetchPayrollList({ salary_month: month, department_id: id, size: 200 })
        )
        const salResults = await Promise.all(salPromises)
        salResults.forEach(page => {
          page.content.forEach(sal => {
            existingSalaries.set(`${sal.employeeId}-${month}`, sal)
          })
        })
      }

      // Match each parsed row
      const matched: MatchedRow[] = parsedRows.map(parsed => {
        const emp = empMap.get(parsed.employeeId)
        if (!emp) {
          return {
            parsed,
            employeeName: `ID ${parsed.employeeId}`,
            departmentName: '—',
            mode: 'create' as const,
            existingSalaryId: null,
            existingBaseSalary: null,
            existingBonus: null,
            existingDeductions: null,
            netSalary: parsed.baseSalary + parsed.bonus - parsed.deductions,
            error: vi ? `Không tìm thấy NV #${parsed.employeeId}` : `Employee #${parsed.employeeId} not found`,
          }
        }

        const key = `${parsed.employeeId}-${parsed.salaryMonth}`
        const existing = existingSalaries.get(key)

        if (existing) {
          // Adjust existing record
          return {
            parsed,
            employeeName: emp.fullName,
            departmentName: emp.departmentName ?? '',
            mode: 'adjust' as const,
            existingSalaryId: existing.salaryId,
            existingBaseSalary: existing.baseSalary,
            existingBonus: existing.bonus,
            existingDeductions: existing.deductions,
            netSalary: existing.baseSalary + parsed.bonus - parsed.deductions,
            error: null,
          }
        }

        // New record
        return {
          parsed,
          employeeName: emp.fullName,
          departmentName: emp.departmentName ?? '',
          mode: 'create' as const,
          existingSalaryId: null,
          existingBaseSalary: null,
          existingBonus: null,
          existingDeductions: null,
          netSalary: parsed.baseSalary + parsed.bonus - parsed.deductions,
          error: null,
        }
      })

      setMatchedRows(matched)
      setStep('preview')
    } catch {
      setParseError(vi ? 'Lỗi khi kiểm tra dữ liệu nhân viên' : 'Error checking employee data')
    } finally {
      setMatching(false)
    }
  }, [parsedRows, vi])

  // ── Preview stats ──────────────────────────────────────────

  const previewStats = useMemo(() => {
    const valid = matchedRows.filter(r => !r.error)
    const errors = matchedRows.filter(r => r.error)
    const creates = valid.filter(r => r.mode === 'create')
    const adjusts = valid.filter(r => r.mode === 'adjust')
    const totalBonus = valid.reduce((s, r) => s + r.parsed.bonus, 0)
    const totalDeductions = valid.reduce((s, r) => s + r.parsed.deductions, 0)
    const totalNet = valid.reduce((s, r) => s + r.netSalary, 0)
    return { valid, errors, creates, adjusts, totalBonus, totalDeductions, totalNet }
  }, [matchedRows])

  // ── Submit ─────────────────────────────────────────────────

  const handleSubmit = useCallback(async () => {
    const toSubmit = previewStats.valid
    if (toSubmit.length === 0) return

    setSubmitting(true)
    setSubmitTotal(toSubmit.length)
    setSubmitProgress(0)
    const failed: { name: string; error: string }[] = []
    let success = 0

    for (let i = 0; i < toSubmit.length; i++) {
      const r = toSubmit[i]
      try {
        if (r.mode === 'create') {
          await onCreateSalary({
            employeeId: r.parsed.employeeId,
            salaryMonth: r.parsed.salaryMonth,
            baseSalary: r.parsed.baseSalary,
            bonus: r.parsed.bonus,
            deductions: r.parsed.deductions,
          })
        } else if (r.existingSalaryId) {
          await onAdjustSalary(r.existingSalaryId, {
            bonus: r.parsed.bonus,
            deductions: r.parsed.deductions,
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
    setStep('result')
  }, [previewStats.valid, onCreateSalary, onAdjustSalary])

  // ═══════════════════════════════════════════════════════════
  //  RENDER
  // ═══════════════════════════════════════════════════════════

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden mx-4">

        {/* ── Header ────────────────────────────────────── */}
        <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-white">
                {vi ? 'Import Dữ Liệu Lương Từ Excel' : 'Import Salary Data From Excel'}
              </h1>
              <p className="text-xs text-slate-500">
                {vi ? 'Nhập hàng loạt từ file .xlsx / .xls / .csv' : 'Bulk import from .xlsx / .xls / .csv files'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Body ──────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-6">

          {/* ═══════ STEP 1: ASK TEMPLATE ═══════ */}
          {step === 'ask-template' && (
            <div className="text-center space-y-6 py-8">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 flex items-center justify-center mx-auto">
                <HelpCircle className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
              </div>

              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  {vi ? 'Bạn có cần file mẫu không?' : 'Do you need a template file?'}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  {vi
                    ? 'File mẫu chứa các cột đúng định dạng để bạn dễ dàng nhập dữ liệu lương. Nếu đã có file sẵn, bạn có thể bỏ qua bước này.'
                    : 'The template contains correctly formatted columns for easy salary data entry. Skip this if you already have a file ready.'}
                </p>
              </div>

              {/* Template preview */}
              <Card className="p-4 text-left max-w-lg mx-auto">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2">
                  {vi ? 'Cấu trúc file mẫu' : 'Template structure'}
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700">
                        {TEMPLATE_HEADERS.map(h => (
                          <th key={h} className="px-2 py-1.5 text-left font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="text-slate-500 dark:text-slate-400">
                      <tr>
                        <td className="px-2 py-1">101</td>
                        <td className="px-2 py-1">2026-03-01</td>
                        <td className="px-2 py-1">15,000,000</td>
                        <td className="px-2 py-1">2,000,000</td>
                        <td className="px-2 py-1">500,000</td>
                      </tr>
                      <tr className="bg-slate-50 dark:bg-slate-900/30">
                        <td className="px-2 py-1">102</td>
                        <td className="px-2 py-1">2026-03-01</td>
                        <td className="px-2 py-1">12,000,000</td>
                        <td className="px-2 py-1">1,500,000</td>
                        <td className="px-2 py-1">300,000</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </Card>

              <div className="flex justify-center gap-3">
                <Button
                  onClick={handleDownloadTemplate}
                  className="gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
                >
                  <Download className="w-4 h-4" />
                  {vi ? 'Có, tải mẫu' : 'Yes, download template'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setStep('upload')}
                  className="gap-2"
                >
                  <ChevronRight className="w-4 h-4" />
                  {vi ? 'Không, tôi đã có file' : 'No, I have a file'}
                </Button>
              </div>

              {/* Small link to proceed after downloading */}
              <p className="text-xs text-slate-400">
                {vi
                  ? 'Sau khi tải mẫu, điền dữ liệu rồi quay lại đây để import.'
                  : 'After downloading, fill in the data and come back to import.'}
                {' '}
                <button
                  onClick={() => setStep('upload')}
                  className="text-blue-500 hover:text-blue-600 underline"
                >
                  {vi ? 'Tiếp tục import →' : 'Continue to import →'}
                </button>
              </p>
            </div>
          )}

          {/* ═══════ STEP 2: UPLOAD ═══════ */}
          {step === 'upload' && (
            <div className="space-y-6">
              {/* Drop zone */}
              <div
                className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors cursor-pointer ${
                  parseError && parsedRows.length === 0
                    ? 'border-red-300 bg-red-50/50 dark:border-red-700 dark:bg-red-900/10'
                    : parsedRows.length > 0
                    ? 'border-emerald-300 bg-emerald-50/50 dark:border-emerald-700 dark:bg-emerald-900/10'
                    : 'border-slate-300 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/30 dark:hover:bg-blue-900/10'
                }`}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={handleFileSelect}
                />

                {parsedRows.length > 0 ? (
                  <>
                    <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                    <p className="text-lg font-semibold text-emerald-700 dark:text-emerald-300">
                      {fileName}
                    </p>
                    <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">
                      {vi ? `Đã phân tích ${parsedRows.length} dòng dữ liệu hợp lệ` : `Parsed ${parsedRows.length} valid data rows`}
                    </p>
                  </>
                ) : parseError && parsedRows.length === 0 ? (
                  <>
                    <FileWarning className="w-12 h-12 text-red-400 mx-auto mb-3" />
                    <p className="text-lg font-semibold text-red-700 dark:text-red-300">
                      {vi ? 'File không hợp lệ' : 'Invalid file'}
                    </p>
                  </>
                ) : (
                  <>
                    <Upload className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                    <p className="text-lg font-semibold text-slate-700 dark:text-slate-300">
                      {vi ? 'Nhấn để chọn file hoặc kéo thả vào đây' : 'Click to select or drag a file here'}
                    </p>
                    <p className="text-sm text-slate-500 mt-1">
                      {vi ? 'Hỗ trợ: .xlsx, .xls, .csv' : 'Supported: .xlsx, .xls, .csv'}
                    </p>
                  </>
                )}
              </div>

              {/* Parse error / warning */}
              {parseError && (
                <div className={`p-3 rounded-lg border flex items-start gap-2 ${
                  parsedRows.length > 0
                    ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                    : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                }`}>
                  {parsedRows.length > 0
                    ? <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    : <FileWarning className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  }
                  <pre className={`text-xs whitespace-pre-wrap ${
                    parsedRows.length > 0
                      ? 'text-amber-700 dark:text-amber-300'
                      : 'text-red-700 dark:text-red-300'
                  }`}>
                    {parseError}
                  </pre>
                </div>
              )}

              {/* Parsed rows preview */}
              {parsedRows.length > 0 && (
                <Card className="overflow-hidden">
                  <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                      {vi ? `Xem trước dữ liệu (${parsedRows.length} dòng)` : `Data preview (${parsedRows.length} rows)`}
                    </h3>
                  </div>
                  <div className="overflow-x-auto max-h-60">
                    <table className="w-full">
                      <thead className="bg-slate-50 dark:bg-slate-800/50 border-b sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase">#</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase">{vi ? 'Mã NV' : 'Emp ID'}</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase">{vi ? 'Tháng' : 'Month'}</th>
                          <th className="px-3 py-2 text-right text-xs font-semibold text-slate-500 uppercase">{vi ? 'Lương CB' : 'Base'}</th>
                          <th className="px-3 py-2 text-right text-xs font-semibold text-slate-500 uppercase">{vi ? 'Thưởng' : 'Bonus'}</th>
                          <th className="px-3 py-2 text-right text-xs font-semibold text-slate-500 uppercase">{vi ? 'Khấu trừ' : 'Deduct'}</th>
                          <th className="px-3 py-2 text-right text-xs font-semibold text-slate-500 uppercase">{vi ? 'Thực lĩnh' : 'Net'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                        {parsedRows.slice(0, 50).map((r, i) => (
                          <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                            <td className="px-3 py-1.5 text-xs text-slate-400">{r.rowIndex}</td>
                            <td className="px-3 py-1.5 text-sm font-medium text-slate-900 dark:text-white">{r.employeeId}</td>
                            <td className="px-3 py-1.5 text-sm text-slate-600 dark:text-slate-400">{r.salaryMonth}</td>
                            <td className="px-3 py-1.5 text-sm text-right text-slate-900 dark:text-white">{fmt.format(r.baseSalary)}</td>
                            <td className="px-3 py-1.5 text-sm text-right text-emerald-600">{fmt.format(r.bonus)}</td>
                            <td className="px-3 py-1.5 text-sm text-right text-red-600">{fmt.format(r.deductions)}</td>
                            <td className="px-3 py-1.5 text-sm text-right font-semibold text-blue-600">
                              {fmt.format(r.baseSalary + r.bonus - r.deductions)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {parsedRows.length > 50 && (
                      <div className="px-4 py-2 text-xs text-slate-500 text-center bg-slate-50 dark:bg-slate-800/50">
                        {vi ? `... và ${parsedRows.length - 50} dòng nữa` : `... and ${parsedRows.length - 50} more rows`}
                      </div>
                    )}
                  </div>
                </Card>
              )}

              {/* Actions */}
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => { setStep('ask-template'); setParseError(null); setParsedRows([]) }} className="gap-1">
                  <ChevronLeft className="w-4 h-4" />
                  {vi ? 'Quay lại' : 'Back'}
                </Button>
                <Button
                  onClick={handleMatchRows}
                  disabled={parsedRows.length === 0 || matching}
                  className="gap-1"
                >
                  {matching ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                      {vi ? 'Đang kiểm tra...' : 'Checking...'}
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4" />
                      {vi ? `Kiểm tra & Xem trước (${parsedRows.length})` : `Check & Preview (${parsedRows.length})`}
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* ═══════ STEP 3: PREVIEW ═══════ */}
          {step === 'preview' && !submitting && !submitResults && (
            <div className="space-y-5">
              {/* Summary cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Card className="p-3 text-center">
                  <div className="text-2xl font-bold text-blue-600">{previewStats.creates.length}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{vi ? 'Tạo mới' : 'Create'}</div>
                </Card>
                <Card className="p-3 text-center">
                  <div className="text-2xl font-bold text-amber-600">{previewStats.adjusts.length}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{vi ? 'Cập nhật' : 'Update'}</div>
                </Card>
                <Card className="p-3 text-center">
                  <div className="text-2xl font-bold text-red-600">{previewStats.errors.length}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{vi ? 'Lỗi / Bỏ qua' : 'Errors'}</div>
                </Card>
                <Card className="p-3 text-center">
                  <div className="text-lg font-bold text-emerald-600">{fmt.format(previewStats.totalNet)}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{vi ? 'Tổng thực lĩnh' : 'Total net'}</div>
                </Card>
              </div>

              {/* Error rows */}
              {previewStats.errors.length > 0 && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <h4 className="text-sm font-semibold text-red-700 dark:text-red-300 mb-1.5">
                    {previewStats.errors.length} {vi ? 'dòng sẽ bị bỏ qua:' : 'rows will be skipped:'}
                  </h4>
                  <ul className="space-y-0.5">
                    {previewStats.errors.slice(0, 5).map((r, i) => (
                      <li key={i} className="text-xs text-red-600 dark:text-red-400">
                        • {vi ? 'Dòng' : 'Row'} {r.parsed.rowIndex}: {r.error}
                      </li>
                    ))}
                    {previewStats.errors.length > 5 && (
                      <li className="text-xs text-red-500">... +{previewStats.errors.length - 5}</li>
                    )}
                  </ul>
                </div>
              )}

              {/* Valid rows detail */}
              <Card className="overflow-hidden">
                <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    {vi ? `Chi tiết (${previewStats.valid.length} bản ghi sẽ được lưu)` : `Details (${previewStats.valid.length} records to save)`}
                  </h3>
                </div>
                <div className="overflow-x-auto max-h-72">
                  <table className="w-full">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 border-b sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase">#</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase">{vi ? 'Nhân viên' : 'Employee'}</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase">{vi ? 'Phòng ban' : 'Dept'}</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase">{vi ? 'Tháng' : 'Month'}</th>
                        <th className="px-3 py-2 text-center text-xs font-semibold text-slate-500 uppercase">{vi ? 'Loại' : 'Type'}</th>
                        <th className="px-3 py-2 text-right text-xs font-semibold text-slate-500 uppercase">{vi ? 'Lương CB' : 'Base'}</th>
                        <th className="px-3 py-2 text-right text-xs font-semibold text-slate-500 uppercase">{vi ? 'Thưởng' : 'Bonus'}</th>
                        <th className="px-3 py-2 text-right text-xs font-semibold text-slate-500 uppercase">{vi ? 'Khấu trừ' : 'Deduct'}</th>
                        <th className="px-3 py-2 text-right text-xs font-semibold text-slate-500 uppercase">{vi ? 'Thực lĩnh' : 'Net'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                      {previewStats.valid.map((r, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="px-3 py-2 text-xs text-slate-400">{idx + 1}</td>
                          <td className="px-3 py-2 text-sm font-medium text-slate-900 dark:text-white">{r.employeeName}</td>
                          <td className="px-3 py-2 text-sm text-slate-600 dark:text-slate-400">{r.departmentName}</td>
                          <td className="px-3 py-2 text-sm text-slate-600 dark:text-slate-400">{r.parsed.salaryMonth}</td>
                          <td className="px-3 py-2 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                              r.mode === 'create'
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                            }`}>
                              {r.mode === 'create' ? (vi ? 'Mới' : 'New') : (vi ? 'Sửa' : 'Edit')}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-right text-sm text-slate-900 dark:text-white">
                            {fmt.format(r.mode === 'create' ? r.parsed.baseSalary : (r.existingBaseSalary ?? 0))}
                          </td>
                          <td className="px-3 py-2 text-right text-sm text-emerald-600">
                            {r.mode === 'adjust' && r.existingBonus !== r.parsed.bonus && (
                              <span className="line-through text-slate-400 mr-1 text-xs">{fmt.format(r.existingBonus ?? 0)}</span>
                            )}
                            {fmt.format(r.parsed.bonus)}
                          </td>
                          <td className="px-3 py-2 text-right text-sm text-red-600">
                            {r.mode === 'adjust' && r.existingDeductions !== r.parsed.deductions && (
                              <span className="line-through text-slate-400 mr-1 text-xs">{fmt.format(r.existingDeductions ?? 0)}</span>
                            )}
                            {fmt.format(r.parsed.deductions)}
                          </td>
                          <td className="px-3 py-2 text-right text-sm font-bold text-blue-600 dark:text-blue-400">
                            {fmt.format(r.netSalary)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="border-t-2 border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50">
                      <tr>
                        <td colSpan={5} className="px-3 py-2 text-sm font-bold text-slate-900 dark:text-white">
                          {vi ? `Tổng (${previewStats.valid.length})` : `Total (${previewStats.valid.length})`}
                        </td>
                        <td className="px-3 py-2 text-right text-sm font-bold text-slate-900 dark:text-white">
                          {fmt.format(previewStats.valid.reduce((s, r) => s + (r.mode === 'create' ? r.parsed.baseSalary : (r.existingBaseSalary ?? 0)), 0))}
                        </td>
                        <td className="px-3 py-2 text-right text-sm font-bold text-emerald-600">{fmt.format(previewStats.totalBonus)}</td>
                        <td className="px-3 py-2 text-right text-sm font-bold text-red-600">{fmt.format(previewStats.totalDeductions)}</td>
                        <td className="px-3 py-2 text-right text-sm font-bold text-blue-600">{fmt.format(previewStats.totalNet)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </Card>

              {/* Submit progress */}
              {submitting && (
                <Card className="p-5">
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

              {/* Nav */}
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep('upload')} className="gap-1">
                  <ChevronLeft className="w-4 h-4" />
                  {vi ? 'Quay lại' : 'Back'}
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={onClose}>
                    {vi ? 'Hủy' : 'Cancel'}
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={previewStats.valid.length === 0 || submitting}
                    className="gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {vi ? `Xác nhận import (${previewStats.valid.length})` : `Confirm import (${previewStats.valid.length})`}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* ═══════ STEP 4: RESULT ═══════ */}
          {step === 'result' && submitResults && (
            <div className="text-center space-y-6 py-6">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  {vi ? 'Import Hoàn Tất!' : 'Import Complete!'}
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {vi
                    ? `Đã lưu thành công ${submitResults.success} bản ghi từ file "${fileName}".`
                    : `Successfully saved ${submitResults.success} records from "${fileName}".`}
                </p>
              </div>

              {submitResults.failed.length > 0 && (
                <div className="text-left max-w-md mx-auto">
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

              <div className="flex justify-center gap-3">
                <Button variant="outline" onClick={() => {
                  setStep('upload')
                  setSubmitResults(null)
                  setParsedRows([])
                  setMatchedRows([])
                  setFileName('')
                  setParseError(null)
                }}>
                  {vi ? 'Import thêm' : 'Import more'}
                </Button>
                <Button onClick={() => { onComplete(); onClose() }}>
                  {vi ? 'Đóng & Làm mới' : 'Close & Refresh'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
