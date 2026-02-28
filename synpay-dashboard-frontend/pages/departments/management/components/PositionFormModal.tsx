import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { X } from 'lucide-react'
import type { Position, PositionLevel, DepartmentStatus, Department } from '../types'

type Props = {
  isOpen: boolean
  onClose: () => void
  onSave: (data: Partial<Position>) => void
  position?: Position | null
  departments: Department[]
  language: 'vi' | 'en'
}

export default function PositionFormModal({ isOpen, onClose, onSave, position, departments, language }: Props) {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    level: 'mid' as PositionLevel,
    departmentId: '',
    description: '',
    status: 'active' as DepartmentStatus,
  })

  useEffect(() => {
    if (position) {
      setFormData({
        name: position.name,
        code: position.code,
        level: position.level,
        departmentId: position.departmentId,
        description: position.description,
        status: position.status,
      })
    } else {
      setFormData({
        name: '',
        code: '',
        level: 'mid',
        departmentId: departments[0]?.id || '',
        description: '',
        status: 'active',
      })
    }
  }, [position, isOpen, departments])

  const t = {
    title: language === 'vi' ? (position ? 'Chỉnh Sửa Chức Vụ' : 'Thêm Chức Vụ Mới') : (position ? 'Edit Position' : 'Add New Position'),
    name: language === 'vi' ? 'Tên Chức Vụ' : 'Position Name',
    namePlaceholder: language === 'vi' ? 'VD: Senior Software Engineer' : 'e.g. Senior Software Engineer',
    code: language === 'vi' ? 'Mã Chức Vụ' : 'Position Code',
    codePlaceholder: language === 'vi' ? 'VD: DEV01' : 'e.g. DEV01',
    level: language === 'vi' ? 'Cấp Bậc' : 'Level',
    department: language === 'vi' ? 'Phòng Ban' : 'Department',
    description: language === 'vi' ? 'Mô Tả' : 'Description',
    descriptionPlaceholder: language === 'vi' ? 'Mô tả ngắn về chức vụ' : 'Brief description of the position',
    status: language === 'vi' ? 'Trạng Thái' : 'Status',
    active: language === 'vi' ? 'Hoạt động' : 'Active',
    inactive: language === 'vi' ? 'Không hoạt động' : 'Inactive',
    cancel: language === 'vi' ? 'Hủy' : 'Cancel',
    save: language === 'vi' ? 'Lưu' : 'Save',
    selectDepartment: language === 'vi' ? 'Chọn phòng ban' : 'Select department',
    junior: 'Junior',
    mid: 'Mid Level',
    senior: 'Senior',
    lead: 'Lead',
    manager: 'Manager',
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const selectedDept = departments.find(d => d.id === formData.departmentId)
    onSave({
      ...formData,
      departmentName: selectedDept?.name || '',
    })
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t.title}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
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
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  {t.code} <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder={t.codePlaceholder}
                  required
                  maxLength={10}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  {t.level} <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: e.target.value as PositionLevel })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 transition-colors"
                  required
                >
                  <option value="junior">{t.junior}</option>
                  <option value="mid">{t.mid}</option>
                  <option value="senior">{t.senior}</option>
                  <option value="lead">{t.lead}</option>
                  <option value="manager">{t.manager}</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {t.department} <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.departmentId}
                onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 transition-colors"
                required
              >
                <option value="">{t.selectDepartment}</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name} ({dept.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {t.description}
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={t.descriptionPlaceholder}
                rows={3}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-transparent transition-colors resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {t.status}
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as DepartmentStatus })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 transition-colors"
              >
                <option value="active">{t.active}</option>
                <option value="inactive">{t.inactive}</option>
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                {t.cancel}
              </Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600">
                {t.save}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
