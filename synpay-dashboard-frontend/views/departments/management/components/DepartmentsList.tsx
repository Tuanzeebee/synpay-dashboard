import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Building2, Plus, Search, Edit2, Trash2, Loader2 } from 'lucide-react'
import { useState } from 'react'
import type { Department } from '../types'

type Props = {
  departments: Department[]
  language: 'vi' | 'en'
  isLoading?: boolean
  onAdd: () => void
  onEdit: (department: Department) => void
  onDelete: (department: Department) => void
}

export default function DepartmentsList({ departments, language, isLoading, onAdd, onEdit, onDelete }: Props) {
  const [searchQuery, setSearchQuery] = useState('')

  const t = {
    title: language === 'vi' ? 'Phòng Ban' : 'Departments',
    addNew: language === 'vi' ? 'Thêm Mới' : 'Add New',
    search: language === 'vi' ? 'Tìm kiếm phòng ban...' : 'Search departments...',
    loading: language === 'vi' ? 'Đang tải...' : 'Loading...',
    empty: language === 'vi' ? 'Chưa có phòng ban nào' : 'No departments found',
    noResults: language === 'vi' ? 'Không tìm thấy kết quả' : 'No results found',
    createdAt: language === 'vi' ? 'Ngày tạo' : 'Created',
  }

  const filteredDepartments = departments.filter((dept) =>
    dept.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <Card className="transition-colors duration-300">
      <div className="p-6 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-500 dark:text-blue-400" />
            <span>{t.title}</span>
          </h2>
          <Button onClick={onAdd} className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600">
            <Plus className="w-4 h-4 mr-2" />
            {t.addNew}
          </Button>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <Input
            type="text"
            placeholder={t.search}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>
      <div className="divide-y divide-slate-200 dark:divide-slate-700 max-h-[600px] overflow-y-auto">
        {/* Loading state */}
        {isLoading && (
          <div className="p-8 flex items-center justify-center text-slate-400 dark:text-slate-500">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            <span className="text-sm">{t.loading}</span>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && departments.length === 0 && (
          <div className="p-8 text-center text-sm text-slate-400 dark:text-slate-500">
            {t.empty}
          </div>
        )}

        {/* No search results */}
        {!isLoading && departments.length > 0 && filteredDepartments.length === 0 && (
          <div className="p-8 text-center text-sm text-slate-400 dark:text-slate-500">
            {t.noResults}
          </div>
        )}

        {/* Department items */}
        {!isLoading && filteredDepartments.map((dept) => (
          <div
            key={dept.id}
            className="p-4 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">{dept.name}</h3>
                {dept.createdAt && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {t.createdAt}: {new Date(dept.createdAt).toLocaleDateString()}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(dept)}
                  className="text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(dept)}
                  className="text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
