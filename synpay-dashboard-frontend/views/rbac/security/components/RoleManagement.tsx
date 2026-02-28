'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { PlusCircle, Search, Shield, Users, Edit, Copy, Trash2 } from 'lucide-react'
import type { Language } from '@/lib/translations'
import type { Role, Permission } from '../types'
import { t } from '@/lib/translations'

type Props = {
  roles: Role[]
  permissions: Permission[]
  language: Language
  onCreateRole: () => void
  onEditRole: (roleId: string) => void
  onCloneRole: (roleId: string) => void
  onDeleteRole: (roleId: string) => void
}

export default function RoleManagement({
  roles,
  permissions,
  language,
  onCreateRole,
  onEditRole,
  onCloneRole,
  onDeleteRole,
}: Props) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredRoles = roles.filter((role) =>
    role.name[language].toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getPermissionName = (permissionId: string): string => {
    const perm = permissions.find((p) => p.id === permissionId)
    return perm ? perm.name[language] : permissionId
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex-1 w-full sm:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              type="text"
              placeholder={t('rbac.roles.search', language)}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
            />
          </div>
        </div>
        <Button onClick={onCreateRole} className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600">
          <PlusCircle className="w-4 h-4 mr-2" />
          {t('rbac.roles.createRole', language)}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[700px] overflow-y-auto">
        {filteredRoles.map((role) => (
          <Card
            key={role.id}
            className="border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow duration-300"
          >
            <CardContent className="p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-400 dark:to-blue-500 rounded-xl flex items-center justify-center">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{role.name[language]}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Users className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        {role.userCount} {t('rbac.roles.userCount', language)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-sm text-slate-600 dark:text-slate-300">{role.description[language]}</p>

              <div>
                <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-400 uppercase tracking-wider mb-2">
                  {t('rbac.roles.responsibilities', language)}
                </h4>
                <ul className="space-y-1">
                  {role.responsibilities.slice(0, 3).map((resp, idx) => (
                    <li key={idx} className="text-sm text-slate-600 dark:text-slate-300 flex items-start gap-2">
                      <span className="text-blue-500 mt-1">•</span>
                      <span>{resp[language]}</span>
                    </li>
                  ))}
                  {role.responsibilities.length > 3 && (
                    <li className="text-xs text-slate-500 dark:text-slate-400">
                      +{role.responsibilities.length - 3} {t('rbac.roles.more', language)}
                    </li>
                  )}
                </ul>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-400 uppercase tracking-wider mb-2">
                  {t('rbac.roles.permissions', language)} ({role.permissionIds.length} {t('rbac.roles.total', language)}
                  )
                </h4>
                <div className="flex flex-wrap gap-2">
                  {role.permissionIds.slice(0, 5).map((permId) => (
                    <Badge
                      key={permId}
                      className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs"
                    >
                      {getPermissionName(permId)}
                    </Badge>
                  ))}
                  {role.permissionIds.length > 5 && (
                    <Badge className="bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300 text-xs">
                      +{role.permissionIds.length - 5} {t('rbac.roles.more', language)}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onEditRole(role.id)}
                  className="flex-1 border-slate-300 dark:border-slate-600"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  {t('rbac.roles.action.edit', language)}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onCloneRole(role.id)}
                  className="border-slate-300 dark:border-slate-600"
                >
                  <Copy className="w-4 h-4 mr-1" />
                  {t('rbac.roles.action.clone', language)}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onDeleteRole(role.id)}
                  className="border-red-300 dark:border-red-700 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
