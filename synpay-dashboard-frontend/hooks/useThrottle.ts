import { useRef, useCallback } from 'react'

export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 500
): T {
  const lastRun = useRef(Date.now())

  return useCallback(
    ((...args) => {
      const now = Date.now()
      if (now - lastRun.current >= delay) {
        callback(...args)
        lastRun.current = now
      }
    }) as T,
    [callback, delay]
  )
}
