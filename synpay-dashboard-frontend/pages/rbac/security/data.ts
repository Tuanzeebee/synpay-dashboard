import type { Permission, Role, User, AuditLog } from './types'

export const MOCK_PERMISSIONS: Permission[] = [
  {
    id: 'user.read',
    name: { vi: 'Xem Người Dùng', en: 'View Users' },
    domain: { vi: 'Quản Lý Người Dùng', en: 'User Management' },
    description: { vi: 'Xem thông tin người dùng', en: 'View user information' },
    dependencies: [],
  },
  {
    id: 'user.write',
    name: { vi: 'Chỉnh Sửa Người Dùng', en: 'Edit Users' },
    domain: { vi: 'Quản Lý Người Dùng', en: 'User Management' },
    description: { vi: 'Tạo và chỉnh sửa người dùng', en: 'Create and edit users' },
    dependencies: ['user.read'],
  },
  {
    id: 'role.read',
    name: { vi: 'Xem Vai Trò', en: 'View Roles' },
    domain: { vi: 'Quản Lý Vai Trò', en: 'Role Management' },
    description: { vi: 'Xem thông tin vai trò', en: 'View role information' },
    dependencies: [],
  },
  {
    id: 'role.write',
    name: { vi: 'Chỉnh Sửa Vai Trò', en: 'Edit Roles' },
    domain: { vi: 'Quản Lý Vai Trò', en: 'Role Management' },
    description: { vi: 'Tạo và chỉnh sửa vai trò', en: 'Create and edit roles' },
    dependencies: ['role.read'],
  },
  {
    id: 'permission.write',
    name: { vi: 'Chỉnh Sửa Quyền', en: 'Edit Permissions' },
    domain: { vi: 'Quản Lý Quyền', en: 'Permission Management' },
    description: { vi: 'Chỉnh sửa phân quyền', en: 'Edit permissions' },
    dependencies: ['role.read'],
  },
  {
    id: 'employee.read',
    name: { vi: 'Xem Nhân Viên', en: 'View Employees' },
    domain: { vi: 'Quản Lý Nhân Viên', en: 'Employee Management' },
    description: { vi: 'Xem dữ liệu nhân viên', en: 'View employee data' },
    dependencies: [],
  },
  {
    id: 'employee.write',
    name: { vi: 'Chỉnh Sửa Nhân Viên', en: 'Edit Employees' },
    domain: { vi: 'Quản Lý Nhân Viên', en: 'Employee Management' },
    description: { vi: 'Tạo và chỉnh sửa nhân viên', en: 'Create and edit employees' },
    dependencies: ['employee.read'],
  },
  {
    id: 'payroll.read',
    name: { vi: 'Xem Bảng Lương', en: 'View Payroll' },
    domain: { vi: 'Quản Lý Lương', en: 'Payroll Management' },
    description: { vi: 'Xem dữ liệu lương', en: 'View payroll data' },
    dependencies: [],
  },
  {
    id: 'payroll.write',
    name: { vi: 'Chỉnh Sửa Bảng Lương', en: 'Edit Payroll' },
    domain: { vi: 'Quản Lý Lương', en: 'Payroll Management' },
    description: { vi: 'Chỉnh sửa dữ liệu lương', en: 'Edit payroll data' },
    dependencies: ['payroll.read'],
  },
  {
    id: 'attendance.read',
    name: { vi: 'Xem Chấm Công', en: 'View Attendance' },
    domain: { vi: 'Quản Lý Chấm Công', en: 'Attendance Management' },
    description: { vi: 'Xem bản ghi chấm công', en: 'View attendance records' },
    dependencies: [],
  },
  {
    id: 'report.read',
    name: { vi: 'Xem Báo Cáo', en: 'View Reports' },
    domain: { vi: 'Báo Cáo', en: 'Reports' },
    description: { vi: 'Xem báo cáo hệ thống', en: 'View system reports' },
    dependencies: [],
  },
  {
    id: 'alert.read',
    name: { vi: 'Xem Cảnh Báo', en: 'View Alerts' },
    domain: { vi: 'Quản Lý Cảnh Báo', en: 'Alert Management' },
    description: { vi: 'Xem cảnh báo hệ thống', en: 'View system alerts' },
    dependencies: [],
  },
  {
    id: 'audit.read',
    name: { vi: 'Xem Nhật Ký Kiểm Toán', en: 'View Audit Log' },
    domain: { vi: 'Quản Lý Kiểm Toán', en: 'Audit Management' },
    description: { vi: 'Xem nhật ký kiểm toán', en: 'View audit logs' },
    dependencies: [],
  },
  {
    id: 'system.config',
    name: { vi: 'Cấu Hình Hệ Thống', en: 'System Configuration' },
    domain: { vi: 'Quản Lý Hệ Thống', en: 'System Management' },
    description: { vi: 'Cấu hình cài đặt hệ thống', en: 'Configure system settings' },
    dependencies: [],
  },
]

export const MOCK_ROLES: Role[] = [
  {
    id: 'admin',
    name: { vi: 'Quản Trị Viên', en: 'Administrator' },
    description: {
      vi: 'Toàn quyền truy cập hệ thống với tất cả đặc quyền quản trị',
      en: 'Full system access with all administrative privileges',
    },
    responsibilities: [
      { vi: 'Quản lý người dùng, vai trò và quyền', en: 'Manage users, roles, and permissions' },
      { vi: 'Xem tất cả báo cáo và nhật ký kiểm toán', en: 'View all reports and audit logs' },
      { vi: 'Cấu hình hệ thống', en: 'System configuration' },
      { vi: 'Quản lý chính sách bảo mật', en: 'Manage security policies' },
    ],
    permissionIds: [
      'user.read',
      'user.write',
      'role.read',
      'role.write',
      'permission.write',
      'employee.read',
      'employee.write',
      'payroll.read',
      'payroll.write',
      'attendance.read',
      'report.read',
      'alert.read',
      'audit.read',
      'system.config',
    ],
    userCount: 3,
  },
  {
    id: 'hr_manager',
    name: { vi: 'Quản Lý Nhân Sự', en: 'HR Manager' },
    description: {
      vi: 'Quản lý nhân sự với quyền truy cập dữ liệu nhân viên',
      en: 'HR management with employee data access',
    },
    responsibilities: [
      { vi: 'Quản lý nhân viên và phòng ban', en: 'Manage employees and departments' },
      { vi: 'Xem báo cáo nhân sự', en: 'View HR reports' },
      { vi: 'Xem bản ghi chấm công', en: 'View attendance records' },
      { vi: 'Tuyển dụng và sa thải nhân viên', en: 'Hire and terminate employees' },
    ],
    permissionIds: ['employee.read', 'employee.write', 'attendance.read', 'report.read', 'alert.read'],
    userCount: 5,
  },
  {
    id: 'payroll_manager',
    name: { vi: 'Quản Lý Lương', en: 'Payroll Manager' },
    description: {
      vi: 'Quyền truy cập xử lý và báo cáo lương',
      en: 'Payroll processing and reporting access',
    },
    responsibilities: [
      { vi: 'Xem và cập nhật dữ liệu lương', en: 'View and update payroll data' },
      { vi: 'Tạo báo cáo lương', en: 'Generate payroll reports' },
      { vi: 'Xử lý tính toán lương', en: 'Process payroll calculations' },
      { vi: 'Quản lý thuế và phúc lợi', en: 'Manage taxes and benefits' },
    ],
    permissionIds: ['payroll.read', 'payroll.write', 'report.read', 'employee.read'],
    userCount: 2,
  },
  {
    id: 'employee',
    name: { vi: 'Nhân Viên', en: 'Employee' },
    description: {
      vi: 'Quyền truy cập tự phục vụ cơ bản cho nhân viên',
      en: 'Basic self-service access for employees',
    },
    responsibilities: [
      { vi: 'Xem hồ sơ cá nhân', en: 'View own profile' },
      { vi: 'Xem thông tin lương của mình', en: 'View own payroll information' },
      { vi: 'Xem bản ghi chấm công của mình', en: 'View own attendance records' },
      { vi: 'Gửi yêu cầu nghỉ phép', en: 'Submit leave requests' },
    ],
    permissionIds: ['employee.read', 'payroll.read', 'attendance.read'],
    userCount: 342,
  },
]

export const MOCK_USERS: User[] = [
  {
    id: 'u1',
    firstName: 'Nguyễn',
    lastName: 'Thị Mai',
    email: 'admin@hrnexus.com',
    roleIds: ['admin'],
    status: 'active',
    lastLogin: '2024-12-15 09:30',
    createdAt: '2024-01-15',
  },
  {
    id: 'u2',
    firstName: 'Trần',
    lastName: 'Văn Hùng',
    email: 'hr@hrnexus.com',
    roleIds: ['hr_manager'],
    status: 'active',
    lastLogin: '2024-12-15 08:45',
    createdAt: '2024-02-20',
  },
  {
    id: 'u3',
    firstName: 'Lê',
    lastName: 'Thị Lan',
    email: 'payroll@hrnexus.com',
    roleIds: ['payroll_manager'],
    status: 'active',
    lastLogin: '2024-12-14 16:20',
    createdAt: '2024-03-10',
  },
  {
    id: 'u4',
    firstName: 'Phạm',
    lastName: 'Văn Nam',
    email: 'employee@hrnexus.com',
    roleIds: ['employee'],
    status: 'active',
    lastLogin: '2024-12-15 07:15',
    createdAt: '2024-04-05',
  },
  {
    id: 'u5',
    firstName: 'Hoàng',
    lastName: 'Thị Hoa',
    email: 'hoa.hoang@hrnexus.com',
    roleIds: ['hr_manager', 'payroll_manager'],
    status: 'active',
    lastLogin: '2024-12-13 14:30',
    createdAt: '2024-05-12',
  },
  {
    id: 'u6',
    firstName: 'Vũ',
    lastName: 'Văn Đức',
    email: 'duc.vu@hrnexus.com',
    roleIds: ['employee'],
    status: 'inactive',
    lastLogin: '2024-11-28 10:00',
    createdAt: '2024-06-18',
  },
  {
    id: 'u7',
    firstName: 'Đặng',
    lastName: 'Thị Linh',
    email: 'linh.dang@hrnexus.com',
    roleIds: ['hr_manager'],
    status: 'active',
    lastLogin: '2024-12-14 11:20',
    createdAt: '2024-07-22',
  },
  {
    id: 'u8',
    firstName: 'Bùi',
    lastName: 'Văn Tuấn',
    email: 'tuan.bui@hrnexus.com',
    roleIds: ['employee'],
    status: 'active',
    lastLogin: '2024-12-15 08:00',
    createdAt: '2024-08-15',
  },
]

export const MOCK_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'a1',
    eventType: 'login',
    userId: 'u1',
    userName: 'Nguyễn Thị Mai',
    action: { vi: 'Người dùng đã đăng nhập', en: 'User logged in' },
    details: { ip: '192.168.1.100', device: 'Chrome on Windows' },
    timestamp: '2024-12-15 09:30:00',
  },
  {
    id: 'a2',
    eventType: 'permission_change',
    userId: 'u1',
    userName: 'Nguyễn Thị Mai',
    action: { vi: 'Đã chỉnh sửa quyền cho vai trò Quản lý nhân sự', en: 'Modified permissions for HR Manager role' },
    details: { role: 'HR Manager', changes: ['Added: report.read', 'Removed: system.config'] },
    timestamp: '2024-12-15 09:15:00',
  },
  {
    id: 'a3',
    eventType: 'user_assignment',
    userId: 'u1',
    userName: 'Nguyễn Thị Mai',
    action: { vi: 'Đã gán vai trò Quản lý lương cho Hoàng Thị Hoa', en: 'Assigned Payroll Manager role to Hoàng Thị Hoa' },
    details: { targetUser: 'Hoàng Thị Hoa', role: 'Payroll Manager' },
    timestamp: '2024-12-15 08:45:00',
  },
  {
    id: 'a4',
    eventType: 'role_change',
    userId: 'u1',
    userName: 'Nguyễn Thị Mai',
    action: { vi: 'Đã tạo vai trò mới: Quản lý phòng ban', en: 'Created new role: Department Manager' },
    details: { roleName: 'Department Manager', permissions: 5 },
    timestamp: '2024-12-14 16:30:00',
  },
  {
    id: 'a5',
    eventType: 'login',
    userId: 'u2',
    userName: 'Trần Văn Hùng',
    action: { vi: 'Người dùng đã đăng nhập', en: 'User logged in' },
    details: { ip: '192.168.1.105', device: 'Safari on MacOS' },
    timestamp: '2024-12-14 08:45:00',
  },
  {
    id: 'a6',
    eventType: 'user_assignment',
    userId: 'u1',
    userName: 'Nguyễn Thị Mai',
    action: { vi: 'Đã vô hiệu hóa tài khoản: Vũ Văn Đức', en: 'Disabled account: Vũ Văn Đức' },
    details: { targetUser: 'Vũ Văn Đức', reason: 'Employee resigned' },
    timestamp: '2024-12-13 15:20:00',
  },
  {
    id: 'a7',
    eventType: 'permission_change',
    userId: 'u1',
    userName: 'Nguyễn Thị Mai',
    action: { vi: 'Đã cập nhật quyền vai trò Nhân viên', en: 'Updated Employee role permissions' },
    details: { role: 'Employee', changes: ['Added: attendance.read'] },
    timestamp: '2024-12-13 10:15:00',
  },
  {
    id: 'a8',
    eventType: 'login',
    userId: 'u3',
    userName: 'Lê Thị Lan',
    action: { vi: 'Người dùng đã đăng nhập', en: 'User logged in' },
    details: { ip: '192.168.1.110', device: 'Firefox on Windows' },
    timestamp: '2024-12-14 16:20:00',
  },
]

export function getMockPermissions(): Permission[] {
  return [...MOCK_PERMISSIONS]
}

export function getMockRoles(): Role[] {
  return [...MOCK_ROLES]
}

export function getMockUsers(): User[] {
  return [...MOCK_USERS]
}

export function getMockAuditLogs(): AuditLog[] {
  return [...MOCK_AUDIT_LOGS]
}
