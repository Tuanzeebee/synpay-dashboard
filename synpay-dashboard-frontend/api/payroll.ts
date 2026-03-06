/**
 * Payroll Management API Client
 *
 * Calls the FastAPI gateway at /api/payroll, which forwards
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

export interface ApiSalaryResponse {
  salaryId: number
  employeeId: number
  employeeName: string | null
  departmentName: string | null
  positionName: string | null
  salaryMonth: string
  baseSalary: number
  bonus: number
  deductions: number
  netSalary: number
  createdAt: string | null
}

export interface ApiSalaryDetailResponse {
  salaryId: number
  salaryMonth: string
  baseSalary: number
  bonus: number
  deductions: number
  netSalary: number
  createdAt: string | null
  employeeId: number
  employeeName: string | null
  employeeStatus: string | null
  departmentId: number | null
  departmentName: string | null
  positionId: number | null
  positionName: string | null
  workDays: number | null
  absentDays: number | null
  leaveDays: number | null
}

export interface ApiSalaryPageResponse {
  content: ApiSalaryResponse[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

// ── Request Types ────────────────────────────────────────────────

export interface AdjustSalaryPayload {
  baseSalary?: number
  bonus?: number
  deductions?: number
  netSalary?: number
}

export interface CreateSalaryPayload {
  employeeId: number
  salaryMonth: string
  baseSalary: number
  bonus?: number
  deductions?: number
  netSalary?: number
}

// ── Query Parameters ─────────────────────────────────────────────

export interface PayrollListParams {
  employee_id?: number
  department_id?: number
  salary_month?: string
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

/** Paginated salary list with filters. Requires payroll.read. */
export async function fetchPayrollList(
  params: PayrollListParams = {},
): Promise<ApiSalaryPageResponse> {
  const searchParams = new URLSearchParams()

  if (params.page !== undefined) searchParams.set('page', String(params.page))
  if (params.size !== undefined) searchParams.set('size', String(params.size))
  if (params.employee_id !== undefined) searchParams.set('employee_id', String(params.employee_id))
  if (params.department_id !== undefined) searchParams.set('department_id', String(params.department_id))
  if (params.salary_month) searchParams.set('salary_month', params.salary_month)

  const qs = searchParams.toString()
  return request<ApiSalaryPageResponse>(`/api/payroll${qs ? `?${qs}` : ''}`)
}

/** Fetch distinct salary months (descending). Requires payroll.read. */
export async function fetchSalaryMonths(): Promise<string[]> {
  return request<string[]>('/api/payroll/months')
}

/** Get salary detail by ID. Requires payroll.read. */
export async function fetchSalaryDetail(
  salaryId: number,
): Promise<ApiSalaryDetailResponse> {
  return request<ApiSalaryDetailResponse>(`/api/payroll/${salaryId}`)
}

/** Adjust bonus / deductions for a salary. Requires payroll.write. */
export async function adjustSalary(
  salaryId: number,
  payload: AdjustSalaryPayload,
): Promise<ApiSalaryResponse> {
  return request<ApiSalaryResponse>(`/api/payroll/${salaryId}/adjust`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

/** Create a new salary record. Requires payroll.write. */
export async function createSalaryApi(
  payload: CreateSalaryPayload,
): Promise<ApiSalaryResponse> {
  return request<ApiSalaryResponse>('/api/payroll', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

/** Approve a salary record. Requires payroll.approve. */
export async function approveSalary(
  salaryId: number,
): Promise<ApiSalaryResponse> {
  return request<ApiSalaryResponse>(`/api/payroll/${salaryId}/approve`, {
    method: 'POST',
  })
}

/** Export salary report as Excel (.xlsx). Requires payroll.export. */
export async function exportPayroll(
  params: Omit<PayrollListParams, 'page' | 'size'> = {},
): Promise<Blob> {
  const searchParams = new URLSearchParams()

  if (params.employee_id !== undefined) searchParams.set('employee_id', String(params.employee_id))
  if (params.department_id !== undefined) searchParams.set('department_id', String(params.department_id))
  if (params.salary_month) searchParams.set('salary_month', params.salary_month)

  const qs = searchParams.toString()
  const response = await fetch(`${API_BASE}/api/payroll/export${qs ? `?${qs}` : ''}`, {
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
