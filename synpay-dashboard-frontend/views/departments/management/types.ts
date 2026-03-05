/**
 * Department & Position Management Types
 *
 * These types represent the UI models mapped from the API DTOs.
 * The mapping is performed by useDepartments / usePositions hooks.
 */

export interface Department {
  id: number
  name: string
  createdAt: string | null
  updatedAt: string | null
}

export interface Position {
  id: number
  name: string
  createdAt: string | null
  updatedAt: string | null
}

export interface DepartmentStats {
  totalDepartments: number
  totalPositions: number
}

/** Form data emitted by DepartmentFormModal */
export interface DepartmentFormData {
  name: string
}

/** Form data emitted by PositionFormModal */
export interface PositionFormData {
  name: string
}

// Required by Next.js Pages Router — this file is not a page
export default function _NotAPage() { return null }
