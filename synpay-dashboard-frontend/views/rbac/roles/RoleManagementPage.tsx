'use client'

import { useState } from 'react'
import Sidebar from '../../../components/layout/Sidebar'
import Header from '../../../components/layout/Header'
import RoleManagement from '../security/components/RoleManagement'
import RoleModal from '../security/components/RoleModal'
import ConfirmModal from '../security/components/ConfirmModal'
import { getMockRoles, getMockPermissions, getMockAuditLogs } from '../security/data'
import type { Role, Permission, AuditLog, ConfirmModalData } from '../security/types'
import { t } from '@/lib/translations'
import { useLanguage } from '@/components/providers/LanguageProvider'

export default function RoleManagementPage() {
  const { language, toggleLanguage } = useLanguage()
  const [roles, setRoles] = useState<Role[]>(getMockRoles())

  const [permissions] = useState<Permission[]>(getMockPermissions())
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(getMockAuditLogs())

  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const [confirmModalData, setConfirmModalData] = useState<ConfirmModalData | null>(null)

  const handleCreateRole = () => {
    setEditingRole(null)
    setIsRoleModalOpen(true)
  }

  const handleEditRole = (roleId: string) => {
    const role = roles.find((r) => r.id === roleId)
    if (role) {
      setEditingRole(role)
      setIsRoleModalOpen(true)
    }
  }

  const handleSaveRole = (roleData: Omit<Role, 'id' | 'userCount'>) => {
    if (editingRole) {
      setRoles((prev) => prev.map((r) => (r.id === editingRole.id ? { ...r, ...roleData } : r)))
      addAuditLog('role_change', `${language === 'vi' ? 'Đã cập nhật vai trò' : 'Updated role'}: ${roleData.name.vi}`)
    } else {
      const newRole: Role = {
        ...roleData,
        id: `role_${Date.now()}`,
        userCount: 0,
      }
      setRoles((prev) => [...prev, newRole])
      addAuditLog('role_change', `${language === 'vi' ? 'Đã tạo vai trò mới' : 'Created new role'}: ${roleData.name.vi}`)
    }
    setIsRoleModalOpen(false)
    setEditingRole(null)
  }

  const handleCloneRole = (roleId: string) => {
    const role = roles.find((r) => r.id === roleId)
    if (!role) return

    const copyText = language === 'vi' ? '(Bản sao)' : '(Copy)'
    const clonedRole: Role = {
      ...role,
      id: `role_${Date.now()}`,
      name: { vi: `${role.name.vi} ${copyText}`, en: `${role.name.en} ${copyText}` },
      userCount: 0,
    }
    setRoles((prev) => [...prev, clonedRole])
    addAuditLog('role_change', `${language === 'vi' ? 'Đã sao chép vai trò' : 'Cloned role'}: ${role.name.vi}`)
  }

  const handleDeleteRole = (roleId: string) => {
    const role = roles.find((r) => r.id === roleId)
    if (!role) return

    const roleName = language === 'vi' ? role.name.vi : role.name.en
    showConfirmModal(
      t('rbac.confirm.delete.role', language),
      `${language === 'vi' ? 'Bạn có chắc chắn muốn xóa vai trò' : 'Are you sure you want to delete role'} "${roleName}"? ${language === 'vi' ? 'Hành động này không thể hoàn tác.' : 'This action cannot be undone.'}`,
      () => {
        setRoles((prev) => prev.filter((r) => r.id !== roleId))
        addAuditLog('role_change', `${language === 'vi' ? 'Đã xóa vai trò' : 'Deleted role'}: ${roleName}`)
      }
    )
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

  const showConfirmModal = (title: string, message: string, callback: () => void) => {
    setConfirmModalData({ title, message, callback })
    setIsConfirmModalOpen(true)
  }

  const closeConfirmModal = () => {
    setIsConfirmModalOpen(false)
    setConfirmModalData(null)
  }

  return (
    <div className="flex w-full min-h-screen">
      <Sidebar language={language} t={(key) => t(key, language)} activeRoute="/rbac/roles" />

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
            {t('rbac.pageTitle.roles', language)}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">{t('rbac.pageSubtitle.roles', language)}</p>
        </div>

        <div className="flex-1 p-4 md:p-8 overflow-y-auto">
          <RoleManagement
            roles={roles}
            permissions={permissions}
            language={language}
            onCreateRole={handleCreateRole}
            onEditRole={handleEditRole}
            onCloneRole={handleCloneRole}
            onDeleteRole={handleDeleteRole}
          />
        </div>
      </main>

      <RoleModal
        isOpen={isRoleModalOpen}
        role={editingRole}
        language={language}
        onClose={() => {
          setIsRoleModalOpen(false)
          setEditingRole(null)
        }}
        onSave={handleSaveRole}
      />

      <ConfirmModal
        isOpen={isConfirmModalOpen}
        data={confirmModalData}
        language={language}
        onClose={closeConfirmModal}
      />
    </div>
  )
}
