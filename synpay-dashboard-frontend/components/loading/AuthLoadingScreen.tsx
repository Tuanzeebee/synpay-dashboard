'use client'

import { useAuth } from '@/components/providers/AuthProvider'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Shows a loading screen while auth state is being restored on page load.
 * Redirects to login only after the restore attempt completes and fails.
 */
export function AuthLoadingScreen() {
  const router = useRouter()
  const auth = useAuth()

  // After auth finishes loading and user is not authenticated, redirect
  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated) {
      // Small delay to ensure smooth transition
      const timer = setTimeout(() => {
        router.replace('/login')
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [auth.isLoading, auth.isAuthenticated, router])

  // While loading, show loading screen
  if (auth.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800">
        <div className="text-center">
          <div className="mb-6">
            <div className="inline-flex h-12 w-12 animate-spin rounded-full border-4 border-slate-200 dark:border-slate-700 border-t-blue-600 dark:border-t-blue-400"></div>
          </div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
            Đang khôi phục phiên đăng nhập...
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            Vui lòng chờ trong giây lát
          </p>
        </div>
      </div>
    )
  }

  // If authenticated, don't render anything (let page content show)
  return null
}
