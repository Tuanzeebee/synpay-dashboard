'use client'

import Sidebar from '../../../components/layout/Sidebar'
import Header from '../../../components/layout/Header'
import AuditLog from '../security/components/AuditLog'
import { useAuditLogs } from '@/hooks/useAuditLogs'
import { t } from '@/lib/translations'
import { useLanguage } from '@/components/providers/LanguageProvider'

export default function AuditLogPage() {
  const { language, toggleLanguage } = useLanguage()
  const {
    data,
    isLoading,
    isExporting,
    error,
    filter,
    setFilter,
    resetFilter,
    goToPage,
    refresh,
    exportCsv,
    clearError,
  } = useAuditLogs()

  return (
    <div className="flex w-full min-h-screen">
      <Sidebar language={language} t={(key) => t(key, language)} activeRoute="/rbac/audit" />

      <main className="flex-1 flex flex-col min-w-0">
        <Header
          language={language}
          onLanguageToggle={toggleLanguage}
          onRefresh={refresh}
          t={(key) => t(key, language)}
        />

        <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 md:px-8 py-6">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
            {t('rbac.pageTitle.audit', language)}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">{t('rbac.pageSubtitle.audit', language)}</p>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mx-4 md:mx-8 mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center justify-between">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            <button
              onClick={clearError}
              className="text-red-500 hover:text-red-700 dark:hover:text-red-300 text-sm font-medium"
            >
              {language === 'vi' ? 'Đóng' : 'Dismiss'}
            </button>
          </div>
        )}

        <div className="flex-1 p-4 md:p-8 overflow-y-auto">
          <AuditLog
            entries={data?.content ?? []}
            totalElements={data?.totalElements ?? 0}
            totalPages={data?.totalPages ?? 0}
            currentPage={data?.page ?? 0}
            pageSize={data?.size ?? 20}
            filter={filter}
            language={language}
            isLoading={isLoading}
            isExporting={isExporting}
            onFilterChange={setFilter}
            onResetFilter={resetFilter}
            onGoToPage={goToPage}
            onExport={exportCsv}
            onRefresh={refresh}
          />
        </div>
      </main>
    </div>
  )
}
