"use client"

import { memo } from 'react'

interface SkeletonProps {
  className?: string
}

export const Skeleton = memo(({ className = '' }: SkeletonProps) => (
  <div className={`animate-pulse bg-slate-200 dark:bg-slate-700 rounded ${className}`} />
))
Skeleton.displayName = 'Skeleton'

export const CardSkeleton = memo(() => (
  <div className="bg-white dark:bg-slate-800 rounded-lg p-5 space-y-3">
    <Skeleton className="h-4 w-24" />
    <Skeleton className="h-8 w-32" />
    <Skeleton className="h-3 w-20" />
  </div>
))
CardSkeleton.displayName = 'CardSkeleton'

export const TableSkeleton = memo(() => (
  <div className="bg-white dark:bg-slate-800 rounded-lg p-6 space-y-4">
    <Skeleton className="h-6 w-48" />
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex gap-4">
          <Skeleton className="h-12 flex-1" />
          <Skeleton className="h-12 w-32" />
          <Skeleton className="h-12 w-24" />
        </div>
      ))}
    </div>
  </div>
))
TableSkeleton.displayName = 'TableSkeleton'

export const ChartSkeleton = memo(() => (
  <div className="bg-white dark:bg-slate-800 rounded-lg p-6 space-y-4">
    <Skeleton className="h-6 w-48" />
    <Skeleton className="h-64 w-full" />
  </div>
))
ChartSkeleton.displayName = 'ChartSkeleton'
