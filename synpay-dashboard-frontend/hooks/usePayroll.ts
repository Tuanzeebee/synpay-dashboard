'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import {
  fetchPayrollList,
  fetchSalaryDetail,
  fetchSalaryMonths,
  adjustSalary,
  createSalaryApi,
  exportPayroll,
  type ApiSalaryResponse,
  type ApiSalaryDetailResponse,
  type ApiSalaryPageResponse,
  type AdjustSalaryPayload,
  type CreateSalaryPayload,
  type PayrollListParams,
} from '@/api/payroll'

// ── Mapped UI Types ──────────────────────────────────────────────

export interface SalaryItem {
  salaryId: number
  employeeId: number
  employeeName: string
  departmentName: string
  positionName: string
  salaryMonth: string
  baseSalary: number
  bonus: number
  deductions: number
  netSalary: number
  createdAt: string | null
}

export interface SalaryDetail {
  salaryId: number
  salaryMonth: string
  baseSalary: number
  bonus: number
  deductions: number
  netSalary: number
  createdAt: string | null
  employeeId: number
  employeeName: string
  employeeStatus: string
  departmentId: number | null
  departmentName: string
  positionId: number | null
  positionName: string
  workDays: number | null
  absentDays: number | null
  leaveDays: number | null
}

// ── Mapper ───────────────────────────────────────────────────────

function toItem(dto: ApiSalaryResponse): SalaryItem {
  return {
    salaryId: dto.salaryId,
    employeeId: dto.employeeId,
    employeeName: dto.employeeName ?? '',
    departmentName: dto.departmentName ?? '',
    positionName: dto.positionName ?? '',
    salaryMonth: dto.salaryMonth,
    baseSalary: dto.baseSalary,
    bonus: dto.bonus,
    deductions: dto.deductions,
    netSalary: dto.netSalary,
    createdAt: dto.createdAt,
  }
}

function toDetail(dto: ApiSalaryDetailResponse): SalaryDetail {
  return {
    salaryId: dto.salaryId,
    salaryMonth: dto.salaryMonth,
    baseSalary: dto.baseSalary,
    bonus: dto.bonus,
    deductions: dto.deductions,
    netSalary: dto.netSalary,
    createdAt: dto.createdAt,
    employeeId: dto.employeeId,
    employeeName: dto.employeeName ?? '',
    employeeStatus: dto.employeeStatus ?? '',
    departmentId: dto.departmentId,
    departmentName: dto.departmentName ?? '',
    positionId: dto.positionId,
    positionName: dto.positionName ?? '',
    workDays: dto.workDays,
    absentDays: dto.absentDays,
    leaveDays: dto.leaveDays,
  }
}

// ── Hook State ───────────────────────────────────────────────────

interface UsePayrollState {
  salaries: SalaryItem[]
  salaryMonths: string[]
  totalElements: number
  totalPages: number
  currentPage: number
  pageSize: number
  isLoading: boolean
  error: string | null
  isSaving: boolean
}

interface UsePayrollReturn extends UsePayrollState {
  refresh: () => Promise<void>
  loadSalaries: (params: PayrollListParams) => Promise<void>
  getDetail: (salaryId: number) => Promise<SalaryDetail>
  getEmployeeHistory: (employeeId: number) => Promise<SalaryItem[]>
  adjust: (salaryId: number, payload: AdjustSalaryPayload) => Promise<SalaryItem>
  create: (payload: CreateSalaryPayload) => Promise<SalaryItem>
  exportExcel: (params?: Omit<PayrollListParams, 'page' | 'size'>) => Promise<void>
  clearError: () => void
}

// ── Hook ─────────────────────────────────────────────────────────

export function usePayroll(initialParams?: PayrollListParams): UsePayrollReturn {
  const [state, setState] = useState<UsePayrollState>({
    salaries: [],
    salaryMonths: [],
    totalElements: 0,
    totalPages: 0,
    currentPage: 0,
    pageSize: 20,
    isLoading: true,
    error: null,
    isSaving: false,
  })

  const mountedRef = useRef(true)
  const lastParamsRef = useRef<PayrollListParams>(initialParams ?? {})

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  // ── Load salaries with params ──────────────────────────────

  const loadSalaries = useCallback(async (params: PayrollListParams) => {
    lastParamsRef.current = params
    setState((s) => ({ ...s, isLoading: true, error: null }))
    try {
      const page: ApiSalaryPageResponse = await fetchPayrollList(params)
      if (mountedRef.current) {
        setState((s) => ({
          ...s,
          salaries: page.content.map(toItem),
          totalElements: page.totalElements,
          totalPages: page.totalPages,
          currentPage: page.page,
          pageSize: page.size,
          isLoading: false,
        }))
      }
    } catch (err) {
      if (mountedRef.current) {
        const message = err instanceof Error ? err.message : 'Không thể tải dữ liệu lương'
        setState((s) => ({ ...s, isLoading: false, error: message }))
      }
    }
  }, [])

  // ── Refresh with last-used params ──────────────────────────

  const refresh = useCallback(async () => {
    await loadSalaries(lastParamsRef.current)
  }, [loadSalaries])

  // Load on mount
  useEffect(() => {
    loadSalaries(initialParams ?? { page: 0, size: 20 })
    // Fetch distinct salary months
    fetchSalaryMonths()
      .then((months) => {
        if (mountedRef.current) {
          setState((s) => ({ ...s, salaryMonths: months }))
        }
      })
      .catch(() => { /* non-critical */ })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Get single detail ──────────────────────────────────────

  const getDetail = useCallback(async (salaryId: number): Promise<SalaryDetail> => {
    const dto = await fetchSalaryDetail(salaryId)
    return toDetail(dto)
  }, [])

  // ── Get all salary records for an employee ─────────────────

  const getEmployeeHistory = useCallback(async (employeeId: number): Promise<SalaryItem[]> => {
    const page = await fetchPayrollList({ employee_id: employeeId, page: 0, size: 200 })
    return page.content.map(toItem)
  }, [])

  // ── Adjust bonus / deductions ──────────────────────────────

  const adjust = useCallback(async (
    salaryId: number,
    payload: AdjustSalaryPayload,
  ): Promise<SalaryItem> => {
    setState((s) => ({ ...s, isSaving: true, error: null }))
    try {
      const dto = await adjustSalary(salaryId, payload)
      const item = toItem(dto)
      if (mountedRef.current) {
        setState((s) => ({
          ...s,
          isSaving: false,
          salaries: s.salaries.map((sal) =>
            sal.salaryId === salaryId ? item : sal,
          ),
        }))
      }
      return item
    } catch (err) {
      if (mountedRef.current) {
        const message = err instanceof Error ? err.message : 'Điều chỉnh lương thất bại'
        setState((s) => ({ ...s, isSaving: false, error: message }))
      }
      throw err
    }
  }, [])

  // ── Create new salary record ────────────────────────────

  const create = useCallback(async (
    payload: CreateSalaryPayload,
  ): Promise<SalaryItem> => {
    setState((s) => ({ ...s, isSaving: true, error: null }))
    try {
      const dto = await createSalaryApi(payload)
      const item = toItem(dto)
      if (mountedRef.current) {
        // Refresh list to include the new record
        await loadSalaries(lastParamsRef.current)
        setState((s) => ({ ...s, isSaving: false }))
      }
      return item
    } catch (err) {
      if (mountedRef.current) {
        const message = err instanceof Error ? err.message : 'Tạo lương thất bại'
        setState((s) => ({ ...s, isSaving: false, error: message }))
      }
      throw err
    }
  }, [loadSalaries])

  // ── Export Excel ───────────────────────────────────────────

  const exportExcel = useCallback(async (
    params: Omit<PayrollListParams, 'page' | 'size'> = {},
  ): Promise<void> => {
    const blob = await exportPayroll(params)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'salary_report.xlsx'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [])

  // ── Clear error ────────────────────────────────────────────

  const clearError = useCallback(() => {
    setState((s) => ({ ...s, error: null }))
  }, [])

  return {
    ...state,
    refresh,
    loadSalaries,
    getDetail,
    getEmployeeHistory,
    adjust,
    create,
    exportExcel,
    clearError,
  }
}
