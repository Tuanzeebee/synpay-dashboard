'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  ShieldX,
  ArrowLeft,
  Home,
  Mail,
  Phone,
  MessageCircle,
  Moon,
  Sun,
} from 'lucide-react'
import { useTheme } from 'next-themes'

type Props = {}

export default function ForbiddenPage({}: Props) {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const contactOptions = [
    { icon: Mail, label: 'support@hrnexus.com', href: 'mailto:support@hrnexus.com' },
    { icon: Phone, label: '+84 123 456 789', href: 'tel:+84123456789' },
    { icon: MessageCircle, label: 'Chat Trực Tuyến', onClick: () => alert('Đang mở chat hỗ trợ...') },
  ]

  if (!mounted) return null

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 h-20">
        <div className="px-4 md:px-8 py-4 flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-md">
              H
            </div>
            <div>
              <span className="font-bold text-xl text-slate-800 dark:text-white block">HR Nexus</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">Phiên Bản Doanh Nghiệp</span>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="rounded-lg"
          >
            <Sun className="w-5 h-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute w-5 h-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4 md:p-8">
        <div className="max-w-2xl w-full">
          {/* Error Icon with Animation */}
          <div className="flex justify-center mb-8 relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-32 h-32 bg-red-500/20 dark:bg-red-500/10 rounded-full animate-ping" />
            </div>
            <div className="relative w-32 h-32 bg-gradient-to-br from-red-500 to-red-600 dark:from-red-600 dark:to-red-700 rounded-full flex items-center justify-center shadow-xl animate-bounce">
              <ShieldX className="w-16 h-16 text-white" />
            </div>
          </div>

          {/* Error Message Card */}
          <Card className="shadow-xl">
            <CardContent className="p-8 md:p-12 text-center">
              {/* Error Code */}
              <div className="inline-block px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-sm font-semibold mb-4">
                Lỗi 403 - Forbidden
              </div>

              {/* Main Heading */}
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
                Không Có Quyền Truy Cập
              </h1>

              {/* Description */}
              <p className="text-slate-600 dark:text-slate-400 text-lg mb-8 max-w-xl mx-auto">
                Bạn không có quyền truy cập vào trang này. Vui lòng liên hệ với quản trị viên hệ thống để được cấp quyền truy cập.
              </p>

              {/* Divider */}
              <div className="w-16 h-1 bg-gradient-to-r from-red-500 to-red-600 rounded-full mx-auto mb-8" />

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
                <Button
                  onClick={() => router.back()}
                  className="w-full sm:w-auto gap-2 bg-blue-600 hover:bg-blue-700"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Quay Lại Trang Trước</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push('/dashboard')}
                  className="w-full sm:w-auto gap-2"
                >
                  <Home className="w-4 h-4" />
                  <span>Về Trang Chủ</span>
                </Button>
              </div>

              {/* Contact Support */}
              <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                  Cần trợ giúp? Liên hệ với chúng tôi:
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm">
                  {contactOptions.map((option, index) => (
                    <div key={index} className="flex items-center gap-4">
                      {option.href ? (
                        <a
                          href={option.href}
                          className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                        >
                          <option.icon className="w-4 h-4" />
                          <span>{option.label}</span>
                        </a>
                      ) : (
                        <button
                          onClick={option.onClick}
                          className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                        >
                          <option.icon className="w-4 h-4" />
                          <span>{option.label}</span>
                        </button>
                      )}
                      {index < contactOptions.length - 1 && (
                        <span className="hidden sm:block text-slate-300 dark:text-slate-600">|</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 py-6">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              © 2024 HR Nexus Pro - TechCorp Inc. Bảo lưu mọi quyền.
            </p>
            <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
              <button className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
                Chính Sách Bảo Mật
              </button>
              <span>|</span>
              <button className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
                Điều Khoản Sử Dụng
              </button>
              <span>|</span>
              <button className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
                Liên Hệ
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
