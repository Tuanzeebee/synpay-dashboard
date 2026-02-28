'use client'

import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useState,
  useMemo,
  type ReactNode,
} from 'react'
import {
  type AuthUser,
  type LoginRequest,
  type LoginResponseData,
  login as apiLogin,
  toAuthUser,
  storeAuth,
  clearAuth,
  getStoredToken,
  getStoredUser,
  hasPermission as checkPermission,
  hasAnyPermission as checkAnyPermission,
  AuthError,
} from '@/lib/auth'

// ── Context Types ────────────────────────────────────────────────

interface AuthContextType {
  /** Current authenticated user (null if not logged in) */
  user: AuthUser | null
  /** JWT access token */
  token: string | null
  /** Whether user is authenticated */
  isAuthenticated: boolean
  /** Whether auth state is still loading from storage */
  isLoading: boolean
  /** Login with email + password. Throws AuthError on failure. */
  login: (request: LoginRequest) => Promise<LoginResponseData>
  /** Clear auth state and redirect to login */
  logout: () => void
  /** Check if current user has a specific permission */
  hasPermission: (key: string) => boolean
  /** Check if current user has any of the given permissions */
  hasAnyPermission: (keys: string[]) => boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

// ── Provider ─────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Hydrate from localStorage on mount
  useEffect(() => {
    const storedToken = getStoredToken()
    const storedUser = getStoredUser()
    if (storedToken && storedUser) {
      setToken(storedToken)
      setUser(storedUser)
    }
    setIsLoading(false)
  }, [])

  const login = useCallback(async (request: LoginRequest): Promise<LoginResponseData> => {
    const data = await apiLogin(request)
    const authUser = toAuthUser(request.email, data)

    storeAuth(data.access_token, authUser)
    setToken(data.access_token)
    setUser(authUser)

    return data
  }, [])

  const logout = useCallback(() => {
    clearAuth()
    setToken(null)
    setUser(null)
  }, [])

  const hasPermissionFn = useCallback(
    (key: string) => checkPermission(user, key),
    [user]
  )

  const hasAnyPermissionFn = useCallback(
    (keys: string[]) => checkAnyPermission(user, keys),
    [user]
  )

  const isAuthenticated = !!token && !!user

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      token,
      isAuthenticated,
      isLoading,
      login,
      logout,
      hasPermission: hasPermissionFn,
      hasAnyPermission: hasAnyPermissionFn,
    }),
    [user, token, isAuthenticated, isLoading, login, logout, hasPermissionFn, hasAnyPermissionFn]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// ── Hook ─────────────────────────────────────────────────────────

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
