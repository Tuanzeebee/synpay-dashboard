/**
 * Authentication API Client & Token Storage
 *
 * Handles communication with the FastAPI gateway for login,
 * and manages JWT token + auth data in localStorage.
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
const TOKEN_KEY = 'synpay_auth_token'
const USER_KEY = 'synpay_auth_user'

// ── Token Storage ────────────────────────────────────────────────

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}

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
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY)
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
  constructor(message: string, status: number) {
    super(message)
    this.name = 'AuthError'
    this.status = status
  }
}

/**
 * Send login request to the FastAPI gateway.
 *
 * Flow: Frontend → POST /api/auth/login → FastAPI → Spring Boot
 */
export async function login(request: LoginRequest): Promise<LoginResponseData> {
  const response = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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
 * Send logout request to the FastAPI gateway.
 *
 * Flow: Frontend → POST /api/auth/logout → FastAPI → Spring Boot
 * Spring Boot updates last_logout_at and creates audit log.
 *
 * This is fire-and-forget: even if the API call fails,
 * the local auth state should still be cleared.
 */
export async function logout(): Promise<void> {
  const token = getStoredToken()
  if (!token) return

  try {
    await fetch(`${API_BASE}/api/auth/logout`, {
      method: 'POST',
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
