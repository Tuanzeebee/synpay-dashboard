/**
 * Department & Position Management Types
 */

export type DepartmentStatus = 'active' | 'inactive'
export type SyncStatus = 'synced' | 'pending'
export type PositionLevel = 'junior' | 'mid' | 'senior' | 'lead' | 'manager'

export interface Department {
  id: string
  name: string
  code: string
  description: string
  status: DepartmentStatus
  syncStatus: SyncStatus
  employeeCount: number
  positionCount: number
  managerId?: string
  managerName?: string
  createdAt: string
  updatedAt: string
}

export interface Position {
  id: string
  name: string
  code: string
  level: PositionLevel
  departmentId: string
  departmentName: string
  description: string
  status: DepartmentStatus
  syncStatus: SyncStatus
  employeeCount: number
  createdAt: string
  updatedAt: string
}

export interface DepartmentStats {
  totalDepartments: number
  totalPositions: number
  totalEmployees: number
  syncPercentage: number
  lastSyncTime: string
}
