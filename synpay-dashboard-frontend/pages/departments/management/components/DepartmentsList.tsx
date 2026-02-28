import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Building2, Plus, Search, Users, Briefcase, Edit2, Trash2, CheckCircle } from 'lucide-react'
import { useState } from 'react'
import type { Department } from '../types'

type Props = {
  departments: Department[]
  language: 'vi' | 'en'
  onAdd: () => void
  onEdit: (department: Department) => void
  onDelete: (department: Department) => void
}

export default function DepartmentsList({ departments, language, onAdd, onEdit, onDelete }: Props) {
  const [searchQuery, setSearchQuery] = useState('')

  const t = {
    title: language === 'vi' ? 'Phòng Ban' : 'Departments',
    addNew: language === 'vi' ? 'Thêm Mới' : 'Add New',
    search: language === 'vi' ? 'Tìm kiếm phòng ban...' : 'Search departments...',
    active: language === 'vi' ? 'Hoạt động' : 'Active',
    inactive: language === 'vi' ? 'Không hoạt động' : 'Inactive',
    synced: language === 'vi' ? 'Đã đồng bộ' : 'Synced',
    pending: language === 'vi' ? 'Chờ đồng bộ' : 'Pending',
    code: language === 'vi' ? 'Mã' : 'Code',
    employees: language === 'vi' ? 'nhân viên' : 'employees',
    positions: language === 'vi' ? 'chức vụ' : 'positions',
  }

  const filteredDepartments = departments.filter((dept) =>
    dept.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dept.code.toLowerCase().includes(searchQuery.toLowerCase())
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
        {filteredDepartments.map((dept) => (
          <div
            key={dept.id}
            className="p-4 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{dept.name}</h3>
                  <Badge
                    className={
                      dept.status === 'active'
                        ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }
                  >
                    {dept.status === 'active' ? t.active : t.inactive}
                  </Badge>
                  <Badge
                    className={
                      dept.syncStatus === 'synced'
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                        : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 animate-pulse'
                    }
                  >
                    <CheckCircle className="w-3 h-3 mr-1" />
                    {dept.syncStatus === 'synced' ? t.synced : t.pending}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                  {t.code}: {dept.code}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">{dept.description}</p>
                <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    <span>
                      {dept.employeeCount} {t.employees}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Briefcase className="w-3 h-3" />
                    <span>
                      {dept.positionCount} {t.positions}
                    </span>
                  </div>
                </div>
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
