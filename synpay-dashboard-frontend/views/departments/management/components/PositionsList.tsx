import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Briefcase, Plus, Search, Users, Edit2, Trash2, CheckCircle } from 'lucide-react'
import { useState } from 'react'
import type { Position } from '../types'

type Props = {
  positions: Position[]
  language: 'vi' | 'en'
  onAdd: () => void
  onEdit: (position: Position) => void
  onDelete: (position: Position) => void
}

export default function PositionsList({ positions, language, onAdd, onEdit, onDelete }: Props) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState('')

  const t = {
    title: language === 'vi' ? 'Chức Vụ' : 'Positions',
    addNew: language === 'vi' ? 'Thêm Mới' : 'Add New',
    search: language === 'vi' ? 'Tìm kiếm chức vụ...' : 'Search positions...',
    allDepartments: language === 'vi' ? 'Tất cả phòng ban' : 'All departments',
    active: language === 'vi' ? 'Hoạt động' : 'Active',
    inactive: language === 'vi' ? 'Không hoạt động' : 'Inactive',
    synced: language === 'vi' ? 'Đã đồng bộ' : 'Synced',
    pending: language === 'vi' ? 'Chờ đồng bộ' : 'Pending',
    code: language === 'vi' ? 'Mã' : 'Code',
    employees: language === 'vi' ? 'nhân viên' : 'employees',
    junior: 'Junior',
    mid: 'Mid Level',
    senior: 'Senior',
    lead: 'Lead',
    manager: 'Manager',
  }

  const levelLabels = {
    junior: t.junior,
    mid: t.mid,
    senior: t.senior,
    lead: t.lead,
    manager: t.manager,
  }

  const filteredPositions = positions.filter((pos) => {
    const matchesSearch =
      pos.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pos.code.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesDepartment = !selectedDepartment || pos.departmentId === selectedDepartment
    return matchesSearch && matchesDepartment
  })

  // Get unique departments for filter
  const departments = Array.from(
    new Set(positions.map((p) => JSON.stringify({ id: p.departmentId, name: p.departmentName })))
  ).map((str) => JSON.parse(str))

  return (
    <Card className="transition-colors duration-300">
      <div className="p-6 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
            <span>{t.title}</span>
          </h2>
          <Button onClick={onAdd} className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600">
            <Plus className="w-4 h-4 mr-2" />
            {t.addNew}
          </Button>
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <Input
              type="text"
              placeholder={t.search}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 transition-colors"
          >
            <option value="">{t.allDepartments}</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="divide-y divide-slate-200 dark:divide-slate-700 max-h-[600px] overflow-y-auto">
        {filteredPositions.map((pos) => (
          <div
            key={pos.id}
            className="p-4 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{pos.name}</h3>
                  <Badge
                    className={
                      pos.status === 'active'
                        ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }
                  >
                    {pos.status === 'active' ? t.active : t.inactive}
                  </Badge>
                  <Badge
                    className={
                      pos.syncStatus === 'synced'
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                        : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 animate-pulse'
                    }
                  >
                    <CheckCircle className="w-3 h-3 mr-1" />
                    {pos.syncStatus === 'synced' ? t.synced : t.pending}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                  {t.code}: {pos.code} • {levelLabels[pos.level]}
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mb-2">{pos.departmentName}</p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">{pos.description}</p>
                <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                  <Users className="w-3 h-3" />
                  <span>
                    {pos.employeeCount} {t.employees}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(pos)}
                  className="text-slate-400 dark:text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(pos)}
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
