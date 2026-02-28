import { useState, useEffect, useCallback } from 'react'

export function useLocalStorage<T>(key: string, initialValue: T) {
  // Always start with initialValue for SSR consistency
  const [storedValue, setStoredValue] = useState<T>(initialValue)
  const [isInitialized, setIsInitialized] = useState(false)

  // Load from localStorage after mount
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    try {
      const item = window.localStorage.getItem(key)
      if (item) {
        // Try to parse as JSON first
        try {
          setStoredValue(JSON.parse(item))
        } catch {
          // If parsing fails, use the raw value (backward compatibility)
          setStoredValue(item as T)
        }
      }
    } catch (error) {
      console.error(`Error loading localStorage key "${key}":`, error)
    } finally {
      setIsInitialized(true)
    }
  }, [key])

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore))
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error)
    }
  }, [key, storedValue])

  return [storedValue, setValue] as const
}
