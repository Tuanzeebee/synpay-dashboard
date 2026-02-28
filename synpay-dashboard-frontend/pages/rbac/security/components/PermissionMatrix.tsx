'use client'

import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Save } from 'lucide-react'
import type { Language } from '@/lib/translations'
import type { Role, Permission } from '../types'
import { t } from '@/lib/translations'

type Props = {
  roles: Role[]
  permissions: Permission[]
  language: Language
  onTogglePermission: (roleId: string, permissionId: string) => void
  onSaveChanges: () => void
}

export default function PermissionMatrix({
  roles,
  permissions,
  language,
  onTogglePermission,
  onSaveChanges,
}: Props) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredPermissions = permissions.filter((perm) =>
    perm.name[language].toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Group permissions by domain
  const permissionsByDomain = filteredPermissions.reduce(
    (acc, perm) => {
      const domain = perm.domain[language]
      if (!acc[domain]) {
        acc[domain] = []
      }
      acc[domain].push(perm)
      return acc
    },
    {} as Record<string, Permission[]>
  )

  const hasPermission = (roleId: string, permissionId: string): boolean => {
    const role = roles.find((r) => r.id === roleId)
    return role ? role.permissionIds.includes(permissionId) : false
  }

  return (
    <div className="space-y-6">
      {/* Header with Title and Save Button */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {language === 'vi' ? 'Ma Trận Quyền Theo Vai Trò' : 'Role Permission Matrix'}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {language === 'vi'
                ? 'Bật/tắt quyền cho từng vai trò trên tất cả các miền'
                : 'Toggle permissions for each role across all domains'}
            </p>
          </div>
          <Button onClick={onSaveChanges} className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600">
            <Save className="w-4 h-4 mr-2" />
            {language === 'vi' ? 'Lưu Thay Đổi' : 'Save Changes'}
          </Button>
        </div>

        {/* Search Input */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            type="text"
            placeholder={t('rbac.permissions.search', language)}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
          />
        </div>
      </div>

      {/* Permission Matrix Table */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden max-h-[800px]">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider w-64">
                  {language === 'vi' ? 'Quyền' : 'Permission'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  {t('rbac.permissions.table.description', language)}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  {t('rbac.permissions.table.dependencies', language)}
                </th>
                {roles.map((role) => (
                  <th
                    key={role.id}
                    className="px-6 py-3 text-center text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
                  >
                    {role.name[language]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {Object.entries(permissionsByDomain).map(([domain, domainPerms]) => (
                <React.Fragment key={domain}>
                  <tr className="bg-slate-100 dark:bg-slate-800">
                    <td
                      colSpan={3 + roles.length}
                      className="px-6 py-3 text-sm font-bold text-slate-900 dark:text-white uppercase"
                    >
                      {domain}
                    </td>
                  </tr>
                  {domainPerms.map((perm) => (
                    <tr
                      key={perm.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-slate-900 dark:text-white">{perm.name[language]}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{perm.id}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{perm.description[language]}</td>
                      <td className="px-6 py-4">
                        {perm.dependencies.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {perm.dependencies.map((dep) => (
                              <span
                                key={dep}
                                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300"
                              >
                                {dep}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">-</span>
                        )}
                      </td>
                      {roles.map((role) => (
                        <td key={role.id} className="px-6 py-4 text-center">
                          <input
                            type="checkbox"
                            checked={hasPermission(role.id, perm.id)}
                            onChange={() => onTogglePermission(role.id, perm.id)}
                            className="w-4 h-4 text-blue-600 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded focus:ring-blue-500 dark:focus:ring-blue-400 cursor-pointer"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
