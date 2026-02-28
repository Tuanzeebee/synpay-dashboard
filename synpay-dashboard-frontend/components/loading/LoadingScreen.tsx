'use client'

import { useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'

type Props = {
  message?: string
  subMessage?: string
}

export default function LoadingScreen({ 
  message = 'Đang tải dữ liệu',
  subMessage = 'Vui lòng đợi trong giây lát...'
}: Props) {
  useEffect(() => {
    // Inject keyframes animation
    const style = document.createElement('style')
    style.innerHTML = `
      @keyframes progress-bar {
        0% { width: 0%; }
        50% { width: 70%; }
        100% { width: 100%; }
      }
      .animate-progress-bar {
        animation: progress-bar 2s ease-in-out infinite;
      }
    `
    document.head.appendChild(style)
    
    return () => {
      document.head.removeChild(style)
    }
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <div className="max-w-sm w-full">
        <Card className="border border-slate-200 dark:border-slate-700 shadow-lg">
          <CardContent className="p-8 text-center">
            {/* Logo */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-md animate-pulse">
                H
              </div>
            </div>

            {/* Brand Name */}
            <h1 className="font-bold text-xl text-slate-800 dark:text-white mb-2">
              HR Nexus
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              Phiên Bản Doanh Nghiệp
            </p>

            {/* Spinner */}
            <div className="flex justify-center mb-6">
              <div className="relative w-12 h-12">
                <div className="absolute inset-0 border-4 border-slate-200 dark:border-slate-700 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-blue-600 dark:border-blue-500 rounded-full border-t-transparent animate-spin"></div>
              </div>
            </div>

            {/* Loading Text */}
            <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
              {message}
            </p>

            {/* Animated Dots */}
            <div className="flex items-center justify-center gap-1.5 mb-6">
              <div className="w-2 h-2 bg-blue-600 dark:bg-blue-500 rounded-full animate-bounce [animation-delay:-0.32s]"></div>
              <div className="w-2 h-2 bg-blue-600 dark:bg-blue-500 rounded-full animate-bounce [animation-delay:-0.16s]"></div>
              <div className="w-2 h-2 bg-blue-600 dark:bg-blue-500 rounded-full animate-bounce"></div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-500 dark:to-blue-400 rounded-full animate-progress-bar"></div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Info */}
        <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-4">
          {subMessage}
        </p>
      </div>
    </div>
  )
}
