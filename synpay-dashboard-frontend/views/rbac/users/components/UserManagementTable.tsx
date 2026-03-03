'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { UserPlus, Search, Edit, Power } from 'lucide-react'
import type { Language } from '@/lib/translations'
import type { ApiUserResponse } from '@/api/users'
import { t } from '@/lib/translations'

type Props = {
  users: ApiUserResponse[]
  language: Language
  onAddUser: () => void
  onEditUser: (accountId: number) => void
  onToggleStatus: (accountId: number) => void
}

export default function UserManagementTable({
  users,
  language,
  onAddUser,
  onEditUser,
  onToggleStatus,
}: Props) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredUsers = users.filter((user) =>
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.roles.some((r) => r.name.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  /** Format a nullable ISO timestamp for display. */
  const fmtDate = (iso: string | null) => {
    if (!iso) return '—'
    try {
      return new Date(iso).toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    } catch {
      return iso
    }
  }

  /** First letter(s) for avatar. Uses email username initial. */
  const avatarInitials = (email: string) => {
    const local = email.split('@')[0] ?? ''
    return local.charAt(0).toUpperCase()
  }

  return (
    <div className="space-y-6">
      {/* Search + Add */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex-1 w-full sm:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              type="text"
              placeholder={t('rbac.users.search', language)}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
            />
          </div>
        </div>
        <Button onClick={onAddUser} className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600">
          <UserPlus className="w-4 h-4 mr-2" />
          {t('rbac.users.addUser', language)}
        </Button>
      </div>

      {/* Table */}
      <Card className="border-slate-200 dark:border-slate-700 shadow-custom overflow-hidden">
        <div className="overflow-x-auto max-h-[600px]">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  {t('rbac.users.table.email', language)}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  {t('rbac.users.table.roles', language)}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  {t('rbac.users.table.status', language)}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  {t('rbac.users.table.lastLogin', language)}
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  {t('rbac.users.table.actions', language)}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                    {searchQuery
                      ? (language === 'vi' ? 'Không tìm thấy người dùng phù hợp.' : 'No matching users found.')
                      : (language === 'vi' ? 'Chưa có người dùng nào.' : 'No users yet.')}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr
                    key={user.accountId}
                    className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    {/* Email + avatar */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                          {avatarInitials(user.email)}
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-semibold text-slate-900 dark:text-white">
                            {user.email}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            ID: {user.accountId}
                            {user.employeeId ? ` · EMP: ${user.employeeId}` : ''}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Roles */}
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {user.roles.length > 0 ? (
                          user.roles.map((role) => (
                            <Badge
                              key={role.roleId}
                              className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                            >
                              {role.name}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400 italic">
                            {language === 'vi' ? 'Chưa có vai trò' : 'No roles'}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge
                        className={
                          user.status === 'active'
                            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                        }
                      >
                        {t(`rbac.users.status.${user.status}`, language)}
                      </Badge>
                    </td>

                    {/* Last Login */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">
                      {fmtDate(user.lastLoginAt)}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onEditUser(user.accountId)}
                          className="border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700"
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          {t('rbac.users.action.edit', language)}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onToggleStatus(user.accountId)}
                          className={
                            user.status === 'active'
                              ? 'border-red-300 dark:border-red-700 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                              : 'border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                          }
                        >
                          <Power className="w-4 h-4 mr-1" />
                          {t('rbac.users.action.toggle', language)}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
