'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import {
  fetchRoles,
  fetchRole,
  createRole,
  updateRole,
  assignPermissions,
  type ApiRoleResponse,
  type CreateRolePayload,
  type UpdateRolePayload,
  type AssignPermissionsPayload,
} from '@/api/roles'

// ── Hook State ───────────────────────────────────────────────────

interface UseRolesState {
  roles: ApiRoleResponse[]
  selectedRole: ApiRoleResponse | null
  isLoading: boolean
  error: string | null
  isSaving: boolean
}

interface UseRolesReturn extends UseRolesState {
  refresh: () => Promise<void>
  loadDetail: (roleId: number) => Promise<ApiRoleResponse>
  create: (payload: CreateRolePayload) => Promise<void>
  update: (id: number, payload: UpdateRolePayload) => Promise<void>
  updatePermissions: (roleId: number, payload: AssignPermissionsPayload) => Promise<void>
  clearError: () => void
  clearSelectedRole: () => void
}

// ── Hook ─────────────────────────────────────────────────────────

export function useRoles(): UseRolesReturn {
  const [state, setState] = useState<UseRolesState>({
    roles: [],
    selectedRole: null,
    isLoading: true,
    error: null,
    isSaving: false,
  })

  const mountedRef = useRef(true)
  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  // ── List roles ─────────────────────────────────────────────────

  const refresh = useCallback(async () => {
    setState((s) => ({ ...s, isLoading: true, error: null }))
    try {
      const roles = await fetchRoles()
      if (mountedRef.current) setState((s) => ({ ...s, roles, isLoading: false }))
    } catch (err) {
      if (mountedRef.current) {
        const message = err instanceof Error ? err.message : 'Failed to load roles'
        setState((s) => ({ ...s, isLoading: false, error: message }))
      }
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  // ── Load role detail (with permissions) ────────────────────────

  const loadDetail = useCallback(async (roleId: number): Promise<ApiRoleResponse> => {
    try {
      const detail = await fetchRole(roleId)
      if (mountedRef.current) setState((s) => ({ ...s, selectedRole: detail }))
      return detail
    } catch (err) {
      if (mountedRef.current) {
        const message = err instanceof Error ? err.message : 'Failed to load role detail'
        setState((s) => ({ ...s, error: message }))
      }
      throw err
    }
  }, [])

  // ── Create role ────────────────────────────────────────────────

  const create = useCallback(async (payload: CreateRolePayload) => {
    setState((s) => ({ ...s, isSaving: true, error: null }))
    try {
      await createRole(payload)
      if (mountedRef.current) {
        setState((s) => ({ ...s, isSaving: false }))
        await refresh()
      }
    } catch (err) {
      if (mountedRef.current) {
        const message = err instanceof Error ? err.message : 'Failed to create role'
        setState((s) => ({ ...s, isSaving: false, error: message }))
      }
      throw err
    }
  }, [refresh])

  // ── Update role ────────────────────────────────────────────────

  const update = useCallback(async (id: number, payload: UpdateRolePayload) => {
    setState((s) => ({ ...s, isSaving: true, error: null }))
    try {
      await updateRole(id, payload)
      if (mountedRef.current) {
        setState((s) => ({ ...s, isSaving: false }))
        await refresh()
      }
    } catch (err) {
      if (mountedRef.current) {
        const message = err instanceof Error ? err.message : 'Failed to update role'
        setState((s) => ({ ...s, isSaving: false, error: message }))
      }
      throw err
    }
  }, [refresh])

  // ── Assign permissions ─────────────────────────────────────────

  const updatePermissions = useCallback(async (roleId: number, payload: AssignPermissionsPayload) => {
    setState((s) => ({ ...s, isSaving: true, error: null }))
    try {
      const updated = await assignPermissions(roleId, payload)
      if (mountedRef.current) {
        setState((s) => ({ ...s, isSaving: false, selectedRole: updated }))
        await refresh()
      }
    } catch (err) {
      if (mountedRef.current) {
        const message = err instanceof Error ? err.message : 'Failed to assign permissions'
        setState((s) => ({ ...s, isSaving: false, error: message }))
      }
      throw err
    }
  }, [refresh])

  // ── Utilities ──────────────────────────────────────────────────

  const clearError = useCallback(() => {
    setState((s) => ({ ...s, error: null }))
  }, [])

  const clearSelectedRole = useCallback(() => {
    setState((s) => ({ ...s, selectedRole: null }))
  }, [])

  return {
    ...state,
    refresh,
    loadDetail,
    create,
    update,
    updatePermissions,
    clearError,
    clearSelectedRole,
  }
}
