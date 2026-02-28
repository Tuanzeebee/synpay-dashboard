export interface Permission {
  id: string
  name: { vi: string; en: string }
  domain: { vi: string; en: string }
  description: { vi: string; en: string }
  dependencies: string[]
}

export interface Role {
  id: string
  name: { vi: string; en: string }
  description: { vi: string; en: string }
  responsibilities: Array<{ vi: string; en: string }>
  permissionIds: string[]
  userCount: number
}

export interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  roleIds: string[]
  status: 'active' | 'inactive'
  lastLogin: string
  createdAt: string
}

export interface AuditLog {
  id: string
  eventType: 'login' | 'permission_change' | 'user_assignment' | 'role_change'
  userId: string
  userName: string
  action: { vi: string; en: string }
  details: Record<string, any>
  timestamp: string
}

export interface ConfirmModalData {
  title: string
  message: string
  callback: () => void
}

export type Language = 'vi' | 'en'

export class PermissionResolver {
  private roles: Role[]
  private permissions: Permission[]

  constructor(roles: Role[], permissions: Permission[]) {
    this.roles = roles
    this.permissions = permissions
  }

  hasPermission(userRoleIds: string[], permissionId: string): boolean {
    for (const roleId of userRoleIds) {
      const role = this.roles.find((r) => r.id === roleId)
      if (role && role.permissionIds.includes(permissionId)) {
        return true
      }
    }
    return false
  }

  getUserPermissions(userRoleIds: string[]): string[] {
    const permissionSet = new Set<string>()
    for (const roleId of userRoleIds) {
      const role = this.roles.find((r) => r.id === roleId)
      if (role) {
        role.permissionIds.forEach((permId) => permissionSet.add(permId))
      }
    }
    return Array.from(permissionSet)
  }

  validatePermissionDependencies(permissionIds: string[]): string[] {
    const warnings: string[] = []
    for (const permId of permissionIds) {
      const perm = this.permissions.find((p) => p.id === permId)
      if (perm && perm.dependencies.length > 0) {
        for (const depId of perm.dependencies) {
          if (!permissionIds.includes(depId)) {
            warnings.push(`${perm.name.en} requires ${depId}`)
          }
        }
      }
    }
    return warnings
  }
}

// Required by Next.js Pages Router — this file is not a page
export default function _NotAPage() { return null }
