/**
 * Dashboard API Client
 *
 * Calls the FastAPI gateway at /api/dashboard, which forwards
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

export interface NameValueItem {
  name: string
  value: number
}

export interface MonthValueItem {
  month: string
  value: number
}

export interface DonutItem {
  name: string
  value: number
  color: string
}

export interface AlertItem {
  severity: string
  category: string
  title: string
  description: string
  time: string
}

export interface KpiSummary {
  totalEmployees: number
  activeEmployees: number
  activePercent: number
  monthlyPayroll: number
  avgSalary: number
  leaveDays: number
  alertCount: number
  employeeGrowthPercent: number
  payrollGrowthPercent: number
  leaveGrowthPercent: number
}

export interface DashboardOverviewData {
  kpis: KpiSummary
  deptData: NameValueItem[]
  headcountData: MonthValueItem[]
  payrollData: MonthValueItem[]
  payrollDonutData: DonutItem[]
  alerts: AlertItem[]
}

export interface DashboardHrData {
  totalEmployees: number
  activeEmployees: number
  growthPercent: number
  departmentDistribution: NameValueItem[]
  headcountTrend: MonthValueItem[]
}

export interface DashboardPayrollData {
  totalPayroll: number
  avgSalary: number
  changePercent: number
  payrollTrend: MonthValueItem[]
  payrollByDepartment: DonutItem[]
}

export interface DashboardAttendanceData {
  attendanceRate: number
  totalLeaveDays: number
  totalAbsentDays: number
  totalWorkDays: number
  leaveChangePercent: number
}

export interface ActivityItem {
  auditId: number
  actorEmail: string
  actorRole: string
  action: string
  resource: string
  resourceId: string | null
  description: string
  ipAddress: string | null
  createdAt: string
}

export interface DashboardActivityData {
  totalRecentActions: number
  recentActivities: ActivityItem[]
}

// ── Helpers ──────────────────────────────────────────────────────

async function get<T>(path: string): Promise<T> {
  const url = `${API_BASE}${path}`
  const res = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.message ?? `Dashboard API error: ${res.status}`)
  }
  const envelope: ApiEnvelope<T> = await res.json()
  if (!envelope.success || !envelope.data) {
    throw new Error(envelope.message ?? 'Failed to fetch dashboard data')
  }
  return envelope.data
}

// ── API Functions ────────────────────────────────────────────────

/** Full dashboard overview: KPIs, charts, alerts. Requires: report.view_dashboard */
export function fetchDashboardOverview(): Promise<DashboardOverviewData> {
  return get<DashboardOverviewData>('/api/dashboard/overview')
}

/** HR dashboard: employee counts, department distribution, headcount trend. Requires: report.view_hr */
export function fetchDashboardHr(): Promise<DashboardHrData> {
  return get<DashboardHrData>('/api/dashboard/hr')
}

/** Payroll dashboard: monthly trend, department donut chart. Requires: report.view_payroll */
export function fetchDashboardPayroll(): Promise<DashboardPayrollData> {
  return get<DashboardPayrollData>('/api/dashboard/payroll')
}

/** Attendance dashboard: rates, leave days, absent days. Requires: report.view_dashboard */
export function fetchDashboardAttendance(): Promise<DashboardAttendanceData> {
  return get<DashboardAttendanceData>('/api/dashboard/attendance')
}

/** Activity dashboard: recent audit log entries. Requires: report.view_dashboard */
export function fetchDashboardActivity(): Promise<DashboardActivityData> {
  return get<DashboardActivityData>('/api/dashboard/activity')
}
