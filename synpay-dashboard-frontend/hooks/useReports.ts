'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import {
  fetchReportsData,
  fetchExportReport,
  type ReportsFilterParams,
} from '@/api/reports'
import { ReportsData } from '@/views/reports/analytics/types'
import { getMockReportsData } from '@/views/reports/analytics/data'

// ── Hook State ───────────────────────────────────────────────────

interface UseReportsState {
  data: ReportsData
  isLoading: boolean
  error: string | null
  isExporting: boolean
}

export interface UseReportsReturn extends UseReportsState {
  /** Re-fetch with current filters */
  refresh: () => Promise<void>
  /** Fetch with new filters */
  loadReports: (filters: ReportsFilterParams) => Promise<void>
  /** Export full data (requires report.export permission) */
  exportData: (filters?: ReportsFilterParams) => Promise<ReportsData>
  clearError: () => void
}

// ── Hook ─────────────────────────────────────────────────────────

export function useReports(initialFilters?: ReportsFilterParams): UseReportsReturn {
  const [state, setState] = useState<UseReportsState>({
    data: getMockReportsData(), // fallback while loading
    isLoading: true,
    error: null,
    isExporting: false,
  })

  const mountedRef = useRef(true)
  const lastFiltersRef = useRef<ReportsFilterParams>(initialFilters ?? {})

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  // ── Load reports ───────────────────────────────────────────

  const loadReports = useCallback(async (filters: ReportsFilterParams) => {
    lastFiltersRef.current = filters
    setState((s) => ({ ...s, isLoading: true, error: null }))
    try {
      const result = await fetchReportsData(filters)
      if (mountedRef.current) {
        setState((s) => ({ ...s, data: result, isLoading: false }))
      }
    } catch (err) {
      if (mountedRef.current) {
        const message = err instanceof Error ? err.message : 'Không thể tải dữ liệu báo cáo'
        setState((s) => ({ ...s, isLoading: false, error: message }))
      }
    }
  }, [])

  // ── Refresh ────────────────────────────────────────────────

  const refresh = useCallback(async () => {
    await loadReports(lastFiltersRef.current)
  }, [loadReports])

  // ── Export ─────────────────────────────────────────────────

  const exportData = useCallback(async (filters?: ReportsFilterParams): Promise<ReportsData> => {
    setState((s) => ({ ...s, isExporting: true }))
    try {
      const result = await fetchExportReport(filters ?? lastFiltersRef.current)
      if (mountedRef.current) {
        setState((s) => ({ ...s, isExporting: false }))
      }
      return result
    } catch (err) {
      if (mountedRef.current) {
        setState((s) => ({ ...s, isExporting: false }))
      }
      throw err
    }
  }, [])

  // ── Clear error ────────────────────────────────────────────

  const clearError = useCallback(() => {
    setState((s) => ({ ...s, error: null }))
  }, [])

  // ── Auto-load on mount ─────────────────────────────────────

  useEffect(() => {
    loadReports(initialFilters ?? {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    ...state,
    refresh,
    loadReports,
    exportData,
    clearError,
  }
}
