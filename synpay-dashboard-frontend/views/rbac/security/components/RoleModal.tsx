'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X } from 'lucide-react'
import type { Language } from '@/lib/translations'
import type { Role } from '../types'
import { t } from '@/lib/translations'

type Props = {
  isOpen: boolean
  role: Role | null
  language: Language
  onClose: () => void
  onSave: (roleData: Omit<Role, 'id' | 'userCount'>) => void
}

export default function RoleModal({ isOpen, role, language, onClose, onSave }: Props) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [responsibilities, setResponsibilities] = useState('')

  useEffect(() => {
    if (role) {
      setName(role.name[language])
      setDescription(role.description[language])
      setResponsibilities(role.responsibilities.map((r) => r[language]).join('\n'))
    } else {
      setName('')
      setDescription('')
      setResponsibilities('')
    }
  }, [role, language, isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const responsibilityArray = responsibilities
      .split('\n')
      .filter((r) => r.trim())
      .map((r) => ({ vi: r.trim(), en: r.trim() }))

    onSave({
      name: { vi: name, en: name },
      description: { vi: description, en: description },
      responsibilities: responsibilityArray,
      permissionIds: role?.permissionIds || [],
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between sticky top-0 bg-white dark:bg-slate-800 z-10">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            {role ? t('rbac.modal.role.title.edit', language) : t('rbac.modal.role.title.create', language)}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              {t('rbac.modal.role.name', language)}
            </label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              {t('rbac.modal.role.description', language)}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={3}
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              {t('rbac.modal.role.responsibilities', language)}
            </label>
            <textarea
              value={responsibilities}
              onChange={(e) => setResponsibilities(e.target.value)}
              placeholder={t('rbac.modal.role.responsibilitiesPlaceholder', language)}
              rows={4}
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-3 pt-4">
            <Button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              {t('rbac.modal.role.save', language)}
            </Button>
            <Button
              type="button"
              onClick={onClose}
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
