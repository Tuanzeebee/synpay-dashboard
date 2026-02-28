'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Download, LogIn, Key, UserCheck, Shield, Activity, ShieldAlert, Users, Search, Clock, Globe, Monitor } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { Language } from '@/lib/translations'
import type { AuditLog } from '../types'
import { t } from '@/lib/translations'

type Props = {
  auditLogs: AuditLog[]
  language: Language
  onExport: () => void
}

const eventIcons = {
  login: LogIn,
  permission_change: Key,
  user_assignment: UserCheck,
  role_change: Shield,
}

const eventColors = {
  login: 'blue',
  permission_change: 'amber',
  user_assignment: 'emerald',
  role_change: 'purple',
}

export default function AuditLog({ auditLogs, language, onExport }: Props) {
  const [searchQuery, setSearchQuery] = useState('')
  const [eventFilter, setEventFilter] = useState('all')
  const [timeFilter, setTimeFilter] = useState('all')

  // Filter logs
  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch = log.action[language].toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.userName.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesEvent = eventFilter === 'all' || log.eventType === eventFilter
    return matchesSearch && matchesEvent
  })

  // Calculate stats
  const todayEvents = filteredLogs.length
  const securityAlerts = filteredLogs.filter(log => log.eventType === 'permission_change').length
  const activeUsers = new Set(filteredLogs.map(log => log.userId)).size

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white dark:bg-slate-800 p-6 border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Activity className="w-5 h-5" />
            </div>
            <Badge className="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30">
              +12%
            </Badge>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{todayEvents.toLocaleString()}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {language === 'vi' ? 'Tổng sự kiện hôm nay' : 'Total events today'}
          </p>
        </Card>

        <Card className="bg-white dark:bg-slate-800 p-6 border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center text-amber-600 dark:text-amber-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <Badge className="bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700">
              {language === 'vi' ? '24h qua' : 'Last 24h'}
            </Badge>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{securityAlerts}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {language === 'vi' ? 'Cảnh báo bảo mật' : 'Security alerts'}
          </p>
        </Card>

        <Card className="bg-white dark:bg-slate-800 p-6 border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Users className="w-5 h-5" />
            </div>
            <Badge className="bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700">
              {language === 'vi' ? 'Đang hoạt động' : 'Active'}
            </Badge>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{activeUsers}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {language === 'vi' ? 'Người dùng trực tuyến' : 'Online users'}
          </p>
        </Card>
      </div>

      {/* Filters & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              type="text"
              placeholder={language === 'vi' ? 'Tìm kiếm sự kiện...' : 'Search events...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 w-64 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
            />
          </div>
          <select
            value={eventFilter}
            onChange={(e) => setEventFilter(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="all">{language === 'vi' ? 'Tất cả sự kiện' : 'All events'}</option>
            <option value="login">{language === 'vi' ? 'Đăng nhập' : 'Login'}</option>
            <option value="role_change">{language === 'vi' ? 'Thay đổi vai trò' : 'Role changes'}</option>
            <option value="permission_change">{language === 'vi' ? 'Thay đổi quyền' : 'Permission changes'}</option>
            <option value="user_assignment">{language === 'vi' ? 'Phân quyền người dùng' : 'User assignments'}</option>
          </select>
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="all">{language === 'vi' ? 'Tất cả thời gian' : 'All time'}</option>
            <option value="today">{language === 'vi' ? 'Hôm nay' : 'Today'}</option>
            <option value="week">{language === 'vi' ? 'Tuần này' : 'This week'}</option>
            <option value="month">{language === 'vi' ? 'Tháng này' : 'This month'}</option>
          </select>
        </div>
        <Button
          onClick={onExport}
          className="bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
        >
          <Download className="w-4 h-4 mr-2" />
          <span>{language === 'vi' ? 'Xuất CSV' : 'Export CSV'}</span>
        </Button>
      </div>

      {/* Timeline Container */}
      <Card className="border-slate-200 dark:border-slate-700 shadow-sm p-6 md:p-8">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
          <Clock className="w-5 h-5 text-slate-400" />
          <span>{language === 'vi' ? 'Dòng Thời Gian Hoạt Động' : 'Activity Timeline'}</span>
        </h3>
        <div className="space-y-8">
          {filteredLogs.map((log, index) => {
            const Icon = eventIcons[log.eventType] || Shield
            const color = eventColors[log.eventType] || 'slate'

            return (
              <div key={log.id} className="relative pl-12 pb-2 group">
                {/* Timeline connector */}
                {index < filteredLogs.length - 1 && (
                  <div className="absolute left-5 top-14 bottom-0 w-0.5 bg-gradient-to-b from-slate-200 to-transparent dark:from-slate-700 z-0" />
                )}

                {/* Icon Marker */}
                <div
                  className={`absolute left-0 top-0 w-10 h-10 rounded-full flex items-center justify-center border-4 border-white dark:border-slate-800 z-10 shadow-sm group-hover:scale-110 transition-transform duration-200 ${
                    color === 'blue'
                      ? 'bg-blue-100 dark:bg-blue-900/30'
                      : color === 'amber'
                        ? 'bg-amber-100 dark:bg-amber-900/30'
                        : color === 'emerald'
                          ? 'bg-emerald-100 dark:bg-emerald-900/30'
                          : color === 'purple'
                            ? 'bg-purple-100 dark:bg-purple-900/30'
                            : 'bg-slate-100 dark:bg-slate-700'
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 ${
                      color === 'blue'
                        ? 'text-blue-600 dark:text-blue-400'
                        : color === 'amber'
                          ? 'text-amber-600 dark:text-amber-400'
                          : color === 'emerald'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : color === 'purple'
                              ? 'text-purple-600 dark:text-purple-400'
                              : 'text-slate-600 dark:text-slate-400'
                    }`}
                  />
                </div>

                {/* Content Card */}
                <div className="bg-white dark:bg-slate-800 rounded-lg transition-all duration-200">
                  <div className="flex items-start justify-between mb-1">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">{log.action[language]}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <img
                          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(log.userName)}&background=random&size=24`}
                          className="w-5 h-5 rounded-full"
                          alt={log.userName}
                        />
                        <p className="text-xs font-medium text-slate-600 dark:text-slate-400">{log.userName}</p>
                      </div>
                    </div>
                    <Badge className="bg-slate-50 dark:bg-slate-700/50 text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                      {log.timestamp}
                    </Badge>
                  </div>

                  {/* Details */}
                  {Object.keys(log.details).length > 0 && (
                    <div className="mt-3">
                      {log.eventType === 'login' && log.details.ip && log.details.device ? (
                        <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1">
                            <Globe className="w-3 h-3" /> {log.details.ip}
                          </span>
                          <span className="flex items-center gap-1">
                            <Monitor className="w-3 h-3" /> {log.details.device}
                          </span>
                        </div>
                      ) : log.eventType === 'permission_change' && Array.isArray(log.details.changes) ? (
                        <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-700">
                          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            {language === 'vi' ? 'Thay đổi:' : 'Changes:'}
                          </p>
                          <ul className="list-disc list-inside text-xs text-slate-600 dark:text-slate-400">
                            {log.details.changes.map((change: string, idx: number) => (
                              <li key={idx}>{change}</li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-700">
                          <div className="space-y-1">
                            {Object.entries(log.details).map(([key, value]) => (
                              <div key={key} className="flex items-start gap-2 text-xs">
                                <span className="font-medium text-slate-600 dark:text-slate-400">{key}:</span>
                                <span className="text-slate-700 dark:text-slate-300">
                                  {Array.isArray(value) ? value.join(', ') : String(value)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
