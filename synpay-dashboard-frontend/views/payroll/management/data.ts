import { Employee, PayrollRecord, AttendanceRecord } from './types'

export const mockEmployees: Employee[] = [
  { id: 'EMP001', fullName: 'Nguyễn Văn An', email: 'an.nguyen@company.com', department: 'Engineering', position: 'Senior Developer', baseSalary: 45000000 },
  { id: 'EMP002', fullName: 'Trần Thị Bình', email: 'binh.tran@company.com', department: 'Sales', position: 'Sales Manager', baseSalary: 40000000 },
  { id: 'EMP003', fullName: 'Lê Minh Châu', email: 'chau.le@company.com', department: 'Marketing', position: 'Marketing Specialist', baseSalary: 30000000 },
  { id: 'EMP004', fullName: 'Phạm Hoàng Dũng', email: 'dung.pham@company.com', department: 'Engineering', position: 'Tech Lead', baseSalary: 55000000 },
  { id: 'EMP005', fullName: 'Võ Thị Hương', email: 'huong.vo@company.com', department: 'HR', position: 'HR Manager', baseSalary: 38000000 },
  { id: 'EMP006', fullName: 'Đỗ Văn Khoa', email: 'khoa.do@company.com', department: 'Finance', position: 'Accountant', baseSalary: 35000000 },
  { id: 'EMP007', fullName: 'Bùi Thị Lan', email: 'lan.bui@company.com', department: 'Engineering', position: 'Backend Developer', baseSalary: 42000000 },
  { id: 'EMP008', fullName: 'Hoàng Văn Minh', email: 'minh.hoang@company.com', department: 'Engineering', position: 'DevOps Engineer', baseSalary: 48000000 },
  { id: 'EMP009', fullName: 'Ngô Thị Nga', email: 'nga.ngo@company.com', department: 'Marketing', position: 'Content Writer', baseSalary: 25000000 },
  { id: 'EMP010', fullName: 'Trương Văn Phúc', email: 'phuc.truong@company.com', department: 'Sales', position: 'Sales Director', baseSalary: 60000000 }
]

export function generatePayrollData(): PayrollRecord[] {
  const months = ['2024-01', '2023-12', '2023-11', '2023-10', '2023-09', '2023-08']
  const payrollData: PayrollRecord[] = []

  mockEmployees.forEach(emp => {
    months.forEach(() => {
      const baseVariation = Math.random() * 0.1 - 0.05
      const baseSalary = Math.round(emp.baseSalary * (1 + baseVariation))
      
      let bonus = 0
      if (Math.random() > 0.6) {
        bonus = Math.round(baseSalary * (0.1 + Math.random() * 0.3))
      }
      
      const deductions = Math.round(baseSalary * (0.08 + Math.random() * 0.04))
      const netSalary = baseSalary + bonus - deductions
      
      const hasAnomaly = Math.random() > 0.95
      let anomalyReason = ''
      if (hasAnomaly) {
        const reasons = [
          'Lương vượt ngưỡng bình thường +40%',
          'Khấu trừ cao bất thường',
          'Thưởng vượt mức quy định'
        ]
        anomalyReason = reasons[Math.floor(Math.random() * reasons.length)]
      }

      payrollData.push({
        employeeId: emp.id,
        month: months[0],
        baseSalary,
        bonus,
        deductions,
        netSalary,
        hasAnomaly,
        anomalyReason
      })
    })
  })

  return payrollData
}

export function generateAttendanceData(): AttendanceRecord[] {
  const months = ['2024-01', '2023-12', '2023-11', '2023-10', '2023-09', '2023-08']
  const attendanceData: AttendanceRecord[] = []

  mockEmployees.forEach(emp => {
    months.forEach(month => {
      const totalDays = 22
      const leaveDays = Math.floor(Math.random() * 3)
      const absentDays = Math.random() > 0.9 ? Math.floor(Math.random() * 2) : 0
      const workDays = totalDays - leaveDays - absentDays
      const attendanceRate = (workDays / totalDays) * 100

      attendanceData.push({
        employeeId: emp.id,
        month,
        workDays,
        leaveDays,
        absentDays,
        attendanceRate
      })
    })
  })

  return attendanceData
}

export const departments = ['Engineering', 'Sales', 'Marketing', 'HR', 'Finance']

export const months = [
  { value: '2024-01', label: 'Tháng 1/2024' },
  { value: '2023-12', label: 'Tháng 12/2023' },
  { value: '2023-11', label: 'Tháng 11/2023' },
  { value: '2023-10', label: 'Tháng 10/2023' },
]

// Required by Next.js Pages Router — this file is not a page
export default function _NotAPage() { return null }
