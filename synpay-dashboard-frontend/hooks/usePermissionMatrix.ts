'use client'

/**
 * React hook for Permission Matrix state management.
 *
 * Toggles are applied locally first. Changes are only persisted
 * to the server when `saveChanges()` is called (batch save).
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import {
  fetchPermissionMatrix,
  togglePermission,
  fetchPermissionSummary,
  type PermissionMatrixData,
  type PermissionSummaryData,
  type TogglePermissionPayload,
} from '@/api/permission-matrix'

// ── Hook State ───────────────────────────────────────────────────

interface UsePermissionMatrixState {
  /** The permission matrix with local (unsaved) edits applied. */
  matrix: PermissionMatrixData | null
  /** Per-role permission summary (null until explicitly loaded). */
  summary: PermissionSummaryData | null
  /** True during initial load or refresh. */
  isLoading: boolean
  /** Error message from the last failed operation. */
  error: string | null
  /** True while save requests are in flight. */
  isSaving: boolean
}

export interface UsePermissionMatrixReturn extends UsePermissionMatrixState {
  /** Reload the permission matrix from the API (discards unsaved changes). */
  refresh: () => Promise<void>
  /** Toggle a permission locally (no API call). */
  localToggle: (roleId: number, domain: string, action: string, enabled: boolean) => void
  /** Discard all unsaved local changes. */
  discardChanges: () => void
  /** Persist all pending changes to the server one-by-one. */
  saveChanges: () => Promise<void>
  /** Whether there are unsaved local changes. */
  hasChanges: boolean
  /** Number of pending change operations. */
  pendingCount: number
  /** Load permission summary for a specific role. */
  loadSummary: (roleId: number) => Promise<PermissionSummaryData>
  /** Clear the current error. */
  clearError: () => void
  /** Clear the loaded summary. */
  clearSummary: () => void
}

// ── Hook ─────────────────────────────────────────────────────────

/**
 * Hook to manage permission matrix and RBAC configuration.
 * Waits for authentication to be verified before fetching.
 */
export function usePermissionMatrix(skipAuthCheck = false): UsePermissionMatrixReturn {
  const auth = useAuth()
  const [state, setState] = useState<UsePermissionMatrixState>({
    matrix: null,
    summary: null,
    isLoading: true,
    error: null,
    isSaving: false,
  })

  /** The server-side matrix (source of truth before local edits). */
  const serverMatrixRef = useRef<PermissionMatrixData | null>(null)

  /**
   * Pending changes keyed by "roleId:domain.action" → enabled.
   * Only changes that differ from the server state are tracked.
   */
  const [pendingChanges, setPendingChanges] = useState<Map<string, TogglePermissionPayload>>(new Map())

  const mountedRef = useRef(true)
  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  // ── Refresh ──────────────────────────────────────────────────

  const refresh = useCallback(async () => {
    setState((s) => ({ ...s, isLoading: true, error: null }))
    try {
      const matrix = await fetchPermissionMatrix()
      if (mountedRef.current) {
        serverMatrixRef.current = matrix
        setPendingChanges(new Map())
        setState((s) => ({ ...s, matrix, isLoading: false }))
      }
    } catch (err) {
      if (mountedRef.current) {
        const message = err instanceof Error ? err.message : 'Failed to load permission matrix'
        setState((s) => ({ ...s, isLoading: false, error: message }))
      }
    }
  }, [])

  // Auto-load on mount
  useEffect(() => { 
    if (skipAuthCheck || (!auth.isLoading && auth.isAuthenticated)) {
      refresh()
    }
  }, [skipAuthCheck, auth.isLoading, auth.isAuthenticated, refresh])

  // ── Local Toggle (no API call) ───────────────────────────────

  const localToggle = useCallback((roleId: number, domain: string, action: string, enabled: boolean) => {
    const permKey = `${domain}.${action}`
    const changeKey = `${roleId}:${permKey}`

    // Check if this reverts back to the server value
    const serverValue = serverMatrixRef.current?.roles
      .find((r) => r.roleId === roleId)
      ?.permissions[permKey] ?? false

    setPendingChanges((prev) => {
      const next = new Map(prev)
      if (enabled === serverValue) {
        // Reverts to server state — remove from pending
        next.delete(changeKey)
      } else {
        next.set(changeKey, { roleId, domain, action, enabled })
      }
      return next
    })

    // Update the displayed matrix optimistically
    setState((s) => {
      if (!s.matrix) return s
      const updatedRoles = s.matrix.roles.map((role) => {
        if (role.roleId !== roleId) return role
        return {
          ...role,
          permissions: { ...role.permissions, [permKey]: enabled },
        }
      })
      return { ...s, matrix: { ...s.matrix, roles: updatedRoles } }
    })
  }, [])

  // ── Discard Changes ──────────────────────────────────────────

  const discardChanges = useCallback(() => {
    if (serverMatrixRef.current) {
      setState((s) => ({ ...s, matrix: serverMatrixRef.current }))
    }
    setPendingChanges(new Map())
  }, [])

  // ── Save Changes (batch) ─────────────────────────────────────

  const saveChanges = useCallback(async () => {
    const changes = Array.from(pendingChanges.values())
    if (changes.length === 0) return

    setState((s) => ({ ...s, isSaving: true, error: null }))

    let lastMatrix: PermissionMatrixData | null = null
    const errors: string[] = []

    for (const payload of changes) {
      try {
        lastMatrix = await togglePermission(payload)
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to save'
        errors.push(`${payload.domain}.${payload.action}: ${msg}`)
      }
    }

    if (mountedRef.current) {
      if (errors.length > 0) {
        // Partial failure — refresh to get actual server state
        setState((s) => ({
          ...s,
          isSaving: false,
          error: `${errors.length} change(s) failed: ${errors.join('; ')}`,
        }))
        // Refresh to sync with server
        await refresh()
      } else if (lastMatrix) {
        // All succeeded — update server ref and clear pending
        serverMatrixRef.current = lastMatrix
        setPendingChanges(new Map())
        setState((s) => ({ ...s, matrix: lastMatrix, isSaving: false }))
      } else {
        setState((s) => ({ ...s, isSaving: false }))
      }
    }
  }, [pendingChanges, refresh])

  // ── Load Summary ─────────────────────────────────────────────

  const loadSummary = useCallback(async (roleId: number): Promise<PermissionSummaryData> => {
    try {
      const summary = await fetchPermissionSummary(roleId)
      if (mountedRef.current) setState((s) => ({ ...s, summary }))
      return summary
    } catch (err) {
      if (mountedRef.current) {
        const message = err instanceof Error ? err.message : 'Failed to load permission summary'
        setState((s) => ({ ...s, error: message }))
      }
      throw err
    }
  }, [])

  // ── Utility ──────────────────────────────────────────────────

  const clearError = useCallback(() => setState((s) => ({ ...s, error: null })), [])
  const clearSummary = useCallback(() => setState((s) => ({ ...s, summary: null })), [])

  return {
    ...state,
    refresh,
    localToggle,
    discardChanges,
    saveChanges,
    hasChanges: pendingChanges.size > 0,
    pendingCount: pendingChanges.size,
    loadSummary,
    clearError,
    clearSummary,
  }
}
