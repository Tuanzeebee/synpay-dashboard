'use client'

import { memo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import NotificationBell from '@/components/ui/NotificationBell'
import {
  Menu,
  Languages,
  RefreshCw,
  Sun,
  Moon,
  ChevronDown,
  User,
  Settings,
  LogOut,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { useState, useEffect } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'

type Language = 'vi' | 'en'

interface HeaderProps {
  language?: Language
  onLanguageToggle?: () => void
  onRefresh?: () => void
  onMenuToggle?: () => void
  t: (key: string) => string
}

function Header({ language = 'vi', onLanguageToggle, onRefresh, onMenuToggle, t }: HeaderProps) {
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const { logout, user } = useAuth()

  const handleLogout = useCallback(async () => {
    await logout()
    router.replace('/login')
  }, [logout, router])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }, [theme, setTheme])

  const handleRefresh = useCallback(() => {
    if (onRefresh) {
      onRefresh()
    } else {
      window.location.reload()
    }
  }, [onRefresh])

  if (!mounted) return null

  return (
    <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-20">
      <div className="px-4 md:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onMenuToggle && (
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuToggle}>
              <Menu className="w-6 h-6" />
            </Button>
          )}
          <div className="flex items-center gap-3 lg:hidden">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
              H
            </div>
            <span className="font-bold text-xl">HR Nexus</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onLanguageToggle && (
            <Button variant="ghost" size="icon" onClick={onLanguageToggle}>
              <Languages className="w-5 h-5" />
            </Button>
          )}

          <Button variant="ghost" size="icon" onClick={handleRefresh}>
            <RefreshCw className="w-5 h-5" />
          </Button>

          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            <Sun className="w-5 h-5 hidden dark:block" />
            <Moon className="w-5 h-5 block dark:hidden" />
          </Button>

          <NotificationBell t={t} />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-3">
                <Avatar className="w-9 h-9">
                  <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" />
                  <AvatarFallback>AM</AvatarFallback>
                </Avatar>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-semibold">Alex Morgan</p>
                  <p className="text-xs text-slate-500">{t('user.role')}</p>
                </div>
                <ChevronDown className="w-4 h-4 hidden md:block" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div>
                  <p className="font-semibold">Alex Morgan</p>
                  <p className="text-xs text-slate-500">alex.morgan@company.com</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="w-4 h-4 mr-2" />
                My Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="w-4 h-4 mr-2" />
                Account Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}

export default memo(Header)
