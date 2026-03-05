import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { X, Loader2 } from 'lucide-react'
import type { Department, DepartmentFormData } from '../types'

type Props = {
  isOpen: boolean
  onClose: () => void
  onSave: (data: DepartmentFormData) => void
  department?: Department | null
  language: 'vi' | 'en'
  isSaving?: boolean
}

export default function DepartmentFormModal({ isOpen, onClose, onSave, department, language, isSaving }: Props) {
  const [formData, setFormData] = useState<DepartmentFormData>({
    name: '',
  })

  useEffect(() => {
    if (department) {
      setFormData({
        name: department.name,
      })
    } else {
      setFormData({
        name: '',
      })
    }
  }, [department, isOpen])

  const t = {
    title: language === 'vi'
      ? (department ? 'Chỉnh Sửa Phòng Ban' : 'Thêm Phòng Ban Mới')
      : (department ? 'Edit Department' : 'Add New Department'),
    name: language === 'vi' ? 'Tên Phòng Ban' : 'Department Name',
    namePlaceholder: language === 'vi' ? 'VD: Phòng Kỹ Thuật' : 'e.g. Engineering',
    cancel: language === 'vi' ? 'Hủy' : 'Cancel',
    save: language === 'vi' ? 'Lưu' : 'Save',
    saving: language === 'vi' ? 'Đang lưu...' : 'Saving...',
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t.title}</h2>
          <Button variant="ghost" size="icon" onClick={onClose} disabled={isSaving}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {t.name} <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t.namePlaceholder}
                required
                disabled={isSaving}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
                {t.cancel}
              </Button>
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t.saving}
                  </>
                ) : (
                  t.save
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
