'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'

/**
 * Hook that redirects to /login if the user is not authenticated.
 * Returns the auth context so callers can access user, permissions, etc.
 */
export function useRequireAuth() {
  const router = useRouter()
  const auth = useAuth()

  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated) {
      router.replace('/login')
    }
  }, [auth.isLoading, auth.isAuthenticated, router])

  return auth
}
