/**
 * API Service Layer with Caching
 * Provides centralized API calls with automatic caching, deduplication, and error handling
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  expiry: number
}

interface RequestConfig {
  ttl?: number // Time to live in milliseconds (default: 5 minutes)
  force?: boolean // Force refresh, bypass cache
  dedupe?: boolean // Deduplicate concurrent requests (default: true)
}

class APIService {
  private cache = new Map<string, CacheEntry<any>>()
  private pendingRequests = new Map<string, Promise<any>>()
  private readonly DEFAULT_TTL = 5 * 60 * 1000 // 5 minutes
  private readonly MAX_CACHE_SIZE = 100

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
    const requestPromise = this.makeRequest<T>(url, options)
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
   * Actual fetch implementation
   */
  private async makeRequest<T>(url: string, options: RequestInit): Promise<T> {
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`API request failed: ${url}`, error)
      throw error
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
