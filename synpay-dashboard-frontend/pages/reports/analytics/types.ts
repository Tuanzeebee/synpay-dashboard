import { Language } from '@/lib/translations'

export interface KPIData {
  totalEmployees: number
  growthRate: number
  totalSalary: number
  avgSalary: number
  totalLeave: number
  leaveChange: number
  dividend: number
  dividendChange: number
}

export interface DepartmentData {
  id: string
  name: string
  employees: number
  totalSalary: number
  avgSalary: number
  leaveDays: number
  performance: number
}

export interface ChartDataPoint {
  name: string
  value: number
  [key: string]: string | number
}

export interface SalaryTrendData {
  month: string
  amount: number
}

export interface StatusDistribution {
  status: string
  count: number
}

export interface LeaveTypeData {
  type: string
  days: number
}

export interface AttendanceData {
  month: string
  rate: number
}

export interface DividendData {
  quarter: string
  amount: number
}

export interface PerformanceData {
  department: string
  score: number
}

export interface ReportsFilter {
  department: string
  period: 'month' | 'quarter' | 'year' | 'custom'
  startDate: string
  endDate: string
}

export interface ReportsData {
  kpis: KPIData
  departments: DepartmentData[]
  salaryTrend: SalaryTrendData[]
  statusDistribution: StatusDistribution[]
  leaveTypes: LeaveTypeData[]
  attendance: AttendanceData[]
  dividends: DividendData[]
  performance: PerformanceData[]
}
