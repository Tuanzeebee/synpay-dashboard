/**
 * Permission Matrix API Client
 *
 * Typed functions that call the FastAPI gateway endpoints
 * for Permission Matrix CRUD operations.
 *
 * Flow: Frontend → FastAPI Gateway → Spring Boot Integration Core
 */

import { authHeader } from '@/lib/auth'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

// ── API Response Types (mirrors Spring Boot DTOs) ────────────────

export interface ApiEnvelope<T> {
  success: boolean
  message?: string
  data?: T
}

/** A single role's permission state within the matrix. */
export interface RolePermissionMatrix {
  roleId: number
  code: string
  name: string
  /** Keyed by "domain.action" → enabled boolean */
  permissions: Record<string, boolean>
}

/** Full permission matrix response for all roles. */
export interface PermissionMatrixData {
  /** Sorted list of unique permission domains (e.g. "user", "role"). */
  domains: string[]
  /** Sorted list of unique permission actions (e.g. "read", "write"). */
  actions: string[]
  /** All roles with their permission state. */
  roles: RolePermissionMatrix[]
}

/** A single permission item within a domain group. */
export interface PermissionItem {
  permissionId: number
  key: string
  name: string
  action: string
  enabled: boolean
}

/** Permissions grouped under a single domain for a role. */
export interface DomainGroup {
  domain: string
  permissions: PermissionItem[]
  enabledCount: number
}

/** Permission summary for a single role, grouped by domain. */
export interface PermissionSummaryData {
  roleId: number
  roleCode: string
  roleName: string
  domains: DomainGroup[]
  totalEnabled: number
  totalPermissions: number
}

// ── Request Types ────────────────────────────────────────────────

export interface TogglePermissionPayload {
  roleId: number
  domain: string
  action: string
  enabled: boolean
}

// ── Error ────────────────────────────────────────────────────────

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

// ── Request Helper ───────────────────────────────────────────────

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: { 'Content-Type': 'application/json', ...authHeader(), ...options.headers },
    ...options,
  })
  const body: ApiEnvelope<T> = await response.json()
  if (!response.ok || !body.success) {
    throw new ApiError(body.message ?? `Request failed with status ${response.status}`, response.status)
  }
  return body.data as T
}

// ── API Functions ────────────────────────────────────────────────

/**
 * Fetch the full permission matrix for all roles.
 * GET /api/permission-matrix
 */
export async function fetchPermissionMatrix(): Promise<PermissionMatrixData> {
  return request<PermissionMatrixData>('/api/permission-matrix')
}

/**
 * Toggle a single permission cell in the matrix.
 * PUT /api/permission-matrix
 */
export async function togglePermission(payload: TogglePermissionPayload): Promise<PermissionMatrixData> {
  return request<PermissionMatrixData>('/api/permission-matrix', {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

/**
 * Fetch permission summary for a role, grouped by domain.
 * GET /api/roles/{roleId}/permissions/summary
 */
export async function fetchPermissionSummary(roleId: number): Promise<PermissionSummaryData> {
  return request<PermissionSummaryData>(`/api/roles/${roleId}/permissions/summary`)
}
