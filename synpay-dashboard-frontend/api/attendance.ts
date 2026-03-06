/**
 * Attendance Management API Client
 *
 * Calls the FastAPI gateway at /api/attendance, which forwards
 * all requests to Spring Boot Integration Core.
 *
 * RBAC is enforced server-side by Spring Boot — this layer
 * only handles HTTP transport and type-safe response mapping.
 */

import { authHeader } from '@/lib/auth'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

// ── API Envelope ─────────────────────────────────────────────────

export interface ApiEnvelope<T> {
  success: boolean
  message?: string
  data?: T
}

// ── Response Types (mirror Spring Boot DTOs) ─────────────────────

export interface ApiAttendanceResponse {
  attendanceId: number
  employeeId: number
  employeeName: string | null
  departmentName: string | null
  positionName: string | null
  workDays: number
  absentDays: number
  leaveDays: number
  attendanceMonth: string
  createdAt: string | null
}

export interface ApiAttendanceDetailResponse {
  attendanceId: number
  employeeId: number
  employeeName: string | null
  employeeStatus: string | null
  departmentId: number | null
  departmentName: string | null
  positionId: number | null
  positionName: string | null
  workDays: number
  absentDays: number
  leaveDays: number
  attendanceMonth: string
  createdAt: string | null
}

export interface ApiAttendancePageResponse {
  content: ApiAttendanceResponse[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

// ── Request Types ────────────────────────────────────────────────

export interface AdjustAttendancePayload {
  workDays?: number
  absentDays?: number
  leaveDays?: number
  reason?: string
}

// ── Query Parameters ─────────────────────────────────────────────

export interface AttendanceListParams {
  employee_id?: number
  department_id?: number
  attendance_month?: string
  page?: number
  size?: number
}

// ── API Error ────────────────────────────────────────────────────

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

// ── Helper ───────────────────────────────────────────────────────

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...authHeader(),
      ...options.headers,
    },
    ...options,
  })

  const body: ApiEnvelope<T> = await response.json()

  if (!response.ok || !body.success) {
    throw new ApiError(
      body.message ?? `Request failed with status ${response.status}`,
      response.status,
    )
  }

  return body.data as T
}

// ── API Functions ────────────────────────────────────────────────

/** Paginated attendance list with filters. Requires attendance.read. */
export async function fetchAttendanceList(
  params: AttendanceListParams = {},
): Promise<ApiAttendancePageResponse> {
  const searchParams = new URLSearchParams()

  if (params.page !== undefined) searchParams.set('page', String(params.page))
  if (params.size !== undefined) searchParams.set('size', String(params.size))
  if (params.employee_id !== undefined) searchParams.set('employee_id', String(params.employee_id))
  if (params.department_id !== undefined) searchParams.set('department_id', String(params.department_id))
  if (params.attendance_month) searchParams.set('attendance_month', params.attendance_month)

  const qs = searchParams.toString()
  return request<ApiAttendancePageResponse>(`/api/attendance${qs ? `?${qs}` : ''}`)
}

/** Get attendance detail by ID. Requires attendance.read. */
export async function fetchAttendanceDetail(
  attendanceId: number,
): Promise<ApiAttendanceDetailResponse> {
  return request<ApiAttendanceDetailResponse>(`/api/attendance/${attendanceId}`)
}

/** Adjust work_days / absent_days / leave_days. Requires attendance.write. */
export async function adjustAttendance(
  attendanceId: number,
  payload: AdjustAttendancePayload,
): Promise<ApiAttendanceResponse> {
  return request<ApiAttendanceResponse>(`/api/attendance/${attendanceId}/adjust`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

/** Approve an attendance record. Requires attendance.approve. */
export async function approveAttendance(
  attendanceId: number,
): Promise<ApiAttendanceResponse> {
  return request<ApiAttendanceResponse>(`/api/attendance/${attendanceId}/approve`, {
    method: 'POST',
  })
}

/** Export attendance report as Excel (.xlsx). Requires attendance.export. */
export async function exportAttendance(
  params: Omit<AttendanceListParams, 'page' | 'size'> = {},
): Promise<Blob> {
  const searchParams = new URLSearchParams()

  if (params.employee_id !== undefined) searchParams.set('employee_id', String(params.employee_id))
  if (params.department_id !== undefined) searchParams.set('department_id', String(params.department_id))
  if (params.attendance_month) searchParams.set('attendance_month', params.attendance_month)

  const qs = searchParams.toString()
  const response = await fetch(`${API_BASE}/api/attendance/export${qs ? `?${qs}` : ''}`, {
    headers: { ...authHeader() },
  })

  if (!response.ok) {
    let message = `Export failed with status ${response.status}`
    try {
      const err = await response.json()
      if (err?.message) message = err.message
    } catch { /* response body is not JSON */ }
    throw new ApiError(message, response.status)
  }

  return response.blob()
}
