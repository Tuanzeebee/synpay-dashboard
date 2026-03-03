'use client'

import { useState, useCallback } from 'react'
import Sidebar from '../../../components/layout/Sidebar'
import Header from '../../../components/layout/Header'
import RoleManagementTable from './components/RoleManagementTable'
import RoleFormModal from './components/RoleFormModal'
import PermissionMatrixModal from './components/PermissionMatrixModal'
import { useRoles } from '@/hooks/useRoles'
import type { ApiRoleResponse, CreateRolePayload, UpdateRolePayload, AssignPermissionsPayload } from '@/api/roles'
import { t } from '@/lib/translations'
import { useLanguage } from '@/components/providers/LanguageProvider'

export default function RoleManagementPage() {
  const { language, toggleLanguage } = useLanguage()
  const {
    roles, isLoading, error, isSaving, selectedRole,
    refresh, loadDetail, create, update, updatePermissions, clearError,
  } = useRoles()

  // ── Role form modal state ──────────────────────────────────────
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<ApiRoleResponse | null>(null)

  // ── Permission modal state ─────────────────────────────────────
  const [isPermModalOpen, setIsPermModalOpen] = useState(false)

  // ── Handlers ───────────────────────────────────────────────────

  const handleCreateRole = useCallback(() => {
    setEditingRole(null)
    setIsRoleModalOpen(true)
  }, [])

  const handleEditRole = useCallback((role: ApiRoleResponse) => {
    setEditingRole(role)
    setIsRoleModalOpen(true)
  }, [])

  const handleManagePermissions = useCallback(async (role: ApiRoleResponse) => {
    try {
      await loadDetail(role.roleId)
      setIsPermModalOpen(true)
    } catch {
      // error is set via hook state
    }
  }, [loadDetail])

  const handleSaveRole = useCallback(async (
    payload: CreateRolePayload | UpdateRolePayload,
    roleId?: number,
  ) => {
    try {
      if (roleId != null) {
        await update(roleId, payload as UpdateRolePayload)
      } else {
        await create(payload as CreateRolePayload)
      }
      setIsRoleModalOpen(false)
      setEditingRole(null)
    } catch {
      // error is set via hook state
    }
  }, [create, update])

  const handleSavePermissions = useCallback(async (
    roleId: number,
    payload: AssignPermissionsPayload,
  ) => {
    try {
      await updatePermissions(roleId, payload)
      setIsPermModalOpen(false)
    } catch {
      // error is set via hook state
    }
  }, [updatePermissions])

  return (
    <div className="flex w-full min-h-screen">
      <Sidebar language={language} t={(key) => t(key, language)} activeRoute="/rbac/roles" />

      <main className="flex-1 flex flex-col min-w-0">
        <Header
          language={language}
          onLanguageToggle={toggleLanguage}
          onRefresh={refresh}
          t={(key) => t(key, language)}
        />

        <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 md:px-8 py-6">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
            {t('rbac.pageTitle.roles', language)}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">{t('rbac.pageSubtitle.roles', language)}</p>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mx-4 md:mx-8 mt-4 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center justify-between">
            <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
            <button
              onClick={clearError}
              className="text-red-500 hover:text-red-700 dark:hover:text-red-300 text-sm font-medium"
            >
              {language === 'vi' ? 'Đóng' : 'Dismiss'}
            </button>
          </div>
        )}

        <div className="flex-1 p-4 md:p-8 overflow-y-auto">
          <RoleManagementTable
            roles={roles}
            isLoading={isLoading}
            language={language}
            onCreateRole={handleCreateRole}
            onEditRole={handleEditRole}
            onManagePermissions={handleManagePermissions}
          />
        </div>
      </main>

      {/* Create / Edit Role Modal */}
      <RoleFormModal
        isOpen={isRoleModalOpen}
        role={editingRole}
        isSaving={isSaving}
        language={language}
        onClose={() => { setIsRoleModalOpen(false); setEditingRole(null) }}
        onSave={handleSaveRole}
      />

      {/* Permission Assignment Modal */}
      <PermissionMatrixModal
        isOpen={isPermModalOpen}
        role={selectedRole}
        isSaving={isSaving}
        language={language}
        onClose={() => setIsPermModalOpen(false)}
        onSave={handleSavePermissions}
      />
    </div>
  )
}
