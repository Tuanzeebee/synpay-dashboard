export type Employee = {
  id: string
  fullName: string
  email: string
  department: string
  position: string
  baseSalary: number
}

export type PayrollRecord = {
  employeeId: string
  month: string
  baseSalary: number
  bonus: number
  deductions: number
  netSalary: number
  hasAnomaly: boolean
  anomalyReason: string
}

export type AttendanceRecord = {
  employeeId: string
  month: string
  workDays: number
  leaveDays: number
  absentDays: number
  attendanceRate: number
}

export type PayrollFilters = {
  search: string
  month: string
  department: string
}

export type PayrollData = {
  employee: Employee
  payroll: PayrollRecord
  attendance: AttendanceRecord
}

export type Language = 'vi' | 'en'

// Required by Next.js Pages Router — this file is not a page
export default function _NotAPage() { return null }
