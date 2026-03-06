/**
 * Static lookup data for payroll filters.
 * Department list mirrors the payroll database departments_payroll table.
 */

export const departments = [
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

// Required by Next.js Pages Router — this file is not a page
export default function _NotAPage() { return null }
