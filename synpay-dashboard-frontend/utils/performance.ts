/**
 * Performance Utilities
 * Collection of utilities for optimizing React components and reducing lag
 */

import { useEffect, useRef, useState, useCallback } from 'react'

/**
 * Virtual Scrolling Hook
 * Renders only visible items in a large list
 */
export function useVirtualScroll<T>(
  items: T[],
  containerHeight: number = 600,
  itemHeight: number = 50
) {
  const [scrollTop, setScrollTop] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const visibleStart = Math.floor(scrollTop / itemHeight)
  const visibleCount = Math.ceil(containerHeight / itemHeight)
  const visibleEnd = Math.min(visibleStart + visibleCount + 5, items.length) // +5 buffer

  const visibleItems = items.slice(visibleStart, visibleEnd)
  const offsetY = visibleStart * itemHeight

  const totalHeight = items.length * itemHeight

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }, [])

  return {
    containerRef,
    visibleItems,
    offsetY,
    totalHeight,
    handleScroll,
    visibleStart,
  }
}

/**
 * Intersection Observer Hook
 * Lazy load content when it enters viewport
 */
export function useIntersectionObserver(
  options: IntersectionObserverInit = {}
) {
  const [isIntersecting, setIsIntersecting] = useState(false)
  const targetRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const target = targetRef.current
    if (!target) return

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting)
    }, options)

    observer.observe(target)

    return () => observer.disconnect()
  }, [options])

  return { targetRef, isIntersecting }
}

/**
 * Request Animation Frame Throttle
 * Throttle function calls to animation frame rate (~60fps)
 */
export function useRAFThrottle<T extends (...args: any[]) => any>(
  callback: T
): T {
  const rafId = useRef<number | null>(null)
  const latestArgs = useRef<any[]>([])

  const throttledFn = useCallback(
    (...args: any[]) => {
      latestArgs.current = args

      if (rafId.current === null) {
        rafId.current = requestAnimationFrame(() => {
          callback(...latestArgs.current)
          rafId.current = null
        })
      }
    },
    [callback]
  )

  useEffect(() => {
    return () => {
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current)
      }
    }
  }, [])

  return throttledFn as T
}

/**
 * Memoized Search/Filter
 * Optimized search with debouncing
 */
export function useMemoizedFilter<T>(
  items: T[],
  searchTerm: string,
  filterFn: (item: T, term: string) => boolean,
  debounceMs: number = 300
) {
  const [debouncedTerm, setDebouncedTerm] = useState(searchTerm)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm)
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [searchTerm, debounceMs])

  const filtered = useCallback(() => {
    if (!debouncedTerm) return items
    return items.filter((item) => filterFn(item, debouncedTerm))
  }, [items, debouncedTerm, filterFn])

  return filtered()
}

/**
 * Idle Callback Hook
 * Execute expensive operations during browser idle time
 */
export function useIdleCallback(callback: () => void, dependencies: any[] = []) {
  useEffect(() => {
    if ('requestIdleCallback' in window) {
      const id = requestIdleCallback(callback)
      return () => cancelIdleCallback(id)
    } else {
      // Fallback for browsers without requestIdleCallback
      const id = setTimeout(callback, 1)
      return () => clearTimeout(id)
    }
  }, dependencies)
}

/**
 * Batch State Updates
 * Batch multiple state updates into a single re-render
 */
export function useBatchedUpdates() {
  const [, forceUpdate] = useState({})
  const updates = useRef<Array<() => void>>([])
  const rafId = useRef<number | null>(null)

  const batchUpdate = useCallback((updateFn: () => void) => {
    updates.current.push(updateFn)

    if (rafId.current === null) {
      rafId.current = requestAnimationFrame(() => {
        updates.current.forEach((fn) => fn())
        updates.current = []
        rafId.current = null
        forceUpdate({})
      })
    }
  }, [])

  return batchUpdate
}

/**
 * Memoized Expensive Calculation
 * Cache expensive computations with LRU eviction
 */
export function useMemoizedComputation<T, R>(
  computeFn: (input: T) => R,
  maxCacheSize: number = 10
) {
  const cache = useRef<Map<string, R>>(new Map())

  return useCallback(
    (input: T): R => {
      const key = JSON.stringify(input)
      
      if (cache.current.has(key)) {
        // Move to end (most recently used)
        const value = cache.current.get(key)!
        cache.current.delete(key)
        cache.current.set(key, value)
        return value
      }

      const result = computeFn(input)

      // LRU eviction
      if (cache.current.size >= maxCacheSize) {
        const firstKey = cache.current.keys().next().value
        if (firstKey !== undefined) {
          cache.current.delete(firstKey)
        }
      }

      cache.current.set(key, result)
      return result
    },
    [computeFn, maxCacheSize]
  )
}

/**
 * Prefetch on Hover
 * Prefetch data when user hovers over an element
 */
export function usePrefetchOnHover<T>(
  prefetchFn: () => Promise<T>,
  delay: number = 100
) {
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const hasPrefetched = useRef(false)

  const handleMouseEnter = useCallback(() => {
    if (hasPrefetched.current) return

    timerRef.current = setTimeout(() => {
      prefetchFn().then(() => {
        hasPrefetched.current = true
      })
    }, delay)
  }, [prefetchFn, delay])

  const handleMouseLeave = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
  }, [])

  return { handleMouseEnter, handleMouseLeave }
}

/**
 * Image Lazy Loading
 * Load images only when they're about to enter viewport
 */
export function useImageLazyLoad(src: string, placeholder?: string) {
  const [imageSrc, setImageSrc] = useState(placeholder || '')
  const [isLoaded, setIsLoaded] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    if (!imgRef.current) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const img = new Image()
          img.src = src
          img.onload = () => {
            setImageSrc(src)
            setIsLoaded(true)
          }
          observer.disconnect()
        }
      },
      { rootMargin: '50px' }
    )

    observer.observe(imgRef.current)

    return () => observer.disconnect()
  }, [src])

  return { imgRef, imageSrc, isLoaded }
}

/**
 * Optimized Event Handler
 * Prevents unnecessary re-renders from event handlers
 */
export function useStableCallback<T extends (...args: any[]) => any>(
  callback: T
): T {
  const callbackRef = useRef(callback)

  useEffect(() => {
    callbackRef.current = callback
  })

  return useCallback(
    ((...args) => callbackRef.current(...args)) as T,
    []
  )
}

/**
 * Data Prefetching on Mount
 * Prefetch related data in the background
 */
export function usePrefetchRelated(
  prefetchFns: Array<() => Promise<any>>,
  delay: number = 100
) {
  useEffect(() => {
    const timer = setTimeout(() => {
      prefetchFns.forEach((fn) => {
        fn().catch(() => {
          // Silently fail
        })
      })
    }, delay)

    return () => clearTimeout(timer)
  }, [])
}
