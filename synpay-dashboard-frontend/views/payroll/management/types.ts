import type { SalaryItem, SalaryDetail } from '@/hooks/usePayroll'

export type { SalaryItem, SalaryDetail }

export type PayrollFilters = {
  search: string
  salaryMonth: string
  departmentId: string
}

export type Language = 'vi' | 'en'

// Required by Next.js Pages Router — this file is not a page
export default function _NotAPage() { return null }
