'use client'

import { useState } from 'react'
import Sidebar from '../../../components/layout/Sidebar'
import Header from '../../../components/layout/Header'
import UserManagement from '../security/components/UserManagement'
import UserModal from '../security/components/UserModal'
import ConfirmModal from '../security/components/ConfirmModal'
import { getMockUsers, getMockRoles, getMockAuditLogs } from '../security/data'
import type { User, Role, AuditLog, ConfirmModalData } from '../security/types'
import { t } from '@/lib/translations'
import { useLanguage } from '@/components/providers/LanguageProvider'

export default function UserManagementPage() {
  const { language, toggleLanguage } = useLanguage()
  const [users, setUsers] = useState<User[]>(getMockUsers())

  const [roles] = useState<Role[]>(getMockRoles())
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(getMockAuditLogs())

  const [isUserModalOpen, setIsUserModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const [confirmModalData, setConfirmModalData] = useState<ConfirmModalData | null>(null)

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
      setUsers((prev) =>
        prev.map((u) => (u.id === editingUser.id ? { ...u, ...userData } : u))
      )
      addAuditLog(
        'user_assignment',
        `${language === 'vi' ? 'Đã cập nhật người dùng' : 'Updated user'}: ${userData.firstName} ${userData.lastName}`
      )
    } else {
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
        setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, status: newStatus } : u)))
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
        alert(
          `${language === 'vi' ? 'Đã gửi email đặt lại mật khẩu đến' : 'Password reset email sent to'} ${user.email}`
        )
        addAuditLog(
          'user_assignment',
          `${language === 'vi' ? 'Đã gửi email đặt lại mật khẩu cho' : 'Sent password reset for'}: ${user.email}`
        )
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
      <Sidebar language={language} t={(key) => t(key, language)} activeRoute="/rbac/users" />

      <main className="flex-1 flex flex-col min-w-0">
        <Header
          language={language}
          onLanguageToggle={toggleLanguage}
          onRefresh={() => {
            setUsers(getMockUsers())
            setAuditLogs(getMockAuditLogs())
          }}
          t={(key) => t(key, language)}
        />

        <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 md:px-8 py-6">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
            {t('rbac.pageTitle.users', language)}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">{t('rbac.pageSubtitle.users', language)}</p>
        </div>

        <div className="flex-1 p-4 md:p-8 overflow-y-auto">
          <UserManagement
            users={users}
            roles={roles}
            language={language}
            onAddUser={handleAddUser}
            onEditUser={handleEditUser}
            onToggleStatus={handleToggleUserStatus}
            onResetPassword={handleResetPassword}
          />
        </div>
      </main>

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

      <ConfirmModal
        isOpen={isConfirmModalOpen}
        data={confirmModalData}
        language={language}
        onClose={closeConfirmModal}
      />
    </div>
  )
}
