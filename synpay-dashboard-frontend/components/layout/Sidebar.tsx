'use client'

import { memo, useCallback } from 'react'
import { Badge } from '@/components/ui/badge'
import {
  LayoutDashboard,
  Users,
  Building2,
  CalendarCheck,
  Banknote,
  Bell,
  BarChart3,
  UserCog,
  Shield,
  Key,
  FileText,
  Settings,
} from 'lucide-react'
import Link from 'next/link'
import { routes } from '@/routes'

type Language = 'vi' | 'en'

interface SidebarProps {
  language: Language
  t: (key: string) => string
  activeRoute?: string
}

function Sidebar({ language, t, activeRoute = '/' }: SidebarProps) {
  const isActive = useCallback((route: string) => {
    if (activeRoute === route) return true
    // Check if current route starts with the menu route (for nested routes)
    if (route !== '/' && activeRoute.startsWith(route)) return true
    return false
  }, [activeRoute])

  return (
    <aside className="hidden lg:flex w-64 flex-col bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 sticky top-0 h-screen">
      <div className="p-6 border-b border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 dark:bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-lg">
            H
          </div>
          <span className="font-bold text-xl text-slate-800 dark:text-white">HR Nexus</span>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4 px-2">
          {t('nav.main')}
        </div>

        <Link
          href={routes.dashboard}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-md font-medium transition-colors ${
            isActive(routes.dashboard)
              ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span>{t('nav.dashboard')}</span>
        </Link>

        <Link
          href={routes.employees}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-md font-medium transition-colors ${
            isActive(routes.employees)
              ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
          }`}
        >
          <Users className="w-5 h-5" />
          <span>{t('nav.employees')}</span>
          <Badge className="ml-auto">342</Badge>
        </Link>

        <Link
          href={routes.departments}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-md font-medium transition-colors ${
            isActive(routes.departments)
              ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
          }`}
        >
          <Building2 className="w-5 h-5" />
          <span>{t('nav.departments')}</span>
        </Link>

        <Link
          href={routes.attendance}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-md font-medium transition-colors ${
            isActive(routes.attendance)
              ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
          }`}
        >
          <CalendarCheck className="w-5 h-5" />
          <span>{t('nav.attendance')}</span>
        </Link>

        <Link
          href={routes.payroll}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-md font-medium transition-colors ${
            isActive(routes.payroll)
              ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
          }`}
        >
          <Banknote className="w-5 h-5" />
          <span>{t('nav.payroll')}</span>
        </Link>

        <Link
          href={routes.notifications}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-md font-medium transition-colors ${
            isActive(routes.notifications)
              ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
          }`}
        >
          <Bell className="w-5 h-5" />
          <span>{t('nav.notifications')}</span>
          <Badge variant="destructive" className="ml-auto">
            24
          </Badge>
        </Link>

        <Link
          href={routes.reports}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-md font-medium transition-colors ${
            isActive(routes.reports)
              ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
          }`}
        >
          <BarChart3 className="w-5 h-5" />
          <span>{t('nav.reports')}</span>
        </Link>

        <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4 px-2 pt-6">
          {t('nav.security')}
        </div>

        <Link
          href={routes.users}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-md font-medium transition-colors ${
            isActive(routes.users)
              ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
          }`}
        >
          <UserCog className="w-5 h-5" />
          <span>{t('nav.users')}</span>
        </Link>

        <Link
          href={routes.roles}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-md font-medium transition-colors ${
            isActive(routes.roles)
              ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
          }`}
        >
          <Shield className="w-5 h-5" />
          <span>{t('nav.roles')}</span>
        </Link>

        <Link
          href={routes.permissions}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-md font-medium transition-colors ${
            isActive(routes.permissions)
              ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
          }`}
        >
          <Key className="w-5 h-5" />
          <span>{t('nav.permissions')}</span>
        </Link>

        <Link
          href={routes.auditLog}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-md font-medium transition-colors ${
            isActive(routes.auditLog)
              ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
          }`}
        >
          <FileText className="w-5 h-5" />
          <span>{t('nav.audit')}</span>
        </Link>

        <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4 px-2 pt-6">
          {t('nav.settings')}
        </div>

        <Link
          href={routes.settings}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-md font-medium transition-colors ${
            isActive(routes.settings)
              ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
          }`}
        >
          <Settings className="w-5 h-5" />
          <span>{t('nav.settings')}</span>
        </Link>
      </nav>
    </aside>
  )
}

export default memo(Sidebar)
