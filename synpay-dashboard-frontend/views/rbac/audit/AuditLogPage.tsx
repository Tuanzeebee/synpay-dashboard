'use client'

import { useState } from 'react'
import Sidebar from '../../../components/layout/Sidebar'
import Header from '../../../components/layout/Header'
import AuditLog from '../security/components/AuditLog'
import { getMockAuditLogs } from '../security/data'
import type { AuditLog as AuditLogType } from '../security/types'
import { t } from '@/lib/translations'
import { useLanguage } from '@/components/providers/LanguageProvider'

export default function AuditLogPage() {
  const { language, toggleLanguage } = useLanguage()
  const [auditLogs, setAuditLogs] = useState<AuditLogType[]>(getMockAuditLogs())

  const handleExportAuditLog = () => {
    alert(language === 'vi' ? 'Đã xuất nhật ký kiểm toán!' : 'Audit log exported!')
  }

  return (
    <div className="flex w-full min-h-screen">
      <Sidebar language={language} t={(key) => t(key, language)} activeRoute="/rbac/audit" />

      <main className="flex-1 flex flex-col min-w-0">
        <Header
          language={language}
          onLanguageToggle={toggleLanguage}
          onRefresh={() => {
            setAuditLogs(getMockAuditLogs())
          }}
          t={(key) => t(key, language)}
        />

        <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 md:px-8 py-6">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
            {t('rbac.pageTitle.audit', language)}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">{t('rbac.pageSubtitle.audit', language)}</p>
        </div>

        <div className="flex-1 p-4 md:p-8 overflow-y-auto">
          <AuditLog auditLogs={auditLogs} language={language} onExport={handleExportAuditLog} />
        </div>
      </main>
    </div>
  )
}
