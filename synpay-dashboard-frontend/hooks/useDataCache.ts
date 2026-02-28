import { useMemo, useCallback, useState } from 'react'

interface CacheOptions {
  key: string
  ttl?: number // Time to live in milliseconds
}

interface CachedData<T> {
  data: T
  timestamp: number
}

export function useDataCache<T>() {
  const setCache = useCallback((key: string, data: T, ttl?: number) => {
    const cachedData: CachedData<T> = {
      data,
      timestamp: Date.now(),
    }
    
    try {
      sessionStorage.setItem(key, JSON.stringify(cachedData))
      
      // Set expiration if TTL provided
      if (ttl) {
        setTimeout(() => {
          sessionStorage.removeItem(key)
        }, ttl)
      }
    } catch (error) {
      console.error('Error caching data:', error)
    }
  }, [])

  const getCache = useCallback((key: string, ttl?: number): T | null => {
    try {
      const cached = sessionStorage.getItem(key)
      if (!cached) return null

      const cachedData: CachedData<T> = JSON.parse(cached)
      
      // Check if cache is still valid
      if (ttl && Date.now() - cachedData.timestamp > ttl) {
        sessionStorage.removeItem(key)
        return null
      }

      return cachedData.data
    } catch (error) {
      console.error('Error retrieving cached data:', error)
      return null
    }
  }, [])

  const clearCache = useCallback((key?: string) => {
    if (key) {
      sessionStorage.removeItem(key)
    } else {
      sessionStorage.clear()
    }
  }, [])

  return { setCache, getCache, clearCache }
}

// Hook for memoized filtering and sorting
export function useFilteredData<T>(
  data: T[],
  filterFn: (item: T) => boolean,
  sortFn?: (a: T, b: T) => number
) {
  return useMemo(() => {
    let filtered = data.filter(filterFn)
    if (sortFn) {
      filtered = filtered.sort(sortFn)
    }
    return filtered
  }, [data, filterFn, sortFn])
}

// Hook for pagination
export function usePagination<T>(data: T[], pageSize: number = 10) {
  const [currentPage, setCurrentPage] = useState(1)

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    return data.slice(startIndex, endIndex)
  }, [data, currentPage, pageSize])

  const totalPages = useMemo(() => {
    return Math.ceil(data.length / pageSize)
  }, [data.length, pageSize])

  const goToPage = useCallback((page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }, [totalPages])

  const nextPage = useCallback(() => {
    goToPage(currentPage + 1)
  }, [currentPage, goToPage])

  const prevPage = useCallback(() => {
    goToPage(currentPage - 1)
  }, [currentPage, goToPage])

  return {
    data: paginatedData,
    currentPage,
    totalPages,
    goToPage,
    nextPage,
    prevPage,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
  }
}
