'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import {
  fetchEmployees,
  fetchEmployee,
  createEmployee,
  updateEmployee,
  changeEmployeeStatus,
  type ApiEmployeeResponse,
  type ApiEmployeePageResponse,
  type CreateEmployeePayload,
  type UpdateEmployeePayload,
  type EmployeeListParams,
} from '@/api/employees'

// ── Hook State ───────────────────────────────────────────────────

interface UseEmployeesState {
  employees: ApiEmployeeResponse[]
  /** Total elements from the server (for pagination) */
  totalElements: number
  totalPages: number
  currentPage: number
  pageSize: number
  isLoading: boolean
  error: string | null
  /** Currently executing a create/update mutation */
  isSaving: boolean
}

interface UseEmployeesReturn extends UseEmployeesState {
  /** Reload the employee list from the API with current filters */
  refresh: () => Promise<void>
  /** Load employees with specific params (filters, pagination) */
  loadEmployees: (params: EmployeeListParams) => Promise<void>
  /** Get a single employee detail (with account info) */
  getDetail: (id: number) => Promise<ApiEmployeeResponse>
  /** Create a new employee */
  create: (payload: CreateEmployeePayload) => Promise<void>
  /** Update an existing employee */
  update: (id: number, payload: UpdateEmployeePayload) => Promise<void>
  /** Change employee status */
  changeStatus: (id: number, status: string) => Promise<void>
  /** Clear the current error */
  clearError: () => void
}

// ── Hook ─────────────────────────────────────────────────────────

export function useEmployees(initialParams?: EmployeeListParams): UseEmployeesReturn {
  const [state, setState] = useState<UseEmployeesState>({
    employees: [],
    totalElements: 0,
    totalPages: 0,
    currentPage: 0,
    pageSize: 10,
    isLoading: true,
    error: null,
    isSaving: false,
  })

  const mountedRef = useRef(true)
  const lastParamsRef = useRef<EmployeeListParams>(initialParams ?? {})

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  // ── Load employees with params ─────────────────────────────

  const loadEmployees = useCallback(async (params: EmployeeListParams) => {
    lastParamsRef.current = params
    setState((s) => ({ ...s, isLoading: true, error: null }))
    try {
      const page: ApiEmployeePageResponse = await fetchEmployees(params)
      if (mountedRef.current) {
        setState((s) => ({
          ...s,
          employees: page.content,
          totalElements: page.totalElements,
          totalPages: page.totalPages,
          currentPage: page.page,
          pageSize: page.size,
          isLoading: false,
        }))
      }
    } catch (err) {
      if (mountedRef.current) {
        const message = err instanceof Error ? err.message : 'Không thể tải danh sách nhân viên'
        setState((s) => ({ ...s, isLoading: false, error: message }))
      }
    }
  }, [])

  // ── Refresh with last-used params ──────────────────────────

  const refresh = useCallback(async () => {
    await loadEmployees(lastParamsRef.current)
  }, [loadEmployees])

  // Load on mount
  useEffect(() => {
    loadEmployees(initialParams ?? { page: 0, size: 10 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Get single detail ──────────────────────────────────────

  const getDetail = useCallback(async (id: number): Promise<ApiEmployeeResponse> => {
    return fetchEmployee(id)
  }, [])

  // ── Create employee ────────────────────────────────────────

  const create = useCallback(async (payload: CreateEmployeePayload) => {
    setState((s) => ({ ...s, isSaving: true, error: null }))
    try {
      await createEmployee(payload)
      if (mountedRef.current) {
        setState((s) => ({ ...s, isSaving: false }))
        await refresh()
      }
    } catch (err) {
      if (mountedRef.current) {
        const message = err instanceof Error ? err.message : 'Không thể tạo nhân viên'
        setState((s) => ({ ...s, isSaving: false, error: message }))
      }
      throw err
    }
  }, [refresh])

  // ── Update employee ────────────────────────────────────────

  const update = useCallback(async (id: number, payload: UpdateEmployeePayload) => {
    setState((s) => ({ ...s, isSaving: true, error: null }))
    try {
      await updateEmployee(id, payload)
      if (mountedRef.current) {
        setState((s) => ({ ...s, isSaving: false }))
        await refresh()
      }
    } catch (err) {
      if (mountedRef.current) {
        const message = err instanceof Error ? err.message : 'Không thể cập nhật nhân viên'
        setState((s) => ({ ...s, isSaving: false, error: message }))
      }
      throw err
    }
  }, [refresh])

  // ── Change status ──────────────────────────────────────────

  const changeStatus = useCallback(async (id: number, status: string) => {
    setState((s) => ({ ...s, isSaving: true, error: null }))
    try {
      await changeEmployeeStatus(id, { status })
      if (mountedRef.current) {
        setState((s) => ({ ...s, isSaving: false }))
        await refresh()
      }
    } catch (err) {
      if (mountedRef.current) {
        const message = err instanceof Error ? err.message : 'Không thể đổi trạng thái'
        setState((s) => ({ ...s, isSaving: false, error: message }))
      }
      throw err
    }
  }, [refresh])

  // ── Clear error ────────────────────────────────────────────

  const clearError = useCallback(() => {
    setState((s) => ({ ...s, error: null }))
  }, [])

  return {
    ...state,
    refresh,
    loadEmployees,
    getDetail,
    create,
    update,
    changeStatus,
    clearError,
  }
}
