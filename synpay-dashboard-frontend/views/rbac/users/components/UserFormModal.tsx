'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X, AlertCircle, Loader2 } from 'lucide-react'
import type { Language } from '@/lib/translations'
import type { ApiUserResponse, ApiRoleResponse, CreateUserPayload, UpdateUserPayload } from '@/api/users'
import { t } from '@/lib/translations'

type Props = {
  isOpen: boolean
  user: ApiUserResponse | null
  availableRoles: ApiRoleResponse[]
  language: Language
  isSaving: boolean
  error: string | null
  onClose: () => void
  onSave: (payload: CreateUserPayload | UpdateUserPayload) => void
}

export default function UserFormModal({
  isOpen,
  user,
  availableRoles,
  language,
  isSaving,
  error,
  onClose,
  onSave,
}: Props) {
  const isEdit = !!user

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [employeeId, setEmployeeId] = useState('')
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([])
  const [status, setStatus] = useState<'active' | 'inactive'>('active')

  // Reset form when modal opens / user changes
  useEffect(() => {
    if (user) {
      setEmail(user.email)
      setPassword('')
      setEmployeeId(user.employeeId ? String(user.employeeId) : '')
      setSelectedRoleIds(user.roles.map((r) => r.roleId))
      setStatus(user.status as 'active' | 'inactive')
    } else {
      setEmail('')
      setPassword('')
      setEmployeeId('')
      setSelectedRoleIds([])
      setStatus('active')
    }
  }, [user, isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (isEdit) {
      // Build partial update payload — only include changed fields
      const payload: UpdateUserPayload = {}
      if (email !== user!.email) payload.email = email
      if (password) payload.password = password
      if (status !== user!.status) payload.status = status

      const empId = employeeId ? Number(employeeId) : undefined
      if (empId && empId !== user!.employeeId) payload.employeeId = empId

      // Always include roleIds so the backend can reconcile
      payload.roleIds = selectedRoleIds

      onSave(payload)
    } else {
      const payload: CreateUserPayload = {
        email,
        password,
        employeeId: employeeId ? Number(employeeId) : 0,
        roleIds: selectedRoleIds,
        status,
      }
      onSave(payload)
    }
  }

  const toggleRole = (roleId: number) => {
    setSelectedRoleIds((prev) =>
      prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId]
    )
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between sticky top-0 bg-white dark:bg-slate-800 z-10">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            {isEdit ? t('rbac.modal.user.title.edit', language) : t('rbac.modal.user.title.add', language)}
          </h2>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              {t('rbac.modal.user.email', language)}
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isSaving}
              placeholder="user@example.com"
              className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              {t('rbac.modal.user.password', language)}
              {isEdit && (
                <span className="ml-1 text-xs font-normal text-slate-400">
                  ({language === 'vi' ? 'để trống nếu không đổi' : 'leave blank to keep current'})
                </span>
              )}
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required={!isEdit}
              disabled={isSaving}
              placeholder={isEdit ? '••••••••' : language === 'vi' ? 'Nhập mật khẩu' : 'Enter password'}
              className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
            />
          </div>

          {/* Employee ID */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              {t('rbac.modal.user.employeeId', language)}
            </label>
            <Input
              type="number"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              disabled={isSaving}
              placeholder={language === 'vi' ? 'ID nhân viên (tùy chọn)' : 'Employee ID (optional)'}
              className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
            />
          </div>

          {/* Role assignment */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              {t('rbac.modal.user.assignRoles', language)}
            </label>
            <div className="space-y-2 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg">
              {availableRoles.length > 0 ? (
                availableRoles.map((role) => (
                  <label
                    key={role.roleId}
                    className="flex items-center gap-3 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedRoleIds.includes(role.roleId)}
                      onChange={() => toggleRole(role.roleId)}
                      disabled={isSaving}
                      className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-2 focus:ring-blue-500"
                    />
                    <div>
                      <div className="text-sm font-medium text-slate-900 dark:text-white">{role.name}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{role.code}</div>
                    </div>
                  </label>
                ))
              ) : (
                <p className="text-sm text-slate-400 italic">
                  {language === 'vi' ? 'Chưa có vai trò khả dụng' : 'No roles available'}
                </p>
              )}
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              {t('rbac.modal.user.status', language)}
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
              disabled={isSaving}
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <option value="active">{t('rbac.users.status.active', language)}</option>
              <option value="inactive">{t('rbac.users.status.inactive', language)}</option>
            </select>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-3 pt-4">
            <Button
              type="submit"
              disabled={isSaving}
              className="flex-1 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {language === 'vi' ? 'Đang lưu...' : 'Saving...'}
                </>
              ) : (
                t('rbac.modal.user.save', language)
              )}
            </Button>
            <Button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 disabled:opacity-50"
            >
              {t('rbac.modal.cancel', language)}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
