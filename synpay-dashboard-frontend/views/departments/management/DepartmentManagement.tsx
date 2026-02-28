'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import StatsCards from './components/StatsCards'
import DepartmentsList from './components/DepartmentsList'
import PositionsList from './components/PositionsList'
import DepartmentFormModal from './components/DepartmentFormModal'
import PositionFormModal from './components/PositionFormModal'
import { useLanguage } from '@/components/providers/LanguageProvider'
import type { Department, Position, DepartmentStats } from './types'

export default function DepartmentManagement() {
  const { language, toggleLanguage, t: translate } = useLanguage()
  const [showDepartmentModal, setShowDepartmentModal] = useState(false)
  const [showPositionModal, setShowPositionModal] = useState(false)
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null)
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null)

  // Mock data - replace with actual API calls
  const [stats] = useState<DepartmentStats>({
    totalDepartments: 8,
    totalPositions: 24,
    totalEmployees: 156,
    syncPercentage: 100,
    lastSyncTime: '5 phút trước',
  })

  const [departments, setDepartments] = useState<Department[]>([
    {
      id: '1',
      name: 'Phòng Kỹ Thuật',
      code: 'ENG',
      description: 'Phát triển sản phẩm và công nghệ',
      status: 'active',
      syncStatus: 'synced',
      employeeCount: 32,
      positionCount: 6,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-29',
    },
    {
      id: '2',
      name: 'Phòng Kinh Doanh',
      code: 'SALES',
      description: 'Bán hàng và phát triển thị trường',
      status: 'active',
      syncStatus: 'synced',
      employeeCount: 28,
      positionCount: 5,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-29',
    },
    {
      id: '3',
      name: 'Phòng Marketing',
      code: 'MKT',
      description: 'Truyền thông và tiếp thị',
      status: 'active',
      syncStatus: 'synced',
      employeeCount: 18,
      positionCount: 4,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-29',
    },
    {
      id: '4',
      name: 'Phòng Nhân Sự',
      code: 'HR',
      description: 'Quản lý nguồn nhân lực',
      status: 'active',
      syncStatus: 'synced',
      employeeCount: 12,
      positionCount: 3,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-29',
    },
    {
      id: '5',
      name: 'Phòng Tài Chính',
      code: 'FIN',
      description: 'Kế toán và tài chính',
      status: 'active',
      syncStatus: 'synced',
      employeeCount: 15,
      positionCount: 3,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-29',
    },
    {
      id: '6',
      name: 'Phòng Vận Hành',
      code: 'OPS',
      description: 'Quản lý hoạt động và quy trình',
      status: 'active',
      syncStatus: 'synced',
      employeeCount: 20,
      positionCount: 4,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-29',
    },
    {
      id: '7',
      name: 'Phòng Chăm Sóc Khách Hàng',
      code: 'CS',
      description: 'Hỗ trợ và dịch vụ khách hàng',
      status: 'active',
      syncStatus: 'pending',
      employeeCount: 22,
      positionCount: 4,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-29',
    },
    {
      id: '8',
      name: 'Phòng Nghiên Cứu & Phát Triển',
      code: 'RD',
      description: 'Nghiên cứu và phát triển',
      status: 'active',
      syncStatus: 'synced',
      employeeCount: 9,
      positionCount: 2,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-29',
    },
  ])

  const [positions, setPositions] = useState<Position[]>([
    {
      id: '1',
      name: 'Senior Software Engineer',
      code: 'DEV01',
      level: 'senior',
      departmentId: '1',
      departmentName: 'Phòng Kỹ Thuật',
      description: 'Phát triển phần mềm cấp cao',
      status: 'active',
      syncStatus: 'synced',
      employeeCount: 8,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-29',
    },
    {
      id: '2',
      name: 'Junior Developer',
      code: 'DEV02',
      level: 'junior',
      departmentId: '1',
      departmentName: 'Phòng Kỹ Thuật',
      description: 'Phát triển phần mềm cơ bản',
      status: 'active',
      syncStatus: 'synced',
      employeeCount: 12,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-29',
    },
    {
      id: '3',
      name: 'Tech Lead',
      code: 'DEV03',
      level: 'lead',
      departmentId: '1',
      departmentName: 'Phòng Kỹ Thuật',
      description: 'Dẫn dắt nhóm kỹ thuật',
      status: 'active',
      syncStatus: 'synced',
      employeeCount: 3,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-29',
    },
    {
      id: '4',
      name: 'DevOps Engineer',
      code: 'DEV04',
      level: 'mid',
      departmentId: '1',
      departmentName: 'Phòng Kỹ Thuật',
      description: 'Quản lý hạ tầng và triển khai',
      status: 'active',
      syncStatus: 'synced',
      employeeCount: 5,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-29',
    },
    {
      id: '5',
      name: 'Sales Manager',
      code: 'SALES01',
      level: 'manager',
      departmentId: '2',
      departmentName: 'Phòng Kinh Doanh',
      description: 'Quản lý đội ngũ bán hàng',
      status: 'active',
      syncStatus: 'synced',
      employeeCount: 4,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-29',
    },
    {
      id: '6',
      name: 'Sales Executive',
      code: 'SALES02',
      level: 'mid',
      departmentId: '2',
      departmentName: 'Phòng Kinh Doanh',
      description: 'Nhân viên kinh doanh',
      status: 'active',
      syncStatus: 'synced',
      employeeCount: 18,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-29',
    },
    {
      id: '7',
      name: 'Marketing Manager',
      code: 'MKT01',
      level: 'manager',
      departmentId: '3',
      departmentName: 'Phòng Marketing',
      description: 'Quản lý marketing',
      status: 'active',
      syncStatus: 'synced',
      employeeCount: 3,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-29',
    },
    {
      id: '8',
      name: 'Content Writer',
      code: 'MKT02',
      level: 'mid',
      departmentId: '3',
      departmentName: 'Phòng Marketing',
      description: 'Viết nội dung',
      status: 'active',
      syncStatus: 'synced',
      employeeCount: 10,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-29',
    },
    {
      id: '9',
      name: 'HR Manager',
      code: 'HR01',
      level: 'manager',
      departmentId: '4',
      departmentName: 'Phòng Nhân Sự',
      description: 'Quản lý nhân sự',
      status: 'active',
      syncStatus: 'synced',
      employeeCount: 2,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-29',
    },
    {
      id: '10',
      name: 'Customer Support',
      code: 'CS02',
      level: 'mid',
      departmentId: '7',
      departmentName: 'Phòng Chăm Sóc Khách Hàng',
      description: 'Nhân viên hỗ trợ',
      status: 'active',
      syncStatus: 'pending',
      employeeCount: 16,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-29',
    },
  ])

  const handleRefresh = useCallback(() => {
    // Implement refresh logic
    console.log('Refresh data')
  }, [])

  const handleSync = useCallback(() => {
    // Implement sync logic
    console.log('Sync with external system')
  }, [])

  const handleAddDepartment = useCallback(() => {
    setSelectedDepartment(null)
    setShowDepartmentModal(true)
  }, [])

  const handleEditDepartment = useCallback((dept: Department) => {
    setSelectedDepartment(dept)
    setShowDepartmentModal(true)
  }, [])

  const handleDeleteDepartment = useCallback((dept: Department) => {
    if (confirm(language === 'vi' ? `Xóa phòng ban "${dept.name}"?` : `Delete department "${dept.name}"?`)) {
      setDepartments(prev => prev.filter((d) => d.id !== dept.id))
    }
  }, [language])

  const handleSaveDepartment = useCallback((data: Partial<Department>) => {
    if (selectedDepartment) {
      // Edit existing — functional updater avoids stale closure
      setDepartments(prev =>
        prev.map((d) =>
          d.id === selectedDepartment.id
            ? { ...d, ...data, updatedAt: new Date().toISOString(), syncStatus: 'pending' as const }
            : d
        )
      )
    } else {
      // Add new
      const newDept: Department = {
        id: String(Date.now()),
        name: data.name || '',
        code: data.code || '',
        description: data.description || '',
        status: data.status || 'active',
        syncStatus: 'pending',
        employeeCount: 0,
        positionCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      setDepartments(prev => [...prev, newDept])
    }
  }, [selectedDepartment])

  const handleAddPosition = useCallback(() => {
    setSelectedPosition(null)
    setShowPositionModal(true)
  }, [])

  const handleEditPosition = useCallback((pos: Position) => {
    setSelectedPosition(pos)
    setShowPositionModal(true)
  }, [])

  const handleDeletePosition = useCallback((pos: Position) => {
    if (confirm(language === 'vi' ? `Xóa chức vụ "${pos.name}"?` : `Delete position "${pos.name}"?`)) {
      setPositions(prev => prev.filter((p) => p.id !== pos.id))
    }
  }, [language])

  const handleSavePosition = useCallback((data: Partial<Position>) => {
    if (selectedPosition) {
      // Edit existing — functional updater avoids stale closure
      setPositions(prev =>
        prev.map((p) =>
          p.id === selectedPosition.id
            ? { ...p, ...data, updatedAt: new Date().toISOString(), syncStatus: 'pending' as const }
            : p
        )
      )
    } else {
      // Add new
      const newPos: Position = {
        id: String(Date.now()),
        name: data.name || '',
        code: data.code || '',
        level: data.level || 'mid',
        departmentId: data.departmentId || '',
        departmentName: data.departmentName || '',
        description: data.description || '',
        status: data.status || 'active',
        syncStatus: 'pending',
        employeeCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      setPositions(prev => [...prev, newPos])
    }
  }, [selectedPosition])

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900">{/* Sidebar */}
      {/* Sidebar */}
      <Sidebar language={language} t={translate} activeRoute="/departments" />

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <Header language={language} onLanguageToggle={toggleLanguage} t={translate} />

        {/* Title Section */}
        <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 md:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                {language === 'vi' ? 'Phòng Ban & Chức Vụ' : 'Departments & Positions'}
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {language === 'vi'
                  ? 'Cấu trúc tổ chức và vị trí công việc'
                  : 'Organization structure and job positions'}
              </p>
            </div>
            <Button
              onClick={handleSync}
              variant="outline"
              className="text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 border-blue-200 dark:border-blue-800"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">{language === 'vi' ? 'Đồng Bộ' : 'Sync'}</span>
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 md:p-8 overflow-y-auto">
          <StatsCards stats={stats} language={language} />

          {/* Split Panel Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DepartmentsList
              departments={departments}
              language={language}
              onAdd={handleAddDepartment}
              onEdit={handleEditDepartment}
              onDelete={handleDeleteDepartment}
            />

            <PositionsList
              positions={positions}
              language={language}
              onAdd={handleAddPosition}
              onEdit={handleEditPosition}
              onDelete={handleDeletePosition}
            />
          </div>
        </div>
      </main>

      {/* Modals */}
      <DepartmentFormModal
        isOpen={showDepartmentModal}
        onClose={() => setShowDepartmentModal(false)}
        onSave={handleSaveDepartment}
        department={selectedDepartment}
        language={language}
      />

      <PositionFormModal
        isOpen={showPositionModal}
        onClose={() => setShowPositionModal(false)}
        onSave={handleSavePosition}
        position={selectedPosition}
        departments={departments}
        language={language}
      />
    </div>
  )
}
