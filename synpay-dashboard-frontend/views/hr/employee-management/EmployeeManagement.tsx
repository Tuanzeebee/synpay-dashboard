'use client'

import { useState, useMemo, useCallback, useEffect, memo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import { useDebounce } from '@/hooks'
import { useLanguage } from '@/components/providers/LanguageProvider'
import { useEmployees } from '@/hooks/useEmployees'
import type {
  ApiEmployeeResponse,
  CreateEmployeePayload,
  UpdateEmployeePayload,
} from '@/api/employees'
import {
  Search,
  X,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  UserPlus,
  RefreshCw,
  User,
  Briefcase,
  Clock,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Users,
  Loader2,
  AlertCircle,
} from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

type FormMode = 'create' | 'edit'

interface Filters {
  department: string
  status: string
}

interface FormData {
  fullName: string
  dateOfBirth: string
  gender: string
  phoneNumber: string
  email: string
  hireDate: string
  departmentId: string
  positionId: string
  status: string
}

const emptyForm: FormData = {
  fullName: '',
  dateOfBirth: '',
  gender: '',
  phoneNumber: '',
  email: '',
  hireDate: '',
  departmentId: '',
  positionId: '',
  status: '',
}

// ── Hard-coded department / position lists ────────────────────────
// In a full implementation these would be fetched from the API.
// The IDs here must match the Departments and Positions tables in SQL Server.

const DEPARTMENTS = [
  { id: 1, name: 'Engineering' },
  { id: 2, name: 'Sales' },
  { id: 3, name: 'Marketing' },
  { id: 4, name: 'HR' },
  { id: 5, name: 'Finance' },
  { id: 6, name: 'Support' },
] as const

const POSITIONS = [
  { id: 1, name: 'Senior Developer' },
  { id: 2, name: 'Sales Manager' },
  { id: 3, name: 'Marketing Specialist' },
  { id: 4, name: 'Tech Lead' },
  { id: 5, name: 'HR Manager' },
  { id: 6, name: 'Accountant' },
  { id: 7, name: 'Support Lead' },
  { id: 8, name: 'DevOps Engineer' },
  { id: 9, name: 'Content Writer' },
  { id: 10, name: 'Sales Director' },
  { id: 11, name: 'Recruiter' },
  { id: 12, name: 'Frontend Developer' },
  { id: 13, name: 'Financial Analyst' },
  { id: 14, name: 'Customer Support' },
  { id: 15, name: 'SEO Specialist' },
] as const

const PAGE_SIZE = 10

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return '—'
  return new Date(dateString).toLocaleDateString('vi-VN')
}

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase()
}

const calculateTenure = (hireDate: string | null | undefined): string => {
  if (!hireDate) return '—'
  const start = new Date(hireDate)
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
// SUB-COMPONENTS
// ============================================================================

const StatusBadge = memo(({ status }: { status: string }) => {
  switch (status) {
    case 'Active':
      return (
        <Badge className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5" />
          Đang làm việc
        </Badge>
      )
    case 'Inactive':
      return (
        <Badge className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700">
          <span className="w-1.5 h-1.5 bg-slate-400 rounded-full mr-1.5" />
          Nghỉ việc
        </Badge>
      )
    default:
      return (
        <Badge className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30">
          <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mr-1.5 animate-pulse" />
          {status || 'Chờ xử lý'}
        </Badge>
      )
  }
})
StatusBadge.displayName = 'StatusBadge'

// ── Detail Row Helper ────────────────────────────────────────────

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-700">
      <span className="text-sm text-slate-500 dark:text-slate-400">{label}</span>
      <span className="text-sm font-medium text-slate-900 dark:text-white">
        {value || '—'}
      </span>
    </div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function EmployeeManagement() {
  const { language, toggleLanguage, t } = useLanguage()

  // ── API Hook ───────────────────────────────────────────────
  const {
    employees,
    totalElements,
    totalPages,
    isLoading,
    error,
    isSaving,
    loadEmployees,
    refresh,
    getDetail,
    create,
    update,
    changeStatus,
    clearError,
  } = useEmployees({ page: 0, size: PAGE_SIZE })

  // ── Local UI state ─────────────────────────────────────────
  const [searchInput, setSearchInput] = useState('')
  const debouncedSearch = useDebounce(searchInput, 400)

  const [filters, setFilters] = useState<Filters>({ department: '', status: '' })
  const [page, setPage] = useState(0) // 0-indexed for API

  const [selectedEmployee, setSelectedEmployee] = useState<ApiEmployeeResponse | null>(null)
  const [detailEmployee, setDetailEmployee] = useState<ApiEmployeeResponse | null>(null)
  const [showProfileDrawer, setShowProfileDrawer] = useState(false)
  const [showFormModal, setShowFormModal] = useState(false)
  const [showDeactivateModal, setShowDeactivateModal] = useState(false)
  const [formMode, setFormMode] = useState<FormMode>('create')
  const [formData, setFormData] = useState<FormData>(emptyForm)
  const [formError, setFormError] = useState<string | null>(null)
  const [isLoadingDetail, setIsLoadingDetail] = useState(false)

  // ── Fetch on filter / search / page change ─────────────────
  useEffect(() => {
    const params: Record<string, any> = { page, size: PAGE_SIZE }
    if (debouncedSearch) params.keyword = debouncedSearch
    if (filters.department) params.departmentId = Number(filters.department)
    if (filters.status) params.status = filters.status
    loadEmployees(params)
  }, [debouncedSearch, filters.department, filters.status, page, loadEmployees])

  // Reset page when filters change
  useEffect(() => {
    setPage(0)
  }, [debouncedSearch, filters.department, filters.status])

  // ── Stats (derived from current page data + server total) ──
  const stats = useMemo(() => {
    const active = employees.filter((e) => e.status === 'Active').length
    const inactive = employees.filter((e) => e.status === 'Inactive').length
    const pending = employees.filter((e) => e.status !== 'Active' && e.status !== 'Inactive').length
    return { total: totalElements, active, inactive, pending }
  }, [employees, totalElements])

  // ── Handlers ───────────────────────────────────────────────

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value)
  }, [])

  const handleClearFilters = useCallback(() => {
    setSearchInput('')
    setFilters({ department: '', status: '' })
    setPage(0)
  }, [])

  const openCreateModal = useCallback(() => {
    setFormMode('create')
    setFormData(emptyForm)
    setFormError(null)
    setShowFormModal(true)
  }, [])

  const openEditModal = useCallback((emp: ApiEmployeeResponse) => {
    setFormMode('edit')
    setSelectedEmployee(emp)
    setFormData({
      fullName: emp.fullName || '',
      dateOfBirth: emp.dateOfBirth || '',
      gender: emp.gender || '',
      phoneNumber: emp.phoneNumber || '',
      email: emp.email || '',
      hireDate: emp.hireDate || '',
      departmentId: emp.departmentId ? String(emp.departmentId) : '',
      positionId: emp.positionId ? String(emp.positionId) : '',
      status: emp.status || '',
    })
    setFormError(null)
    setShowFormModal(true)
    setShowProfileDrawer(false)
  }, [])

  const openDeactivateModal = useCallback((emp: ApiEmployeeResponse) => {
    setSelectedEmployee(emp)
    setShowDeactivateModal(true)
    setShowProfileDrawer(false)
  }, [])

  const openProfileDrawer = useCallback(async (emp: ApiEmployeeResponse) => {
    setSelectedEmployee(emp)
    setDetailEmployee(emp) // show immediately with list data
    setShowProfileDrawer(true)
    // Fetch full detail (includes account info)
    setIsLoadingDetail(true)
    try {
      const detail = await getDetail(emp.employeeId)
      setDetailEmployee(detail)
    } catch {
      // Fallback: keep the list-level data already displayed
    } finally {
      setIsLoadingDetail(false)
    }
  }, [getDetail])

  // ── Form submit ────────────────────────────────────────────
  const handleFormSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    try {
      if (formMode === 'create') {
        const payload: CreateEmployeePayload = {
          fullName: formData.fullName,
          dateOfBirth: formData.dateOfBirth,
          hireDate: formData.hireDate,
          departmentId: Number(formData.departmentId),
          positionId: Number(formData.positionId),
        }
        if (formData.gender) payload.gender = formData.gender
        if (formData.phoneNumber) payload.phoneNumber = formData.phoneNumber
        if (formData.email) payload.email = formData.email
        if (formData.status) payload.status = formData.status

        await create(payload)
      } else if (selectedEmployee) {
        const payload: UpdateEmployeePayload = {}
        if (formData.fullName) payload.fullName = formData.fullName
        if (formData.dateOfBirth) payload.dateOfBirth = formData.dateOfBirth
        if (formData.gender) payload.gender = formData.gender
        if (formData.phoneNumber) payload.phoneNumber = formData.phoneNumber
        if (formData.email) payload.email = formData.email
        if (formData.hireDate) payload.hireDate = formData.hireDate
        if (formData.departmentId) payload.departmentId = Number(formData.departmentId)
        if (formData.positionId) payload.positionId = Number(formData.positionId)

        await update(selectedEmployee.employeeId, payload)

        // If status changed, call the separate changeStatus API
        if (formData.status && formData.status !== selectedEmployee.status) {
          await changeStatus(selectedEmployee.employeeId, formData.status)
        }
      }

      setShowFormModal(false)
      setFormData(emptyForm)
      setSelectedEmployee(null)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Đã có lỗi xảy ra'
      setFormError(msg)
    }
  }, [formMode, formData, selectedEmployee, create, update])

  // ── Deactivate (change status to Inactive) ─────────────────
  const handleDeactivate = useCallback(async () => {
    if (!selectedEmployee) return
    try {
      await changeStatus(selectedEmployee.employeeId, 'Inactive')
      setShowDeactivateModal(false)
      setSelectedEmployee(null)
    } catch {
      // error captured by hook state
    }
  }, [selectedEmployee, changeStatus])

  // ── Display page (1-indexed for UI) ────────────────────────
  const displayPage = page + 1

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Sidebar */}
      <Sidebar language={language} t={t} activeRoute="/employee" />

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <Header language={language} onLanguageToggle={toggleLanguage} t={t} />

        {/* Title Section */}
        <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 md:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                {language === 'vi' ? 'Quản Lý Nhân Viên' : 'Employee Management'}
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {language === 'vi'
                  ? 'Quản lý thông tin nhân viên và hồ sơ'
                  : 'Manage employee information and records'}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={refresh}
              disabled={isLoading}
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 md:p-8 overflow-y-auto">
          {/* Global error banner */}
          {error && (
            <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800 dark:text-red-300">{error}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={clearError} className="text-red-500">
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}

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
                <div className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                  {stats.total}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Trang {displayPage}/{totalPages || 1}
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
                <div className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                  {stats.active}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Trang hiện tại</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Nghỉ Việc
                  </span>
                  <UserPlus className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                </div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                  {stats.inactive}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Trang hiện tại</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Chờ Xử Lý
                  </span>
                  <RefreshCw className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                </div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                  {stats.pending}
                </div>
                <div className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                  Cần xử lý
                </div>
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
                      placeholder="Tìm kiếm theo tên, email..."
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
                    onChange={(e) => setFilters((f) => ({ ...f, department: e.target.value }))}
                    className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                  >
                    <option value="">Tất cả phòng ban</option>
                    {DEPARTMENTS.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>

                  <select
                    value={filters.status}
                    onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
                    className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                  >
                    <option value="">Tất cả trạng thái</option>
                    <option value="Active">Đang làm việc</option>
                    <option value="Inactive">Nghỉ việc</option>
                    <option value="Pending">Chờ xử lý</option>
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
                      Mã NV
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                      Họ và Tên
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                      Phòng Ban
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                      Chức Vụ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                      Ngày Vào
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
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                          <span className="text-sm text-slate-500 dark:text-slate-400">
                            Đang tải dữ liệu...
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : employees.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <Users className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                          <span className="text-sm text-slate-500 dark:text-slate-400">
                            Không tìm thấy nhân viên nào
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    employees.map((employee) => (
                      <tr
                        key={employee.employeeId}
                        onClick={() => openProfileDrawer(employee)}
                        className="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 cursor-pointer transition-colors"
                      >
                        <td className="px-6 py-4">
                          <span className="text-sm font-medium text-slate-900 dark:text-white">
                            #{employee.employeeId}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                              {getInitials(employee.fullName)}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-slate-900 dark:text-white">
                                {employee.fullName}
                              </div>
                              <div className="text-xs text-slate-500 dark:text-slate-400">
                                {employee.email || '—'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-slate-600 dark:text-slate-300">
                            {employee.departmentName || '—'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-slate-600 dark:text-slate-300">
                            {employee.positionName || '—'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-slate-600 dark:text-slate-300">
                            {formatDate(employee.hireDate)}
                          </span>
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
                            {employee.status === 'Active' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  openDeactivateModal(employee)
                                }}
                                className="text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 0 && (
              <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Hiển thị{' '}
                  <span className="font-medium text-slate-900 dark:text-white">
                    {page * PAGE_SIZE + 1}
                  </span>{' '}
                  đến{' '}
                  <span className="font-medium text-slate-900 dark:text-white">
                    {Math.min((page + 1) * PAGE_SIZE, totalElements)}
                  </span>{' '}
                  trong tổng số{' '}
                  <span className="font-medium text-slate-900 dark:text-white">
                    {totalElements}
                  </span>{' '}
                  nhân viên
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => i).map((p) => {
                    if (
                      p === 0 ||
                      p === totalPages - 1 ||
                      (p >= page - 1 && p <= page + 1)
                    ) {
                      return (
                        <Button
                          key={p}
                          variant={p === page ? 'default' : 'outline'}
                          onClick={() => setPage(p)}
                          className="min-w-[40px]"
                        >
                          {p + 1}
                        </Button>
                      )
                    } else if (p === page - 2 || p === page + 2) {
                      return (
                        <span
                          key={p}
                          className="px-2 text-slate-400 flex items-center"
                        >
                          ...
                        </span>
                      )
                    }
                    return null
                  })}
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </main>

      {/* ─── Profile Drawer ──────────────────────────────────── */}
      {showProfileDrawer && detailEmployee && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowProfileDrawer(false)}
          />
          <div className="ml-auto w-full md:w-[600px] bg-white dark:bg-slate-800 shadow-2xl overflow-y-auto animate-in slide-in-from-right">
            <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Hồ Sơ Nhân Viên
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowProfileDrawer(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="p-6 space-y-6">
              {/* Header */}
              <div className="flex items-start gap-4 pb-6 border-b border-slate-200 dark:border-slate-700">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">
                  {getInitials(detailEmployee.fullName)}
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                    {detailEmployee.fullName}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-2">
                    {detailEmployee.positionName || '—'}
                  </p>
                  <StatusBadge status={detailEmployee.status} />
                </div>
              </div>

              {/* Personal Info */}
              <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-500" />
                  <span>Thông Tin Cá Nhân</span>
                </h4>
                <div className="space-y-3">
                  <DetailRow label="Mã nhân viên" value={`#${detailEmployee.employeeId}`} />
                  <DetailRow label="Email" value={detailEmployee.email} />
                  <DetailRow label="Số điện thoại" value={detailEmployee.phoneNumber} />
                  <DetailRow label="Giới tính" value={detailEmployee.gender} />
                  <DetailRow label="Ngày sinh" value={formatDate(detailEmployee.dateOfBirth)} />
                </div>
              </div>

              {/* Work Info */}
              <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-emerald-500" />
                  <span>Thông Tin Công Việc</span>
                </h4>
                <div className="space-y-3">
                  <DetailRow label="Phòng ban" value={detailEmployee.departmentName} />
                  <DetailRow label="Chức vụ" value={detailEmployee.positionName} />
                  <DetailRow label="Ngày vào làm" value={formatDate(detailEmployee.hireDate)} />
                  <DetailRow label="Thâm niên" value={calculateTenure(detailEmployee.hireDate)} />
                </div>
              </div>

              {/* Account Info (detail-only, populated when fetched) */}
              {detailEmployee.accountId && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                    <User className="w-4 h-4 text-purple-500" />
                    <span>Tài Khoản Liên Kết</span>
                  </h4>
                  <div className="space-y-3">
                    <DetailRow label="Account ID" value={String(detailEmployee.accountId)} />
                    <DetailRow label="Email tài khoản" value={detailEmployee.accountEmail} />
                    <DetailRow label="Trạng thái TK" value={detailEmployee.accountStatus} />
                  </div>
                </div>
              )}

              {/* Audit Info */}
              <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-cyan-500" />
                  <span>Thông Tin Kiểm Toán</span>
                </h4>
                <div className="space-y-3">
                  <DetailRow label="Ngày tạo" value={formatDate(detailEmployee.createdAt)} />
                  <DetailRow label="Cập nhật lần cuối" value={formatDate(detailEmployee.updatedAt)} />
                </div>
              </div>

              {isLoadingDetail && (
                <div className="text-center py-2">
                  <Loader2 className="w-5 h-5 text-blue-500 animate-spin inline-block" />
                  <span className="text-xs text-slate-500 ml-2">Đang tải chi tiết...</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                <Button onClick={() => openEditModal(detailEmployee)} className="flex-1">
                  <Edit2 className="w-4 h-4 mr-2" />
                  Chỉnh Sửa
                </Button>
                {detailEmployee.status === 'Active' && (
                  <Button
                    variant="outline"
                    onClick={() => openDeactivateModal(detailEmployee)}
                    className="border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Vô hiệu hóa
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Form Modal ──────────────────────────────────────── */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowFormModal(false)}
          />
          <div className="relative bg-white dark:bg-slate-800 rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden animate-in zoom-in-95">
            <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {formMode === 'create' ? 'Thêm Nhân Viên Mới' : 'Chỉnh Sửa Nhân Viên'}
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowFormModal(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <form
              onSubmit={handleFormSubmit}
              className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-140px)]"
            >
              {/* Form error */}
              {formError && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-700 dark:text-red-300">{formError}</p>
                </div>
              )}

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
                      value={formData.fullName}
                      onChange={(e) =>
                        setFormData((f) => ({ ...f, fullName: e.target.value }))
                      }
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData((f) => ({ ...f, email: e.target.value }))
                      }
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Số Điện Thoại
                    </label>
                    <input
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={(e) =>
                        setFormData((f) => ({ ...f, phoneNumber: e.target.value }))
                      }
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Ngày Sinh <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.dateOfBirth}
                      onChange={(e) =>
                        setFormData((f) => ({ ...f, dateOfBirth: e.target.value }))
                      }
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Giới Tính
                    </label>
                    <select
                      value={formData.gender}
                      onChange={(e) =>
                        setFormData((f) => ({ ...f, gender: e.target.value }))
                      }
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                    >
                      <option value="">Chọn giới tính</option>
                      <option value="Nam">Nam</option>
                      <option value="Nữ">Nữ</option>
                      <option value="Khác">Khác</option>
                    </select>
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
                      value={formData.departmentId}
                      onChange={(e) =>
                        setFormData((f) => ({ ...f, departmentId: e.target.value }))
                      }
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                    >
                      <option value="">Chọn phòng ban</option>
                      {DEPARTMENTS.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Chức Vụ <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.positionId}
                      onChange={(e) =>
                        setFormData((f) => ({ ...f, positionId: e.target.value }))
                      }
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                    >
                      <option value="">Chọn chức vụ</option>
                      {POSITIONS.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Ngày Vào Làm <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.hireDate}
                      onChange={(e) =>
                        setFormData((f) => ({ ...f, hireDate: e.target.value }))
                      }
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Trạng Thái
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        setFormData((f) => ({ ...f, status: e.target.value }))
                      }
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                    >
                      <option value="">Chọn trạng thái</option>
                      <option value="Đang làm việc">Đang làm việc</option>
                      <option value="Nghỉ việc">Nghỉ việc</option>
                      <option value="Nghỉ phép">Nghỉ phép</option>
                      <option value="Thử việc">Thử việc</option>
                      <option value="Thực tập">Thực tập</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowFormModal(false)}
                  disabled={isSaving}
                >
                  Hủy
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {formMode === 'create' ? 'Thêm Nhân Viên' : 'Cập Nhật'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Deactivate Confirmation Modal ───────────────────── */}
      {showDeactivateModal && selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowDeactivateModal(false)}
          />
          <div className="relative bg-white dark:bg-slate-800 rounded-lg shadow-2xl w-full max-w-md animate-in zoom-in-95">
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    Xác Nhận Vô Hiệu Hóa
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                    Bạn có chắc chắn muốn vô hiệu hóa nhân viên &quot;
                    {selectedEmployee.fullName}&quot; (#{selectedEmployee.employeeId})?
                    Trạng thái sẽ chuyển sang &quot;Nghỉ việc&quot;.
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowDeactivateModal(false)}
                  disabled={isSaving}
                >
                  Hủy
                </Button>
                <Button variant="destructive" onClick={handleDeactivate} disabled={isSaving}>
                  {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Vô Hiệu Hóa
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
