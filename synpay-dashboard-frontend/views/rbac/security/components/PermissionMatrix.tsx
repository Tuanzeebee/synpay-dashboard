'use client'

import React, { useMemo, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Save, Undo2, Loader2, ShieldCheck, ShieldAlert } from 'lucide-react'
import type { Language } from '@/lib/translations'
import type { PermissionMatrixData } from '@/api/permission-matrix'

// ── Props ────────────────────────────────────────────────────────

type Props = {
  matrix: PermissionMatrixData
  language: Language
  isSaving: boolean
  hasChanges: boolean
  pendingCount: number
  onTogglePermission: (roleId: number, domain: string, action: string, enabled: boolean) => void
  onSaveChanges: () => void
  onDiscardChanges: () => void
}

// ── Bilingual labels for domains & actions ───────────────────────

const DOMAIN_LABELS: Record<string, { vi: string; en: string }> = {
  user: { vi: 'Quản Lý Người Dùng', en: 'User Management' },
  role: { vi: 'Quản Lý Vai Trò', en: 'Role Management' },
  permission: { vi: 'Quản Lý Quyền', en: 'Permission Management' },
  permission_matrix: { vi: 'Ma Trận Quyền', en: 'Permission Matrix' },
  employee: { vi: 'Quản Lý Nhân Viên', en: 'Employee Management' },
  payroll: { vi: 'Quản Lý Lương', en: 'Payroll Management' },
  attendance: { vi: 'Quản Lý Chấm Công', en: 'Attendance Management' },
  report: { vi: 'Báo Cáo', en: 'Reports' },
  alert: { vi: 'Quản Lý Cảnh Báo', en: 'Alert Management' },
  audit: { vi: 'Quản Lý Kiểm Toán', en: 'Audit Management' },
  system: { vi: 'Quản Lý Hệ Thống', en: 'System Management' },
}

const ACTION_LABELS: Record<string, { vi: string; en: string }> = {
  read: { vi: 'Xem', en: 'View' },
  write: { vi: 'Chỉnh Sửa', en: 'Edit' },
  create: { vi: 'Tạo Mới', en: 'Create' },
  delete: { vi: 'Xóa', en: 'Delete' },
  config: { vi: 'Cấu Hình', en: 'Configure' },
}

// ── Component ────────────────────────────────────────────────────

export default function PermissionMatrix({
  matrix,
  language,
  isSaving,
  hasChanges,
  pendingCount,
  onTogglePermission,
  onSaveChanges,
  onDiscardChanges,
}: Props) {
  const [searchQuery, setSearchQuery] = useState('')
  const { domains, roles } = matrix

  // Build a map: domain → sorted list of actions present in any role
  const domainActions = useMemo(() => {
    const map: Record<string, Set<string>> = {}
    for (const role of roles) {
      for (const key of Object.keys(role.permissions)) {
        const dotIdx = key.indexOf('.')
        if (dotIdx === -1) continue
        const d = key.substring(0, dotIdx)
        const a = key.substring(dotIdx + 1)
        if (!map[d]) map[d] = new Set()
        map[d].add(a)
      }
    }
    // Convert to sorted arrays, preserving domain order from API
    const result: Record<string, string[]> = {}
    for (const d of domains) {
      result[d] = Array.from(map[d] ?? []).sort()
    }
    return result
  }, [domains, roles])

  // Filter domains by search query
  const filteredDomains = useMemo(() => {
    if (!searchQuery) return domains
    const q = searchQuery.toLowerCase()
    return domains.filter((d) => {
      const label = DOMAIN_LABELS[d]?.[language] ?? d
      if (label.toLowerCase().includes(q) || d.toLowerCase().includes(q)) return true
      // Also match if any action label within domain matches
      const actions = domainActions[d] ?? []
      return actions.some((a) => {
        const aLabel = ACTION_LABELS[a]?.[language] ?? a
        return aLabel.toLowerCase().includes(q) || `${d}.${a}`.includes(q)
      })
    })
  }, [domains, domainActions, searchQuery, language])

  // Count totals per role
  const roleTotals = useMemo(() => {
    const totals: Record<number, { enabled: number; total: number }> = {}
    for (const role of roles) {
      const values = Object.values(role.permissions)
      totals[role.roleId] = {
        enabled: values.filter(Boolean).length,
        total: values.length,
      }
    }
    return totals
  }, [roles])

  const domainLabel = (d: string) => DOMAIN_LABELS[d]?.[language] ?? d.charAt(0).toUpperCase() + d.slice(1)
  const actionLabel = (a: string) => ACTION_LABELS[a]?.[language] ?? a.charAt(0).toUpperCase() + a.slice(1)

  return (
    <div className="space-y-6">
      {/* ── Header ────────────────────────────────────────────── */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {language === 'vi' ? 'Ma Trận Quyền Theo Vai Trò' : 'Role Permission Matrix'}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {language === 'vi'
                ? 'Bật/tắt quyền cho từng vai trò, sau đó ấn Lưu Thay Đổi'
                : 'Toggle permissions for each role, then click Save Changes'}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            {hasChanges && (
              <span className="text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-2.5 py-1 rounded-full">
                {pendingCount} {language === 'vi' ? 'thay đổi chưa lưu' : 'unsaved change(s)'}
              </span>
            )}

            {hasChanges && (
              <Button
                variant="outline"
                size="sm"
                onClick={onDiscardChanges}
                disabled={isSaving}
                className="text-slate-600 dark:text-slate-300"
              >
                <Undo2 className="w-4 h-4 mr-1.5" />
                {language === 'vi' ? 'Hủy' : 'Discard'}
              </Button>
            )}

            <Button
              size="sm"
              onClick={onSaveChanges}
              disabled={!hasChanges || isSaving}
              className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  {language === 'vi' ? 'Đang lưu...' : 'Saving...'}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-1.5" />
                  {language === 'vi' ? 'Lưu Thay Đổi' : 'Save Changes'}
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            type="text"
            placeholder={language === 'vi' ? 'Tìm kiếm miền quyền...' : 'Search permission domains...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
          />
        </div>
      </div>

      {/* ── Matrix Table ──────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden max-h-[800px]">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider w-52">
                  {language === 'vi' ? 'Quyền' : 'Permission'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider w-44">
                  {language === 'vi' ? 'Khóa' : 'Key'}
                </th>
                {roles.map((role) => {
                  const t = roleTotals[role.roleId]
                  return (
                    <th
                      key={role.roleId}
                      className="px-4 py-3 text-center text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider min-w-[120px]"
                    >
                      <div className="flex flex-col items-center gap-0.5">
                        <span>{role.name}</span>
                        <span className="text-[10px] font-normal text-slate-400">{role.code}</span>
                        {t && (
                          <span className="text-[10px] font-normal text-blue-500 dark:text-blue-400">
                            {t.enabled}/{t.total}
                          </span>
                        )}
                      </div>
                    </th>
                  )
                })}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {filteredDomains.map((domain) => {
                const actions = domainActions[domain] ?? []
                // Count enabled per domain
                const domainEnabled = roles.reduce((sum, role) => {
                  return sum + actions.filter((a) => role.permissions[`${domain}.${a}`]).length
                }, 0)
                const domainTotal = actions.length * roles.length

                return (
                  <React.Fragment key={domain}>
                    {/* Domain header row */}
                    <tr className="bg-slate-100 dark:bg-slate-700/50">
                      <td
                        colSpan={2 + roles.length}
                        className="px-6 py-3"
                      >
                        <div className="flex items-center gap-2">
                          {domainEnabled === domainTotal ? (
                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <ShieldAlert className="w-4 h-4 text-amber-500" />
                          )}
                          <span className="text-sm font-bold text-slate-900 dark:text-white uppercase">
                            {domainLabel(domain)}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400 ml-1">
                            ({domainEnabled}/{domainTotal})
                          </span>
                        </div>
                      </td>
                    </tr>

                    {/* Permission rows */}
                    {actions.map((action) => {
                      const permKey = `${domain}.${action}`
                      return (
                        <tr
                          key={permKey}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <span className="text-sm font-medium text-slate-900 dark:text-white">
                              {actionLabel(action)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <code className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-slate-600 dark:text-slate-300">
                              {permKey}
                            </code>
                          </td>
                          {roles.map((role) => {
                            const enabled = role.permissions[permKey] ?? false
                            return (
                              <td key={role.roleId} className="px-4 py-4 text-center">
                                <input
                                  type="checkbox"
                                  checked={enabled}
                                  disabled={isSaving}
                                  onChange={() => onTogglePermission(role.roleId, domain, action, !enabled)}
                                  className="w-4 h-4 text-blue-600 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded focus:ring-blue-500 dark:focus:ring-blue-400 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                              </td>
                            )
                          })}
                        </tr>
                      )
                    })}
                  </React.Fragment>
                )
              })}

              {filteredDomains.length === 0 && (
                <tr>
                  <td
                    colSpan={2 + roles.length}
                    className="px-6 py-12 text-center text-sm text-slate-500 dark:text-slate-400"
                  >
                    {language === 'vi' ? 'Không tìm thấy miền quyền phù hợp.' : 'No matching permission domains found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
