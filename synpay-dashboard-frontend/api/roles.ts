/**
 * Role Management API Client
 *
 * Calls the FastAPI gateway at /api/roles, which forwards
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

export interface ApiPermissionItem {
  permissionId: number
  key: string
  name: string
  enabled: boolean
}

/** Returned by both list and detail endpoints */
export interface ApiRoleResponse {
  roleId: number
  code: string
  name: string
  description: string | null
  responsibility: string | null
  createdAt: string | null
  updatedAt: string | null
  userCount: number
  /** null in list, populated in detail */
  permissions: ApiPermissionItem[] | null
}

// ── Request Types ────────────────────────────────────────────────

export interface CreateRolePayload {
  code: string
  name: string
  description?: string
  responsibility?: string
}

export interface UpdateRolePayload {
  name?: string
  description?: string
  responsibility?: string
}

export interface PermissionAssignment {
  permissionId: number
  enabled: boolean
}

export interface AssignPermissionsPayload {
  permissions: PermissionAssignment[]
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

/** List all roles with user counts. Requires role.read permission. */
export async function fetchRoles(): Promise<ApiRoleResponse[]> {
  return request<ApiRoleResponse[]>('/api/roles')
}

/** Get role detail with permissions. Requires role.read permission. */
export async function fetchRole(id: number): Promise<ApiRoleResponse> {
  return request<ApiRoleResponse>(`/api/roles/${id}`)
}

/** Create a new role. Requires role.write permission. */
export async function createRole(payload: CreateRolePayload): Promise<ApiRoleResponse> {
  return request<ApiRoleResponse>('/api/roles', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

/** Update an existing role. Requires role.write permission. */
export async function updateRole(id: number, payload: UpdateRolePayload): Promise<ApiRoleResponse> {
  return request<ApiRoleResponse>(`/api/roles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

/** Assign or update permissions for a role. Requires permission.assign permission. */
export async function assignPermissions(
  roleId: number,
  payload: AssignPermissionsPayload,
): Promise<ApiRoleResponse> {
  return request<ApiRoleResponse>(`/api/roles/${roleId}/permissions`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}
