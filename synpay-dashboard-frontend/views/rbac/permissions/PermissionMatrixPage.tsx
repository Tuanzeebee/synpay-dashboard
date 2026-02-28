'use client'

import { useState } from 'react'
import Sidebar from '../../../components/layout/Sidebar'
import Header from '../../../components/layout/Header'
import PermissionMatrix from '../security/components/PermissionMatrix'
import { getMockRoles, getMockPermissions, getMockAuditLogs } from '../security/data'
import type { Role, Permission, AuditLog } from '../security/types'
import { t } from '@/lib/translations'
import { useLanguage } from '@/components/providers/LanguageProvider'

export default function PermissionMatrixPage() {
  const { language, toggleLanguage } = useLanguage()
  const [roles, setRoles] = useState<Role[]>(getMockRoles())

  const [permissions] = useState<Permission[]>(getMockPermissions())
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(getMockAuditLogs())

  const handleTogglePermission = (roleId: string, permissionId: string) => {
    setRoles((prev) =>
      prev.map((role) => {
        if (role.id === roleId) {
          const hasPermission = role.permissionIds.includes(permissionId)
          return {
            ...role,
            permissionIds: hasPermission
              ? role.permissionIds.filter((p) => p !== permissionId)
              : [...role.permissionIds, permissionId],
          }
        }
        return role
      })
    )
  }

  const handleSavePermissionChanges = () => {
    alert(language === 'vi' ? 'Đã lưu thay đổi quyền thành công!' : 'Permission changes saved successfully!')
    addAuditLog('permission_change', language === 'vi' ? 'Đã lưu thay đổi ma trận quyền' : 'Saved permission matrix changes')
  }

  const addAuditLog = (eventType: AuditLog['eventType'], action: string) => {
    const newLog: AuditLog = {
      id: `a${auditLogs.length + 1}`,
      eventType,
      userId: 'u1',
      userName: 'Nguyễn Thị Mai',
      action: { vi: action, en: action },
      details: {},
      timestamp: new Date().toISOString().slice(0, 19).replace('T', ' '),
    }
    setAuditLogs((prev) => [newLog, ...prev])
  }

  return (
    <div className="flex w-full min-h-screen">
      <Sidebar language={language} t={(key) => t(key, language)} activeRoute="/rbac/permissions" />

      <main className="flex-1 flex flex-col min-w-0">
        <Header
          language={language}
          onLanguageToggle={toggleLanguage}
          onRefresh={() => {
            setRoles(getMockRoles())
            setAuditLogs(getMockAuditLogs())
          }}
          t={(key) => t(key, language)}
        />

        <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 md:px-8 py-6">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
            {t('rbac.pageTitle.permissions', language)}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">{t('rbac.pageSubtitle.permissions', language)}</p>
        </div>

        <div className="flex-1 p-4 md:p-8 overflow-y-auto">
          <PermissionMatrix
            roles={roles}
            permissions={permissions}
            language={language}
            onTogglePermission={handleTogglePermission}
            onSaveChanges={handleSavePermissionChanges}
          />
        </div>
      </main>
    </div>
  )
}
