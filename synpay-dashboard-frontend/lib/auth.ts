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
const REFRESH_TOKEN_KEY = 'synpay_refresh_token'

// ── In-Memory Token ──────────────────────────────────────────────

let _accessToken: string | null = null

export function getStoredToken(): string | null {
  return _accessToken
}

export function setAccessToken(token: string | null): void {
  _accessToken = token
}

// ── Refresh Token Storage (localStorage) ─────────────────────────

export function getStoredRefreshToken(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return localStorage.getItem(REFRESH_TOKEN_KEY)
  } catch {
    return null
  }
}

export function setStoredRefreshToken(token: string | null): void {
  if (typeof window === 'undefined') return
  try {
    if (token) {
      localStorage.setItem(REFRESH_TOKEN_KEY, token)
    } else {
      localStorage.removeItem(REFRESH_TOKEN_KEY)
    }
  } catch {
    // Silently fail if localStorage is not available
  }
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

export function storeAuth(token: string, user: AuthUser, refreshToken: string | null = null): void {
  _accessToken = token
  localStorage.setItem(USER_KEY, JSON.stringify(user))
  if (refreshToken) {
    setStoredRefreshToken(refreshToken)
  }
}

export function clearAuth(): void {
  _accessToken = null
  localStorage.removeItem(USER_KEY)
  setStoredRefreshToken(null)
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
 * Attempt to refresh the access token using the stored refresh_token.
 * Returns the new access token on success, or null if refresh failed.
 */
export async function refreshAccessToken(): Promise<LoginResponseData | null> {
  try {
    const refreshToken = getStoredRefreshToken()
    console.log('[refreshAccessToken] Starting refresh attempt...')
    console.log('[refreshAccessToken] Refresh token available:', !!refreshToken)
    
    if (!refreshToken) {
      console.warn('[refreshAccessToken] No refresh token stored')
      return null
    }

    const response = await fetch(`${API_BASE}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ refresh_token: refreshToken }),
    })

    console.log('[refreshAccessToken] Response status:', response.status)

    if (!response.ok) {
      console.warn('[refreshAccessToken] Refresh failed with status', response.status)
      return null
    }

    const body: ApiEnvelope<LoginResponseData> = await response.json()
    console.log('[refreshAccessToken] Response success:', body.success)
    
    if (!body.success || !body.data) {
      console.warn('[refreshAccessToken] Success false or no data in response')
      return null
    }

    // Update stored refresh token if server issued a new one
    if (body.data.refresh_token) {
      console.log('[refreshAccessToken] New refresh token received, updating storage')
      setStoredRefreshToken(body.data.refresh_token)
    }

    console.log('[refreshAccessToken] Refresh successful, token obtained')
    return body.data
  } catch (err) {
    console.error('[refreshAccessToken] Error:', err)
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
