'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { X, Loader2, Search, Shield, Check, Minus } from 'lucide-react'
import type { Language } from '@/lib/translations'
import type { ApiRoleResponse, ApiPermissionItem, AssignPermissionsPayload } from '@/api/roles'
import { t } from '@/lib/translations'

type Props = {
  isOpen: boolean
  role: ApiRoleResponse | null
  isSaving: boolean
  language: Language
  onClose: () => void
  onSave: (roleId: number, payload: AssignPermissionsPayload) => void
}

export default function PermissionMatrixModal({
  isOpen, role, isSaving, language, onClose, onSave,
}: Props) {
  const [permStates, setPermStates] = useState<Map<number, boolean>>(new Map())
  const [searchQuery, setSearchQuery] = useState('')

  // Initialise toggle states from role permissions
  useEffect(() => {
    if (role?.permissions) {
      const states = new Map<number, boolean>()
      role.permissions.forEach((p) => states.set(p.permissionId, p.enabled))
      setPermStates(states)
    } else {
      setPermStates(new Map())
    }
    setSearchQuery('')
  }, [role, isOpen])

  const togglePermission = useCallback((permissionId: number) => {
    setPermStates((prev) => {
      const next = new Map(prev)
      next.set(permissionId, !next.get(permissionId))
      return next
    })
  }, [])

  const handleSave = () => {
    if (!role) return
    const permissions = Array.from(permStates.entries()).map(([permissionId, enabled]) => ({
      permissionId,
      enabled,
    }))
    onSave(role.roleId, { permissions })
  }

  // Check if anything changed
  const hasChanges = role?.permissions?.some(
    (p) => permStates.get(p.permissionId) !== p.enabled,
  ) ?? false

  if (!isOpen || !role) return null

  const permissions = role.permissions ?? []
  const filteredPermissions = permissions.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.key.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Group permissions by domain (key prefix before the dot)
  const grouped = new Map<string, ApiPermissionItem[]>()
  filteredPermissions.forEach((p) => {
    const domain = p.key.split('.')[0] ?? 'other'
    if (!grouped.has(domain)) grouped.set(domain, [])
    grouped.get(domain)!.push(p)
  })

  const enabledCount = Array.from(permStates.values()).filter(Boolean).length
  const totalCount = permissions.length

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {language === 'vi' ? 'Quản lý quyền' : 'Manage Permissions'}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <Badge className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs">
                {role.name}
              </Badge>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {enabledCount}/{totalCount} {language === 'vi' ? 'được bật' : 'enabled'}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="px-6 pt-4 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              type="text"
              placeholder={language === 'vi' ? 'Tìm kiếm quyền...' : 'Search permissions...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
            />
          </div>
        </div>

        {/* Permission list */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {permissions.length === 0 && (
            <div className="text-center py-12">
              <Shield className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
              <p className="text-slate-500 dark:text-slate-400">
                {language === 'vi' ? 'Không có quyền nào trong hệ thống' : 'No permissions available'}
              </p>
            </div>
          )}

          {Array.from(grouped.entries()).map(([domain, perms]) => (
            <div key={domain}>
              <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                {domain}
              </h3>
              <div className="space-y-2">
                {perms.map((perm) => {
                  const isEnabled = permStates.get(perm.permissionId) ?? false
                  return (
                    <button
                      key={perm.permissionId}
                      type="button"
                      onClick={() => togglePermission(perm.permissionId)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-left ${
                        isEnabled
                          ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                          : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${
                        isEnabled
                          ? 'bg-blue-500 text-white'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                      }`}>
                        {isEnabled ? <Check className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-slate-900 dark:text-white">{perm.name}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">{perm.key}</div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex items-center gap-3 flex-shrink-0">
          <Button
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            className="flex-1 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {language === 'vi' ? 'Lưu thay đổi' : 'Save Changes'}
          </Button>
          <Button
            onClick={onClose}
            disabled={isSaving}
            className="px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300"
          >
            {t('rbac.modal.cancel', language)}
          </Button>
        </div>
      </div>
    </div>
  )
}
