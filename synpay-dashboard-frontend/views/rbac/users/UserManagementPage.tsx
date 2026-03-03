'use client'

import { useState } from 'react'
import Sidebar from '../../../components/layout/Sidebar'
import Header from '../../../components/layout/Header'
import UserManagementTable from './components/UserManagementTable'
import UserFormModal from './components/UserFormModal'
import ConfirmModal from '../security/components/ConfirmModal'
import { useUsers } from '@/hooks/useUsers'
import { useRoles } from '@/hooks/useRoles'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import type { ApiUserResponse, CreateUserPayload, UpdateUserPayload } from '@/api/users'
import type { ConfirmModalData } from '../security/types'
import { t } from '@/lib/translations'
import { useLanguage } from '@/components/providers/LanguageProvider'
import { AlertCircle, RefreshCw, Loader2 } from 'lucide-react'

export default function UserManagementPage() {
  const { language, toggleLanguage } = useLanguage()
  const auth = useRequireAuth()

  const {
    users,
    isLoading,
    error,
    isSaving,
    refresh,
    create,
    update,
    toggleStatus,
    clearError,
  } = useUsers()

  // Fetch all roles from the Roles API (not derived from existing users)
  const { roles: allRoles } = useRoles()
  const availableRoles = allRoles.map((r) => ({
    roleId: r.roleId,
    code: r.code,
    name: r.name,
  }))

  // Modal state
  const [isUserModalOpen, setIsUserModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<ApiUserResponse | null>(null)
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const [confirmModalData, setConfirmModalData] = useState<ConfirmModalData | null>(null)
  const [modalError, setModalError] = useState<string | null>(null)

  // ── Handlers ──────────────────────────────────────────────────

  const handleAddUser = () => {
    setEditingUser(null)
    setModalError(null)
    setIsUserModalOpen(true)
  }

  const handleEditUser = (accountId: number) => {
    const user = users.find((u) => u.accountId === accountId)
    if (user) {
      setEditingUser(user)
      setModalError(null)
      setIsUserModalOpen(true)
    }
  }

  const handleSaveUser = async (payload: CreateUserPayload | UpdateUserPayload) => {
    try {
      setModalError(null)
      if (editingUser) {
        await update(editingUser.accountId, payload as UpdateUserPayload)
      } else {
        await create(payload as CreateUserPayload)
      }
      setIsUserModalOpen(false)
      setEditingUser(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Operation failed'
      setModalError(message)
    }
  }

  const handleToggleUserStatus = (accountId: number) => {
    const user = users.find((u) => u.accountId === accountId)
    if (!user) return

    const newStatus = user.status === 'active' ? 'inactive' : 'active'
    const actionText =
      newStatus === 'active'
        ? language === 'vi' ? 'kích hoạt' : 'activate'
        : language === 'vi' ? 'vô hiệu hóa' : 'deactivate'

    showConfirmModal(
      t('rbac.confirm.changeStatus', language),
      `${language === 'vi' ? 'Bạn có chắc chắn muốn' : 'Are you sure you want to'} ${actionText} ${user.email}?`,
      async () => {
        try {
          await toggleStatus(user)
        } catch {
          // error displayed via hook's error state
        }
      }
    )
  }

  const showConfirmModal = (title: string, message: string, callback: () => void) => {
    setConfirmModalData({ title, message, callback })
    setIsConfirmModalOpen(true)
  }

  const closeConfirmModal = () => {
    setIsConfirmModalOpen(false)
    setConfirmModalData(null)
  }

  // Guard: still loading auth
  if (auth.isLoading) return null

  return (
    <div className="flex w-full min-h-screen">
      <Sidebar language={language} t={(key) => t(key, language)} activeRoute="/rbac/users" />

      <main className="flex-1 flex flex-col min-w-0">
        <Header
          language={language}
          onLanguageToggle={toggleLanguage}
          onRefresh={refresh}
          t={(key) => t(key, language)}
        />

        <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 md:px-8 py-6">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
            {t('rbac.pageTitle.users', language)}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">{t('rbac.pageSubtitle.users', language)}</p>
        </div>

        <div className="flex-1 p-4 md:p-8 overflow-y-auto">
          {/* Global error banner */}
          {error && (
            <div className="mb-6 flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-300 flex-1">{error}</p>
              <button
                onClick={clearError}
                className="text-red-600 dark:text-red-400 hover:underline text-sm font-medium"
              >
                {language === 'vi' ? 'Đóng' : 'Dismiss'}
              </button>
              <button
                onClick={refresh}
                className="text-red-600 dark:text-red-400 hover:underline text-sm font-medium flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                {language === 'vi' ? 'Thử lại' : 'Retry'}
              </button>
            </div>
          )}

          {/* Loading state */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" />
              <span className="ml-3 text-slate-600 dark:text-slate-400">
                {language === 'vi' ? 'Đang tải...' : 'Loading...'}
              </span>
            </div>
          ) : (
            <UserManagementTable
              users={users}
              language={language}
              onAddUser={handleAddUser}
              onEditUser={handleEditUser}
              onToggleStatus={handleToggleUserStatus}
            />
          )}
        </div>
      </main>

      <UserFormModal
        isOpen={isUserModalOpen}
        user={editingUser}
        availableRoles={availableRoles}
        language={language}
        isSaving={isSaving}
        error={modalError}
        onClose={() => {
          setIsUserModalOpen(false)
          setEditingUser(null)
          setModalError(null)
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
