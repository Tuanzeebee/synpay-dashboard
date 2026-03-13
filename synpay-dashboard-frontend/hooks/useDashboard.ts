'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import {
  fetchDashboardOverview,
  fetchDashboardHr,
  fetchDashboardPayroll,
  fetchDashboardAttendance,
  fetchDashboardActivity,
  type DashboardOverviewData,
  type DashboardHrData,
  type DashboardPayrollData,
  type DashboardAttendanceData,
  type DashboardActivityData,
  type NameValueItem,
  type MonthValueItem,
  type DonutItem,
  type AlertItem,
  type KpiSummary,
  type ActivityItem,
} from '@/api/dashboard'

// ── Re-export types for consumers ────────────────────────────────

export type {
  DashboardOverviewData,
  DashboardHrData,
  DashboardPayrollData,
  DashboardAttendanceData,
  DashboardActivityData,
  NameValueItem,
  MonthValueItem,
  DonutItem,
  AlertItem,
  KpiSummary,
  ActivityItem,
}

// ── Hook State ───────────────────────────────────────────────────

interface UseDashboardState {
  overview: DashboardOverviewData | null
  hr: DashboardHrData | null
  payroll: DashboardPayrollData | null
  attendance: DashboardAttendanceData | null
  activity: DashboardActivityData | null
  isLoading: boolean
  error: string | null
}

export interface UseDashboardReturn extends UseDashboardState {
  /** Re-fetch all dashboard data */
  refresh: () => Promise<void>
  /** Fetch only the overview endpoint */
  loadOverview: () => Promise<void>
  /** Fetch only the HR endpoint */
  loadHr: () => Promise<void>
  /** Fetch only the payroll endpoint */
  loadPayroll: () => Promise<void>
  /** Fetch only the attendance endpoint */
  loadAttendance: () => Promise<void>
  /** Fetch only the activity endpoint */
  loadActivity: () => Promise<void>
  /** Clear current error */
  clearError: () => void
}

// ── Hook ─────────────────────────────────────────────────────────

/**
 * Hook to fetch dashboard data from API endpoints.
 * 
 * IMPORTANT: By default, fetching is delayed until authentication is verified.
 * This prevents 401 errors on page refresh. Pass skipAuthCheck=true only if you're
 * confident that the auth token is already loaded (e.g., from a protected page).
 */
export function useDashboard(skipAuthCheck = false): UseDashboardReturn {
  const auth = useAuth()
  const [state, setState] = useState<UseDashboardState>({
    overview: null,
    hr: null,
    payroll: null,
    attendance: null,
    activity: null,
    isLoading: true,
    error: null,
  })

  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  // ── Individual loaders ─────────────────────────────────────

  const loadOverview = useCallback(async () => {
    setState((s) => ({ ...s, isLoading: true, error: null }))
    try {
      const data = await fetchDashboardOverview()
      if (mountedRef.current) {
        setState((s) => ({ ...s, overview: data, isLoading: false }))
      }
    } catch (err) {
      if (mountedRef.current) {
        const message = err instanceof Error ? err.message : 'Không thể tải dữ liệu tổng quan'
        setState((s) => ({ ...s, isLoading: false, error: message }))
      }
    }
  }, [])

  const loadHr = useCallback(async () => {
    setState((s) => ({ ...s, isLoading: true, error: null }))
    try {
      const data = await fetchDashboardHr()
      if (mountedRef.current) {
        setState((s) => ({ ...s, hr: data, isLoading: false }))
      }
    } catch (err) {
      if (mountedRef.current) {
        const message = err instanceof Error ? err.message : 'Không thể tải dữ liệu HR'
        setState((s) => ({ ...s, isLoading: false, error: message }))
      }
    }
  }, [])

  const loadPayroll = useCallback(async () => {
    setState((s) => ({ ...s, isLoading: true, error: null }))
    try {
      const data = await fetchDashboardPayroll()
      if (mountedRef.current) {
        setState((s) => ({ ...s, payroll: data, isLoading: false }))
      }
    } catch (err) {
      if (mountedRef.current) {
        const message = err instanceof Error ? err.message : 'Không thể tải dữ liệu bảng lương'
        setState((s) => ({ ...s, isLoading: false, error: message }))
      }
    }
  }, [])

  const loadAttendance = useCallback(async () => {
    setState((s) => ({ ...s, isLoading: true, error: null }))
    try {
      const data = await fetchDashboardAttendance()
      if (mountedRef.current) {
        setState((s) => ({ ...s, attendance: data, isLoading: false }))
      }
    } catch (err) {
      if (mountedRef.current) {
        const message = err instanceof Error ? err.message : 'Không thể tải dữ liệu chấm công'
        setState((s) => ({ ...s, isLoading: false, error: message }))
      }
    }
  }, [])

  const loadActivity = useCallback(async () => {
    setState((s) => ({ ...s, isLoading: true, error: null }))
    try {
      const data = await fetchDashboardActivity()
      if (mountedRef.current) {
        setState((s) => ({ ...s, activity: data, isLoading: false }))
      }
    } catch (err) {
      if (mountedRef.current) {
        const message = err instanceof Error ? err.message : 'Không thể tải dữ liệu hoạt động'
        setState((s) => ({ ...s, isLoading: false, error: message }))
      }
    }
  }, [])

  // ── Refresh all ────────────────────────────────────────────

  const refresh = useCallback(async () => {
    setState((s) => ({ ...s, isLoading: true, error: null }))
    try {
      const [overview, hr, payroll, attendance, activity] = await Promise.all([
        fetchDashboardOverview(),
        fetchDashboardHr(),
        fetchDashboardPayroll(),
        fetchDashboardAttendance(),
        fetchDashboardActivity(),
      ])
      if (mountedRef.current) {
        setState({ overview, hr, payroll, attendance, activity, isLoading: false, error: null })
      }
    } catch (err) {
      if (mountedRef.current) {
        const message = err instanceof Error ? err.message : 'Không thể tải dữ liệu dashboard'
        setState((s) => ({ ...s, isLoading: false, error: message }))
      }
    }
  }, [])

  // ── Clear error ────────────────────────────────────────────

  const clearError = useCallback(() => {
    setState((s) => ({ ...s, error: null }))
  }, [])

  // ── Auto-load on mount ─────────────────────────────────────

  useEffect(() => {
    if (skipAuthCheck || (!auth.isLoading && auth.isAuthenticated)) {
      refresh()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skipAuthCheck, auth.isLoading, auth.isAuthenticated])

  return {
    ...state,
    refresh,
    loadOverview,
    loadHr,
    loadPayroll,
    loadAttendance,
    loadActivity,
    clearError,
  }
}
