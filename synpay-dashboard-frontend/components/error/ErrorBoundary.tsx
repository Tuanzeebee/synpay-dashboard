"use client"

import { Component, ReactNode, ErrorInfo } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <Card className="p-8 m-4 text-center">
          <div className="flex flex-col items-center gap-4">
            <AlertTriangle className="w-16 h-16 text-rose-500" />
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Đã xảy ra lỗi
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              {this.state.error?.message || 'Có gì đó không đúng. Vui lòng thử lại.'}
            </p>
            <Button
              onClick={() => {
                this.setState({ hasError: false })
                window.location.reload()
              }}
            >
              Tải lại trang
            </Button>
          </div>
        </Card>
      )
    }

    return this.props.children
  }
}
