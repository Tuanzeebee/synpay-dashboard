"use client"

import { useState, useMemo, useCallback, memo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Sidebar, Header } from "@/components/layout"
import { useLanguage } from "@/components/providers/LanguageProvider"
import { useAttendance, type AttendanceItem, type AttendanceDetail } from "@/hooks/useAttendance"
import type { AttendanceListParams, AdjustAttendancePayload } from "@/api/attendance"
import {
  Users,
  CalendarCheck,
  CalendarDays,
  AlertCircle,
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  X,
  Edit3,
  Loader2,
} from "lucide-react"

// ──────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────

const departments = [
  { id: 1, name: 'Phòng Nhân sự' },
  { id: 2, name: 'Phòng Kế toán' },
  { id: 3, name: 'Phòng Kỹ thuật' },
  { id: 4, name: 'Phòng Kinh doanh' },
  { id: 5, name: 'Phòng Hành chính' },
  { id: 6, name: 'Phòng Marketing' },
  { id: 7, name: 'Phòng Sản xuất' },
  { id: 8, name: 'Phòng Bảo trì' },
  { id: 9, name: 'Phòng Nghiên cứu & Phát triển' },
  { id: 10, name: 'Phòng Dịch vụ khách hàng' },
]

interface AttendanceFilters {
  search: string
  attendanceMonth: string
  departmentId: string
}

// ──────────────────────────────────────────────
// Utility helpers
// ──────────────────────────────────────────────

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(-2)
    .join("")
    .toUpperCase()
}

// ──────────────────────────────────────────────
// Sub-components (memoized)
// ──────────────────────────────────────────────

const StatCard = memo(({
  icon: Icon,
  iconBg,
  iconColor,
  title,
  value,
  valueColor,
  subtitle,
}: {
  icon: React.ElementType
  iconBg: string
  iconColor: string
  title: string
  value: string | number
  valueColor?: string
  subtitle: string
}) => (
  <Card className="p-0 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
    <CardContent className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 ${iconBg} rounded-lg flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
      </div>
      <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">{title}</h3>
      <p className={`text-3xl font-bold mb-1 ${valueColor || "text-slate-900 dark:text-white"}`}>{value}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
    </CardContent>
  </Card>
))
StatCard.displayName = 'StatCard'

// ──────────────────────────────────────────────
// Detail Drawer
// ──────────────────────────────────────────────

function DetailDrawer({
  detail,
  loading,
  onClose,
}: {
  detail: AttendanceDetail | null
  loading: boolean
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white dark:bg-slate-800 shadow-xl overflow-y-auto animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Chi Tiết Chấm Công</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : detail ? (
          <div className="p-6 space-y-6">
            {/* Employee Info */}
            <div className="flex items-center gap-4">
              <Avatar className="w-14 h-14">
                <AvatarFallback className="text-lg">{getInitials(detail.employeeName)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-lg font-bold text-slate-900 dark:text-white">{detail.employeeName}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="rounded-full">{detail.departmentName}</Badge>
                  <Badge variant="outline" className="rounded-full">{detail.positionName}</Badge>
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Trạng thái</span>
              <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1">{detail.employeeStatus || '—'}</p>
            </div>

            {/* Attendance Month */}
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <span className="text-xs font-medium text-blue-900 dark:text-blue-300 uppercase tracking-wide">Tháng chấm công</span>
              <p className="text-lg font-bold text-blue-900 dark:text-blue-200 mt-1">{detail.attendanceMonth}</p>
            </div>

            {/* Work/Leave/Absent */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                <CalendarCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{detail.workDays}</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">Ngày công</p>
              </div>
              <div className="text-center p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <CalendarDays className="w-5 h-5 text-amber-600 dark:text-amber-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{detail.leaveDays}</p>
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">Ngày phép</p>
              </div>
              <div className="text-center p-4 bg-rose-50 dark:bg-rose-900/20 rounded-lg">
                <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-rose-700 dark:text-rose-300">{detail.absentDays}</p>
                <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">Ngày vắng</p>
              </div>
            </div>

            {/* Created At */}
            {detail.createdAt && (
              <div className="text-xs text-slate-500 dark:text-slate-400 text-center">
                Tạo lúc: {new Date(detail.createdAt).toLocaleString('vi-VN')}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────
// Adjust Modal
// ──────────────────────────────────────────────

function AdjustModal({
  item,
  isSaving,
  onSubmit,
  onClose,
}: {
  item: AttendanceItem
  isSaving: boolean
  onSubmit: (payload: AdjustAttendancePayload & { attendanceId: number }) => void
  onClose: () => void
}) {
  const [workDays, setWorkDays] = useState(String(item.workDays))
  const [absentDays, setAbsentDays] = useState(String(item.absentDays))
  const [leaveDays, setLeaveDays] = useState(String(item.leaveDays))
  const [reason, setReason] = useState('')

  const handleSubmit = () => {
    onSubmit({
      attendanceId: item.attendanceId,
      workDays: workDays !== '' ? Number(workDays) : undefined,
      absentDays: absentDays !== '' ? Number(absentDays) : undefined,
      leaveDays: leaveDays !== '' ? Number(leaveDays) : undefined,
      reason: reason || undefined,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Điều Chỉnh Chấm Công</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">{item.employeeName} — {item.attendanceMonth}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Ngày công</label>
            <Input type="number" min={0} max={31} value={workDays} onChange={(e) => setWorkDays(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Ngày vắng</label>
            <Input type="number" min={0} max={31} value={absentDays} onChange={(e) => setAbsentDays(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Ngày phép</label>
            <Input type="number" min={0} max={31} value={leaveDays} onChange={(e) => setLeaveDays(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Lý do điều chỉnh</label>
            <Input placeholder="Nhập lý do..." value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
        </div>

        <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>Hủy</Button>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Edit3 className="w-4 h-4 mr-2" />}
            Lưu Thay Đổi
          </Button>
        </div>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────
// Main Page Component
// ──────────────────────────────────────────────

export default function AttendancePage() {
  const { language, t } = useLanguage()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Filters
  const [filters, setFilters] = useState<AttendanceFilters>({
    search: '',
    attendanceMonth: '',
    departmentId: '',
  })

  // API hook
  const {
    attendances, totalElements, totalPages, currentPage, pageSize,
    isLoading, error, isSaving,
    loadAttendance, getDetail, adjust, approve, exportExcel, clearError,
  } = useAttendance({ page: 0, size: 20 })

  // Detail drawer state
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailData, setDetailData] = useState<AttendanceDetail | null>(null)

  // Adjust modal state
  const [adjustItem, setAdjustItem] = useState<AttendanceItem | null>(null)

  // ── Filter handler (calls API) ────────────────────────────

  const applyFilters = useCallback((newFilters: AttendanceFilters, page = 0) => {
    setFilters(newFilters)
    loadAttendance({
      page,
      size: pageSize,
      attendance_month: newFilters.attendanceMonth || undefined,
      department_id: newFilters.departmentId ? Number(newFilters.departmentId) : undefined,
    })
  }, [loadAttendance, pageSize])

  const handlePageChange = useCallback((page: number) => {
    applyFilters(filters, page)
  }, [applyFilters, filters])

  // ── Row click → detail drawer ─────────────────────────────

  const handleRowClick = useCallback(async (attendanceId: number) => {
    setDetailData(null)
    setDetailOpen(true)
    setDetailLoading(true)
    try {
      const detail = await getDetail(attendanceId)
      setDetailData(detail)
    } catch {
      setDetailData(null)
    } finally {
      setDetailLoading(false)
    }
  }, [getDetail])

  // ── Adjust ─────────────────────────────────────────────────

  const handleAdjustSubmit = useCallback(async (payload: AdjustAttendancePayload & { attendanceId: number }) => {
    const { attendanceId, ...adjustPayload } = payload
    try {
      await adjust(attendanceId, adjustPayload)
      setAdjustItem(null)
    } catch { /* error is set in hook state */ }
  }, [adjust])

  // ── Approve ────────────────────────────────────────────────

  const handleApprove = useCallback(async (attendanceId: number) => {
    try {
      await approve(attendanceId)
    } catch { /* error is set in hook state */ }
  }, [approve])

  // ── Export ─────────────────────────────────────────────────

  const handleExport = useCallback(async () => {
    await exportExcel({
      attendance_month: filters.attendanceMonth || undefined,
      department_id: filters.departmentId ? Number(filters.departmentId) : undefined,
    })
  }, [exportExcel, filters])

  // ── Client-side search filter ─────────────────────────────

  const displayedAttendances = useMemo(() => {
    if (!filters.search) return attendances
    const searchLower = filters.search.toLowerCase()
    return attendances.filter(a =>
      a.employeeName.toLowerCase().includes(searchLower) ||
      a.departmentName.toLowerCase().includes(searchLower) ||
      a.positionName.toLowerCase().includes(searchLower)
    )
  }, [attendances, filters.search])

  // ── Stats ──────────────────────────────────────────────────

  const stats = useMemo(() => {
    if (displayedAttendances.length === 0) {
      return { totalRecords: 0, avgWorkDays: '0', totalAbsent: 0, totalLeave: 0 }
    }
    let totalWork = 0
    let totalAbsent = 0
    let totalLeave = 0
    displayedAttendances.forEach(a => {
      totalWork += a.workDays
      totalAbsent += a.absentDays
      totalLeave += a.leaveDays
    })
    return {
      totalRecords: displayedAttendances.length,
      avgWorkDays: (totalWork / displayedAttendances.length).toFixed(1),
      totalAbsent,
      totalLeave,
    }
  }, [displayedAttendances])

  // ── Pagination range ───────────────────────────────────────

  const pageNumbers = useMemo(() => {
    const pages: number[] = []
    const start = Math.max(0, currentPage - 2)
    const end = Math.min(totalPages - 1, currentPage + 2)
    for (let i = start; i <= end; i++) pages.push(i)
    return pages
  }, [currentPage, totalPages])

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900">
      <Sidebar language={language} t={t} activeRoute="/attendance" />

      <main className="flex-1 flex flex-col min-w-0">
        <Header
          language={language}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          t={t}
        />

        <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 md:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                {language === 'vi' ? 'Quản Lý Chấm Công' : 'Attendance Management'}
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {language === 'vi' ? 'Theo dõi và điều chỉnh chấm công nhân viên' : 'Track and adjust employee attendance'}
              </p>
            </div>
            <Button variant="outline" className="flex items-center gap-2" onClick={handleExport}>
              <Download className="w-4 h-4" />
              {language === 'vi' ? 'Xuất Excel' : 'Export Excel'}
            </Button>
          </div>
        </div>

        <div className="flex-1 p-4 md:p-8 overflow-y-auto">
          {/* Error Banner */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center justify-between">
              <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
              <button onClick={clearError} className="text-red-500 hover:text-red-700">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <StatCard
              icon={Users}
              iconBg="bg-blue-100 dark:bg-blue-900/30"
              iconColor="text-blue-600 dark:text-blue-400"
              title="Tổng Bản Ghi"
              value={totalElements}
              subtitle={`${totalPages} trang`}
            />
            <StatCard
              icon={CalendarCheck}
              iconBg="bg-emerald-100 dark:bg-emerald-900/30"
              iconColor="text-emerald-600 dark:text-emerald-400"
              title="TB Ngày Công"
              value={stats.avgWorkDays}
              subtitle={`Trên ${stats.totalRecords} bản ghi`}
            />
            <StatCard
              icon={CalendarDays}
              iconBg="bg-amber-100 dark:bg-amber-900/30"
              iconColor="text-amber-600 dark:text-amber-400"
              title="Tổng Ngày Phép"
              value={stats.totalLeave}
              valueColor="text-amber-600 dark:text-amber-400"
              subtitle="Trong kết quả hiện tại"
            />
            <StatCard
              icon={AlertCircle}
              iconBg="bg-rose-100 dark:bg-rose-900/30"
              iconColor="text-rose-600 dark:text-rose-400"
              title="Tổng Vắng Mặt"
              value={stats.totalAbsent}
              valueColor="text-rose-600 dark:text-rose-400"
              subtitle="Ngày vắng không phép"
            />
          </div>

          {/* Filters */}
          <Card className="p-0 shadow-sm mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <Input
                    placeholder="Tìm kiếm nhân viên..."
                    value={filters.search}
                    onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
                    className="pl-10"
                  />
                </div>
                <Input
                  type="month"
                  value={filters.attendanceMonth}
                  onChange={(e) => applyFilters({ ...filters, attendanceMonth: e.target.value })}
                  className="w-48"
                />
                <select
                  value={filters.departmentId}
                  onChange={(e) => applyFilters({ ...filters, departmentId: e.target.value })}
                  className="px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Tất cả phòng ban</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Attendance Table */}
          <Card className="p-0 shadow-sm overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Nhân viên</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Phòng ban</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Chức vụ</th>
                        <th className="px-6 py-4 text-center text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Tháng</th>
                        <th className="px-6 py-4 text-center text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Ngày công</th>
                        <th className="px-6 py-4 text-center text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Ngày phép</th>
                        <th className="px-6 py-4 text-center text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Ngày vắng</th>
                        <th className="px-6 py-4 text-center text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      {displayedAttendances.map((att) => (
                        <tr
                          key={att.attendanceId}
                          onClick={() => handleRowClick(att.attendanceId)}
                          className="cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/50"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <Avatar className="w-9 h-9">
                                <AvatarFallback className="text-xs">{getInitials(att.employeeName)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="text-sm font-semibold text-slate-900 dark:text-white">{att.employeeName}</div>
                                <div className="text-xs text-slate-500 dark:text-slate-400">ID: {att.employeeId}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 dark:text-slate-300">{att.departmentName}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 dark:text-slate-300">{att.positionName}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-slate-700 dark:text-slate-300">{att.attendanceMonth}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{att.workDays}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">{att.leaveDays}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className={`text-sm font-semibold ${att.absentDays > 0 ? "text-rose-600 dark:text-rose-400" : "text-slate-500 dark:text-slate-400"}`}>
                              {att.absentDays}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-blue-600 dark:text-blue-400 h-8 px-2"
                                onClick={() => setAdjustItem(att)}
                                title="Điều chỉnh"
                              >
                                <Edit3 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-emerald-600 dark:text-emerald-400 h-8 px-2"
                                onClick={() => handleApprove(att.attendanceId)}
                                title="Phê duyệt"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {displayedAttendances.length === 0 && (
                        <tr>
                          <td colSpan={8} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                            Không tìm thấy bản ghi chấm công
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Trang <span className="font-semibold">{currentPage + 1}</span> / <span className="font-semibold">{totalPages}</span>
                    {' '}— <span className="font-semibold">{totalElements}</span> bản ghi
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage <= 0}
                      onClick={() => handlePageChange(currentPage - 1)}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    {pageNumbers.map(p => (
                      <Button
                        key={p}
                        size="sm"
                        variant={p === currentPage ? 'default' : 'outline'}
                        className={p === currentPage ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}
                        onClick={() => handlePageChange(p)}
                      >
                        {p + 1}
                      </Button>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage >= totalPages - 1}
                      onClick={() => handlePageChange(currentPage + 1)}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </Card>
        </div>

        {/* Detail Drawer */}
        {detailOpen && (
          <DetailDrawer
            detail={detailData}
            loading={detailLoading}
            onClose={() => setDetailOpen(false)}
          />
        )}

        {/* Adjust Modal */}
        {adjustItem && (
          <AdjustModal
            item={adjustItem}
            isSaving={isSaving}
            onSubmit={handleAdjustSubmit}
            onClose={() => setAdjustItem(null)}
          />
        )}
      </main>
    </div>
  )
}
