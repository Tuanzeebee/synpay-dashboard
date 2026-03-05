/**
 * Position Management API Client
 *
 * Calls the FastAPI gateway at /api/positions, which forwards
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

export interface ApiPositionResponse {
  positionId: number
  positionName: string
  createdAt: string | null
  updatedAt: string | null
}

export interface ApiPositionPageResponse {
  content: ApiPositionResponse[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

// ── Request Types ────────────────────────────────────────────────

export interface CreatePositionPayload {
  positionName: string
}

export interface UpdatePositionPayload {
  positionName?: string
}

// ── Query Parameters ─────────────────────────────────────────────

export interface PositionListParams {
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

/** Paginated position list. Requires position.read. */
export async function fetchPositions(
  params: PositionListParams = {},
): Promise<ApiPositionPageResponse> {
  const searchParams = new URLSearchParams()

  if (params.page !== undefined) searchParams.set('page', String(params.page))
  if (params.size !== undefined) searchParams.set('size', String(params.size))

  const qs = searchParams.toString()
  return request<ApiPositionPageResponse>(`/api/positions${qs ? `?${qs}` : ''}`)
}

/** Get single position by ID. Requires position.read. */
export async function fetchPosition(id: number): Promise<ApiPositionResponse> {
  return request<ApiPositionResponse>(`/api/positions/${id}`)
}

/** Create a new position. Requires position.write. */
export async function createPosition(
  payload: CreatePositionPayload,
): Promise<ApiPositionResponse> {
  return request<ApiPositionResponse>('/api/positions', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

/** Update an existing position. Requires position.write. */
export async function updatePosition(
  id: number,
  payload: UpdatePositionPayload,
): Promise<ApiPositionResponse> {
  return request<ApiPositionResponse>(`/api/positions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

/** Delete a position by ID. Requires position.write. */
export async function deletePosition(id: number): Promise<void> {
  return request<void>(`/api/positions/${id}`, {
    method: 'DELETE',
  })
}
