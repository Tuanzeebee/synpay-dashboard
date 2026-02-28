'use client'

import { useState } from 'react'
import Sidebar from '../../../components/layout/Sidebar'
import Header from '../../../components/layout/Header'
import { Button } from '@/components/ui/button'
import { UserCog, Shield, Key, FileText } from 'lucide-react'
import UserManagement from './components/UserManagement'
import UserModal from './components/UserModal'
import RoleManagement from './components/RoleManagement'
import RoleModal from './components/RoleModal'
import PermissionMatrix from './components/PermissionMatrix'
import AuditLog from './components/AuditLog'
import ConfirmModal from './components/ConfirmModal'
import { getMockUsers, getMockRoles, getMockPermissions, getMockAuditLogs } from './data'
import type { User, Role, AuditLog as AuditLogType, ConfirmModalData } from './types'
import { t } from '@/lib/translations'
import { useLanguage } from '@/components/providers/LanguageProvider'

type ViewType = 'users' | 'roles' | 'permissions' | 'audit'

export default function RBACDashboard() {
  const { language, toggleLanguage } = useLanguage()
  const [currentView, setCurrentView] = useState<ViewType>('users')

  // Data state
  const [users, setUsers] = useState<User[]>(getMockUsers())
  const [roles, setRoles] = useState<Role[]>(getMockRoles())
  const [permissions] = useState(getMockPermissions())
  const [auditLogs, setAuditLogs] = useState<AuditLogType[]>(getMockAuditLogs())

  // Modal state
  const [isUserModalOpen, setIsUserModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const [confirmModalData, setConfirmModalData] = useState<ConfirmModalData | null>(null)

  // Page title and subtitle based on view
  const pageTitle = t(`rbac.pageTitle.${currentView}`, language)
  const pageSubtitle = t(`rbac.pageSubtitle.${currentView}`, language)

  // User Management handlers
  const handleAddUser = () => {
    setEditingUser(null)
    setIsUserModalOpen(true)
  }

  const handleEditUser = (userId: string) => {
    const user = users.find((u) => u.id === userId)
    if (user) {
      setEditingUser(user)
      setIsUserModalOpen(true)
    }
  }

  const handleSaveUser = (userData: Omit<User, 'id' | 'createdAt'>) => {
    if (editingUser) {
      // Edit existing user
      setUsers((prev) =>
        prev.map((u) =>
          u.id === editingUser.id
            ? { ...u, ...userData }
            : u
        )
      )
      addAuditLog(
        'user_assignment',
        `${language === 'vi' ? 'Đã cập nhật người dùng' : 'Updated user'}: ${userData.firstName} ${userData.lastName}`
      )
    } else {
      // Add new user
      const newUser: User = {
        ...userData,
        id: `u${users.length + 1}`,
        createdAt: new Date().toISOString().slice(0, 10),
      }
      setUsers((prev) => [...prev, newUser])
      addAuditLog(
        'user_assignment',
        `${language === 'vi' ? 'Đã tạo người dùng mới' : 'Created new user'}: ${userData.firstName} ${userData.lastName}`
      )
    }
    setIsUserModalOpen(false)
    setEditingUser(null)
  }

  const handleToggleUserStatus = (userId: string) => {
    const user = users.find((u) => u.id === userId)
    if (!user) return

    const newStatus = user.status === 'active' ? 'inactive' : 'active'
    const actionText =
      newStatus === 'active'
        ? language === 'vi'
          ? 'kích hoạt'
          : 'activate'
        : language === 'vi'
          ? 'vô hiệu hóa'
          : 'disable'

    showConfirmModal(
      t('rbac.confirm.changeStatus', language),
      `${language === 'vi' ? 'Bạn có chắc chắn muốn' : 'Are you sure you want to'} ${actionText} ${user.firstName} ${user.lastName}?`,
      () => {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, status: newStatus } : u))
        )
        addAuditLog(
          'user_assignment',
          `${language === 'vi' ? 'Đã' : ''} ${actionText} ${language === 'en' ? 'user' : 'người dùng'}: ${user.firstName} ${user.lastName}`
        )
      }
    )
  }

  const handleResetPassword = (userId: string) => {
    const user = users.find((u) => u.id === userId)
    if (!user) return

    showConfirmModal(
      t('rbac.confirm.resetPassword', language),
      `${language === 'vi' ? 'Gửi liên kết đặt lại mật khẩu đến' : 'Send password reset link to'} ${user.email}?`,
      () => {
        alert(`${language === 'vi' ? 'Đã gửi email đặt lại mật khẩu đến' : 'Password reset email sent to'} ${user.email}`)
        addAuditLog('user_assignment', `${language === 'vi' ? 'Đã gửi email đặt lại mật khẩu cho' : 'Sent password reset for'}: ${user.email}`)
      }
    )
  }

  // Role Management handlers
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
      // Edit existing role
      setRoles((prev) =>
        prev.map((r) =>
          r.id === editingRole.id ? { ...r, ...roleData } : r
        )
      )
      addAuditLog('role_change', `${language === 'vi' ? 'Đã cập nhật vai trò' : 'Updated role'}: ${roleData.name.vi}`)
    } else {
      // Create new role
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

  // Permission Matrix handlers
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

  // Audit Log handlers
  const handleExportAuditLog = () => {
    alert(language === 'vi' ? 'Đã xuất nhật ký kiểm toán!' : 'Audit log exported!')
  }

  // Utility functions
  const addAuditLog = (eventType: AuditLogType['eventType'], action: string) => {
    const newLog: AuditLogType = {
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
      <Sidebar language={language} t={(key) => t(key, language)} activeRoute="/rbac" />

      <main className="flex-1 flex flex-col min-w-0">
        <Header
          language={language}
          onLanguageToggle={toggleLanguage}
          onRefresh={() => {
            setUsers(getMockUsers())
            setRoles(getMockRoles())
            setAuditLogs(getMockAuditLogs())
          }}
          t={(key) => t(key, language)}
        />

        {/* Page Title Section */}
        <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 md:px-8 py-6">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{pageTitle}</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">{pageSubtitle}</p>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 md:px-8">
          <div className="flex gap-2 overflow-x-auto">
            <Button
              variant="ghost"
              onClick={() => setCurrentView('users')}
              className={`flex items-center gap-2 rounded-t-lg rounded-b-none px-4 py-3 ${
                currentView === 'users'
                  ? 'bg-gradient-to-r from-blue-50 to-blue-100/50 dark:from-blue-900/30 dark:to-blue-900/20 text-blue-700 dark:text-blue-400 font-semibold border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
              }`}
            >
              <UserCog className="w-4 h-4" />
              {t('nav.users', language)}
            </Button>
            <Button
              variant="ghost"
              onClick={() => setCurrentView('roles')}
              className={`flex items-center gap-2 rounded-t-lg rounded-b-none px-4 py-3 ${
                currentView === 'roles'
                  ? 'bg-gradient-to-r from-blue-50 to-blue-100/50 dark:from-blue-900/30 dark:to-blue-900/20 text-blue-700 dark:text-blue-400 font-semibold border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
              }`}
            >
              <Shield className="w-4 h-4" />
              {t('nav.roles', language)}
            </Button>
            <Button
              variant="ghost"
              onClick={() => setCurrentView('permissions')}
              className={`flex items-center gap-2 rounded-t-lg rounded-b-none px-4 py-3 ${
                currentView === 'permissions'
                  ? 'bg-gradient-to-r from-blue-50 to-blue-100/50 dark:from-blue-900/30 dark:to-blue-900/20 text-blue-700 dark:text-blue-400 font-semibold border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
              }`}
            >
              <Key className="w-4 h-4" />
              {t('nav.permissions', language)}
            </Button>
            <Button
              variant="ghost"
              onClick={() => setCurrentView('audit')}
              className={`flex items-center gap-2 rounded-t-lg rounded-b-none px-4 py-3 ${
                currentView === 'audit'
                  ? 'bg-gradient-to-r from-blue-50 to-blue-100/50 dark:from-blue-900/30 dark:to-blue-900/20 text-blue-700 dark:text-blue-400 font-semibold border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
              }`}
            >
              <FileText className="w-4 h-4" />
              {t('nav.audit', language)}
            </Button>
          </div>
        </div>

        <div className="flex-1 p-4 md:p-8 overflow-y-auto">
          {currentView === 'users' && (
            <UserManagement
              users={users}
              roles={roles}
              language={language}
              onAddUser={handleAddUser}
              onEditUser={handleEditUser}
              onToggleStatus={handleToggleUserStatus}
              onResetPassword={handleResetPassword}
            />
          )}

          {currentView === 'roles' && (
            <RoleManagement
              roles={roles}
              permissions={permissions}
              language={language}
              onCreateRole={handleCreateRole}
              onEditRole={handleEditRole}
              onCloneRole={handleCloneRole}
              onDeleteRole={handleDeleteRole}
            />
          )}

          {currentView === 'permissions' && (
            <PermissionMatrix
              roles={roles}
              permissions={permissions}
              language={language}
              onTogglePermission={handleTogglePermission}
              onSaveChanges={handleSavePermissionChanges}
            />
          )}

          {currentView === 'audit' && (
            <AuditLog auditLogs={auditLogs} language={language} onExport={handleExportAuditLog} />
          )}
        </div>
      </main>

      {/* Modals */}
      <UserModal
        isOpen={isUserModalOpen}
        user={editingUser}
        roles={roles}
        language={language}
        onClose={() => {
          setIsUserModalOpen(false)
          setEditingUser(null)
        }}
        onSave={handleSaveUser}
      />

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
