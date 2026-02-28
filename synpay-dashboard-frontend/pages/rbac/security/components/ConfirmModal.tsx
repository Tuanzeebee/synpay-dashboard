'use client'

import { Button } from '@/components/ui/button'
import { AlertTriangle, X } from 'lucide-react'
import type { Language } from '@/lib/translations'
import type { ConfirmModalData } from '../types'
import { t } from '@/lib/translations'

type Props = {
  isOpen: boolean
  data: ConfirmModalData | null
  language: Language
  onClose: () => void
}

export default function ConfirmModal({ isOpen, data, language, onClose }: Props) {
  if (!isOpen || !data) return null

  const handleConfirm = () => {
    data.callback()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{data.title}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">{data.message}</p>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={handleConfirm}
              className="flex-1 bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white"
            >
              {t('rbac.confirm.confirm', language)}
            </Button>
            <Button
              onClick={onClose}
              className="px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300"
            >
              {t('rbac.modal.cancel', language)}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
