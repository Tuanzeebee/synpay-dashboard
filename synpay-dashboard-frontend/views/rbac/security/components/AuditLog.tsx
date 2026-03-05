'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Download, LogIn, Key, UserCheck, Shield, Activity,
  ShieldAlert, Users, Search, Clock, Globe, Monitor,
  ChevronLeft, ChevronRight, Loader2, AlertCircle, RefreshCw
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { Language } from '@/lib/translations'
import type { AuditLogEntry, AuditLogFilter } from '@/api/audit-logs'

// ── Props ────────────────────────────────────────────────────────

type Props = {
  entries: AuditLogEntry[]
  totalElements: number
  totalPages: number
  currentPage: number
  pageSize: number
  filter: AuditLogFilter
  language: Language
  isLoading: boolean
  isExporting: boolean
  onFilterChange: (patch: Partial<AuditLogFilter>) => void
  onResetFilter: () => void
  onGoToPage: (page: number) => void
  onExport: () => void
  onRefresh: () => void
}

// ── Action → Icon / Color mapping ────────────────────────────────

const ACTION_META: Record<string, { icon: typeof Shield; color: string }> = {
  LOGIN:                    { icon: LogIn,    color: 'blue' },
  LOGIN_SUCCESS:            { icon: LogIn,    color: 'emerald' },
  LOGIN_FAILED:             { icon: LogIn,    color: 'red' },
  LOGOUT:                   { icon: LogIn,    color: 'slate' },
  USER_CREATE:              { icon: UserCheck, color: 'emerald' },
  USER_UPDATE:              { icon: UserCheck, color: 'amber' },
  USER_DELETE:              { icon: UserCheck, color: 'red' },
  ROLE_CREATE:              { icon: Shield,   color: 'purple' },
  ROLE_UPDATE:              { icon: Shield,   color: 'amber' },
  ROLE_DELETE:              { icon: Shield,   color: 'red' },
  ROLE_ASSIGN:              { icon: Users,    color: 'purple' },
  PERMISSION_ASSIGN:        { icon: Key,      color: 'amber' },
  PERMISSION_MATRIX_UPDATE: { icon: Key,      color: 'amber' },
  DATA_EXPORT:              { icon: Download, color: 'blue' },
  SYSTEM_CONFIG:            { icon: Activity, color: 'slate' },
}

/** Bilingual action labels. */
const ACTION_LABELS: Record<string, { vi: string; en: string }> = {
  LOGIN:                    { vi: 'Đăng nhập',                en: 'Login' },
  LOGIN_SUCCESS:            { vi: 'Đăng nhập thành công',     en: 'Login Success' },
  LOGIN_FAILED:             { vi: 'Đăng nhập thất bại',       en: 'Login Failed' },
  LOGOUT:                   { vi: 'Đăng xuất',                en: 'Logout' },
  USER_CREATE:              { vi: 'Tạo người dùng',           en: 'User Created' },
  USER_UPDATE:              { vi: 'Cập nhật người dùng',      en: 'User Updated' },
  USER_DELETE:              { vi: 'Xóa người dùng',           en: 'User Deleted' },
  ROLE_CREATE:              { vi: 'Tạo vai trò',              en: 'Role Created' },
  ROLE_UPDATE:              { vi: 'Cập nhật vai trò',         en: 'Role Updated' },
  ROLE_DELETE:              { vi: 'Xóa vai trò',              en: 'Role Deleted' },
  ROLE_ASSIGN:              { vi: 'Gán vai trò',              en: 'Role Assigned' },
  PERMISSION_ASSIGN:        { vi: 'Gán quyền',               en: 'Permission Assigned' },
  PERMISSION_MATRIX_UPDATE: { vi: 'Cập nhật ma trận quyền',  en: 'Permission Matrix Updated' },
  DATA_EXPORT:              { vi: 'Xuất dữ liệu',            en: 'Data Exported' },
  SYSTEM_CONFIG:            { vi: 'Cấu hình hệ thống',       en: 'System Config' },
}

/** Bilingual resource labels. */
const RESOURCE_LABELS: Record<string, { vi: string; en: string }> = {
  account:           { vi: 'Tài khoản',      en: 'Account' },
  user:              { vi: 'Người dùng',      en: 'User' },
  role:              { vi: 'Vai trò',         en: 'Role' },
  permission:        { vi: 'Quyền',           en: 'Permission' },
  permission_matrix: { vi: 'Ma trận quyền',   en: 'Permission Matrix' },
  employee:          { vi: 'Nhân viên',       en: 'Employee' },
  payroll:           { vi: 'Bảng lương',      en: 'Payroll' },
  audit_log:         { vi: 'Nhật ký',         en: 'Audit Log' },
  system:            { vi: 'Hệ thống',        en: 'System' },
}

/** Filter options for the action dropdown. */
const ACTION_FILTER_OPTIONS = [
  'LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGOUT',
  'USER_CREATE', 'USER_UPDATE', 'USER_DELETE',
  'ROLE_CREATE', 'ROLE_UPDATE', 'ROLE_DELETE', 'ROLE_ASSIGN',
  'PERMISSION_ASSIGN', 'PERMISSION_MATRIX_UPDATE',
  'DATA_EXPORT', 'SYSTEM_CONFIG',
]

/** Filter options for the resource dropdown. */
const RESOURCE_FILTER_OPTIONS = [
  'account', 'user', 'role', 'permission', 'permission_matrix',
  'employee', 'payroll', 'audit_log', 'system',
]

// ── Helpers ──────────────────────────────────────────────────────

function getActionMeta(action: string) {
  return ACTION_META[action] ?? { icon: Activity, color: 'slate' }
}

function getActionLabel(action: string, lang: Language): string {
  return ACTION_LABELS[action]?.[lang] ?? action
}

function getResourceLabel(resource: string, lang: Language): string {
  return RESOURCE_LABELS[resource]?.[lang] ?? resource
}

function formatDateTime(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleString('vi-VN', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    })
  } catch {
    return iso
  }
}

function colorClasses(color: string, variant: 'bg' | 'text'): string {
  const map: Record<string, Record<string, string>> = {
    blue:    { bg: 'bg-blue-100 dark:bg-blue-900/30',       text: 'text-blue-600 dark:text-blue-400' },
    emerald: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400' },
    amber:   { bg: 'bg-amber-100 dark:bg-amber-900/30',     text: 'text-amber-600 dark:text-amber-400' },
    purple:  { bg: 'bg-purple-100 dark:bg-purple-900/30',   text: 'text-purple-600 dark:text-purple-400' },
    red:     { bg: 'bg-red-100 dark:bg-red-900/30',         text: 'text-red-600 dark:text-red-400' },
    slate:   { bg: 'bg-slate-100 dark:bg-slate-700',        text: 'text-slate-600 dark:text-slate-400' },
  }
  return map[color]?.[variant] ?? map.slate[variant]
}

// ── Component ────────────────────────────────────────────────────

export default function AuditLog({
  entries,
  totalElements,
  totalPages,
  currentPage,
  pageSize,
  filter,
  language,
  isLoading,
  isExporting,
  onFilterChange,
  onResetFilter,
  onGoToPage,
  onExport,
  onRefresh,
}: Props) {
  const [searchInput, setSearchInput] = useState(filter.actorEmail ?? '')

  // Debounced search handler
  const handleSearchChange = (value: string) => {
    setSearchInput(value)
  }

  const handleSearchSubmit = () => {
    onFilterChange({ actorEmail: searchInput || undefined })
  }

  // Stats from current page data
  const securityAlerts = entries.filter(
    (e) => e.action === 'LOGIN_FAILED' || e.action === 'PERMISSION_MATRIX_UPDATE'
  ).length
  const uniqueActors = new Set(entries.map((e) => e.actorAccountId)).size

  return (
    <div className="space-y-6">
      {/* ── Stats Cards ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total events */}
        <Card className="bg-white dark:bg-slate-800 p-6 border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Activity className="w-5 h-5" />
            </div>
            <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30">
              {language === 'vi' ? 'Tổng cộng' : 'Total'}
            </Badge>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
            {isLoading ? '—' : totalElements.toLocaleString()}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {language === 'vi' ? 'Tổng sự kiện' : 'Total events'}
          </p>
        </Card>

        {/* Security alerts */}
        <Card className="bg-white dark:bg-slate-800 p-6 border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center text-amber-600 dark:text-amber-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <Badge className="bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700">
              {language === 'vi' ? 'Trang này' : 'This page'}
            </Badge>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
            {isLoading ? '—' : securityAlerts}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {language === 'vi' ? 'Cảnh báo bảo mật' : 'Security alerts'}
          </p>
        </Card>

        {/* Unique actors */}
        <Card className="bg-white dark:bg-slate-800 p-6 border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Users className="w-5 h-5" />
            </div>
            <Badge className="bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700">
              {language === 'vi' ? 'Trang này' : 'This page'}
            </Badge>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
            {isLoading ? '—' : uniqueActors}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {language === 'vi' ? 'Tác nhân hoạt động' : 'Active actors'}
          </p>
        </Card>
      </div>

      {/* ── Filters & Actions ─────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search by email */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              type="text"
              placeholder={language === 'vi' ? 'Tìm theo email...' : 'Search by email...'}
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
              onBlur={handleSearchSubmit}
              className="pl-9 pr-4 w-64 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
            />
          </div>

          {/* Action filter */}
          <select
            value={filter.action ?? ''}
            onChange={(e) => onFilterChange({ action: e.target.value || undefined })}
            className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="">{language === 'vi' ? 'Tất cả hành động' : 'All actions'}</option>
            {ACTION_FILTER_OPTIONS.map((a) => (
              <option key={a} value={a}>{getActionLabel(a, language)}</option>
            ))}
          </select>

          {/* Resource filter */}
          <select
            value={filter.resource ?? ''}
            onChange={(e) => onFilterChange({ resource: e.target.value || undefined })}
            className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="">{language === 'vi' ? 'Tất cả đối tượng' : 'All resources'}</option>
            {RESOURCE_FILTER_OPTIONS.map((r) => (
              <option key={r} value={r}>{getResourceLabel(r, language)}</option>
            ))}
          </select>

          {/* Reset filters */}
          {(filter.actorEmail || filter.action || filter.resource) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setSearchInput(''); onResetFilter() }}
              className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1" />
              {language === 'vi' ? 'Đặt lại' : 'Reset'}
            </Button>
          )}
        </div>

        <Button
          onClick={onExport}
          disabled={isExporting}
          className="bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
        >
          {isExporting ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Download className="w-4 h-4 mr-2" />
          )}
          <span>{language === 'vi' ? 'Xuất CSV' : 'Export CSV'}</span>
        </Button>
      </div>

      {/* ── Timeline Container ────────────────────────────────── */}
      <Card className="border-slate-200 dark:border-slate-700 shadow-sm p-6 md:p-8">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
          <Clock className="w-5 h-5 text-slate-400" />
          <span>{language === 'vi' ? 'Dòng Thời Gian Hoạt Động' : 'Activity Timeline'}</span>
          {!isLoading && (
            <Badge className="ml-2 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
              {entries.length} / {totalElements}
            </Badge>
          )}
        </h3>

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <span className="ml-3 text-slate-500 dark:text-slate-400">
              {language === 'vi' ? 'Đang tải nhật ký...' : 'Loading audit logs...'}
            </span>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && entries.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <AlertCircle className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-4" />
            <h4 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {language === 'vi' ? 'Không có nhật ký nào' : 'No audit logs found'}
            </h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">
              {language === 'vi'
                ? 'Thử thay đổi bộ lọc hoặc kiểm tra lại sau.'
                : 'Try adjusting the filters or check back later.'}
            </p>
          </div>
        )}

        {/* Timeline entries */}
        {!isLoading && entries.length > 0 && (
          <div className="space-y-8">
            {entries.map((entry, index) => {
              const { icon: Icon, color } = getActionMeta(entry.action)
              return (
                <div key={entry.id} className="relative pl-12 pb-2 group">
                  {/* Timeline connector */}
                  {index < entries.length - 1 && (
                    <div className="absolute left-5 top-14 bottom-0 w-0.5 bg-gradient-to-b from-slate-200 to-transparent dark:from-slate-700 z-0" />
                  )}

                  {/* Icon marker */}
                  <div className={`absolute left-0 top-0 w-10 h-10 rounded-full flex items-center justify-center border-4 border-white dark:border-slate-800 z-10 shadow-sm group-hover:scale-110 transition-transform duration-200 ${colorClasses(color, 'bg')}`}>
                    <Icon className={`w-5 h-5 ${colorClasses(color, 'text')}`} />
                  </div>

                  {/* Content */}
                  <div className="bg-white dark:bg-slate-800 rounded-lg transition-all duration-200">
                    <div className="flex items-start justify-between mb-1">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          {getActionLabel(entry.action, language)}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={`text-xs ${colorClasses(color, 'bg')} ${colorClasses(color, 'text')} border-0`}>
                            {getResourceLabel(entry.resource, language)}
                            {entry.resourceId && ` #${entry.resourceId}`}
                          </Badge>
                          {entry.actorEmail && (
                            <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                              {entry.actorEmail}
                            </p>
                          )}
                          {entry.actorRole && (
                            <Badge className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border-0">
                              {entry.actorRole}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Badge className="bg-slate-50 dark:bg-slate-700/50 text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700/50 whitespace-nowrap">
                        {formatDateTime(entry.createdAt)}
                      </Badge>
                    </div>

                    {/* Description */}
                    {entry.actionDescription && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {entry.actionDescription}
                      </p>
                    )}

                    {/* Details: IP + User Agent */}
                    {(entry.ipAddress || entry.userAgent) && (
                      <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mt-2">
                        {entry.ipAddress && (
                          <span className="flex items-center gap-1">
                            <Globe className="w-3 h-3" /> {entry.ipAddress}
                          </span>
                        )}
                        {entry.userAgent && (
                          <span className="flex items-center gap-1 truncate max-w-xs">
                            <Monitor className="w-3 h-3 shrink-0" /> {entry.userAgent}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Old / New value diff */}
                    {!!(entry.oldValue || entry.newValue) && (
                      <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-700">
                        {!!entry.oldValue && (
                          <div className="mb-2">
                            <p className="text-xs font-semibold text-red-600 dark:text-red-400 mb-0.5">
                              {language === 'vi' ? 'Giá trị cũ:' : 'Old value:'}
                            </p>
                            <pre className="text-xs text-slate-600 dark:text-slate-400 whitespace-pre-wrap break-all">
                              {typeof entry.oldValue === 'string' ? entry.oldValue : JSON.stringify(entry.oldValue, null, 2)}
                            </pre>
                          </div>
                        )}
                        {!!entry.newValue && (
                          <div>
                            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-0.5">
                              {language === 'vi' ? 'Giá trị mới:' : 'New value:'}
                            </p>
                            <pre className="text-xs text-slate-600 dark:text-slate-400 whitespace-pre-wrap break-all">
                              {typeof entry.newValue === 'string' ? entry.newValue : JSON.stringify(entry.newValue, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* ── Pagination ────────────────────────────────────────── */}
      {!isLoading && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {language === 'vi'
              ? `Trang ${currentPage + 1} / ${totalPages} (${totalElements} bản ghi)`
              : `Page ${currentPage + 1} of ${totalPages} (${totalElements} records)`}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 0}
              onClick={() => onGoToPage(currentPage - 1)}
              className="border-slate-200 dark:border-slate-700"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            {/* Page number buttons (show up to 5) */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number
              if (totalPages <= 5) {
                pageNum = i
              } else if (currentPage < 3) {
                pageNum = i
              } else if (currentPage > totalPages - 4) {
                pageNum = totalPages - 5 + i
              } else {
                pageNum = currentPage - 2 + i
              }
              return (
                <Button
                  key={pageNum}
                  variant={pageNum === currentPage ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onGoToPage(pageNum)}
                  className={pageNum === currentPage
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'border-slate-200 dark:border-slate-700'}
                >
                  {pageNum + 1}
                </Button>
              )
            })}
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages - 1}
              onClick={() => onGoToPage(currentPage + 1)}
              className="border-slate-200 dark:border-slate-700"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
