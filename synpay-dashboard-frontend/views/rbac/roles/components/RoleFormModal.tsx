'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X, Loader2 } from 'lucide-react'
import type { Language } from '@/lib/translations'
import type { ApiRoleResponse, CreateRolePayload, UpdateRolePayload } from '@/api/roles'
import { t } from '@/lib/translations'

type Props = {
  isOpen: boolean
  role: ApiRoleResponse | null
  isSaving: boolean
  language: Language
  onClose: () => void
  onSave: (payload: CreateRolePayload | UpdateRolePayload, roleId?: number) => void
}

export default function RoleFormModal({ isOpen, role, isSaving, language, onClose, onSave }: Props) {
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [responsibility, setResponsibility] = useState('')

  const isEditing = !!role

  useEffect(() => {
    if (role) {
      setCode(role.code)
      setName(role.name)
      setDescription(role.description ?? '')
      setResponsibility(role.responsibility ?? '')
    } else {
      setCode('')
      setName('')
      setDescription('')
      setResponsibility('')
    }
  }, [role, isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (isEditing) {
      const payload: UpdateRolePayload = {}
      if (name !== role!.name) payload.name = name
      if (description !== (role!.description ?? '')) payload.description = description || undefined
      if (responsibility !== (role!.responsibility ?? '')) payload.responsibility = responsibility || undefined
      onSave(payload, role!.roleId)
    } else {
      const payload: CreateRolePayload = { code: code.trim(), name: name.trim() }
      if (description.trim()) payload.description = description.trim()
      if (responsibility.trim()) payload.responsibility = responsibility.trim()
      onSave(payload)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between sticky top-0 bg-white dark:bg-slate-800 z-10">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            {isEditing
              ? t('rbac.modal.role.title.edit', language)
              : t('rbac.modal.role.title.create', language)}
          </h2>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Code (only for create) */}
          {!isEditing && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                {language === 'vi' ? 'Mã vai trò' : 'Role Code'}
              </label>
              <Input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                required
                maxLength={80}
                placeholder={language === 'vi' ? 'VD: HR_MANAGER' : 'e.g. HR_MANAGER'}
                className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 font-mono"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {language === 'vi'
                  ? 'Mã vai trò sẽ được viết hoa tự động. Không thể thay đổi sau khi tạo.'
                  : 'Role code will be uppercased automatically. Cannot be changed after creation.'}
              </p>
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              {t('rbac.modal.role.name', language)}
            </label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={150}
              className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              {t('rbac.modal.role.description', language)}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Responsibility */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              {t('rbac.modal.role.responsibilities', language)}
            </label>
            <textarea
              value={responsibility}
              onChange={(e) => setResponsibility(e.target.value)}
              placeholder={t('rbac.modal.role.responsibilitiesPlaceholder', language)}
              rows={4}
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4">
            <Button
              type="submit"
              disabled={isSaving}
              className="flex-1 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t('rbac.modal.role.save', language)}
            </Button>
            <Button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300"
            >
              {t('rbac.modal.cancel', language)}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
