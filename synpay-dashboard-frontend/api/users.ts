/**
 * User Management API Client
 *
 * Calls the FastAPI gateway at /api/users, which forwards
 * all requests to Spring Boot Integration Core.
 *
 * This module does NOT enforce RBAC — that's handled by Spring Boot.
 */

import { authHeader } from '@/lib/auth'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

// ── API Response Types (mirror Spring Boot DTOs) ─────────────────

export interface ApiEnvelope<T> {
  success: boolean
  message?: string
  data?: T
}

export interface ApiRoleResponse {
  roleId: number
  code: string
  name: string
}

export interface ApiPermissionResponse {
  permissionId: number
  key: string
  name: string
  enabled: boolean
}

export interface ApiRoleDetailResponse {
  roleId: number
  code: string
  name: string
  permissions: ApiPermissionResponse[]
}

/** GET /api/users list item */
export interface ApiUserResponse {
  accountId: number
  email: string
  employeeId: number
  status: string
  createdAt: string | null
  lastLoginAt: string | null
  roles: ApiRoleResponse[]
}

/** GET /api/users/{id} detail */
export interface ApiUserDetailResponse {
  accountId: number
  email: string
  employeeId: number
  status: string
  createdAt: string | null
  updatedAt: string | null
  lastLoginAt: string | null
  lastLogoutAt: string | null
  roles: ApiRoleDetailResponse[]
}

// ── Request Types ────────────────────────────────────────────────

export interface CreateUserPayload {
  email: string
  password: string
  employeeId: number
  roleIds: number[]
  status?: string
}

export interface UpdateUserPayload {
  email?: string
  password?: string
  status?: string
  employeeId?: number
  roleIds?: number[]
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

/** List all user accounts. Requires user.read permission. */
export async function fetchUsers(): Promise<ApiUserResponse[]> {
  return request<ApiUserResponse[]>('/api/users')
}

/** Get user detail by ID. Requires user.read permission. */
export async function fetchUser(id: number): Promise<ApiUserDetailResponse> {
  return request<ApiUserDetailResponse>(`/api/users/${id}`)
}

/** Create a new user account. Requires user.write permission. */
export async function createUser(payload: CreateUserPayload): Promise<ApiUserDetailResponse> {
  return request<ApiUserDetailResponse>('/api/users', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

/** Update an existing user account. Requires user.write permission. */
export async function updateUser(id: number, payload: UpdateUserPayload): Promise<ApiUserDetailResponse> {
  return request<ApiUserDetailResponse>(`/api/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}
