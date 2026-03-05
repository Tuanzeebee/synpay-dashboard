'use client'

import { useState, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { RefreshCw, AlertCircle, X } from 'lucide-react'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import StatsCards from './components/StatsCards'
import DepartmentsList from './components/DepartmentsList'
import PositionsList from './components/PositionsList'
import DepartmentFormModal from './components/DepartmentFormModal'
import PositionFormModal from './components/PositionFormModal'
import DeleteConfirmModal from './components/DeleteConfirmModal'
import { useLanguage } from '@/components/providers/LanguageProvider'
import { useDepartments } from '@/hooks/useDepartments'
import { usePositions } from '@/hooks/usePositions'
import type { Department, Position, DepartmentStats, DepartmentFormData, PositionFormData } from './types'

export default function DepartmentManagement() {
  const { language, toggleLanguage, t: translate } = useLanguage()
  const [showDepartmentModal, setShowDepartmentModal] = useState(false)
  const [showPositionModal, setShowPositionModal] = useState(false)
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null)
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'department' | 'position'; item: Department | Position } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // ── API hooks ────────────────────────────────────────────────

  const {
    departments,
    totalElements: totalDepartments,
    isLoading: isLoadingDepts,
    isSaving: isSavingDept,
    error: deptError,
    refresh: refreshDepts,
    create: createDept,
    update: updateDept,
    remove: removeDept,
    clearError: clearDeptError,
  } = useDepartments({ page: 0, size: 100 })

  const {
    positions,
    totalElements: totalPositions,
    isLoading: isLoadingPos,
    isSaving: isSavingPos,
    error: posError,
    refresh: refreshPos,
    create: createPos,
    update: updatePos,
    remove: removePos,
    clearError: clearPosError,
  } = usePositions({ page: 0, size: 100 })

  // ── Derived stats ────────────────────────────────────────────

  const stats = useMemo<DepartmentStats>(() => ({
    totalDepartments,
    totalPositions,
  }), [totalDepartments, totalPositions])

  // ── Refresh ──────────────────────────────────────────────────

  const handleRefresh = useCallback(async () => {
    await Promise.all([refreshDepts(), refreshPos()])
  }, [refreshDepts, refreshPos])

  // ── Department handlers ──────────────────────────────────────

  const handleAddDepartment = useCallback(() => {
    setSelectedDepartment(null)
    setShowDepartmentModal(true)
  }, [])

  const handleEditDepartment = useCallback((dept: Department) => {
    setSelectedDepartment(dept)
    setShowDepartmentModal(true)
  }, [])

  const handleSaveDepartment = useCallback(async (data: DepartmentFormData) => {
    try {
      if (selectedDepartment) {
        await updateDept(selectedDepartment.id, {
          departmentName: data.name,
        })
      } else {
        await createDept({
          departmentName: data.name,
        })
      }
      setShowDepartmentModal(false)
    } catch { /* error handled by hook, modal stays open */ }
  }, [selectedDepartment, createDept, updateDept])

  // ── Position handlers ────────────────────────────────────────

  const handleAddPosition = useCallback(() => {
    setSelectedPosition(null)
    setShowPositionModal(true)
  }, [])

  const handleEditPosition = useCallback((pos: Position) => {
    setSelectedPosition(pos)
    setShowPositionModal(true)
  }, [])

  const handleSavePosition = useCallback(async (data: PositionFormData) => {
    try {
      if (selectedPosition) {
        await updatePos(selectedPosition.id, {
          positionName: data.name,
        })
      } else {
        await createPos({
          positionName: data.name,
        })
      }
      setShowPositionModal(false)
    } catch { /* error handled by hook, modal stays open */ }
  }, [selectedPosition, createPos, updatePos])

  // ── Delete handlers ──────────────────────────────────────────

  const handleDeleteDepartment = useCallback((dept: Department) => {
    setDeleteTarget({ type: 'department', item: dept })
  }, [])

  const handleDeletePosition = useCallback((pos: Position) => {
    setDeleteTarget({ type: 'position', item: pos })
  }, [])

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      if (deleteTarget.type === 'department') {
        await removeDept(deleteTarget.item.id)
      } else {
        await removePos(deleteTarget.item.id)
      }
      setDeleteTarget(null)
    } catch { /* error handled by hook */ }
    setIsDeleting(false)
  }, [deleteTarget, removeDept, removePos])

  // ── Aggregate state ──────────────────────────────────────────

  const error = deptError || posError
  const isLoading = isLoadingDepts || isLoadingPos

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Sidebar */}
      <Sidebar language={language} t={translate} activeRoute="/departments" />

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <Header language={language} onLanguageToggle={toggleLanguage} t={translate} />

        {/* Title Section */}
        <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 md:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                {language === 'vi' ? 'Phòng Ban & Chức Vụ' : 'Departments & Positions'}
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {language === 'vi'
                  ? 'Cấu trúc tổ chức và vị trí công việc'
                  : 'Organization structure and job positions'}
              </p>
            </div>
            <Button
              onClick={handleRefresh}
              variant="outline"
              disabled={isLoading}
              className="text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 border-blue-200 dark:border-blue-800"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{language === 'vi' ? 'Làm Mới' : 'Refresh'}</span>
            </Button>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mx-4 md:mx-8 mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-sm text-red-700 dark:text-red-400">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1">{error}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => { clearDeptError(); clearPosError() }}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 p-4 md:p-8 overflow-y-auto">
          <StatsCards stats={stats} language={language} />

          {/* Split Panel Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DepartmentsList
              departments={departments as Department[]}
              language={language}
              isLoading={isLoadingDepts}
              onAdd={handleAddDepartment}
              onEdit={handleEditDepartment}
              onDelete={handleDeleteDepartment}
            />

            <PositionsList
              positions={positions as Position[]}
              language={language}
              isLoading={isLoadingPos}
              onAdd={handleAddPosition}
              onEdit={handleEditPosition}
              onDelete={handleDeletePosition}
            />
          </div>
        </div>
      </main>

      {/* Modals */}
      <DepartmentFormModal
        isOpen={showDepartmentModal}
        onClose={() => setShowDepartmentModal(false)}
        onSave={handleSaveDepartment}
        department={selectedDepartment}
        language={language}
        isSaving={isSavingDept}
      />

      <PositionFormModal
        isOpen={showPositionModal}
        onClose={() => setShowPositionModal(false)}
        onSave={handleSavePosition}
        position={selectedPosition}
        language={language}
        isSaving={isSavingPos}
      />

      <DeleteConfirmModal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title={
          deleteTarget?.type === 'department'
            ? (language === 'vi' ? 'Xóa Phòng Ban' : 'Delete Department')
            : (language === 'vi' ? 'Xóa Chức Vụ' : 'Delete Position')
        }
        message={
          deleteTarget?.type === 'department'
            ? (language === 'vi'
              ? 'Bạn có chắc chắn muốn xóa phòng ban này? Hành động này không thể hoàn tác.'
              : 'Are you sure you want to delete this department? This action cannot be undone.')
            : (language === 'vi'
              ? 'Bạn có chắc chắn muốn xóa chức vụ này? Hành động này không thể hoàn tác.'
              : 'Are you sure you want to delete this position? This action cannot be undone.')
        }
        itemName={deleteTarget?.item.name ?? ''}
        language={language}
        isDeleting={isDeleting}
      />
    </div>
  )
}
