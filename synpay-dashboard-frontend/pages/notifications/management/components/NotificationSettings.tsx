import { Mail, Smartphone, Bell, AlertCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { NotificationSettings as SettingsType } from '../types'
import { Language, t } from '@/lib/translations'

type Props = {
  settings: SettingsType
  onSettingsChange: (settings: SettingsType) => void
  language?: Language
}

export default function NotificationSettings({ settings, onSettingsChange, language = 'vi' }: Props) {
  const settingsOptions = [
    {
      icon: Mail,
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      iconColor: 'text-blue-600 dark:text-blue-400',
      title: t('settings.email', language),
      description: t('settings.emailDesc', language),
      key: 'email' as keyof SettingsType,
    },
    {
      icon: Smartphone,
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
      iconColor: 'text-purple-600 dark:text-purple-400',
      title: t('settings.push', language),
      description: t('settings.pushDesc', language),
      key: 'push' as keyof SettingsType,
    },
    {
      icon: Bell,
      bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      title: t('settings.inApp', language),
      description: t('settings.inAppDesc', language),
      key: 'inApp' as keyof SettingsType,
    },
    {
      icon: AlertCircle,
      bgColor: 'bg-red-100 dark:bg-red-900/30',
      iconColor: 'text-red-600 dark:text-red-400',
      title: t('settings.criticalOnly', language),
      description: t('settings.criticalOnlyDesc', language),
      key: 'criticalOnly' as keyof SettingsType,
    },
  ]

  return (
    <Card className="shadow-md mt-6">
      <div className="p-6 border-b border-slate-200 dark:border-slate-700">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          {t('settings.title', language)}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {t('settings.subtitle', language)}
        </p>
      </div>
      <div className="p-6 space-y-4">
        {settingsOptions.map((option) => {
          const Icon = option.icon
          const isEnabled = settings[option.key]

          return (
            <div
              key={option.key}
              className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 ${option.bgColor} rounded-lg flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${option.iconColor}`} />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white">{option.title}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{option.description}</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isEnabled}
                  onChange={(e) => {
                    onSettingsChange({
                      ...settings,
                      [option.key]: e.target.checked,
                    })
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
