/**
 * Authentication API Client & Token Storage
 *
 * - Access token: kept in memory (not localStorage) to mitigate XSS.
 * - Refresh token: httpOnly cookie managed by the FastAPI gateway.
 * - User profile: persisted in localStorage for hydration on page reload.
 */

// ── Types ────────────────────────────────────────────────────────

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponseData {
  access_token: string
  token_type: string
  expires_in: number
  account_id: number
  role: string
  employee_id: number
  permissions: string[]
}

export interface ApiEnvelope<T> {
  success: boolean
  message?: string
  error?: { code: string; message: string }
  data?: T
}

export interface AuthUser {
  accountId: number
  email: string
  role: string
  employeeId: number
  permissions: string[]
}

export interface AuthState {
  user: AuthUser | null
  token: string | null
  isAuthenticated: boolean
}

// ── Constants ────────────────────────────────────────────────────

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'
const USER_KEY = 'synpay_auth_user'

// ── In-Memory Token ──────────────────────────────────────────────

let _accessToken: string | null = null

export function getStoredToken(): string | null {
  return _accessToken
}

export function setAccessToken(token: string | null): void {
  _accessToken = token
}

// ── User Profile Storage (localStorage) ──────────────────────────

export function getStoredUser(): AuthUser | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function storeAuth(token: string, user: AuthUser): void {
  _accessToken = token
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearAuth(): void {
  _accessToken = null
  localStorage.removeItem(USER_KEY)
}

// ── Permission Helpers ───────────────────────────────────────────

export function hasPermission(user: AuthUser | null, key: string): boolean {
  return user?.permissions?.includes(key) ?? false
}

export function hasAnyPermission(user: AuthUser | null, keys: string[]): boolean {
  if (!user?.permissions) return false
  return keys.some((k) => user.permissions.includes(k))
}

export function hasAllPermissions(user: AuthUser | null, keys: string[]): boolean {
  if (!user?.permissions) return false
  return keys.every((k) => user.permissions.includes(k))
}

// ── API Calls ────────────────────────────────────────────────────

export class AuthError extends Error {
  status: number
  code?: string
  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'AuthError'
    this.status = status
    this.code = code
  }
}

/**
 * Send login request to the FastAPI gateway.
 * The gateway sets the refresh token as an httpOnly cookie automatically.
 */
export async function login(request: LoginRequest): Promise<LoginResponseData> {
  const response = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(request),
  })

  const body: ApiEnvelope<LoginResponseData> = await response.json()

  if (!response.ok || !body.success) {
    throw new AuthError(
      body.message ?? 'Login failed',
      response.status
    )
  }

  if (!body.data) {
    throw new AuthError('Invalid response from server', 500)
  }

  return body.data
}

/**
 * Build an AuthUser from the login response for local storage.
 */
export function toAuthUser(email: string, data: LoginResponseData): AuthUser {
  return {
    accountId: data.account_id,
    email,
    role: data.role,
    employeeId: data.employee_id,
    permissions: data.permissions,
  }
}

/**
 * Attempt to refresh the access token using the httpOnly refresh cookie.
 * Returns the new access token on success, or null if refresh failed.
 */
export async function refreshAccessToken(): Promise<LoginResponseData | null> {
  try {
    const response = await fetch(`${API_BASE}/api/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    })

    if (!response.ok) return null

    const body: ApiEnvelope<LoginResponseData> = await response.json()
    if (!body.success || !body.data) return null

    return body.data
  } catch {
    return null
  }
}

/**
 * Send logout request to the FastAPI gateway.
 * The gateway clears the refresh token cookie.
 */
export async function logout(): Promise<void> {
  const token = getStoredToken()
  if (!token) return

  try {
    await fetch(`${API_BASE}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })
  } catch {
    // Ignore network errors — local state will be cleared regardless
  }
}

/**
 * Return standard Authorization header value for authenticated requests.
 */
export function authHeader(): Record<string, string> {
  const token = getStoredToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}
