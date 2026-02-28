'use client'

import { useState, useCallback, useMemo, memo } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/components/providers/AuthProvider'
import { AuthError } from '@/lib/auth'
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  CheckCircle,
  AlertCircle,
  Zap,
  Star,
  ShieldCheck,
  Loader2,
} from 'lucide-react'

type Props = {}

// Constants extracted outside component to prevent re-creation
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const REDIRECT_DELAY = 1500

const STATS = [
  { value: '1.2K+', label: 'Nhân viên' },
  { value: '98%', label: 'Độ chính xác' },
  { value: '24/7', label: 'Hỗ trợ' },
] as const

const SECURITY_FEATURES = [
  { icon: ShieldCheck, label: 'SSL 256-bit', color: 'text-emerald-500', showIcon: true },
  { icon: Lock, label: 'Xác thực 2 lớp', color: 'text-blue-500', showIcon: true },
  { icon: ShieldCheck, label: 'ISO 27001', color: 'text-slate-400', showIcon: false },
] as const

const validateEmail = (email: string) => EMAIL_REGEX.test(email)

export default function LoginPage({}: Props) {
  const router = useRouter()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [emailError, setEmailError] = useState(false)
  const [passwordError, setPasswordError] = useState(false)
  const [loginError, setLoginError] = useState(false)
  const [loginErrorMessage, setLoginErrorMessage] = useState('')
  const [loginSuccess, setLoginSuccess] = useState(false)

  const handleLogin = useCallback(async () => {
    setEmailError(false)
    setPasswordError(false)
    setLoginError(false)
    setLoginErrorMessage('')
    setLoginSuccess(false)

    let valid = true

    if (!email || !validateEmail(email)) {
      setEmailError(true)
      valid = false
    }

    if (!password) {
      setPasswordError(true)
      valid = false
    }

    if (!valid) return

    setIsLoading(true)

    try {
      await login({ email, password })
      setLoginSuccess(true)
      setTimeout(() => {
        router.push('/dashboard')
      }, REDIRECT_DELAY)
    } catch (error) {
      setLoginError(true)

      if (error instanceof AuthError) {
        setLoginErrorMessage(error.message)
        // Only highlight fields for credential errors (409 = BusinessException)
        if (error.status === 409) {
          setEmailError(true)
          setPasswordError(true)
        }
      } else {
        setLoginErrorMessage('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.')
      }
    } finally {
      setIsLoading(false)
    }
  }, [email, password, router, login])

  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleLogin()
    }
  }, [handleLogin])

  const togglePassword = useCallback(() => {
    setShowPassword(prev => !prev)
  }, [])

  const toggleRememberMe = useCallback(() => {
    setRememberMe(prev => !prev)
  }, [])

  const buttonClassName = useMemo(() => 
    `w-full py-3.5 px-6 text-sm font-semibold flex items-center justify-center gap-2 shadow-lg transition-all ${
      loginSuccess
        ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700'
        : 'bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
    }`,
    [loginSuccess]
  )

  return (
    <div className="flex flex-col lg:flex-row min-h-screen">
      {/* LEFT PANEL */}
      <LeftPanel />

      {/* RIGHT PANEL */}
      <div className="w-full lg:w-[52%] flex items-center justify-center bg-white p-6 md:p-10 lg:p-16">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <MobileLogo />

          {/* Header */}
          <div className="mb-8 animate-fade-in-up opacity-0" style={{ animationDelay: '0.1s', animationFillMode: 'forwards' }}>
            <h2 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">
              Chào mừng trở lại
            </h2>
            <p className="text-slate-500 text-sm">
              Đăng nhập để tiếp tục quản lý hệ thống nhân sự của bạn.
            </p>
          </div>

          {/* Form */}
          <div className="space-y-5 animate-fade-in-up opacity-0" style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}>
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Email Công Ty
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="w-4 h-4 text-slate-400" />
                </div>
                <Input
                  type="email"
                  placeholder="ten.ho@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={handleKeyPress}
                  className={`pl-10 pr-4 py-3 bg-slate-50 border text-slate-900 text-sm placeholder:text-slate-400 focus:bg-white transition-all ${
                    emailError ? 'border-red-500 ring-2 ring-red-500/20' : 'border-slate-200'
                  }`}
                />
              </div>
              {emailError && (
                <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Vui lòng nhập email hợp lệ
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-slate-700">
                  Mật Khẩu
                </label>
                <a href="#" className="text-xs text-blue-600 font-semibold hover:text-blue-800 transition-colors">
                  Quên mật khẩu?
                </a>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="w-4 h-4 text-slate-400" />
                </div>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handleKeyPress}
                  className={`pl-10 pr-12 py-3 bg-slate-50 border text-slate-900 text-sm placeholder:text-slate-400 focus:bg-white transition-all ${
                    passwordError ? 'border-red-500 ring-2 ring-red-500/20' : 'border-slate-200'
                  }`}
                />
                <button
                  type="button"
                  onClick={togglePassword}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {passwordError && (
                <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Vui lòng nhập mật khẩu
                </p>
              )}
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <div
                  onClick={toggleRememberMe}
                  className={`w-5 h-5 border-2 rounded flex items-center justify-center cursor-pointer transition-all ${
                    rememberMe
                      ? 'bg-blue-600 border-blue-600'
                      : 'bg-white border-slate-300'
                  }`}
                  role="checkbox"
                  aria-checked={rememberMe}
                >
                  <CheckCircle
                    className={`w-3 h-3 text-white transition-opacity ${
                      rememberMe ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                </div>
                <span className="text-sm text-slate-600 font-medium">
                  Ghi nhớ đăng nhập
                </span>
              </label>
              <span className="text-xs text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full font-medium">
                30 ngày
              </span>
            </div>

            {/* Login Button */}
            <Button
              onClick={handleLogin}
              disabled={isLoading}
              className={buttonClassName}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang xác thực...</span>
                </>
              ) : loginSuccess ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Thành công!</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Đăng Nhập</span>
                </>
              )}
            </Button>

            {/* Error Alert */}
            {loginError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-700 text-sm font-semibold">Đăng nhập thất bại</p>
                  <p className="text-red-600 text-xs mt-0.5">
                    {loginErrorMessage || 'Email hoặc mật khẩu không chính xác. Vui lòng thử lại.'}
                  </p>
                </div>
              </div>
            )}

            {/* Success Alert */}
            {loginSuccess && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-emerald-700 text-sm font-semibold">Đăng nhập thành công!</p>
                  <p className="text-emerald-600 text-xs mt-0.5">
                    Đang chuyển hướng đến bảng điều khiển...
                  </p>
                </div>
              </div>
            )}

            {/* Divider */}
            <div className="flex items-center gap-4 pt-1">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-xs text-slate-400 font-medium whitespace-nowrap">
                hoặc tiếp tục với
              </span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            {/* Google SSO */}
            <Button
              variant="outline"
              className="w-full flex items-center justify-center gap-3 border border-slate-200 bg-white text-slate-700 font-semibold py-3 px-6 text-sm shadow-sm hover:bg-slate-50 transition-all"
            >
              <Image
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                alt="Google"
                width={20}
                height={20}
              />
              Đăng nhập với Google Workspace
            </Button>
          </div>

          {/* Register Link */}
          <div className="mt-8 text-center animate-fade-in-up opacity-0" style={{ animationDelay: '0.4s', animationFillMode: 'forwards' }}>
            <p className="text-sm text-slate-500">
              Chưa có tài khoản?
              <a href="/register" className="font-semibold text-blue-600 hover:text-blue-800 transition-colors ml-1">
                Yêu cầu cấp quyền truy cập
              </a>
            </p>
          </div>

          {/* Security Note */}
          <SecurityNote />
        </div>
      </div>
    </div>
  )
}

// Memoized sub-components to prevent unnecessary re-renders
const MobileLogo = memo(() => (
  <div className="flex items-center gap-3 mb-8 lg:hidden">
    <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-sm">
      <span className="font-bold text-white text-lg">H</span>
    </div>
    <span className="font-bold text-xl text-slate-900">HR Nexus</span>
  </div>
))
MobileLogo.displayName = 'MobileLogo'

const LeftPanel = memo(() => (
  <div className="relative w-full lg:w-[48%] flex flex-col justify-between p-8 md:p-12 overflow-hidden min-h-[360px] bg-gradient-to-br from-blue-900 via-blue-700 to-blue-500">
    {/* Background Effects */}
    <div className="absolute inset-0 opacity-60" 
      style={{
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)',
        backgroundSize: '28px 28px'
      }}
    />
    <div className="absolute -top-24 -left-24 w-80 h-80 bg-blue-400 rounded-full opacity-20 blur-[100px]" />
    <div className="absolute -bottom-32 -right-16 w-96 h-96 bg-indigo-300 rounded-full opacity-20 blur-[100px]" />
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-300 rounded-full opacity-10 blur-[100px]" />

    {/* Logo */}
    <div className="relative z-10 animate-fade-in-up opacity-0" style={{ animationDelay: '0.1s', animationFillMode: 'forwards' }}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg">
          <span className="font-bold text-blue-600 text-xl">H</span>
        </div>
        <span className="font-bold text-2xl text-white tracking-tight">HR Nexus</span>
      </div>
    </div>

    {/* Center Content */}
    <div className="relative z-10 my-10 lg:my-0">
      <div className="animate-fade-in-up opacity-0" style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}>
        <span className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/25 text-blue-100 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
          <Zap className="w-3.5 h-3.5 text-yellow-300" />
          Nền tảng quản lý nhân sự thế hệ mới
        </span>
      </div>

      <div className="animate-fade-in-up opacity-0" style={{ animationDelay: '0.3s', animationFillMode: 'forwards' }}>
        <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-tight mb-5 tracking-tight">
          Quản lý nhân sự<br />
          <span className="text-blue-200">thông minh hơn.</span>
        </h1>
        <p className="text-blue-100 text-base leading-relaxed max-w-sm opacity-90">
          Toàn bộ dữ liệu nhân sự, bảng lương và chấm công trong một nền tảng duy nhất. Tiết kiệm thời gian, tăng hiệu quả vận hành.
        </p>
      </div>

      {/* Stats */}
      <div className="mt-10 grid grid-cols-3 gap-4 animate-fade-in-up opacity-0" style={{ animationDelay: '0.4s', animationFillMode: 'forwards' }}>
        {STATS.map((stat, idx) => (
          <div key={idx} className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
            <div className="text-blue-200 text-xs">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>

    {/* Testimonial */}
    <Testimonial />
  </div>
))
LeftPanel.displayName = 'LeftPanel'

const Testimonial = memo(() => (
  <div className="relative z-10 animate-fade-in-up opacity-0" style={{ animationDelay: '0.5s', animationFillMode: 'forwards' }}>
    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-5 max-w-sm">
      <div className="flex items-start gap-3 mb-3">
        <Image 
          src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=64&h=64&q=80" 
          alt="Nguyễn Thị Lan"
          width={40}
          height={40}
          className="rounded-full border-2 border-white/30 shrink-0"
        />
        <div>
          <div className="text-white font-semibold text-sm">Nguyễn Thị Lan</div>
          <div className="text-blue-200 text-xs">Giám đốc Nhân sự, TechCorp VN</div>
        </div>
      </div>
      <p className="text-blue-100 text-sm leading-relaxed italic opacity-90">
        &quot;HR Nexus giúp chúng tôi tiết kiệm hơn 15 giờ mỗi tuần trong việc xử lý bảng lương và báo cáo nhân sự.&quot;
      </p>
      <div className="flex gap-1 mt-3">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
        ))}
      </div>
    </div>
  </div>
))
Testimonial.displayName = 'Testimonial'

const SecurityNote = memo(() => (
  <div className="mt-5 flex items-center justify-center gap-4 animate-fade-in-up opacity-0" style={{ animationDelay: '0.5s', animationFillMode: 'forwards' }}>
    {SECURITY_FEATURES.map((feature, idx) => (
      <div key={idx} className="flex items-center gap-1.5 text-xs text-slate-400">
        {feature.showIcon && <feature.icon className={`w-3.5 h-3.5 ${feature.color}`} />}
        {!feature.showIcon && idx > 0 && <span className="text-slate-300">•</span>}
        <span>{feature.label}</span>
      </div>
    ))}
  </div>
))
SecurityNote.displayName = 'SecurityNote'
