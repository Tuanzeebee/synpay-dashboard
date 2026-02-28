import { AlertCircle, AlertTriangle, Info, CheckCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { AlertStatistics } from '../types'
import { Language, t } from '@/lib/translations'

type Props = {
  statistics: AlertStatistics
  language?: Language
}

export default function StatisticsCards({ statistics, language = 'vi' }: Props) {
  const cards = [
    {
      icon: AlertCircle,
      bgColor: 'bg-red-100 dark:bg-red-900/30',
      iconColor: 'text-red-600 dark:text-red-400',
      labelColor: 'text-red-600 dark:text-red-400',
      label: t('severity.critical', language).toUpperCase(),
      value: statistics.critical,
      description: t('stats.criticalAlerts', language),
    },
    {
      icon: AlertTriangle,
      bgColor: 'bg-amber-100 dark:bg-amber-900/30',
      iconColor: 'text-amber-600 dark:text-amber-400',
      labelColor: 'text-amber-600 dark:text-amber-400',
      label: t('severity.high', language).toUpperCase(),
      value: statistics.high,
      description: t('stats.highAlerts', language),
    },
    {
      icon: Info,
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      iconColor: 'text-blue-600 dark:text-blue-400',
      labelColor: 'text-blue-600 dark:text-blue-400',
      label: t('stats.infoNotifications', language),
      value: statistics.info,
      description: t('stats.infoNotifications', language),
    },
    {
      icon: CheckCircle,
      bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      labelColor: 'text-emerald-600 dark:text-emerald-400',
      label: t('stats.processed', language).toUpperCase(),
      value: statistics.acknowledged,
      description: t('stats.acknowledged', language),
    },
  ]

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card, index) => {
        const Icon = card.icon
        return (
          <Card key={index} className="shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 ${card.bgColor} rounded-lg flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${card.iconColor}`} />
                </div>
                <span className={`text-xs font-semibold ${card.labelColor} uppercase`}>
                  {card.label}
                </span>
              </div>
              <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
                {card.value}
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {card.description}
              </p>
            </CardContent>
          </Card>
        )
      })}
    </section>
  )
}
