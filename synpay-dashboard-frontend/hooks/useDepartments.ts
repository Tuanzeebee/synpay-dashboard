'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import {
  fetchDepartments,
  fetchDepartment,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  type ApiDepartmentResponse,
  type ApiDepartmentPageResponse,
  type CreateDepartmentPayload,
  type UpdateDepartmentPayload,
  type DepartmentListParams,
} from '@/api/departments'

// ── Mapped UI Type ───────────────────────────────────────────────

export interface DepartmentItem {
  id: number
  name: string
  createdAt: string | null
  updatedAt: string | null
}

function toItem(dto: ApiDepartmentResponse): DepartmentItem {
  return {
    id: dto.departmentId,
    name: dto.departmentName,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  }
}

// ── Hook State ───────────────────────────────────────────────────

interface UseDepartmentsState {
  departments: DepartmentItem[]
  totalElements: number
  totalPages: number
  currentPage: number
  pageSize: number
  isLoading: boolean
  error: string | null
  isSaving: boolean
}

interface UseDepartmentsReturn extends UseDepartmentsState {
  refresh: () => Promise<void>
  loadDepartments: (params: DepartmentListParams) => Promise<void>
  getDetail: (id: number) => Promise<ApiDepartmentResponse>
  create: (payload: CreateDepartmentPayload) => Promise<void>
  update: (id: number, payload: UpdateDepartmentPayload) => Promise<void>
  remove: (id: number) => Promise<void>
  clearError: () => void
}

// ── Hook ─────────────────────────────────────────────────────────

export function useDepartments(initialParams?: DepartmentListParams): UseDepartmentsReturn {
  const [state, setState] = useState<UseDepartmentsState>({
    departments: [],
    totalElements: 0,
    totalPages: 0,
    currentPage: 0,
    pageSize: 20,
    isLoading: true,
    error: null,
    isSaving: false,
  })

  const mountedRef = useRef(true)
  const lastParamsRef = useRef<DepartmentListParams>(initialParams ?? {})

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  // ── Load departments with params ───────────────────────────

  const loadDepartments = useCallback(async (params: DepartmentListParams) => {
    lastParamsRef.current = params
    setState((s) => ({ ...s, isLoading: true, error: null }))
    try {
      const page: ApiDepartmentPageResponse = await fetchDepartments(params)
      if (mountedRef.current) {
        setState((s) => ({
          ...s,
          departments: page.content.map(toItem),
          totalElements: page.totalElements,
          totalPages: page.totalPages,
          currentPage: page.page,
          pageSize: page.size,
          isLoading: false,
        }))
      }
    } catch (err) {
      if (mountedRef.current) {
        const message = err instanceof Error ? err.message : 'Không thể tải danh sách phòng ban'
        setState((s) => ({ ...s, isLoading: false, error: message }))
      }
    }
  }, [])

  // ── Refresh with last-used params ──────────────────────────

  const refresh = useCallback(async () => {
    await loadDepartments(lastParamsRef.current)
  }, [loadDepartments])

  // Load on mount
  useEffect(() => {
    loadDepartments(initialParams ?? { page: 0, size: 20 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Get single detail ──────────────────────────────────────

  const getDetail = useCallback(async (id: number): Promise<ApiDepartmentResponse> => {
    return fetchDepartment(id)
  }, [])

  // ── Create department ──────────────────────────────────────

  const create = useCallback(async (payload: CreateDepartmentPayload) => {
    setState((s) => ({ ...s, isSaving: true, error: null }))
    try {
      await createDepartment(payload)
      if (mountedRef.current) {
        setState((s) => ({ ...s, isSaving: false }))
        await refresh()
      }
    } catch (err) {
      if (mountedRef.current) {
        const message = err instanceof Error ? err.message : 'Không thể tạo phòng ban'
        setState((s) => ({ ...s, isSaving: false, error: message }))
      }
      throw err
    }
  }, [refresh])

  // ── Update department ──────────────────────────────────────

  const update = useCallback(async (id: number, payload: UpdateDepartmentPayload) => {
    setState((s) => ({ ...s, isSaving: true, error: null }))
    try {
      await updateDepartment(id, payload)
      if (mountedRef.current) {
        setState((s) => ({ ...s, isSaving: false }))
        await refresh()
      }
    } catch (err) {
      if (mountedRef.current) {
        const message = err instanceof Error ? err.message : 'Không thể cập nhật phòng ban'
        setState((s) => ({ ...s, isSaving: false, error: message }))
      }
      throw err
    }
  }, [refresh])

  // ── Delete department ──────────────────────────────────────

  const remove = useCallback(async (id: number) => {
    setState((s) => ({ ...s, isSaving: true, error: null }))
    try {
      await deleteDepartment(id)
      if (mountedRef.current) {
        setState((s) => ({ ...s, isSaving: false }))
        await refresh()
      }
    } catch (err) {
      if (mountedRef.current) {
        const message = err instanceof Error ? err.message : 'Không thể xóa phòng ban'
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
    loadDepartments,
    getDetail,
    create,
    update,
    remove,
    clearError,
  }
}
