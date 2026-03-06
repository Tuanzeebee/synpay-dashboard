'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import {
  fetchAttendanceList,
  fetchAttendanceDetail,
  adjustAttendance,
  approveAttendance,
  exportAttendance,
  type ApiAttendanceResponse,
  type ApiAttendanceDetailResponse,
  type ApiAttendancePageResponse,
  type AdjustAttendancePayload,
  type AttendanceListParams,
} from '@/api/attendance'

// ── Mapped UI Types ──────────────────────────────────────────────

export interface AttendanceItem {
  attendanceId: number
  employeeId: number
  employeeName: string
  departmentName: string
  positionName: string
  workDays: number
  absentDays: number
  leaveDays: number
  attendanceMonth: string
  createdAt: string | null
}

export interface AttendanceDetail {
  attendanceId: number
  employeeId: number
  employeeName: string
  employeeStatus: string
  departmentId: number | null
  departmentName: string
  positionId: number | null
  positionName: string
  workDays: number
  absentDays: number
  leaveDays: number
  attendanceMonth: string
  createdAt: string | null
}

// ── Mapper ───────────────────────────────────────────────────────

function toItem(dto: ApiAttendanceResponse): AttendanceItem {
  return {
    attendanceId: dto.attendanceId,
    employeeId: dto.employeeId,
    employeeName: dto.employeeName ?? '',
    departmentName: dto.departmentName ?? '',
    positionName: dto.positionName ?? '',
    workDays: dto.workDays,
    absentDays: dto.absentDays,
    leaveDays: dto.leaveDays,
    attendanceMonth: dto.attendanceMonth,
    createdAt: dto.createdAt,
  }
}

function toDetail(dto: ApiAttendanceDetailResponse): AttendanceDetail {
  return {
    attendanceId: dto.attendanceId,
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
    attendanceMonth: dto.attendanceMonth,
    createdAt: dto.createdAt,
  }
}

// ── Hook State ───────────────────────────────────────────────────

interface UseAttendanceState {
  attendances: AttendanceItem[]
  totalElements: number
  totalPages: number
  currentPage: number
  pageSize: number
  isLoading: boolean
  error: string | null
  isSaving: boolean
}

interface UseAttendanceReturn extends UseAttendanceState {
  refresh: () => Promise<void>
  loadAttendance: (params: AttendanceListParams) => Promise<void>
  getDetail: (attendanceId: number) => Promise<AttendanceDetail>
  adjust: (attendanceId: number, payload: AdjustAttendancePayload) => Promise<AttendanceItem>
  approve: (attendanceId: number) => Promise<AttendanceItem>
  exportExcel: (params?: Omit<AttendanceListParams, 'page' | 'size'>) => Promise<void>
  clearError: () => void
}

// ── Hook ─────────────────────────────────────────────────────────

export function useAttendance(initialParams?: AttendanceListParams): UseAttendanceReturn {
  const [state, setState] = useState<UseAttendanceState>({
    attendances: [],
    totalElements: 0,
    totalPages: 0,
    currentPage: 0,
    pageSize: 20,
    isLoading: true,
    error: null,
    isSaving: false,
  })

  const mountedRef = useRef(true)
  const lastParamsRef = useRef<AttendanceListParams>(initialParams ?? {})

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  // ── Load attendance records with params ────────────────────

  const loadAttendance = useCallback(async (params: AttendanceListParams) => {
    lastParamsRef.current = params
    setState((s) => ({ ...s, isLoading: true, error: null }))
    try {
      const page: ApiAttendancePageResponse = await fetchAttendanceList(params)
      if (mountedRef.current) {
        setState((s) => ({
          ...s,
          attendances: page.content.map(toItem),
          totalElements: page.totalElements,
          totalPages: page.totalPages,
          currentPage: page.page,
          pageSize: page.size,
          isLoading: false,
        }))
      }
    } catch (err) {
      if (mountedRef.current) {
        const message = err instanceof Error ? err.message : 'Không thể tải dữ liệu chấm công'
        setState((s) => ({ ...s, isLoading: false, error: message }))
      }
    }
  }, [])

  // ── Refresh with last-used params ──────────────────────────

  const refresh = useCallback(async () => {
    await loadAttendance(lastParamsRef.current)
  }, [loadAttendance])

  // Load on mount
  useEffect(() => {
    loadAttendance(initialParams ?? { page: 0, size: 20 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Get single detail ──────────────────────────────────────

  const getDetail = useCallback(async (attendanceId: number): Promise<AttendanceDetail> => {
    const dto = await fetchAttendanceDetail(attendanceId)
    return toDetail(dto)
  }, [])

  // ── Adjust work_days / absent_days / leave_days ────────────

  const adjust = useCallback(async (
    attendanceId: number,
    payload: AdjustAttendancePayload,
  ): Promise<AttendanceItem> => {
    setState((s) => ({ ...s, isSaving: true, error: null }))
    try {
      const dto = await adjustAttendance(attendanceId, payload)
      const item = toItem(dto)
      if (mountedRef.current) {
        setState((s) => ({
          ...s,
          isSaving: false,
          attendances: s.attendances.map((att) =>
            att.attendanceId === attendanceId ? item : att,
          ),
        }))
      }
      return item
    } catch (err) {
      if (mountedRef.current) {
        const message = err instanceof Error ? err.message : 'Điều chỉnh chấm công thất bại'
        setState((s) => ({ ...s, isSaving: false, error: message }))
      }
      throw err
    }
  }, [])

  // ── Approve attendance record ──────────────────────────────

  const approve = useCallback(async (attendanceId: number): Promise<AttendanceItem> => {
    setState((s) => ({ ...s, isSaving: true, error: null }))
    try {
      const dto = await approveAttendance(attendanceId)
      const item = toItem(dto)
      if (mountedRef.current) {
        setState((s) => ({ ...s, isSaving: false }))
      }
      return item
    } catch (err) {
      if (mountedRef.current) {
        const message = err instanceof Error ? err.message : 'Phê duyệt chấm công thất bại'
        setState((s) => ({ ...s, isSaving: false, error: message }))
      }
      throw err
    }
  }, [])

  // ── Export Excel ───────────────────────────────────────────

  const exportExcel = useCallback(async (
    params: Omit<AttendanceListParams, 'page' | 'size'> = {},
  ): Promise<void> => {
    const blob = await exportAttendance(params)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'attendance_report.xlsx'
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
    loadAttendance,
    getDetail,
    adjust,
    approve,
    exportExcel,
    clearError,
  }
}
