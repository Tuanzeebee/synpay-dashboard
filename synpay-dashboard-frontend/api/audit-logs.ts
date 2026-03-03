/**
 * Audit Log API Client
 *
 * Typed functions that call the FastAPI gateway endpoints
 * for Audit Log read and export operations.
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

/** A single audit log entry returned by the API. */
export interface AuditLogEntry {
  id: number
  actorAccountId: number
  actorEmail: string | null
  actorRole: string | null
  action: string
  resource: string
  resourceId: string | null
  actionDescription: string | null
  oldValue: unknown
  newValue: unknown
  ipAddress: string | null
  userAgent: string | null
  createdAt: string
}

/** Paginated audit log response. */
export interface AuditLogPage {
  content: AuditLogEntry[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

/** Filter parameters for listing / exporting audit logs. */
export interface AuditLogFilter {
  actorEmail?: string
  action?: string
  resource?: string
  dateFrom?: string
  dateTo?: string
  page?: number
  size?: number
}

/** Body for the CSV export request. */
export interface AuditLogExportBody {
  actorEmail?: string
  action?: string
  resource?: string
  dateFrom?: string
  dateTo?: string
  format?: string
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
 * Fetch a paginated, filtered list of audit log entries.
 * GET /api/audit-logs
 */
export async function fetchAuditLogs(filter: AuditLogFilter = {}): Promise<AuditLogPage> {
  const params = new URLSearchParams()
  if (filter.actorEmail) params.set('actorEmail', filter.actorEmail)
  if (filter.action) params.set('action', filter.action)
  if (filter.resource) params.set('resource', filter.resource)
  if (filter.dateFrom) params.set('dateFrom', filter.dateFrom)
  if (filter.dateTo) params.set('dateTo', filter.dateTo)
  if (filter.page !== undefined) params.set('page', String(filter.page))
  if (filter.size !== undefined) params.set('size', String(filter.size))

  const qs = params.toString()
  return request<AuditLogPage>(`/api/audit-logs${qs ? `?${qs}` : ''}`)
}

/**
 * Fetch a single audit log entry by ID.
 * GET /api/audit-logs/{id}
 */
export async function fetchAuditLogById(id: number): Promise<AuditLogEntry> {
  return request<AuditLogEntry>(`/api/audit-logs/${id}`)
}

/**
 * Export audit logs as CSV. Returns the raw CSV text.
 * POST /api/audit-logs/export
 */
export async function exportAuditLogs(filter: AuditLogExportBody = {}): Promise<string> {
  const response = await fetch(`${API_BASE}/api/audit-logs/export`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify(filter),
  })

  // CSV comes back as text/csv; error comes back as JSON
  const contentType = response.headers.get('content-type') ?? ''
  if (contentType.includes('text/csv')) {
    return response.text()
  }

  // Error path — parse as JSON
  const body = await response.json()
  throw new ApiError(body.message ?? `Export failed with status ${response.status}`, response.status)
}
