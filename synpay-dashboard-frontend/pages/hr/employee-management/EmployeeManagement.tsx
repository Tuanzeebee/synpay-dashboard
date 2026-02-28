'use client'

import { useState, useMemo, useCallback, memo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import { translations, t as translateFn, type Language } from '@/lib/translations'
import { useDebounce } from '@/hooks'
import { useLanguage } from '@/components/providers/LanguageProvider'
import {
  Search,
  Filter,
  X,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  UserPlus,
  RefreshCw,
  User,
  Briefcase,
  DollarSign,
  Clock,
  Database,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Users,
} from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

type EmployeeStatus = 'Active' | 'Inactive' | 'Pending'
type SyncStatus = 'Synced' | 'Pending'
type SortDirection = 'asc' | 'desc'
type FormMode = 'create' | 'edit'

interface Employee {
  id: string
  fullName: string
  email: string
  phone: string
  dateOfBirth: string
  department: string
  position: string
  joinDate: string
  status: EmployeeStatus
  baseSalary: number
  allowance: number
  hasPayroll: boolean
  hasDividends: boolean
  lastUpdated: string
  syncStatus: SyncStatus
}

interface Filters {
  search: string
  department: string
  status: string
}

interface Pagination {
  page: number
  perPage: number
  total: number
}

// ============================================================================
// MOCK DATA
// ============================================================================

const mockEmployees: Employee[] = [
  { id: 'EMP001', fullName: 'Nguyễn Văn An', email: 'an.nguyen@company.com', phone: '0901234567', dateOfBirth: '1990-05-15', department: 'Engineering', position: 'Senior Developer', joinDate: '2020-01-15', status: 'Active', baseSalary: 45000000, allowance: 5000000, hasPayroll: true, hasDividends: true, lastUpdated: '2024-01-15 10:30:00', syncStatus: 'Synced' },
  { id: 'EMP002', fullName: 'Trần Thị Bình', email: 'binh.tran@company.com', phone: '0901234568', dateOfBirth: '1992-08-20', department: 'Sales', position: 'Sales Manager', joinDate: '2019-03-10', status: 'Active', baseSalary: 40000000, allowance: 8000000, hasPayroll: true, hasDividends: true, lastUpdated: '2024-01-14 15:20:00', syncStatus: 'Synced' },
  { id: 'EMP003', fullName: 'Lê Minh Châu', email: 'chau.le@company.com', phone: '0901234569', dateOfBirth: '1995-03-12', department: 'Marketing', position: 'Marketing Specialist', joinDate: '2021-06-01', status: 'Active', baseSalary: 30000000, allowance: 3000000, hasPayroll: true, hasDividends: false, lastUpdated: '2024-01-15 09:15:00', syncStatus: 'Synced' },
  { id: 'EMP004', fullName: 'Phạm Hoàng Dũng', email: 'dung.pham@company.com', phone: '0901234570', dateOfBirth: '1988-11-25', department: 'Engineering', position: 'Tech Lead', joinDate: '2018-09-20', status: 'Active', baseSalary: 55000000, allowance: 7000000, hasPayroll: true, hasDividends: true, lastUpdated: '2024-01-15 11:45:00', syncStatus: 'Synced' },
  { id: 'EMP005', fullName: 'Võ Thị Hương', email: 'huong.vo@company.com', phone: '0901234571', dateOfBirth: '1993-07-08', department: 'HR', position: 'HR Manager', joinDate: '2020-02-15', status: 'Active', baseSalary: 38000000, allowance: 4000000, hasPayroll: true, hasDividends: true, lastUpdated: '2024-01-14 16:30:00', syncStatus: 'Synced' },
  { id: 'EMP006', fullName: 'Đỗ Văn Khoa', email: 'khoa.do@company.com', phone: '0901234572', dateOfBirth: '1991-04-18', department: 'Finance', position: 'Accountant', joinDate: '2019-11-01', status: 'Active', baseSalary: 35000000, allowance: 3500000, hasPayroll: true, hasDividends: false, lastUpdated: '2024-01-15 08:20:00', syncStatus: 'Synced' },
  { id: 'EMP007', fullName: 'Bùi Thị Lan', email: 'lan.bui@company.com', phone: '0901234573', dateOfBirth: '1994-09-30', department: 'Support', position: 'Support Lead', joinDate: '2021-01-10', status: 'Active', baseSalary: 32000000, allowance: 3000000, hasPayroll: true, hasDividends: false, lastUpdated: '2024-01-15 10:00:00', syncStatus: 'Synced' },
  { id: 'EMP008', fullName: 'Hoàng Văn Minh', email: 'minh.hoang@company.com', phone: '0901234574', dateOfBirth: '1989-12-05', department: 'Engineering', position: 'DevOps Engineer', joinDate: '2019-07-15', status: 'Active', baseSalary: 48000000, allowance: 6000000, hasPayroll: true, hasDividends: true, lastUpdated: '2024-01-14 14:10:00', syncStatus: 'Synced' },
  { id: 'EMP009', fullName: 'Ngô Thị Nga', email: 'nga.ngo@company.com', phone: '0901234575', dateOfBirth: '1996-02-14', department: 'Marketing', position: 'Content Writer', joinDate: '2022-03-01', status: 'Pending', baseSalary: 25000000, allowance: 2000000, hasPayroll: false, hasDividends: false, lastUpdated: '2024-01-15 12:00:00', syncStatus: 'Pending' },
  { id: 'EMP010', fullName: 'Trương Văn Phúc', email: 'phuc.truong@company.com', phone: '0901234576', dateOfBirth: '1987-06-22', department: 'Sales', position: 'Sales Director', joinDate: '2017-05-01', status: 'Active', baseSalary: 60000000, allowance: 10000000, hasPayroll: true, hasDividends: true, lastUpdated: '2024-01-15 09:30:00', syncStatus: 'Synced' },
  { id: 'EMP011', fullName: 'Lý Thị Quỳnh', email: 'quynh.ly@company.com', phone: '0901234577', dateOfBirth: '1992-10-11', department: 'HR', position: 'Recruiter', joinDate: '2020-08-15', status: 'Active', baseSalary: 28000000, allowance: 2500000, hasPayroll: true, hasDividends: false, lastUpdated: '2024-01-14 13:45:00', syncStatus: 'Synced' },
  { id: 'EMP012', fullName: 'Đinh Văn Sơn', email: 'son.dinh@company.com', phone: '0901234578', dateOfBirth: '1990-01-28', department: 'Engineering', position: 'Frontend Developer', joinDate: '2021-04-01', status: 'Active', baseSalary: 42000000, allowance: 4500000, hasPayroll: true, hasDividends: false, lastUpdated: '2024-01-15 11:20:00', syncStatus: 'Synced' },
  { id: 'EMP013', fullName: 'Phan Thị Tâm', email: 'tam.phan@company.com', phone: '0901234579', dateOfBirth: '1995-05-17', department: 'Finance', position: 'Financial Analyst', joinDate: '2021-09-01', status: 'Active', baseSalary: 36000000, allowance: 3500000, hasPayroll: true, hasDividends: false, lastUpdated: '2024-01-15 10:45:00', syncStatus: 'Synced' },
  { id: 'EMP014', fullName: 'Vũ Văn Thắng', email: 'thang.vu@company.com', phone: '0901234580', dateOfBirth: '1988-08-09', department: 'Support', position: 'Customer Support', joinDate: '2020-05-20', status: 'Inactive', baseSalary: 26000000, allowance: 2000000, hasPayroll: true, hasDividends: false, lastUpdated: '2023-12-31 17:00:00', syncStatus: 'Synced' },
  { id: 'EMP015', fullName: 'Mai Thị Uyên', email: 'uyen.mai@company.com', phone: '0901234581', dateOfBirth: '1993-11-03', department: 'Marketing', position: 'SEO Specialist', joinDate: '2021-11-15', status: 'Active', baseSalary: 31000000, allowance: 3000000, hasPayroll: true, hasDividends: false, lastUpdated: '2024-01-15 08:50:00', syncStatus: 'Synced' },
]

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('vi-VN')
}

const currencyFormatter = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
const formatCurrency = (amount: number): string => currencyFormatter.format(amount)

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase()
}

const calculateTenure = (joinDate: string): string => {
  const start = new Date(joinDate)
  const now = new Date()
  const years = now.getFullYear() - start.getFullYear()
  const months = now.getMonth() - start.getMonth()

  const totalMonths = years * 12 + months
  const displayYears = Math.floor(totalMonths / 12)
  const displayMonths = totalMonths % 12

  if (displayYears > 0) {
    return `${displayYears} năm ${displayMonths} tháng`
  }
  return `${displayMonths} tháng`
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

// Memoized stat card
const StatCard = memo(({ icon: Icon, label, value, subtitle, iconBg, iconColor }: {
  icon: any
  label: string
  value: string | number
  subtitle?: string
  iconBg: string
  iconColor: string
}) => (
  <Card className="hover:shadow-md transition-shadow">
    <CardContent className="p-5">
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 ${iconBg} rounded-lg flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
            {label}
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">{value}</div>
          {subtitle && (
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{subtitle}</div>
          )}
        </div>
      </div>
    </CardContent>
  </Card>
))
StatCard.displayName = 'StatCard'

// StatusBadge moved OUTSIDE component to avoid re-creating component identity on every render
const StatusBadge = memo(({ status }: { status: EmployeeStatus }) => {
  const variants = {
    Active: (
      <Badge className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30">
        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5" />
        Đang làm việc
      </Badge>
    ),
    Inactive: (
      <Badge className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700">
        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full mr-1.5" />
        Nghỉ việc
      </Badge>
    ),
    Pending: (
      <Badge className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30">
        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mr-1.5 animate-pulse" />
        Chờ đồng bộ
      </Badge>
    ),
  }
  return variants[status]
})
StatusBadge.displayName = 'StatusBadge'

export default function EmployeeManagement() {
  const { language, toggleLanguage, t } = useLanguage()

  // State
  const [employees, setEmployees] = useState<Employee[]>(mockEmployees)
  const [searchInput, setSearchInput] = useState('')
  const debouncedSearch = useDebounce(searchInput, 300) // Debounce search for 300ms
  
  const [filters, setFilters] = useState<Filters>({
    search: '',
    department: '',
    status: '',
  })
  const [sorting, setSorting] = useState<{ column: string; direction: SortDirection }>({
    column: 'id',
    direction: 'asc',
  })
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    perPage: 10,
    total: mockEmployees.length,
  })
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [showProfileDrawer, setShowProfileDrawer] = useState(false)
  const [showFormModal, setShowFormModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [formMode, setFormMode] = useState<FormMode>('create')
  const [formData, setFormData] = useState<Partial<Employee>>({})

  // Filter and sort employees - use debouncedSearch directly instead of syncing via useEffect
  const filteredEmployees = useMemo(() => {
    let result = [...employees]

    // Apply search filter using debouncedSearch directly
    if (debouncedSearch) {
      const searchLower = debouncedSearch.toLowerCase()
      result = result.filter(
        (emp) =>
          emp.id.toLowerCase().includes(searchLower) ||
          emp.fullName.toLowerCase().includes(searchLower) ||
          emp.email.toLowerCase().includes(searchLower) ||
          emp.department.toLowerCase().includes(searchLower) ||
          emp.position.toLowerCase().includes(searchLower)
      )
    }

    // Apply department filter
    if (filters.department) {
      result = result.filter((emp) => emp.department === filters.department)
    }

    // Apply status filter
    if (filters.status) {
      result = result.filter((emp) => emp.status === filters.status)
    }

    // Apply sorting
    result.sort((a, b) => {
      const aVal = a[sorting.column as keyof Employee]
      const bVal = b[sorting.column as keyof Employee]

      if (sorting.column === 'joinDate') {
        const aDate = new Date(aVal as string)
        const bDate = new Date(bVal as string)
        return sorting.direction === 'asc' ? aDate.getTime() - bDate.getTime() : bDate.getTime() - aDate.getTime()
      }

      if (aVal < bVal) return sorting.direction === 'asc' ? -1 : 1
      if (aVal > bVal) return sorting.direction === 'asc' ? 1 : -1
      return 0
    })

    return result
  }, [employees, debouncedSearch, filters.department, filters.status, sorting])

  // Derive total from filteredEmployees instead of syncing via useEffect
  const paginationTotal = filteredEmployees.length
  const totalPages = Math.ceil(paginationTotal / pagination.perPage)
  // Reset page if out of bounds
  const currentPage = pagination.page > totalPages ? 1 : pagination.page

  // Paginated data
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pagination.perPage
    const end = start + pagination.perPage
    return filteredEmployees.slice(start, end)
  }, [filteredEmployees, currentPage, pagination.perPage])

  // Stats calculations - memoized
  const stats = useMemo(() => {
    const total = employees.length
    const active = employees.filter((e) => e.status === 'Active').length
    const newThisMonth = employees.filter((e) => {
      const joinDate = new Date(e.joinDate)
      const now = new Date()
      return joinDate.getMonth() === now.getMonth() && joinDate.getFullYear() === now.getFullYear()
    }).length
    const pendingSync = employees.filter((e) => e.syncStatus === 'Pending').length

    return { total, active, newThisMonth, pendingSync }
  }, [employees])

  // Handlers - use useCallback for stability (MUST be before any conditional returns)
  const handleSort = useCallback((column: string) => {
    setSorting((prev) => ({
      column,
      direction: prev.column === column && prev.direction === 'asc' ? 'desc' : 'asc',
    }))
  }, [])

  const handleClearFilters = useCallback(() => {
    setSearchInput('')
    setFilters({ search: '', department: '', status: '' })
    setPagination(prev => ({ ...prev, page: 1 }))
  }, [])

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value)
  }, [])

  const openCreateModal = useCallback(() => {
    setFormMode('create')
    setFormData({})
    setShowFormModal(true)
  }, [])

  const openEditModal = useCallback((employee: Employee) => {
    setFormMode('edit')
    setSelectedEmployee(employee)
    setFormData(employee)
    setShowFormModal(true)
    setShowProfileDrawer(false)
  }, [])

  const openDeleteModal = useCallback((employee: Employee) => {
    setSelectedEmployee(employee)
    setShowDeleteModal(true)
    setShowProfileDrawer(false)
  }, [])

  const openProfileDrawer = useCallback((employee: Employee) => {
    setSelectedEmployee(employee)
    setShowProfileDrawer(true)
  }, [])

  // Memoized form submit handler — uses functional updaters to avoid stale closures
  const handleFormSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()

    if (formMode === 'create') {
      const newEmployee: Employee = {
        id: `EMP${String(Date.now()).slice(-3).padStart(3, '0')}`,
        fullName: formData.fullName || '',
        email: formData.email || '',
        phone: formData.phone || '',
        dateOfBirth: formData.dateOfBirth || '',
        department: formData.department || '',
        position: formData.position || '',
        joinDate: formData.joinDate || '',
        status: (formData.status as EmployeeStatus) || 'Pending',
        baseSalary: formData.baseSalary || 0,
        allowance: formData.allowance || 0,
        hasPayroll: false,
        hasDividends: false,
        lastUpdated: new Date().toLocaleString('sv-SE'),
        syncStatus: 'Pending',
      }
      setEmployees(prev => [...prev, newEmployee])
    } else if (selectedEmployee) {
      setEmployees(prev =>
        prev.map((emp) =>
          emp.id === selectedEmployee.id
            ? {
                ...emp,
                ...formData,
                lastUpdated: new Date().toLocaleString('sv-SE'),
                syncStatus: 'Pending',
              }
            : emp
        )
      )
    }

    setShowFormModal(false)
    setFormData({})
    setSelectedEmployee(null)
  }, [formMode, formData, selectedEmployee])

  const handleDelete = useCallback(() => {
    if (selectedEmployee) {
      setEmployees(prev => prev.filter((emp) => emp.id !== selectedEmployee.id))
      setShowDeleteModal(false)
      setSelectedEmployee(null)
    }
  }, [selectedEmployee])

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Sidebar */}
      <Sidebar language={language} t={t} activeRoute="/employee" />

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <Header 
          language={language} 
          onLanguageToggle={toggleLanguage}
          t={t}
        />

        {/* Title Section */}
        <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 md:px-8 py-6">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
            {language === 'vi' ? 'Quản Lý Nhân Viên' : 'Employee Management'}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {language === 'vi' ? 'Quản lý thông tin nhân viên và hồ sơ' : 'Manage employee information and records'}
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 md:p-8 overflow-y-auto">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Tổng Nhân Viên
                  </span>
                  <Users className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                </div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{stats.total}</div>
                <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  +{stats.newThisMonth} tháng này
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Đang Làm Việc
                  </span>
                  <CheckCircle className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                </div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{stats.active}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {((stats.active / stats.total) * 100).toFixed(1)}% tổng số
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Mới Tuyển
                  </span>
                  <UserPlus className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
                </div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{stats.newThisMonth}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Tháng này</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Chờ Đồng Bộ
                  </span>
                  <RefreshCw className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                </div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{stats.pendingSync}</div>
                <div className="text-xs text-amber-600 dark:text-amber-400 font-medium">Cần xử lý</div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filters */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Search */}
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
                    <input
                      type="text"
                      placeholder="Tìm kiếm theo tên, email, mã nhân viên..."
                      value={searchInput}
                      onChange={handleSearchChange}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                    />
                  </div>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-3">
                  <select
                    value={filters.department}
                    onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                    className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                  >
                    <option value="">Tất cả phòng ban</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Sales">Sales</option>
                    <option value="Marketing">Marketing</option>
                    <option value="HR">HR</option>
                    <option value="Finance">Finance</option>
                    <option value="Support">Support</option>
                  </select>

                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                  >
                    <option value="">Tất cả trạng thái</option>
                    <option value="Active">Đang làm việc</option>
                    <option value="Inactive">Nghỉ việc</option>
                    <option value="Pending">Chờ đồng bộ</option>
                  </select>

                  <Button variant="outline" onClick={handleClearFilters}>
                    <X className="w-4 h-4 mr-2" />
                    Xóa lọc
                  </Button>

                  <Button onClick={openCreateModal}>
                    <Plus className="w-4 h-4 mr-2" />
                    Thêm nhân viên
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Employee Table */}
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                      <button onClick={() => handleSort('id')} className="flex items-center gap-2 hover:text-slate-900 dark:hover:text-white">
                        Mã NV
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                      <button onClick={() => handleSort('fullName')} className="flex items-center gap-2 hover:text-slate-900 dark:hover:text-white">
                        Họ và Tên
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                      <button onClick={() => handleSort('department')} className="flex items-center gap-2 hover:text-slate-900 dark:hover:text-white">
                        Phòng Ban
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                      Chức Vụ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                      <button onClick={() => handleSort('joinDate')} className="flex items-center gap-2 hover:text-slate-900 dark:hover:text-white">
                        Ngày Vào
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                      Trạng Thái
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                      Thao Tác
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {paginatedData.map((employee) => (
                    <tr
                      key={employee.id}
                      onClick={() => openProfileDrawer(employee)}
                      className="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-slate-900 dark:text-white">{employee.id}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                            {getInitials(employee.fullName)}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-slate-900 dark:text-white">{employee.fullName}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">{employee.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-600 dark:text-slate-300">{employee.department}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-600 dark:text-slate-300">{employee.position}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-600 dark:text-slate-300">{formatDate(employee.joinDate)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={employee.status} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation()
                              openEditModal(employee)
                            }}
                            className="text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation()
                              openDeleteModal(employee)
                            }}
                            className="text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div className="text-sm text-slate-600 dark:text-slate-400">
                Hiển thị <span className="font-medium text-slate-900 dark:text-white">{(currentPage - 1) * pagination.perPage + 1}</span> đến{' '}
                <span className="font-medium text-slate-900 dark:text-white">{Math.min(currentPage * pagination.perPage, paginationTotal)}</span> trong tổng số{' '}
                <span className="font-medium text-slate-900 dark:text-white">{paginationTotal}</span> nhân viên
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                  if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                    return (
                      <Button
                        key={page}
                        variant={page === currentPage ? 'default' : 'outline'}
                        onClick={() => setPagination(prev => ({ ...prev, page }))}
                        className="min-w-[40px]"
                      >
                        {page}
                      </Button>
                    )
                  } else if (page === currentPage - 2 || page === currentPage + 2) {
                    return (
                      <span key={page} className="px-2 text-slate-400 flex items-center">
                        ...
                      </span>
                    )
                  }
                  return null
                })}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </main>

      {/* Profile Drawer */}
      {showProfileDrawer && selectedEmployee && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowProfileDrawer(false)} />
          <div className="ml-auto w-full md:w-[600px] bg-white dark:bg-slate-800 shadow-2xl overflow-y-auto animate-in slide-in-from-right">
            <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Hồ Sơ Nhân Viên</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowProfileDrawer(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex items-start gap-4 pb-6 border-b border-slate-200 dark:border-slate-700">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">
                  {getInitials(selectedEmployee.fullName)}
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{selectedEmployee.fullName}</h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-2">{selectedEmployee.position}</p>
                  <StatusBadge status={selectedEmployee.status} />
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-500" />
                  <span>Thông Tin Cá Nhân</span>
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-700">
                    <span className="text-sm text-slate-500 dark:text-slate-400">Mã nhân viên</span>
                    <span className="text-sm font-medium text-slate-900 dark:text-white">{selectedEmployee.id}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-700">
                    <span className="text-sm text-slate-500 dark:text-slate-400">Email</span>
                    <span className="text-sm font-medium text-slate-900 dark:text-white">{selectedEmployee.email}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-700">
                    <span className="text-sm text-slate-500 dark:text-slate-400">Số điện thoại</span>
                    <span className="text-sm font-medium text-slate-900 dark:text-white">{selectedEmployee.phone}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-700">
                    <span className="text-sm text-slate-500 dark:text-slate-400">Ngày sinh</span>
                    <span className="text-sm font-medium text-slate-900 dark:text-white">{formatDate(selectedEmployee.dateOfBirth)}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-emerald-500" />
                  <span>Thông Tin Công Việc</span>
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-700">
                    <span className="text-sm text-slate-500 dark:text-slate-400">Phòng ban</span>
                    <span className="text-sm font-medium text-slate-900 dark:text-white">{selectedEmployee.department}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-700">
                    <span className="text-sm text-slate-500 dark:text-slate-400">Chức vụ</span>
                    <span className="text-sm font-medium text-slate-900 dark:text-white">{selectedEmployee.position}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-700">
                    <span className="text-sm text-slate-500 dark:text-slate-400">Ngày vào làm</span>
                    <span className="text-sm font-medium text-slate-900 dark:text-white">{formatDate(selectedEmployee.joinDate)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-700">
                    <span className="text-sm text-slate-500 dark:text-slate-400">Thâm niên</span>
                    <span className="text-sm font-medium text-slate-900 dark:text-white">{calculateTenure(selectedEmployee.joinDate)}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-amber-500" />
                  <span>Thông Tin Lương</span>
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-700">
                    <span className="text-sm text-slate-500 dark:text-slate-400">Lương cơ bản</span>
                    <span className="text-sm font-medium text-slate-900 dark:text-white">{formatCurrency(selectedEmployee.baseSalary)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-700">
                    <span className="text-sm text-slate-500 dark:text-slate-400">Phụ cấp</span>
                    <span className="text-sm font-medium text-slate-900 dark:text-white">{formatCurrency(selectedEmployee.allowance)}</span>
                  </div>
                  <div className="flex justify-between py-2 bg-slate-50 dark:bg-slate-900 rounded-lg px-3">
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Tổng thu nhập</span>
                    <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                      {formatCurrency(selectedEmployee.baseSalary + selectedEmployee.allowance)}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Database className="w-4 h-4 text-purple-500" />
                  <span>Dữ Liệu Liên Quan</span>
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 px-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle className={`w-4 h-4 ${selectedEmployee.hasPayroll ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-600'}`} />
                      <span className="text-sm text-slate-700 dark:text-slate-300">Bảng lương</span>
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {selectedEmployee.hasPayroll ? 'Có dữ liệu' : 'Chưa có'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 px-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle className={`w-4 h-4 ${selectedEmployee.hasDividends ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-600'}`} />
                      <span className="text-sm text-slate-700 dark:text-slate-300">Chia cổ tức</span>
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {selectedEmployee.hasDividends ? 'Có dữ liệu' : 'Chưa có'}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-cyan-500" />
                  <span>Thông Tin Kiểm Toán</span>
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-700">
                    <span className="text-sm text-slate-500 dark:text-slate-400">Cập nhật lần cuối</span>
                    <span className="text-sm font-medium text-slate-900 dark:text-white">{selectedEmployee.lastUpdated}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-700">
                    <span className="text-sm text-slate-500 dark:text-slate-400">Trạng thái đồng bộ</span>
                    <Badge variant={selectedEmployee.syncStatus === 'Synced' ? 'default' : 'secondary'}>
                      {selectedEmployee.syncStatus === 'Synced' ? 'Đã đồng bộ' : 'Chờ đồng bộ'}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                <Button onClick={() => openEditModal(selectedEmployee)} className="flex-1">
                  <Edit2 className="w-4 h-4 mr-2" />
                  Chỉnh Sửa
                </Button>
                <Button variant="outline" onClick={() => openDeleteModal(selectedEmployee)} className="border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Xóa
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowFormModal(false)} />
          <div className="relative bg-white dark:bg-slate-800 rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden animate-in zoom-in-95">
            <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {formMode === 'create' ? 'Thêm Nhân Viên Mới' : 'Chỉnh Sửa Nhân Viên'}
              </h2>
              <Button variant="ghost" size="icon" onClick={() => setShowFormModal(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              {/* Personal Information */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-500" />
                  <span>Thông Tin Cá Nhân</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Họ và Tên <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.fullName || ''}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email || ''}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Số Điện Thoại <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.phone || ''}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Ngày Sinh</label>
                    <input
                      type="date"
                      value={formData.dateOfBirth || ''}
                      onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                    />
                  </div>
                </div>
              </div>

              {/* Employment Information */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-emerald-500" />
                  <span>Thông Tin Công Việc</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Phòng Ban <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.department || ''}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                    >
                      <option value="">Chọn phòng ban</option>
                      <option value="Engineering">Engineering</option>
                      <option value="Sales">Sales</option>
                      <option value="Marketing">Marketing</option>
                      <option value="HR">HR</option>
                      <option value="Finance">Finance</option>
                      <option value="Support">Support</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Chức Vụ <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.position || ''}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Ngày Vào Làm <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.joinDate || ''}
                      onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Trạng Thái <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.status || ''}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as EmployeeStatus })}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                    >
                      <option value="">Chọn trạng thái</option>
                      <option value="Active">Đang làm việc</option>
                      <option value="Inactive">Nghỉ việc</option>
                      <option value="Pending">Chờ đồng bộ</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Compensation */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-amber-500" />
                  <span>Thông Tin Lương</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Lương Cơ Bản (VNĐ) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      value={formData.baseSalary || ''}
                      onChange={(e) => setFormData({ ...formData, baseSalary: parseInt(e.target.value) })}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Phụ Cấp (VNĐ)</label>
                    <input
                      type="number"
                      value={formData.allowance || 0}
                      onChange={(e) => setFormData({ ...formData, allowance: parseInt(e.target.value) })}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                    />
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                <Button type="button" variant="outline" onClick={() => setShowFormModal(false)}>
                  Hủy
                </Button>
                <Button type="submit">{formMode === 'create' ? 'Thêm Nhân Viên' : 'Cập Nhật'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)} />
          <div className="relative bg-white dark:bg-slate-800 rounded-lg shadow-2xl w-full max-w-md animate-in zoom-in-95">
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Xác Nhận Xóa Nhân Viên</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                    Bạn có chắc chắn muốn xóa nhân viên &quot;{selectedEmployee.fullName}&quot; ({selectedEmployee.id})? Hành động này không thể hoàn tác.
                  </p>
                  {(selectedEmployee.hasPayroll || selectedEmployee.hasDividends) && (
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mb-4">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-amber-700 dark:text-amber-300">
                          Nhân viên này có dữ liệu liên quan trong hệ thống. Việc xóa có thể ảnh hưởng đến dữ liệu bảng lương hoặc chia cổ tức.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
                  Hủy
                </Button>
                <Button variant="destructive" onClick={handleDelete}>
                  Xóa Nhân Viên
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
