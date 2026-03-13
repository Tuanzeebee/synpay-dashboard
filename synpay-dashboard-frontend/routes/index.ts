/**
 * Route Configuration
 * Centralized route definitions for the application
 */

export const routes = {
  // Main routes
  home: '/',
  dashboard: '/dashboard',
  
  // HR Management
  employees: '/employee',
  departments: '/departments',
  attendance: '/attendance',
  
  // Payroll
  payroll: '/payroll',
  
  // Notifications & Alerts
  notifications: '/notifications',
  
  // Reports & Analytics
  reports: '/reports',
  
  // Security & RBAC
  users: '/rbac/users',
  roles: '/rbac/roles',
  permissions: '/rbac/permissions',
  auditLog: '/rbac/audit',
  
  // Settings
  settings: '/settings',
  myprofile: '/myprofile',
} as const

export type RouteKey = keyof typeof routes
export type RoutePath = typeof routes[RouteKey]

/**
 * Route metadata for navigation
 */
export interface RouteMetadata {
  path: RoutePath
  title: {
    vi: string
    en: string
  }
  icon?: string
  badge?: number
  children?: RouteMetadata[]
}

export const routeMetadata: Record<string, RouteMetadata> = {
  dashboard: {
    path: '/dashboard',
    title: { vi: 'Bảng Điều Khiển', en: 'Dashboard' },
    icon: 'LayoutDashboard',
  },
  employees: {
    path: '/employee',
    title: { vi: 'Nhân Viên', en: 'Employees' },
    icon: 'Users',
  },
  attendance: {
    path: '/attendance',
    title: { vi: 'Chấm Công', en: 'Attendance' },
    icon: 'Clock',
  },
  payroll: {
    path: '/payroll',
    title: { vi: 'Bảng Lương', en: 'Payroll' },
    icon: 'DollarSign',
  },
  notifications: {
    path: '/notifications',
    title: { vi: 'Thông Báo & Cảnh Báo', en: 'Notifications & Alerts' },
    icon: 'Bell',
    badge: 12,
  },
  reports: {
    path: '/reports',
    title: { vi: 'Báo Cáo & Phân Tích', en: 'Reports & Analytics' },
    icon: 'BarChart3',
  },
  myprofile: {
    path: '/myprofile',
    title: { vi: 'Hồ Sơ Của Tôi', en: 'My Profile' },
    icon: 'User',
  },
}
