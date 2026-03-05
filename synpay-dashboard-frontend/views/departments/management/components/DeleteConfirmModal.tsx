import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { X, AlertTriangle, Loader2 } from 'lucide-react'

type Props = {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  itemName: string
  language: 'vi' | 'en'
  isDeleting?: boolean
}

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  itemName,
  language,
  isDeleting,
}: Props) {
  const t = {
    cancel: language === 'vi' ? 'Hủy' : 'Cancel',
    delete: language === 'vi' ? 'Xóa' : 'Delete',
    deleting: language === 'vi' ? 'Đang xóa...' : 'Deleting...',
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            {title}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose} disabled={isDeleting}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <CardContent className="p-6">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
            {message}
          </p>
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-6">
            <p className="text-sm font-semibold text-red-700 dark:text-red-400 text-center">
              {itemName}
            </p>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={isDeleting}>
              {t.cancel}
            </Button>
            <Button
              type="button"
              onClick={onConfirm}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t.deleting}
                </>
              ) : (
                t.delete
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
