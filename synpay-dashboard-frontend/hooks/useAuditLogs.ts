'use client'

/**
 * React hook for Audit Log state management.
 *
 * Handles fetching paginated/filtered audit log entries
 * and exporting to CSV via the API.
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import {
  fetchAuditLogs,
  exportAuditLogs,
  type AuditLogPage,
  type AuditLogFilter,
  type AuditLogExportBody,
} from '@/api/audit-logs'

// ── Hook State ───────────────────────────────────────────────────

interface UseAuditLogsState {
  /** Paginated audit log data. */
  data: AuditLogPage | null
  /** True during initial load or page change. */
  isLoading: boolean
  /** True while CSV export is in progress. */
  isExporting: boolean
  /** Error message from the last failed operation. */
  error: string | null
}

export interface UseAuditLogsReturn extends UseAuditLogsState {
  /** Current filter values (also drives the query). */
  filter: AuditLogFilter
  /** Update one or more filter fields and refetch. */
  setFilter: (patch: Partial<AuditLogFilter>) => void
  /** Reset all filters to defaults and refetch. */
  resetFilter: () => void
  /** Navigate to a specific page (zero-based). */
  goToPage: (page: number) => void
  /** Reload the current page. */
  refresh: () => Promise<void>
  /** Export the current filtered set as CSV (triggers file download). */
  exportCsv: () => Promise<void>
  /** Clear the current error. */
  clearError: () => void
}

// ── Defaults ─────────────────────────────────────────────────────

const DEFAULT_FILTER: AuditLogFilter = {
  page: 0,
  size: 20,
}

// ── Hook ─────────────────────────────────────────────────────────

export function useAuditLogs(): UseAuditLogsReturn {
  const [state, setState] = useState<UseAuditLogsState>({
    data: null,
    isLoading: true,
    isExporting: false,
    error: null,
  })

  const [filter, setFilterState] = useState<AuditLogFilter>({ ...DEFAULT_FILTER })

  const mountedRef = useRef(true)
  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  // ── Fetch ──────────────────────────────────────────────────────

  const loadData = useCallback(async (f: AuditLogFilter) => {
    setState((s) => ({ ...s, isLoading: true, error: null }))
    try {
      const data = await fetchAuditLogs(f)
      if (mountedRef.current) {
        setState((s) => ({ ...s, data, isLoading: false }))
      }
    } catch (err) {
      if (mountedRef.current) {
        const message = err instanceof Error ? err.message : 'Failed to load audit logs'
        setState((s) => ({ ...s, isLoading: false, error: message }))
      }
    }
  }, [])

  // Auto-load on mount and when filter changes
  useEffect(() => {
    loadData(filter)
  }, [filter, loadData])

  // ── Actions ────────────────────────────────────────────────────

  const setFilter = useCallback((patch: Partial<AuditLogFilter>) => {
    setFilterState((prev) => ({
      ...prev,
      ...patch,
      // Reset to page 0 when filter criteria change (not when just paging)
      page: 'page' in patch ? (patch.page ?? 0) : 0,
    }))
  }, [])

  const resetFilter = useCallback(() => {
    setFilterState({ ...DEFAULT_FILTER })
  }, [])

  const goToPage = useCallback((page: number) => {
    setFilterState((prev) => ({ ...prev, page }))
  }, [])

  const refresh = useCallback(async () => {
    await loadData(filter)
  }, [filter, loadData])

  const exportCsv = useCallback(async () => {
    setState((s) => ({ ...s, isExporting: true, error: null }))
    try {
      const exportBody: AuditLogExportBody = {}
      if (filter.actorEmail) exportBody.actorEmail = filter.actorEmail
      if (filter.action) exportBody.action = filter.action
      if (filter.resource) exportBody.resource = filter.resource
      if (filter.dateFrom) exportBody.dateFrom = filter.dateFrom
      if (filter.dateTo) exportBody.dateTo = filter.dateTo

      const csv = await exportAuditLogs(exportBody)

      // Trigger browser file download
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      if (mountedRef.current) {
        setState((s) => ({ ...s, isExporting: false }))
      }
    } catch (err) {
      if (mountedRef.current) {
        const message = err instanceof Error ? err.message : 'Failed to export audit logs'
        setState((s) => ({ ...s, isExporting: false, error: message }))
      }
    }
  }, [filter])

  const clearError = useCallback(() => {
    setState((s) => ({ ...s, error: null }))
  }, [])

  return {
    ...state,
    filter,
    setFilter,
    resetFilter,
    goToPage,
    refresh,
    exportCsv,
    clearError,
  }
}
