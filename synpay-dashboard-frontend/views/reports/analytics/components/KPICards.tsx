import { Users, Banknote, CalendarOff, TrendingUp } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { KPIData } from '../types'
import { Language, t } from '@/lib/translations'

type Props = {
  data: KPIData
  language?: Language
}

export default function KPICards({ data, language = 'vi' }: Props) {
  const formatNumber = (num: number, decimals: number = 1): string => {
    return num.toFixed(decimals)
  }

  const formatCurrency = (num: number): string => {
    if (language === 'vi') {
      if (num >= 1000) return `${formatNumber(num / 1000)} tỷ`
      return `${formatNumber(num)} triệu`
    }
    // Convert triệu VND → USD (approx)
    if (num >= 1000) return `$${formatNumber(num * 0.00033)}M`
    return `$${formatNumber(num * 0.033)}K`
  }

  const formatAvgSalary = (num: number): string => {
    if (language === 'vi') {
      return `${formatNumber(num)} triệu`
    }
    return `$${formatNumber(num * 0.033)}K`
  }

  const cards = [
    {
      icon: Users,
      bgColor: 'bg-gradient-to-br from-white to-blue-50/30 dark:from-slate-800 dark:to-blue-900/10',
      iconBg: 'bg-blue-100 dark:bg-blue-900/30',
      iconColor: 'text-blue-600 dark:text-blue-400',
      title: t('reports.kpi.totalEmployees', language),
      value: data.totalEmployees.toString(),
      trend: data.growthRate,
      trendLabel: `+${formatNumber(data.growthRate)}% ${t('reports.kpi.growth', language)}`,
      trendColor: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      icon: Banknote,
      bgColor: 'bg-gradient-to-br from-white to-emerald-50/30 dark:from-slate-800 dark:to-emerald-900/10',
      iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      title: t('reports.kpi.totalSalary', language),
      value: formatCurrency(data.totalSalary),
      subtitle: `${t('reports.kpi.avgSalary', language)}: ${formatAvgSalary(data.avgSalary)}/${language === 'vi' ? 'người' : 'person'}`,
      trendColor: 'text-slate-500 dark:text-slate-400',
    },
    {
      icon: CalendarOff,
      bgColor: 'bg-gradient-to-br from-white to-amber-50/30 dark:from-slate-800 dark:to-amber-900/10',
      iconBg: 'bg-amber-100 dark:bg-amber-900/30',
      iconColor: 'text-amber-600 dark:text-amber-400',
      title: t('reports.kpi.totalLeave', language),
      value: data.totalLeave.toString(),
      trend: data.leaveChange,
      trendLabel: `${formatNumber(data.leaveChange)}% ${t('reports.kpi.growth', language)}`,
      trendColor: 'text-amber-600 dark:text-amber-400',
    },
    {
      icon: TrendingUp,
      bgColor: 'bg-gradient-to-br from-white to-purple-50/30 dark:from-slate-800 dark:to-purple-900/10',
      iconBg: 'bg-purple-100 dark:bg-purple-900/30',
      iconColor: 'text-purple-600 dark:text-purple-400',
      title: t('reports.kpi.dividend', language),
      value: formatCurrency(data.dividend),
      trend: data.dividendChange,
      trendLabel: `+${formatNumber(data.dividendChange)}% ${t('reports.kpi.quarter', language)}`,
      trendColor: 'text-emerald-600 dark:text-emerald-400',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card, index) => {
        const Icon = card.icon
        return (
          <Card
            key={index}
            className={`${card.bgColor} shadow-sm hover:shadow-md transition-all duration-300 border border-slate-200 dark:border-slate-700`}
          >
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    {card.title}
                  </span>
                  <div className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{card.value}</div>
                </div>
                <div className={`w-12 h-12 ${card.iconBg} rounded-xl flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${card.iconColor}`} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                {card.trendLabel && (
                  <span className={`text-xs font-semibold flex items-center gap-1 ${card.trendColor}`}>
                    {card.trend && card.trend > 0 && <TrendingUp className="w-3 h-3" />}
                    <span>{card.trendLabel}</span>
                  </span>
                )}
                {card.subtitle && <span className="text-xs text-slate-500 dark:text-slate-400">{card.subtitle}</span>}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
