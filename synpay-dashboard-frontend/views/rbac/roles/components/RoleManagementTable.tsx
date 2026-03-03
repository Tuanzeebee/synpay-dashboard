'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { PlusCircle, Search, Shield, Users, Edit, Settings2, Loader2 } from 'lucide-react'
import type { Language } from '@/lib/translations'
import type { ApiRoleResponse } from '@/api/roles'
import { t } from '@/lib/translations'

type Props = {
  roles: ApiRoleResponse[]
  isLoading: boolean
  language: Language
  onCreateRole: () => void
  onEditRole: (role: ApiRoleResponse) => void
  onManagePermissions: (role: ApiRoleResponse) => void
}

export default function RoleManagementTable({
  roles, isLoading, language,
  onCreateRole, onEditRole, onManagePermissions,
}: Props) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredRoles = roles.filter((role) =>
    role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    role.code.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-3 text-slate-600 dark:text-slate-400">
          {language === 'vi' ? 'Đang tải vai trò...' : 'Loading roles...'}
        </span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search + Create */}
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

      {/* Empty state */}
      {filteredRoles.length === 0 && (
        <div className="text-center py-16">
          <Shield className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
          <p className="text-slate-600 dark:text-slate-400">
            {searchQuery
              ? (language === 'vi' ? 'Không tìm thấy vai trò phù hợp' : 'No matching roles found')
              : (language === 'vi' ? 'Chưa có vai trò nào' : 'No roles yet')}
          </p>
        </div>
      )}

      {/* Role cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[700px] overflow-y-auto">
        {filteredRoles.map((role) => (
          <Card key={role.roleId} className="border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow duration-300">
            <CardContent className="p-6 space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-400 dark:to-blue-500 rounded-xl flex items-center justify-center">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{role.name}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <Badge className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-mono">
                        {role.code}
                      </Badge>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          {role.userCount} {t('rbac.roles.userCount', language)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              {role.description && (
                <p className="text-sm text-slate-600 dark:text-slate-300">{role.description}</p>
              )}

              {/* Responsibility */}
              {role.responsibility && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-400 uppercase tracking-wider mb-2">
                    {t('rbac.roles.responsibilities', language)}
                  </h4>
                  <p className="text-sm text-slate-600 dark:text-slate-300">{role.responsibility}</p>
                </div>
              )}

              {/* Permission count (from detail if available) */}
              {role.permissions && role.permissions.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-400 uppercase tracking-wider mb-2">
                    {t('rbac.roles.permissions', language)} ({role.permissions.filter(p => p.enabled).length} {t('rbac.roles.total', language)})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {role.permissions.filter(p => p.enabled).slice(0, 5).map((perm) => (
                      <Badge key={perm.permissionId} className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs">
                        {perm.name}
                      </Badge>
                    ))}
                    {role.permissions.filter(p => p.enabled).length > 5 && (
                      <Badge className="bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300 text-xs">
                        +{role.permissions.filter(p => p.enabled).length - 5} {t('rbac.roles.more', language)}
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                <Button size="sm" variant="outline" onClick={() => onEditRole(role)} className="flex-1 border-slate-300 dark:border-slate-600">
                  <Edit className="w-4 h-4 mr-1" />
                  {t('rbac.roles.action.edit', language)}
                </Button>
                <Button size="sm" variant="outline" onClick={() => onManagePermissions(role)} className="flex-1 border-slate-300 dark:border-slate-600">
                  <Settings2 className="w-4 h-4 mr-1" />
                  {language === 'vi' ? 'Phân quyền' : 'Permissions'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
