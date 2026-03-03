'use client'

import Sidebar from '../../../components/layout/Sidebar'
import Header from '../../../components/layout/Header'
import PermissionMatrix from '../security/components/PermissionMatrix'
import { usePermissionMatrix } from '@/hooks/usePermissionMatrix'
import { t } from '@/lib/translations'
import { useLanguage } from '@/components/providers/LanguageProvider'
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function PermissionMatrixPage() {
  const { language, toggleLanguage } = useLanguage()
  const {
    matrix, isLoading, isSaving, error, hasChanges, pendingCount,
    refresh, localToggle, saveChanges, discardChanges, clearError,
  } = usePermissionMatrix()

  return (
    <div className="flex w-full min-h-screen">
      <Sidebar language={language} t={(key) => t(key, language)} activeRoute="/rbac/permissions" />

      <main className="flex-1 flex flex-col min-w-0">
        <Header
          language={language}
          onLanguageToggle={toggleLanguage}
          onRefresh={refresh}
          t={(key) => t(key, language)}
        />

        <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 md:px-8 py-6">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
            {t('rbac.pageTitle.permissions', language)}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">{t('rbac.pageSubtitle.permissions', language)}</p>
        </div>

        <div className="flex-1 p-4 md:p-8 overflow-y-auto">
          {/* Error Banner */}
          {error && (
            <div className="mb-6 flex items-center gap-3 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-300 flex-1">{error}</p>
              <button onClick={clearError} className="text-red-500 hover:text-red-700 text-sm font-medium">
                {language === 'vi' ? 'Đóng' : 'Dismiss'}
              </button>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {language === 'vi' ? 'Đang tải ma trận quyền...' : 'Loading permission matrix...'}
              </p>
            </div>
          )}

          {/* Empty State (loaded but no data) */}
          {!isLoading && !matrix && !error && (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {language === 'vi' ? 'Không có dữ liệu ma trận quyền.' : 'No permission matrix data available.'}
              </p>
              <Button variant="outline" size="sm" onClick={refresh}>
                <RefreshCw className="w-4 h-4 mr-2" />
                {language === 'vi' ? 'Thử lại' : 'Retry'}
              </Button>
            </div>
          )}

          {/* Matrix */}
          {!isLoading && matrix && (
            <PermissionMatrix
              matrix={matrix}
              language={language}
              isSaving={isSaving}
              hasChanges={hasChanges}
              pendingCount={pendingCount}
              onTogglePermission={localToggle}
              onSaveChanges={saveChanges}
              onDiscardChanges={discardChanges}
            />
          )}
        </div>
      </main>
    </div>
  )
}
