'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import {
  fetchPositions,
  fetchPosition,
  createPosition,
  updatePosition,
  deletePosition,
  type ApiPositionResponse,
  type ApiPositionPageResponse,
  type CreatePositionPayload,
  type UpdatePositionPayload,
  type PositionListParams,
} from '@/api/positions'

// ── Mapped UI Type ───────────────────────────────────────────────

export interface PositionItem {
  id: number
  name: string
  createdAt: string | null
  updatedAt: string | null
}

function toItem(dto: ApiPositionResponse): PositionItem {
  return {
    id: dto.positionId,
    name: dto.positionName,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  }
}

// ── Hook State ───────────────────────────────────────────────────

interface UsePositionsState {
  positions: PositionItem[]
  totalElements: number
  totalPages: number
  currentPage: number
  pageSize: number
  isLoading: boolean
  error: string | null
  isSaving: boolean
}

interface UsePositionsReturn extends UsePositionsState {
  refresh: () => Promise<void>
  loadPositions: (params: PositionListParams) => Promise<void>
  getDetail: (id: number) => Promise<ApiPositionResponse>
  create: (payload: CreatePositionPayload) => Promise<void>
  update: (id: number, payload: UpdatePositionPayload) => Promise<void>
  remove: (id: number) => Promise<void>
  clearError: () => void
}

// ── Hook ─────────────────────────────────────────────────────────

export function usePositions(initialParams?: PositionListParams): UsePositionsReturn {
  const [state, setState] = useState<UsePositionsState>({
    positions: [],
    totalElements: 0,
    totalPages: 0,
    currentPage: 0,
    pageSize: 20,
    isLoading: true,
    error: null,
    isSaving: false,
  })

  const mountedRef = useRef(true)
  const lastParamsRef = useRef<PositionListParams>(initialParams ?? {})

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  // ── Load positions with params ─────────────────────────────

  const loadPositions = useCallback(async (params: PositionListParams) => {
    lastParamsRef.current = params
    setState((s) => ({ ...s, isLoading: true, error: null }))
    try {
      const page: ApiPositionPageResponse = await fetchPositions(params)
      if (mountedRef.current) {
        setState((s) => ({
          ...s,
          positions: page.content.map(toItem),
          totalElements: page.totalElements,
          totalPages: page.totalPages,
          currentPage: page.page,
          pageSize: page.size,
          isLoading: false,
        }))
      }
    } catch (err) {
      if (mountedRef.current) {
        const message = err instanceof Error ? err.message : 'Không thể tải danh sách chức vụ'
        setState((s) => ({ ...s, isLoading: false, error: message }))
      }
    }
  }, [])

  // ── Refresh with last-used params ──────────────────────────

  const refresh = useCallback(async () => {
    await loadPositions(lastParamsRef.current)
  }, [loadPositions])

  // Load on mount
  useEffect(() => {
    loadPositions(initialParams ?? { page: 0, size: 20 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Get single detail ──────────────────────────────────────

  const getDetail = useCallback(async (id: number): Promise<ApiPositionResponse> => {
    return fetchPosition(id)
  }, [])

  // ── Create position ────────────────────────────────────────

  const create = useCallback(async (payload: CreatePositionPayload) => {
    setState((s) => ({ ...s, isSaving: true, error: null }))
    try {
      await createPosition(payload)
      if (mountedRef.current) {
        setState((s) => ({ ...s, isSaving: false }))
        await refresh()
      }
    } catch (err) {
      if (mountedRef.current) {
        const message = err instanceof Error ? err.message : 'Không thể tạo chức vụ'
        setState((s) => ({ ...s, isSaving: false, error: message }))
      }
      throw err
    }
  }, [refresh])

  // ── Update position ────────────────────────────────────────

  const update = useCallback(async (id: number, payload: UpdatePositionPayload) => {
    setState((s) => ({ ...s, isSaving: true, error: null }))
    try {
      await updatePosition(id, payload)
      if (mountedRef.current) {
        setState((s) => ({ ...s, isSaving: false }))
        await refresh()
      }
    } catch (err) {
      if (mountedRef.current) {
        const message = err instanceof Error ? err.message : 'Không thể cập nhật chức vụ'
        setState((s) => ({ ...s, isSaving: false, error: message }))
      }
      throw err
    }
  }, [refresh])

  // ── Delete position ────────────────────────────────────────

  const remove = useCallback(async (id: number) => {
    setState((s) => ({ ...s, isSaving: true, error: null }))
    try {
      await deletePosition(id)
      if (mountedRef.current) {
        setState((s) => ({ ...s, isSaving: false }))
        await refresh()
      }
    } catch (err) {
      if (mountedRef.current) {
        const message = err instanceof Error ? err.message : 'Không thể xóa chức vụ'
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
    loadPositions,
    getDetail,
    create,
    update,
    remove,
    clearError,
  }
}
