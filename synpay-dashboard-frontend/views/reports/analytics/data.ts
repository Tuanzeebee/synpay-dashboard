import {
  ReportsData,
  KPIData,
  DepartmentData,
  SalaryTrendData,
  StatusDistribution,
  LeaveTypeData,
  AttendanceData,
  DividendData,
  PerformanceData,
} from './types'

export const getMockKPIs = (): KPIData => {
  return {
    totalEmployees: 342,
    growthRate: 8.2,
    totalSalary: 8.4,
    avgSalary: 24.6,
    totalLeave: 248,
    leaveChange: -3.5,
    dividend: 2.1,
    dividendChange: 12.4,
  }
}

export const getMockDepartments = (): DepartmentData[] => {
  return [
    {
      id: 'tech',
      name: 'Phòng Kỹ Thuật',
      employees: 78,
      totalSalary: 2340,
      avgSalary: 30,
      leaveDays: 35,
      performance: 95,
    },
    {
      id: 'sales',
      name: 'Phòng Kinh Doanh',
      employees: 52,
      totalSalary: 1560,
      avgSalary: 30,
      leaveDays: 28,
      performance: 92,
    },
    {
      id: 'marketing',
      name: 'Phòng Marketing',
      employees: 34,
      totalSalary: 816,
      avgSalary: 24,
      leaveDays: 18,
      performance: 88,
    },
    {
      id: 'hr',
      name: 'Phòng Nhân Sự',
      employees: 24,
      totalSalary: 528,
      avgSalary: 22,
      leaveDays: 12,
      performance: 94,
    },
    {
      id: 'finance',
      name: 'Phòng Tài Chính',
      employees: 28,
      totalSalary: 672,
      avgSalary: 24,
      leaveDays: 16,
      performance: 96,
    },
    {
      id: 'operations',
      name: 'Phòng Vận Hành',
      employees: 41,
      totalSalary: 902,
      avgSalary: 22,
      leaveDays: 24,
      performance: 91,
    },
    {
      id: 'customer',
      name: 'Phòng Chăm Sóc KH',
      employees: 32,
      totalSalary: 704,
      avgSalary: 22,
      leaveDays: 22,
      performance: 89,
    },
    {
      id: 'rd',
      name: 'Phòng Nghiên Cứu',
      employees: 18,
      totalSalary: 612,
      avgSalary: 34,
      leaveDays: 14,
      performance: 93,
    },
    {
      id: 'legal',
      name: 'Phòng Pháp Chế',
      employees: 12,
      totalSalary: 360,
      avgSalary: 30,
      leaveDays: 8,
      performance: 90,
    },
    {
      id: 'admin',
      name: 'Phòng Hành Chính',
      employees: 23,
      totalSalary: 460,
      avgSalary: 20,
      leaveDays: 15,
      performance: 87,
    },
  ]
}

export const getMockSalaryTrend = (): SalaryTrendData[] => {
  return [
    { month: 'T1', amount: 7.2 },
    { month: 'T2', amount: 7.4 },
    { month: 'T3', amount: 7.6 },
    { month: 'T4', amount: 7.8 },
    { month: 'T5', amount: 8.0 },
    { month: 'T6', amount: 8.1 },
    { month: 'T7', amount: 8.2 },
    { month: 'T8', amount: 8.3 },
    { month: 'T9', amount: 8.1 },
    { month: 'T10', amount: 8.2 },
    { month: 'T11', amount: 8.3 },
    { month: 'T12', amount: 8.4 },
  ]
}

export const getMockStatusDistribution = (): StatusDistribution[] => {
  return [
    { status: 'active', count: 312 },
    { status: 'onLeave', count: 18 },
    { status: 'probation', count: 8 },
    { status: 'intern', count: 4 },
  ]
}

export const getMockLeaveTypes = (): LeaveTypeData[] => {
  return [
    { type: 'annual', days: 142 },
    { type: 'sick', days: 58 },
    { type: 'maternity', days: 24 },
    { type: 'unpaid', days: 16 },
    { type: 'other', days: 8 },
  ]
}

export const getMockAttendance = (): AttendanceData[] => {
  return [
    { month: 'T7', rate: 94.2 },
    { month: 'T8', rate: 93.8 },
    { month: 'T9', rate: 95.1 },
    { month: 'T10', rate: 94.5 },
    { month: 'T11', rate: 95.3 },
    { month: 'T12', rate: 94.8 },
  ]
}

export const getMockDividends = (): DividendData[] => {
  return [
    { quarter: 'Q1 2024', amount: 1.8 },
    { quarter: 'Q2 2024', amount: 1.9 },
    { quarter: 'Q3 2024', amount: 2.0 },
    { quarter: 'Q4 2024', amount: 2.1 },
  ]
}

export const getMockPerformance = (): PerformanceData[] => {
  return [
    { department: 'tech', score: 95 },
    { department: 'sales', score: 92 },
    { department: 'marketing', score: 88 },
    { department: 'hr', score: 94 },
    { department: 'finance', score: 96 },
    { department: 'operations', score: 91 },
  ]
}

export const getMockReportsData = (): ReportsData => {
  return {
    kpis: getMockKPIs(),
    departments: getMockDepartments(),
    salaryTrend: getMockSalaryTrend(),
    statusDistribution: getMockStatusDistribution(),
    leaveTypes: getMockLeaveTypes(),
    attendance: getMockAttendance(),
    dividends: getMockDividends(),
    performance: getMockPerformance(),
  }
}

// Required by Next.js Pages Router — this file is not a page
export default function _NotAPage() { return null }
