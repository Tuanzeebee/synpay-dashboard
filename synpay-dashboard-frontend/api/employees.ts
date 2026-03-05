/**
 * Employee Management API Client
 *
 * Calls the FastAPI gateway at /api/employees, which forwards
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

export interface ApiEmployeeResponse {
  employeeId: number
  fullName: string
  dateOfBirth: string | null
  gender: string | null
  phoneNumber: string | null
  email: string | null
  hireDate: string | null
  departmentId: number | null
  departmentName: string | null
  positionId: number | null
  positionName: string | null
  status: string
  createdAt: string | null
  updatedAt: string | null
  // Detail-only fields (null in list results)
  accountId?: number | null
  accountEmail?: string | null
  accountStatus?: string | null
}

export interface ApiEmployeePageResponse {
  content: ApiEmployeeResponse[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

// ── Request Types ────────────────────────────────────────────────

export interface CreateEmployeePayload {
  fullName: string
  dateOfBirth: string
  gender?: string
  phoneNumber?: string
  email?: string
  hireDate: string
  departmentId: number
  positionId: number
  status?: string
}

export interface UpdateEmployeePayload {
  fullName?: string
  dateOfBirth?: string
  gender?: string
  phoneNumber?: string
  email?: string
  hireDate?: string
  departmentId?: number
  positionId?: number
}

export interface ChangeStatusPayload {
  status: string
}

export interface AssignAccountPayload {
  accountId: number
}

// ── Query Parameters ─────────────────────────────────────────────

export interface EmployeeListParams {
  page?: number
  size?: number
  departmentId?: number
  positionId?: number
  status?: string
  keyword?: string
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

/** Paginated employee list with optional filters. Requires employee.read. */
export async function fetchEmployees(
  params: EmployeeListParams = {},
): Promise<ApiEmployeePageResponse> {
  const searchParams = new URLSearchParams()

  if (params.page !== undefined) searchParams.set('page', String(params.page))
  if (params.size !== undefined) searchParams.set('size', String(params.size))
  if (params.departmentId !== undefined) searchParams.set('departmentId', String(params.departmentId))
  if (params.positionId !== undefined) searchParams.set('positionId', String(params.positionId))
  if (params.status) searchParams.set('status', params.status)
  if (params.keyword) searchParams.set('keyword', params.keyword)

  const qs = searchParams.toString()
  return request<ApiEmployeePageResponse>(`/api/employees${qs ? `?${qs}` : ''}`)
}

/** Get single employee with full detail (includes linked account). */
export async function fetchEmployee(id: number): Promise<ApiEmployeeResponse> {
  return request<ApiEmployeeResponse>(`/api/employees/${id}`)
}

/** Create a new employee. Requires employee.write. */
export async function createEmployee(
  payload: CreateEmployeePayload,
): Promise<ApiEmployeeResponse> {
  return request<ApiEmployeeResponse>('/api/employees', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

/** Update an existing employee. Requires employee.write. */
export async function updateEmployee(
  id: number,
  payload: UpdateEmployeePayload,
): Promise<ApiEmployeeResponse> {
  return request<ApiEmployeeResponse>(`/api/employees/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

/** Change employee status (Active/Inactive). Requires employee.disable. */
export async function changeEmployeeStatus(
  id: number,
  payload: ChangeStatusPayload,
): Promise<ApiEmployeeResponse> {
  return request<ApiEmployeeResponse>(`/api/employees/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

/** Link an account to an employee. Requires employee.assign_account. */
export async function assignEmployeeAccount(
  id: number,
  payload: AssignAccountPayload,
): Promise<ApiEmployeeResponse> {
  return request<ApiEmployeeResponse>(`/api/employees/${id}/assign-account`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

/** Delete an employee by ID. Requires employee.write. */
export async function deleteEmployee(id: number): Promise<void> {
  return request<void>(`/api/employees/${id}`, {
    method: 'DELETE',
  })
}
