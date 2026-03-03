'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import {
  fetchUsers,
  createUser,
  updateUser,
  type ApiUserResponse,
  type CreateUserPayload,
  type UpdateUserPayload,
  type ApiError,
} from '@/api/users'

// ── Hook State ───────────────────────────────────────────────────

interface UseUsersState {
  users: ApiUserResponse[]
  isLoading: boolean
  error: string | null
  /** Currently executing a create/update mutation */
  isSaving: boolean
}

interface UseUsersReturn extends UseUsersState {
  /** Reload the user list from the API */
  refresh: () => Promise<void>
  /** Create a new user. Returns the created user on success. */
  create: (payload: CreateUserPayload) => Promise<void>
  /** Update an existing user. Returns the updated user on success. */
  update: (id: number, payload: UpdateUserPayload) => Promise<void>
  /** Toggle a user's status between active/inactive */
  toggleStatus: (user: ApiUserResponse) => Promise<void>
  /** Clear the current error */
  clearError: () => void
}

// ── Hook ─────────────────────────────────────────────────────────

export function useUsers(): UseUsersReturn {
  const [state, setState] = useState<UseUsersState>({
    users: [],
    isLoading: true,
    error: null,
    isSaving: false,
  })

  const mountedRef = useRef(true)
  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  // ── Load all users ──────────────────────────────────────────

  const refresh = useCallback(async () => {
    setState((s) => ({ ...s, isLoading: true, error: null }))
    try {
      const users = await fetchUsers()
      if (mountedRef.current) {
        setState((s) => ({ ...s, users, isLoading: false }))
      }
    } catch (err) {
      if (mountedRef.current) {
        const message = err instanceof Error ? err.message : 'Failed to load users'
        setState((s) => ({ ...s, isLoading: false, error: message }))
      }
    }
  }, [])

  // Load on mount
  useEffect(() => { refresh() }, [refresh])

  // ── Create user ─────────────────────────────────────────────

  const create = useCallback(async (payload: CreateUserPayload) => {
    setState((s) => ({ ...s, isSaving: true, error: null }))
    try {
      await createUser(payload)
      if (mountedRef.current) {
        setState((s) => ({ ...s, isSaving: false }))
        await refresh()
      }
    } catch (err) {
      if (mountedRef.current) {
        const message = err instanceof Error ? err.message : 'Failed to create user'
        setState((s) => ({ ...s, isSaving: false, error: message }))
      }
      throw err
    }
  }, [refresh])

  // ── Update user ─────────────────────────────────────────────

  const update = useCallback(async (id: number, payload: UpdateUserPayload) => {
    setState((s) => ({ ...s, isSaving: true, error: null }))
    try {
      await updateUser(id, payload)
      if (mountedRef.current) {
        setState((s) => ({ ...s, isSaving: false }))
        await refresh()
      }
    } catch (err) {
      if (mountedRef.current) {
        const message = err instanceof Error ? err.message : 'Failed to update user'
        setState((s) => ({ ...s, isSaving: false, error: message }))
      }
      throw err
    }
  }, [refresh])

  // ── Toggle status ───────────────────────────────────────────

  const toggleStatus = useCallback(async (user: ApiUserResponse) => {
    const newStatus = user.status === 'active' ? 'inactive' : 'active'
    await update(user.accountId, { status: newStatus })
  }, [update])

  // ── Clear error ─────────────────────────────────────────────

  const clearError = useCallback(() => {
    setState((s) => ({ ...s, error: null }))
  }, [])

  return {
    ...state,
    refresh,
    create,
    update,
    toggleStatus,
    clearError,
  }
}
