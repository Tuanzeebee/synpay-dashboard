'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X } from 'lucide-react'
import type { Language } from '@/lib/translations'
import type { User, Role } from '../types'
import { t } from '@/lib/translations'

type Props = {
  isOpen: boolean
  user: User | null
  roles: Role[]
  language: Language
  onClose: () => void
  onSave: (userData: Omit<User, 'id' | 'createdAt'>) => void
}

export default function UserModal({ isOpen, user, roles, language, onClose, onSave }: Props) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([])
  const [status, setStatus] = useState<'active' | 'inactive'>('active')

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName)
      setLastName(user.lastName)
      setEmail(user.email)
      setSelectedRoleIds(user.roleIds)
      setStatus(user.status)
    } else {
      setFirstName('')
      setLastName('')
      setEmail('')
      setSelectedRoleIds([])
      setStatus('active')
    }
  }, [user, isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      firstName,
      lastName,
      email,
      roleIds: selectedRoleIds,
      status,
      lastLogin: user?.lastLogin || new Date().toISOString().slice(0, 16).replace('T', ' '),
    })
  }

  const toggleRole = (roleId: string) => {
    setSelectedRoleIds((prev) =>
      prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId]
    )
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between sticky top-0 bg-white dark:bg-slate-800 z-10">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            {user ? t('rbac.modal.user.title.edit', language) : t('rbac.modal.user.title.add', language)}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                {t('rbac.modal.user.firstName', language)}
              </label>
              <Input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                {t('rbac.modal.user.lastName', language)}
              </label>
              <Input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              {t('rbac.modal.user.email', language)}
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              {t('rbac.modal.user.assignRoles', language)}
            </label>
            <div className="space-y-2 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg">
              {roles.map((role) => (
                <label
                  key={role.id}
                  className="flex items-center gap-3 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedRoleIds.includes(role.id)}
                    onChange={() => toggleRole(role.id)}
                    className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-2 focus:ring-blue-500"
                  />
                  <div>
                    <div className="text-sm font-medium text-slate-900 dark:text-white">{role.name[language]}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{role.description[language]}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              {t('rbac.modal.user.status', language)}
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="active">{t('rbac.users.status.active', language)}</option>
              <option value="inactive">{t('rbac.users.status.inactive', language)}</option>
            </select>
          </div>

          <div className="flex items-center gap-3 pt-4">
            <Button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              {t('rbac.modal.user.save', language)}
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
