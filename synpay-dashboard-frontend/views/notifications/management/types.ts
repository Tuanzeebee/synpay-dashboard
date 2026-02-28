import { Language } from '@/lib/translations'

export type AlertSeverity = 'critical' | 'high' | 'medium' | 'low'
export type AlertType = 'anniversary' | 'leave' | 'salary' | 'attendance' | 'system'
export type AlertStatus = 'unread' | 'read' | 'acknowledged'
export type TimeFilter = 'all' | 'today' | 'week' | 'month'

export interface Alert {
  id: string
  title: string
  description: string
  severity: AlertSeverity
  type: AlertType
  status: AlertStatus
  timestamp: Date
  employeeId?: string
  employeeName?: string
  department?: string
  metadata?: {
    [key: string]: string | number
  }
  suggestedActions?: string[]
}

export interface FilterOptions {
  severity: AlertSeverity | 'all'
  type: AlertType | 'all'
  status: AlertStatus | 'all'
  time: TimeFilter
}

export interface NotificationSettings {
  email: boolean
  push: boolean
  inApp: boolean
  criticalOnly: boolean
}

export interface AlertStatistics {
  critical: number
  high: number
  info: number
  acknowledged: number
}

export interface NotificationsData {
  alerts: Alert[]
  statistics: AlertStatistics
  settings: NotificationSettings
}

// Required by Next.js Pages Router — this file is not a page
export default function _NotAPage() { return null }
