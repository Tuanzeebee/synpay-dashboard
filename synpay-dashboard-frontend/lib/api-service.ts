/**
 * API Service Layer with Caching
 * Provides centralized API calls with automatic caching, deduplication,
 * error handling, and transparent token refresh on 401.
 */

import {
  authHeader,
  clearAuth,
  refreshAccessToken,
  storeAuth,
  getStoredUser,
  toAuthUser,
  AuthError,
  setAccessToken,
} from '@/lib/auth'

interface CacheEntry<T> {
  data: T
  timestamp: number
  expiry: number
}

interface RequestConfig {
  ttl?: number // Time to live in milliseconds (default: 5 minutes)
  force?: boolean // Force refresh, bypass cache
  dedupe?: boolean // Deduplicate concurrent requests (default: true)
  skipAuth?: boolean // Skip attaching Authorization header
}

class APIService {
  private cache = new Map<string, CacheEntry<any>>()
  private pendingRequests = new Map<string, Promise<any>>()
  private readonly DEFAULT_TTL = 5 * 60 * 1000 // 5 minutes
  private readonly MAX_CACHE_SIZE = 100

  // Token refresh coordination
  private isRefreshing = false
  private refreshQueue: Array<{
    resolve: (value: boolean) => void
    reject: (err: Error) => void
  }> = []

  /**
   * Make a cached API request
   */
  async fetch<T>(
    url: string,
    options: RequestInit = {},
    config: RequestConfig = {}
  ): Promise<T> {
    const cacheKey = this.getCacheKey(url, options)
    const ttl = config.ttl ?? this.DEFAULT_TTL
    const shouldDedupe = config.dedupe !== false

    // Check cache first (unless force refresh)
    if (!config.force) {
      const cached = this.getFromCache<T>(cacheKey)
      if (cached) return cached
    }

    // Deduplicate concurrent requests
    if (shouldDedupe && this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey)!
    }

    // Make the request
    const requestPromise = this.makeRequest<T>(url, options, config)
      .then((data) => {
        this.setCache(cacheKey, data, ttl)
        this.pendingRequests.delete(cacheKey)
        return data
      })
      .catch((error) => {
        this.pendingRequests.delete(cacheKey)
        throw error
      })

    if (shouldDedupe) {
      this.pendingRequests.set(cacheKey, requestPromise)
    }

    return requestPromise
  }

  /**
   * Actual fetch implementation with automatic 401 → refresh → retry.
   */
  private async makeRequest<T>(
    url: string,
    options: RequestInit,
    config: RequestConfig = {},
    isRetry = false
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    }

    if (!config.skipAuth) {
      Object.assign(headers, authHeader())
    }

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    })

    // Handle 401 — attempt silent refresh (only once)
    if (response.status === 401 && !isRetry && !config.skipAuth) {
      const body = await response.json().catch(() => ({}))
      const errorCode = body?.error?.code

      if (errorCode === 'TOKEN_EXPIRED') {
        const refreshed = await this.attemptTokenRefresh()
        if (refreshed) {
          return this.makeRequest<T>(url, options, config, true)
        }
      }

      // Token is invalid or refresh failed — force re-login
      clearAuth()
      if (typeof window !== 'undefined') {
        window.location.href = '/login?reason=session_expired'
      }
      throw new AuthError('Authentication required', 401, errorCode)
    }

    if (!response.ok) {
      const errorBody = await response.json().catch(() => null)
      const message = errorBody?.message ?? errorBody?.error?.message ?? response.statusText
      throw new AuthError(message, response.status, errorBody?.error?.code)
    }

    return await response.json()
  }

  /**
   * Attempt to refresh the access token via the httpOnly refresh cookie.
   * Coordinates concurrent callers so only one refresh request is in-flight.
   */
  private async attemptTokenRefresh(): Promise<boolean> {
    if (this.isRefreshing) {
      return new Promise<boolean>((resolve, reject) => {
        this.refreshQueue.push({ resolve, reject })
      })
    }

    this.isRefreshing = true
    try {
      const data = await refreshAccessToken()
      if (!data) {
        this.refreshQueue.forEach((q) => q.resolve(false))
        return false
      }

      // Update in-memory token
      setAccessToken(data.access_token)

      // Update stored user with potentially refreshed permissions
      const currentUser = getStoredUser()
      if (currentUser) {
        const updatedUser = toAuthUser(currentUser.email, data)
        storeAuth(data.access_token, updatedUser)
      }

      this.refreshQueue.forEach((q) => q.resolve(true))
      return true
    } catch {
      this.refreshQueue.forEach((q) => q.resolve(false))
      return false
    } finally {
      this.refreshQueue = []
      this.isRefreshing = false
    }
  }

  /**
   * Get data from cache if valid
   */
  private getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    const now = Date.now()
    if (now > entry.expiry) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  /**
   * Store data in cache with TTL
   */
  private setCache<T>(key: string, data: T, ttl: number): void {
    // Manage cache size
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const firstKey = this.cache.keys().next().value
      if (firstKey) {
        this.cache.delete(firstKey)
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + ttl,
    })
  }

  /**
   * Generate cache key from URL and options
   */
  private getCacheKey(url: string, options: RequestInit): string {
    const method = options.method || 'GET'
    const body = options.body ? JSON.stringify(options.body) : ''
    return `${method}:${url}:${body}`
  }

  /**
   * Invalidate cache for specific key or pattern
   */
  invalidate(pattern?: string | RegExp): void {
    if (!pattern) {
      this.cache.clear()
      return
    }

    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Prefetch data in the background
   */
  async prefetch<T>(
    url: string,
    options: RequestInit = {},
    config: RequestConfig = {}
  ): Promise<void> {
    // Fire and forget - don't wait for result
    this.fetch<T>(url, options, config).catch(() => {
      // Silently fail prefetch
    })
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    const now = Date.now()
    let validEntries = 0
    let expiredEntries = 0

    for (const entry of this.cache.values()) {
      if (now > entry.expiry) {
        expiredEntries++
      } else {
        validEntries++
      }
    }

    return {
      total: this.cache.size,
      valid: validEntries,
      expired: expiredEntries,
      pending: this.pendingRequests.size,
    }
  }

  /**
   * Clear expired entries
   */
  cleanupExpired(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiry) {
        this.cache.delete(key)
      }
    }
  }
}

// Singleton instance
export const apiService = new APIService()

// Convenience methods for common HTTP methods
export const api = {
  get: <T>(url: string, config?: RequestConfig) =>
    apiService.fetch<T>(url, { method: 'GET' }, config),

  post: <T>(url: string, data?: any, config?: RequestConfig) =>
    apiService.fetch<T>(url, { method: 'POST', body: JSON.stringify(data) }, config),

  put: <T>(url: string, data?: any, config?: RequestConfig) =>
    apiService.fetch<T>(url, { method: 'PUT', body: JSON.stringify(data) }, config),

  delete: <T>(url: string, config?: RequestConfig) =>
    apiService.fetch<T>(url, { method: 'DELETE' }, config),

  invalidate: (pattern?: string | RegExp) => apiService.invalidate(pattern),
  
  prefetch: <T>(url: string, config?: RequestConfig) =>
    apiService.prefetch<T>(url, { method: 'GET' }, config),

  stats: () => apiService.getCacheStats(),
  
  cleanup: () => apiService.cleanupExpired(),
}

// Auto cleanup every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => apiService.cleanupExpired(), 5 * 60 * 1000)
}
