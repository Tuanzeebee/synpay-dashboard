"use client"

import { useState, useMemo, useCallback, memo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Sidebar, Header } from "@/components/layout"
import { useLanguage } from "@/components/providers/LanguageProvider"
import {
  Users,
  CalendarCheck,
  CalendarDays,
  AlertCircle,
  AlertTriangle,
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  Info,
  Building2,
  Trophy,
  TrendingDown,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  X,
  Calendar,
  ArrowDown,
  MinusCircle,
  Gift,
} from "lucide-react"

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

type RiskLevel = "ok" | "warning" | "danger"
type LeaveStatus = "pending" | "approved" | "rejected"
type LeaveType = "paid" | "unpaid" | "sick"
type ViewTab = "employee" | "department" | "leave"

interface Employee {
  id: number
  name: string
  dept: string
  deptKey: string
  workDays: number
  leaveDays: number
  absentDays: number
  baseSalary: number
  avatar: string
}

interface Department {
  name: string
  key: string
  employees: number
  avgWorkDays: number
  totalAbsent: number
  riskEmployees: number
}

interface LeaveRequest {
  id: number
  employeeId: number
  employeeName: string
  dept: string
  type: LeaveType
  typeName: string
  from: string
  to: string
  days: number
  reason: string
  status: LeaveStatus
  balance: number
  avatar: string
}

// ──────────────────────────────────────────────
// Constants & Mock Data
// ──────────────────────────────────────────────

const ATTENDANCE_BONUS = 500000
const STANDARD_DAYS = 22

const employeesData: Employee[] = [
  { id: 1, name: "Nguyễn Thị Mai", dept: "Hỗ Trợ", deptKey: "support", workDays: 14, leaveDays: 2, absentDays: 8, baseSalary: 8500000, avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" },
  { id: 2, name: "Trần Văn Hùng", dept: "Kinh Doanh", deptKey: "sales", workDays: 18, leaveDays: 6, absentDays: 0, baseSalary: 12000000, avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" },
  { id: 3, name: "Lê Minh Tuấn", dept: "Kỹ Thuật", deptKey: "engineering", workDays: 22, leaveDays: 2, absentDays: 0, baseSalary: 15000000, avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" },
  { id: 4, name: "Phạm Thị Lan", dept: "Marketing", deptKey: "marketing", workDays: 21, leaveDays: 3, absentDays: 0, baseSalary: 11000000, avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" },
  { id: 5, name: "Hoàng Văn Nam", dept: "Kỹ Thuật", deptKey: "engineering", workDays: 20, leaveDays: 2, absentDays: 1, baseSalary: 14000000, avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" },
  { id: 6, name: "Vũ Thị Hương", dept: "Nhân Sự", deptKey: "hr", workDays: 22, leaveDays: 1, absentDays: 0, baseSalary: 10000000, avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" },
  { id: 7, name: "Đặng Minh Quân", dept: "Hỗ Trợ", deptKey: "support", workDays: 17, leaveDays: 4, absentDays: 3, baseSalary: 8000000, avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" },
  { id: 8, name: "Bùi Thị Nga", dept: "Kinh Doanh", deptKey: "sales", workDays: 21, leaveDays: 2, absentDays: 0, baseSalary: 11500000, avatar: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" },
  { id: 9, name: "Ngô Văn Đức", dept: "Marketing", deptKey: "marketing", workDays: 19, leaveDays: 5, absentDays: 1, baseSalary: 10500000, avatar: "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" },
  { id: 10, name: "Lý Thị Thanh", dept: "Kỹ Thuật", deptKey: "engineering", workDays: 22, leaveDays: 1, absentDays: 0, baseSalary: 16000000, avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" },
]

const departmentsData: Department[] = [
  { name: "Kỹ Thuật", key: "engineering", employees: 320, avgWorkDays: 21.8, totalAbsent: 15, riskEmployees: 3 },
  { name: "Kinh Doanh", key: "sales", employees: 240, avgWorkDays: 21.2, totalAbsent: 18, riskEmployees: 5 },
  { name: "Marketing", key: "marketing", employees: 180, avgWorkDays: 20.8, totalAbsent: 22, riskEmployees: 8 },
  { name: "Hỗ Trợ", key: "support", employees: 150, avgWorkDays: 19.8, totalAbsent: 35, riskEmployees: 12 },
  { name: "Nhân Sự", key: "hr", employees: 45, avgWorkDays: 21.5, totalAbsent: 3, riskEmployees: 0 },
  { name: "Tài Chính", key: "finance", employees: 60, avgWorkDays: 21.3, totalAbsent: 5, riskEmployees: 1 },
  { name: "Vận Hành", key: "operations", employees: 120, avgWorkDays: 20.5, totalAbsent: 28, riskEmployees: 6 },
  { name: "Pháp Lý", key: "legal", employees: 25, avgWorkDays: 21.0, totalAbsent: 2, riskEmployees: 0 },
]

const initialLeaveRequestsData: LeaveRequest[] = [
  { id: 1, employeeId: 1, employeeName: "Nguyễn Thị Mai", dept: "Hỗ Trợ", type: "paid", typeName: "Nghỉ phép có lương", from: "2024-09-15", to: "2024-09-16", days: 2, reason: "Nghỉ phép thường niên", status: "pending", balance: 8, avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" },
  { id: 2, employeeId: 2, employeeName: "Trần Văn Hùng", dept: "Kinh Doanh", type: "paid", typeName: "Nghỉ phép có lương", from: "2024-09-10", to: "2024-09-15", days: 6, reason: "Du lịch gia đình", status: "approved", balance: 6, avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" },
  { id: 3, employeeId: 3, employeeName: "Lê Minh Tuấn", dept: "Kỹ Thuật", type: "sick", typeName: "Nghỉ ốm", from: "2024-09-08", to: "2024-09-09", days: 2, reason: "Bị cảm cúm", status: "approved", balance: 10, avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" },
  { id: 4, employeeId: 4, employeeName: "Phạm Thị Lan", dept: "Marketing", type: "paid", typeName: "Nghỉ phép có lương", from: "2024-09-20", to: "2024-09-22", days: 3, reason: "Việc gia đình", status: "pending", balance: 9, avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" },
  { id: 5, employeeId: 5, employeeName: "Hoàng Văn Nam", dept: "Kỹ Thuật", type: "paid", typeName: "Nghỉ phép có lương", from: "2024-09-25", to: "2024-09-26", days: 2, reason: "Nghỉ phép thường niên", status: "pending", balance: 7, avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" },
  { id: 6, employeeId: 6, employeeName: "Vũ Thị Hương", dept: "Nhân Sự", type: "paid", typeName: "Nghỉ phép có lương", from: "2024-09-12", to: "2024-09-12", days: 1, reason: "Khám sức khỏe định kỳ", status: "approved", balance: 11, avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" },
  { id: 7, employeeId: 7, employeeName: "Đặng Minh Quân", dept: "Hỗ Trợ", type: "unpaid", typeName: "Nghỉ không lương", from: "2024-09-18", to: "2024-09-21", days: 4, reason: "Việc cá nhân", status: "rejected", balance: 0, avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" },
  { id: 8, employeeId: 8, employeeName: "Bùi Thị Nga", dept: "Kinh Doanh", type: "paid", typeName: "Nghỉ phép có lương", from: "2024-09-05", to: "2024-09-06", days: 2, reason: "Nghỉ phép thường niên", status: "approved", balance: 10, avatar: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" },
  { id: 9, employeeId: 9, employeeName: "Ngô Văn Đức", dept: "Marketing", type: "paid", typeName: "Nghỉ phép có lương", from: "2024-09-01", to: "2024-09-05", days: 5, reason: "Du lịch", status: "approved", balance: 7, avatar: "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" },
  { id: 10, employeeId: 10, employeeName: "Lý Thị Thanh", dept: "Kỹ Thuật", type: "paid", typeName: "Nghỉ phép có lương", from: "2024-09-28", to: "2024-09-28", days: 1, reason: "Việc gia đình", status: "pending", balance: 11, avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" },
]

// ──────────────────────────────────────────────
// Utility helpers
// ──────────────────────────────────────────────

function calculateRisk(workDays: number, absentDays: number): RiskLevel {
  if (absentDays >= 3 || workDays < 18) return "danger"
  if (absentDays >= 1 || workDays < 20) return "warning"
  return "ok"
}

function calculateAttendanceBonus(absentDays: number) {
  return absentDays === 0 ? ATTENDANCE_BONUS : 0
}

function getBonusReason(absentDays: number) {
  if (absentDays === 0) return "Chuyên cần đầy đủ — không vắng mặt"
  return `${absentDays} ngày vắng — không đạt thưởng`
}

function calculateDeduction(workDays: number, baseSalary: number) {
  const dailySalary = baseSalary / STANDARD_DAYS
  const missedDays = STANDARD_DAYS - workDays
  return Math.round(missedDays * dailySalary)
}

const currencyFormatter = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" })

function formatCurrency(amount: number) {
  return currencyFormatter.format(amount)
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("vi-VN")
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(-2)
    .join("")
    .toUpperCase()
}

// Config objects moved outside component to avoid re-creation on every render
const RISK_CONFIG: Record<RiskLevel, { label: string; emoji: string; className: string }> = {
  ok: { label: "OK", emoji: "✅", className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300" },
  warning: { label: "Cảnh báo", emoji: "⚠️", className: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300" },
  danger: { label: "Rủi ro cao", emoji: "🔴", className: "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300" },
}

const LEAVE_STATUS_CONFIG: Record<LeaveStatus, { label: string; className: string }> = {
  pending: { label: "Chờ duyệt", className: "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300" },
  approved: { label: "Đã duyệt", className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300" },
  rejected: { label: "Từ chối", className: "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300" },
}

const TABS: { key: ViewTab; label: string }[] = [
  { key: "employee", label: "Theo Nhân Viên" },
  { key: "department", label: "Theo Phòng Ban" },
  { key: "leave", label: "Quản Lý Nghỉ Phép" },
]

// ──────────────────────────────────────────────
// Sub-components (memoized)
// ──────────────────────────────────────────────

const RiskBadge = memo(({ risk }: { risk: RiskLevel }) => {
  const c = RISK_CONFIG[risk]
  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${c.className}`}>
      <span>{c.emoji}</span>
      <span>{c.label}</span>
    </span>
  )
})
RiskBadge.displayName = 'RiskBadge'

const LeaveStatusBadge = memo(({ status }: { status: LeaveStatus }) => {
  const c = LEAVE_STATUS_CONFIG[status]
  return <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${c.className}`}>{c.label}</span>
})
LeaveStatusBadge.displayName = 'LeaveStatusBadge'

const SummaryCard = memo(({
  icon: Icon,
  iconBg,
  iconColor,
  title,
  value,
  valueColor,
  subtitle,
  badge,
}: {
  icon: React.ElementType
  iconBg: string
  iconColor: string
  title: string
  value: string | number
  valueColor?: string
  subtitle: string
  badge?: React.ReactNode
}) => {
  return (
    <Card className="p-0 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`w-12 h-12 ${iconBg} rounded-lg flex items-center justify-center`}>
            <Icon className={`w-6 h-6 ${iconColor}`} />
          </div>
          {badge}
        </div>
        <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">{title}</h3>
        <p className={`text-3xl font-bold mb-1 ${valueColor || "text-slate-900 dark:text-white"}`}>{value}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
      </CardContent>
    </Card>
  )
})
SummaryCard.displayName = 'SummaryCard'

// ──────────────────────────────────────────────
// Employee Detail Modal
// ──────────────────────────────────────────────

function EmployeeModal({ employee, onClose }: { employee: Employee; onClose: () => void }) {
  const risk = calculateRisk(employee.workDays, employee.absentDays)
  const deduction = calculateDeduction(employee.workDays, employee.baseSalary)
  const bonus = calculateAttendanceBonus(employee.absentDays)
  const netSalary = employee.baseSalary + bonus - deduction
  const percentage = (employee.workDays / STANDARD_DAYS) * 100

  const deductionReason = employee.absentDays > 0
    ? `${employee.absentDays} ngày vắng mặt không phép`
    : employee.workDays < STANDARD_DAYS
      ? `Thiếu ${STANDARD_DAYS - employee.workDays} ngày công`
      : "Không có khấu trừ"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="w-16 h-16">
                <AvatarImage src={employee.avatar} alt={employee.name} />
                <AvatarFallback>{getInitials(employee.name)}</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{employee.name}</h2>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="rounded-full">{employee.dept}</Badge>
                  <span className="text-sm text-slate-500 dark:text-slate-400">Tháng 9/2024</span>
                </div>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Attendance Breakdown */}
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Chi Tiết Chấm Công</h3>

              {/* Work Days */}
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Ngày Công</span>
                  <div className="flex items-center gap-1">
                    {employee.workDays >= 20 ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Đạt chuẩn</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-rose-500" />
                        <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">Dưới chuẩn</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-3xl font-bold text-slate-900 dark:text-white">{employee.workDays}</span>
                  <span className="text-lg text-slate-500 dark:text-slate-400">/ {STANDARD_DAYS}</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-2.5 rounded-full transition-all duration-300 ${employee.workDays >= 20 ? "bg-emerald-500" : "bg-rose-500"}`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
              </div>

              {/* Leave Days */}
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Ngày Nghỉ Phép</span>
                  <Calendar className="w-4 h-4 text-slate-400" />
                </div>
                <span className="text-3xl font-bold text-amber-600 dark:text-amber-400">{employee.leaveDays}</span>
              </div>

              {/* Absent Days */}
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Ngày Vắng Mặt</span>
                  <AlertCircle className="w-4 h-4 text-rose-500" />
                </div>
                <span className="text-3xl font-bold text-rose-600 dark:text-rose-400">{employee.absentDays}</span>
              </div>

              {/* Overall Status */}
              <div
                className={`text-center py-3 rounded-lg font-semibold text-sm ${
                  risk === "ok"
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300"
                    : risk === "warning"
                      ? "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300"
                      : "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300"
                }`}
              >
                {risk === "ok" && "✅ Chấm công đạt chuẩn"}
                {risk === "warning" && "⚠️ Có cảnh báo chấm công"}
                {risk === "danger" && "🔴 Rủi ro cao - Cần xem xét"}
              </div>
            </div>

            {/* Salary Impact */}
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Ảnh Hưởng Đến Lương</h3>

              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-5 border border-blue-200 dark:border-blue-800">
                {/* Base Salary */}
                <div className="mb-4">
                  <span className="text-xs font-medium text-blue-900 dark:text-blue-300 uppercase tracking-wide">Lương Cơ Bản</span>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-200 mt-1">{formatCurrency(employee.baseSalary)}</p>
                </div>

                {/* Attendance Bonus */}
                <div className="bg-white dark:bg-slate-800 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Thưởng Chuyên Cần</span>
                    <Gift className={`w-4 h-4 ${bonus > 0 ? "text-emerald-500" : "text-slate-400"}`} />
                  </div>
                  <p className={`text-xl font-bold mb-2 ${bonus > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 dark:text-slate-500"}`}>
                    +{formatCurrency(bonus > 0 ? bonus : ATTENDANCE_BONUS)}
                  </p>
                  <div className="flex items-center gap-2 mb-2">
                    {bonus > 0 ? (
                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded">✅ Đạt</span>
                    ) : (
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">❌ Không đạt</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">{getBonusReason(employee.absentDays)}</p>
                </div>

                {/* Deduction Arrow */}
                <div className="flex items-center justify-center my-4">
                  <ArrowDown className="w-6 h-6 text-slate-400" />
                </div>

                {/* Attendance Deduction */}
                <div className="bg-white dark:bg-slate-800 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Khấu Trừ Chuyên Cần</span>
                    <MinusCircle className="w-4 h-4 text-rose-500" />
                  </div>
                  <p className="text-xl font-bold text-rose-600 dark:text-rose-400 mb-2">-{formatCurrency(deduction)}</p>
                  <span className="text-xs text-blue-600 dark:text-blue-400 underline cursor-pointer">{deductionReason}</span>
                </div>

                {/* Net Salary */}
                <div className="border-t border-blue-200 dark:border-blue-700 pt-4">
                  <span className="text-xs font-medium text-blue-900 dark:text-blue-300 uppercase tracking-wide">Lương Thực Nhận</span>
                  <p className="text-3xl font-bold text-blue-900 dark:text-blue-200 mt-1">{formatCurrency(netSalary)}</p>
                </div>
              </div>

              <Button className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white">
                <FileText className="w-4 h-4" />
                Xem Chi Tiết Bảng Lương
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────
// Leave Detail Modal
// ──────────────────────────────────────────────

function LeaveModal({
  leave,
  onClose,
  onApprove,
  onReject,
}: {
  leave: LeaveRequest
  onClose: () => void
  onApprove: () => void
  onReject: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-lg w-full animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Chi Tiết Đơn Nghỉ Phép</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Xem xét và phê duyệt đơn</p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Employee Info */}
          <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
            <Avatar className="w-12 h-12">
              <AvatarImage src={leave.avatar} alt={leave.employeeName} />
              <AvatarFallback>{getInitials(leave.employeeName)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">{leave.employeeName}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">{leave.dept}</p>
            </div>
          </div>

          {/* Leave Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Loại Phép</label>
              <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1">{leave.typeName}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Số Ngày</label>
              <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1">{leave.days} ngày</p>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Từ Ngày</label>
              <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1">{formatDate(leave.from)}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Đến Ngày</label>
              <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1">{formatDate(leave.to)}</p>
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Lý Do</label>
            <p className="text-sm text-slate-700 dark:text-slate-300 mt-1 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">{leave.reason}</p>
          </div>

          {/* Leave Balance */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-900 dark:text-blue-300">Số Phép Còn Lại</span>
              <span className="text-lg font-bold text-blue-900 dark:text-blue-200">{leave.balance} ngày</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onReject}>
            <XCircle className="w-4 h-4" />
            Từ Chối
          </Button>
          <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={onApprove}>
            <CheckCircle className="w-4 h-4" />
            Phê Duyệt
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

  // View state
  const [activeTab, setActiveTab] = useState<ViewTab>("employee")

  // Employee filters
  const [searchTerm, setSearchTerm] = useState("")
  const [riskFilter, setRiskFilter] = useState<"all" | RiskLevel>("all")
  const [deptFilter, setDeptFilter] = useState<string>("all")

  // Leave filters
  const [leaveSearch, setLeaveSearch] = useState("")
  const [leaveStatusFilter, setLeaveStatusFilter] = useState<"all" | LeaveStatus>("all")
  const [leaveTypeFilter, setLeaveTypeFilter] = useState<"all" | LeaveType>("all")

  // Modals
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null)

  // Leave data (mutable for approve / reject)
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(initialLeaveRequestsData)

  // ── Filtered data ──

  const filteredEmployees = useMemo(() => {
    return employeesData.filter((emp) => {
      const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase())
      const risk = calculateRisk(emp.workDays, emp.absentDays)
      const matchesRisk = riskFilter === "all" || risk === riskFilter
      const matchesDept = deptFilter === "all" || emp.deptKey === deptFilter
      return matchesSearch && matchesRisk && matchesDept
    })
  }, [searchTerm, riskFilter, deptFilter])

  const filteredLeaves = useMemo(() => {
    return leaveRequests.filter((leave) => {
      const matchesSearch = leave.employeeName.toLowerCase().includes(leaveSearch.toLowerCase())
      const matchesStatus = leaveStatusFilter === "all" || leave.status === leaveStatusFilter
      const matchesType = leaveTypeFilter === "all" || leave.type === leaveTypeFilter
      return matchesSearch && matchesStatus && matchesType
    })
  }, [leaveSearch, leaveStatusFilter, leaveTypeFilter, leaveRequests])

  // ── Active filter chips ──

  const activeFilters = useMemo(() => {
    const chips: { key: string; label: string; clear: () => void; color: string }[] = []
    if (riskFilter !== "all") {
      const labels: Record<RiskLevel, string> = { ok: "✅ OK", warning: "⚠️ Cảnh báo", danger: "🔴 Rủi ro cao" }
      chips.push({ key: "risk", label: labels[riskFilter], clear: () => setRiskFilter("all"), color: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400" })
    }
    if (deptFilter !== "all") {
      const dept = departmentsData.find((d) => d.key === deptFilter)
      chips.push({ key: "dept", label: dept?.name ?? deptFilter, clear: () => setDeptFilter("all"), color: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400" })
    }
    if (searchTerm) {
      chips.push({ key: "search", label: `Tìm: "${searchTerm}"`, clear: () => setSearchTerm(""), color: "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300" })
    }
    return chips
  }, [riskFilter, deptFilter, searchTerm])

  // ── Handlers ──

  const handleFilterByDepartment = useCallback((deptKey: string) => {
    setActiveTab("employee")
    setDeptFilter(deptKey)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [])

  const handleApproveLeave = useCallback(() => {
    if (!selectedLeave) return
    setLeaveRequests((prev) => prev.map((l) => (l.id === selectedLeave.id ? { ...l, status: "approved" as LeaveStatus } : l)))
    setSelectedLeave(null)
  }, [selectedLeave])

  const handleRejectLeave = useCallback(() => {
    if (!selectedLeave) return
    setLeaveRequests((prev) => prev.map((l) => (l.id === selectedLeave.id ? { ...l, status: "rejected" as LeaveStatus } : l)))
    setSelectedLeave(null)
  }, [selectedLeave])

  // ── Tab config ──

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900">
      <Sidebar language={language} t={t} activeRoute="/attendance" />

      <main className="flex-1 flex flex-col min-w-0">
        <Header
          language={language}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          t={t}
        />

        <div className="flex-1 p-4 md:p-8 overflow-y-auto">
          {/* ─── Page Header ─── */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Chấm Công Tính Lương</h1>
                <p className="text-slate-600 dark:text-slate-400">Quản lý chấm công theo chu kỳ lương tháng</p>
              </div>
              <Button variant="outline" className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Xuất Báo Cáo
              </Button>
            </div>

            {/* Month Selector */}
            <Card className="p-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" className="rounded-lg">
                      <ChevronLeft className="w-6 h-6 text-slate-600 dark:text-slate-400" />
                    </Button>
                    <div className="text-center">
                      <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Tháng 9/2024</h2>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Chu kỳ lương hiện tại</p>
                    </div>
                    <Button variant="ghost" size="icon" className="rounded-lg">
                      <ChevronRight className="w-6 h-6 text-slate-600 dark:text-slate-400" />
                    </Button>
                  </div>
                  <div className="hidden md:flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <Info className="w-4 h-4" />
                    <span>Dữ liệu tổng hợp theo tháng</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ─── View Tabs ─── */}
          <div className="mb-6 border-b border-slate-200 dark:border-slate-700">
            <div className="flex gap-6">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`py-3 border-b-2 font-semibold text-sm transition-colors ${
                    activeTab === tab.key
                      ? "border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400"
                      : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* ═══════════════════════════════════════════ */}
          {/* Employee View                              */}
          {/* ═══════════════════════════════════════════ */}
          {activeTab === "employee" && (
            <div className="animate-in fade-in duration-300">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                <SummaryCard icon={Users} iconBg="bg-blue-100 dark:bg-blue-900/30" iconColor="text-blue-600 dark:text-blue-400" title="Tổng Nhân Viên" value={342} subtitle="Trong chu kỳ lương này" />
                <SummaryCard
                  icon={CalendarCheck}
                  iconBg="bg-emerald-100 dark:bg-emerald-900/30"
                  iconColor="text-emerald-600 dark:text-emerald-400"
                  title="TB Ngày Công"
                  value="21.2"
                  subtitle="Trên tổng số 22 ngày chuẩn"
                  badge={<span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded">+0.3</span>}
                />
                <SummaryCard icon={CalendarDays} iconBg="bg-cyan-100 dark:bg-cyan-900/30" iconColor="text-cyan-600 dark:text-cyan-400" title="Người Nghỉ Phép" value={87} valueColor="text-cyan-600 dark:text-cyan-400" subtitle="Có sử dụng ngày phép tháng này" />
                <SummaryCard
                  icon={AlertCircle}
                  iconBg="bg-rose-100 dark:bg-rose-900/30"
                  iconColor="text-rose-600 dark:text-rose-400"
                  title="Tổng Vắng Mặt"
                  value={145}
                  valueColor="text-rose-600 dark:text-rose-400"
                  subtitle="Ngày vắng không phép"
                  badge={<span className="text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 px-2 py-1 rounded">+12%</span>}
                />
                <SummaryCard icon={AlertTriangle} iconBg="bg-amber-100 dark:bg-amber-900/30" iconColor="text-amber-600 dark:text-amber-400" title="NV Có Rủi Ro" value={28} valueColor="text-amber-600 dark:text-amber-400" subtitle="Cần xem xét khấu trừ lương" />
              </div>

              {/* Filters */}
              <Card className="p-0 shadow-sm mb-6">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                      <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <Input
                        placeholder="Tìm kiếm nhân viên..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <select
                      value={riskFilter}
                      onChange={(e) => setRiskFilter(e.target.value as "all" | RiskLevel)}
                      className="px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">Tất cả trạng thái</option>
                      <option value="ok">✅ OK</option>
                      <option value="warning">⚠️ Cảnh báo</option>
                      <option value="danger">🔴 Rủi ro cao</option>
                    </select>
                    <select
                      value={deptFilter}
                      onChange={(e) => setDeptFilter(e.target.value)}
                      className="px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">Tất cả phòng ban</option>
                      <option value="engineering">Kỹ Thuật</option>
                      <option value="sales">Kinh Doanh</option>
                      <option value="marketing">Marketing</option>
                      <option value="support">Hỗ Trợ</option>
                      <option value="hr">Nhân Sự</option>
                    </select>
                  </div>

                  {/* Active Filters */}
                  {activeFilters.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {activeFilters.map((chip) => (
                        <span key={chip.key} className={`${chip.color} px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-2 animate-in slide-in-from-left-2 duration-200`}>
                          {chip.label}
                          <button onClick={chip.clear} className="hover:opacity-70">×</button>
                        </span>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Employee Table */}
              <Card className="p-0 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Họ và Tên</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Phòng Ban</th>
                        <th className="px-6 py-4 text-center text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Ngày Công</th>
                        <th className="px-6 py-4 text-center text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Ngày Nghỉ Phép</th>
                        <th className="px-6 py-4 text-center text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Ngày Vắng</th>
                        <th className="px-6 py-4 text-center text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Ảnh Hưởng Lương</th>
                        <th className="px-6 py-4 text-center text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Thao Tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      {filteredEmployees.map((emp) => {
                        const risk = calculateRisk(emp.workDays, emp.absentDays)
                        return (
                          <tr
                            key={emp.id}
                            onClick={() => setSelectedEmployee(emp)}
                            className={`cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/50 ${
                              risk === "danger"
                                ? "bg-red-50 dark:bg-red-500/5"
                                : risk === "warning"
                                  ? "bg-amber-50 dark:bg-amber-500/5"
                                  : ""
                            }`}
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <Avatar className="w-10 h-10">
                                  <AvatarImage src={emp.avatar} alt={emp.name} />
                                  <AvatarFallback>{getInitials(emp.name)}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="text-sm font-semibold text-slate-900 dark:text-white">{emp.name}</div>
                                  <div className="text-xs text-slate-500 dark:text-slate-400">NV-{String(emp.id).padStart(4, "0")}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 dark:text-slate-300">{emp.dept}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <span className={`text-sm font-bold ${emp.workDays < 20 ? "text-amber-600 dark:text-amber-400" : "text-slate-900 dark:text-white"}`}>
                                {emp.workDays} / {STANDARD_DAYS}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-semibold text-amber-600 dark:text-amber-400">{emp.leaveDays}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <span className={`text-sm font-semibold ${emp.absentDays > 0 ? "text-rose-600 dark:text-rose-400" : "text-slate-500 dark:text-slate-400"}`}>{emp.absentDays}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <RiskBadge risk={risk} />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <Button variant="link" size="sm" className="text-blue-600 dark:text-blue-400">
                                Chi tiết
                              </Button>
                            </td>
                          </tr>
                        )
                      })}
                      {filteredEmployees.length === 0 && (
                        <tr>
                          <td colSpan={7} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                            Không tìm thấy nhân viên phù hợp
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Hiển thị <span className="font-semibold">1-{filteredEmployees.length}</span> trong <span className="font-semibold">342</span> nhân viên
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled>Trước</Button>
                    <Button size="sm" className="bg-blue-600 text-white hover:bg-blue-700">1</Button>
                    <Button variant="outline" size="sm">2</Button>
                    <Button variant="outline" size="sm">3</Button>
                    <Button variant="outline" size="sm">Sau</Button>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* ═══════════════════════════════════════════ */}
          {/* Department View                            */}
          {/* ═══════════════════════════════════════════ */}
          {activeTab === "department" && (
            <div className="animate-in fade-in duration-300">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <SummaryCard icon={Building2} iconBg="bg-purple-100 dark:bg-purple-900/30" iconColor="text-purple-600 dark:text-purple-400" title="Tổng Phòng Ban" value={8} subtitle="Đang hoạt động" />
                <Card className="p-0 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                        <Trophy className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                      </div>
                    </div>
                    <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Hiệu Suất Cao Nhất</h3>
                    <p className="text-lg font-bold text-slate-900 dark:text-white mb-1">Kỹ Thuật</p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">21.8 ngày công TB</p>
                  </CardContent>
                </Card>
                <Card className="p-0 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/30 rounded-lg flex items-center justify-center">
                        <TrendingDown className="w-6 h-6 text-rose-600 dark:text-rose-400" />
                      </div>
                    </div>
                    <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Cần Cải Thiện</h3>
                    <p className="text-lg font-bold text-slate-900 dark:text-white mb-1">Hỗ Trợ</p>
                    <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold">19.8 ngày công TB</p>
                  </CardContent>
                </Card>
                <SummaryCard icon={AlertTriangle} iconBg="bg-amber-100 dark:bg-amber-900/30" iconColor="text-amber-600 dark:text-amber-400" title="PB Có Rủi Ro" value={3} valueColor="text-amber-600 dark:text-amber-400" subtitle="Có nhân viên rủi ro cao" />
              </div>

              {/* Department Table */}
              <Card className="p-0 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Phòng Ban</th>
                        <th className="px-6 py-4 text-center text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Số Nhân Viên</th>
                        <th className="px-6 py-4 text-center text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">TB Ngày Công</th>
                        <th className="px-6 py-4 text-center text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Tổng Vắng</th>
                        <th className="px-6 py-4 text-center text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">NV Có Rủi Ro</th>
                        <th className="px-6 py-4 text-center text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Thao Tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      {departmentsData.map((dept) => (
                        <tr
                          key={dept.key}
                          className={`hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${dept.riskEmployees > 0 ? "border-l-4 border-l-amber-500" : ""}`}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                                <Building2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                              </div>
                              <span className="text-sm font-semibold text-slate-900 dark:text-white">{dept.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-semibold text-slate-900 dark:text-white">{dept.employees}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span
                              className={`text-sm font-bold ${
                                dept.avgWorkDays >= 21
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : dept.avgWorkDays >= 20
                                    ? "text-amber-600 dark:text-amber-400"
                                    : "text-rose-600 dark:text-rose-400"
                              }`}
                            >
                              {dept.avgWorkDays}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-semibold text-rose-600 dark:text-rose-400">{dept.totalAbsent}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className={`text-sm font-bold ${dept.riskEmployees > 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                              {dept.riskEmployees}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <Button variant="link" size="sm" className="text-blue-600 dark:text-blue-400" onClick={() => handleFilterByDepartment(dept.key)}>
                              Xem nhân viên
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* ═══════════════════════════════════════════ */}
          {/* Leave Management View                      */}
          {/* ═══════════════════════════════════════════ */}
          {activeTab === "leave" && (
            <div className="animate-in fade-in duration-300">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <SummaryCard icon={FileText} iconBg="bg-blue-100 dark:bg-blue-900/30" iconColor="text-blue-600 dark:text-blue-400" title="Tổng Đơn Nghỉ" value={124} subtitle="Trong tháng này" />
                <SummaryCard
                  icon={Clock}
                  iconBg="bg-amber-100 dark:bg-amber-900/30"
                  iconColor="text-amber-600 dark:text-amber-400"
                  title="Chờ Phê Duyệt"
                  value={18}
                  valueColor="text-amber-600 dark:text-amber-400"
                  subtitle="Đơn đang chờ xử lý"
                  badge={<span className="text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded">Cần duyệt</span>}
                />
                <SummaryCard icon={CheckCircle} iconBg="bg-emerald-100 dark:bg-emerald-900/30" iconColor="text-emerald-600 dark:text-emerald-400" title="Đã Phê Duyệt" value={98} valueColor="text-emerald-600 dark:text-emerald-400" subtitle="Đơn được chấp thuận" />
                <SummaryCard icon={XCircle} iconBg="bg-rose-100 dark:bg-rose-900/30" iconColor="text-rose-600 dark:text-rose-400" title="Từ Chối" value={8} valueColor="text-rose-600 dark:text-rose-400" subtitle="Đơn không được duyệt" />
              </div>

              {/* Filters */}
              <Card className="p-0 shadow-sm mb-6">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                      <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <Input
                        placeholder="Tìm kiếm nhân viên..."
                        value={leaveSearch}
                        onChange={(e) => setLeaveSearch(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <select
                      value={leaveStatusFilter}
                      onChange={(e) => setLeaveStatusFilter(e.target.value as "all" | LeaveStatus)}
                      className="px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">Tất cả trạng thái</option>
                      <option value="pending">Chờ phê duyệt</option>
                      <option value="approved">Đã phê duyệt</option>
                      <option value="rejected">Từ chối</option>
                    </select>
                    <select
                      value={leaveTypeFilter}
                      onChange={(e) => setLeaveTypeFilter(e.target.value as "all" | LeaveType)}
                      className="px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">Tất cả loại phép</option>
                      <option value="paid">Nghỉ phép có lương</option>
                      <option value="unpaid">Nghỉ không lương</option>
                      <option value="sick">Nghỉ ốm</option>
                    </select>
                  </div>
                </CardContent>
              </Card>

              {/* Leave Table */}
              <Card className="p-0 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Nhân Viên</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Loại Phép</th>
                        <th className="px-6 py-4 text-center text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Từ Ngày</th>
                        <th className="px-6 py-4 text-center text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Đến Ngày</th>
                        <th className="px-6 py-4 text-center text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Số Ngày</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Lý Do</th>
                        <th className="px-6 py-4 text-center text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Trạng Thái</th>
                        <th className="px-6 py-4 text-center text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Thao Tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      {filteredLeaves.map((leave) => (
                        <tr key={leave.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <Avatar className="w-10 h-10">
                                <AvatarImage src={leave.avatar} alt={leave.employeeName} />
                                <AvatarFallback>{getInitials(leave.employeeName)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="text-sm font-semibold text-slate-900 dark:text-white">{leave.employeeName}</div>
                                <div className="text-xs text-slate-500 dark:text-slate-400">{leave.dept}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 dark:text-slate-300">{leave.typeName}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-slate-900 dark:text-white">{formatDate(leave.from)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-slate-900 dark:text-white">{formatDate(leave.to)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-bold text-slate-900 dark:text-white">{leave.days}</td>
                          <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300">{leave.reason}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <LeaveStatusBadge status={leave.status} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <Button variant="link" size="sm" className="text-blue-600 dark:text-blue-400" onClick={() => setSelectedLeave(leave)}>
                              Chi tiết
                            </Button>
                          </td>
                        </tr>
                      ))}
                      {filteredLeaves.length === 0 && (
                        <tr>
                          <td colSpan={8} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                            Không tìm thấy đơn nghỉ phép phù hợp
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Hiển thị <span className="font-semibold">1-{filteredLeaves.length}</span> trong <span className="font-semibold">124</span> đơn nghỉ
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled>Trước</Button>
                    <Button size="sm" className="bg-blue-600 text-white hover:bg-blue-700">1</Button>
                    <Button variant="outline" size="sm">2</Button>
                    <Button variant="outline" size="sm">Sau</Button>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* ─── Modals ─── */}
          {selectedEmployee && <EmployeeModal employee={selectedEmployee} onClose={() => setSelectedEmployee(null)} />}
          {selectedLeave && <LeaveModal leave={selectedLeave} onClose={() => setSelectedLeave(null)} onApprove={handleApproveLeave} onReject={handleRejectLeave} />}
        </div>
      </main>
    </div>
  )
}
