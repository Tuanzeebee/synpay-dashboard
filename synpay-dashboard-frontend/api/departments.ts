/**
 * Department Management API Client
 *
 * Calls the FastAPI gateway at /api/departments, which forwards
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

export interface ApiDepartmentResponse {
  departmentId: number
  departmentName: string
  createdAt: string | null
  updatedAt: string | null
}

export interface ApiDepartmentPageResponse {
  content: ApiDepartmentResponse[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

// ── Request Types ────────────────────────────────────────────────

export interface CreateDepartmentPayload {
  departmentName: string
}

export interface UpdateDepartmentPayload {
  departmentName?: string
}

// ── Query Parameters ─────────────────────────────────────────────

export interface DepartmentListParams {
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

/** Paginated department list. Requires department.read. */
export async function fetchDepartments(
  params: DepartmentListParams = {},
): Promise<ApiDepartmentPageResponse> {
  const searchParams = new URLSearchParams()

  if (params.page !== undefined) searchParams.set('page', String(params.page))
  if (params.size !== undefined) searchParams.set('size', String(params.size))

  const qs = searchParams.toString()
  return request<ApiDepartmentPageResponse>(`/api/departments${qs ? `?${qs}` : ''}`)
}

/** Get single department by ID. Requires department.read. */
export async function fetchDepartment(id: number): Promise<ApiDepartmentResponse> {
  return request<ApiDepartmentResponse>(`/api/departments/${id}`)
}

/** Create a new department. Requires department.write. */
export async function createDepartment(
  payload: CreateDepartmentPayload,
): Promise<ApiDepartmentResponse> {
  return request<ApiDepartmentResponse>('/api/departments', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

/** Update an existing department. Requires department.write. */
export async function updateDepartment(
  id: number,
  payload: UpdateDepartmentPayload,
): Promise<ApiDepartmentResponse> {
  return request<ApiDepartmentResponse>(`/api/departments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

/** Delete a department by ID. Requires department.write. */
export async function deleteDepartment(id: number): Promise<void> {
  return request<void>(`/api/departments/${id}`, {
    method: 'DELETE',
  })
}
