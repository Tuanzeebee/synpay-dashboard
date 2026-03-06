/**
 * Reports & Analytics API Client
 *
 * Calls the FastAPI gateway at /api/reports, which forwards
 * all requests to Spring Boot Integration Core.
 *
 * RBAC is enforced server-side by Spring Boot — this layer
 * only handles HTTP transport and type-safe response mapping.
 */

import { authHeader } from '@/lib/auth'
import {
  ReportsData,
  KPIData,
  DepartmentData,
  SalaryTrendData,
  StatusDistribution,
  LeaveTypeData,
  AttendanceData,
  DividendData,
  PerformanceData,
} from '@/views/reports/analytics/types'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

// ── API Envelope ─────────────────────────────────────────────────

export interface ApiEnvelope<T> {
  success: boolean
  message?: string
  data?: T
}

// ── Request Types ────────────────────────────────────────────────

export interface ReportsFilterParams {
  department?: string
  startDate?: string
  endDate?: string
}

// ── Helpers ──────────────────────────────────────────────────────

function buildQS(filters?: ReportsFilterParams): string {
  const params = new URLSearchParams()
  if (filters?.department && filters.department !== 'all') params.set('department', filters.department)
  if (filters?.startDate) params.set('startDate', filters.startDate)
  if (filters?.endDate) params.set('endDate', filters.endDate)
  const qs = params.toString()
  return qs ? `?${qs}` : ''
}

async function get<T>(path: string, filters?: ReportsFilterParams): Promise<T> {
  const url = `${API_BASE}${path}${buildQS(filters)}`
  const res = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.message ?? `Reports API error: ${res.status}`)
  }
  const envelope: ApiEnvelope<T> = await res.json()
  if (!envelope.success || !envelope.data) {
    throw new Error(envelope.message ?? 'Failed to fetch reports data')
  }
  return envelope.data
}

// ── API Functions ────────────────────────────────────────────────

/** Full aggregated reports data. Requires: report.view_dashboard */
export function fetchReportsData(filters?: ReportsFilterParams): Promise<ReportsData> {
  return get<ReportsData>('/api/reports', filters)
}

// ── Sub-Report Responses ─────────────────────────────────────────

export interface DashboardReport {
  totalEmployees: number
  totalDepartments: number
  payrollTotalThisMonth: number
  attendanceRate: number
  growthRate: number
  avgSalary: number
  statusDistribution: StatusDistribution[]
  performance: PerformanceData[]
}

export interface HrReport {
  totalEmployees: number
  growthRate: number
  departments: DepartmentData[]
  statusDistribution: StatusDistribution[]
  performance: PerformanceData[]
}

export interface PayrollReport {
  totalSalary: number
  avgSalary: number
  salaryTrend: SalaryTrendData[]
  departments: DepartmentData[]
  dividends: DividendData[]
}

export interface AttendanceReport {
  overallAttendanceRate: number
  totalLeave: number
  leaveChange: number
  attendance: AttendanceData[]
  leaveTypes: LeaveTypeData[]
}

// ── Sub-Report Fetchers ──────────────────────────────────────────

/** Dashboard overview KPIs. Requires: report.view_dashboard */
export function fetchDashboardReport(filters?: ReportsFilterParams): Promise<DashboardReport> {
  return get<DashboardReport>('/api/reports/dashboard', filters)
}

/** HR report. Requires: report.view_hr */
export function fetchHrReport(filters?: ReportsFilterParams): Promise<HrReport> {
  return get<HrReport>('/api/reports/hr', filters)
}

/** Payroll report. Requires: report.view_payroll */
export function fetchPayrollReport(filters?: ReportsFilterParams): Promise<PayrollReport> {
  return get<PayrollReport>('/api/reports/payroll', filters)
}

/** Attendance report. Requires: report.view_dashboard */
export function fetchAttendanceReport(filters?: ReportsFilterParams): Promise<AttendanceReport> {
  return get<AttendanceReport>('/api/reports/attendance', filters)
}

/** Dividend trend. Requires: report.view_payroll */
export function fetchDividendsReport(filters?: ReportsFilterParams): Promise<DividendData[]> {
  return get<DividendData[]>('/api/reports/dividends', filters)
}

/** Export full data. Requires: report.export */
export function fetchExportReport(filters?: ReportsFilterParams): Promise<ReportsData> {
  return get<ReportsData>('/api/reports/export', filters)
}
