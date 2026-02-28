'use client'

import { useState, useCallback, useMemo, memo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  User,
  Mail,
  Phone,
  Badge as BadgeIcon,
  Building2,
  Briefcase,
  Eye,
  Users,
  Banknote,
  Crown,
  ArrowRight,
  ArrowLeft,
  Send,
  ClipboardList,
  ShieldCheck,
  FlaskConical,
  FileText,
  UserCheck,
  MailCheck,
  Info,
  Check,
  AlertCircle,
  Clock,
  Plus,
  LogIn,
  Loader2,
} from 'lucide-react'

type Props = {}

type FormData = {
  lastName: string
  firstName: string
  workEmail: string
  phone: string
  empId: string
  department: string
  position: string
  role: string
  adminNote: string
}

type RoleOption = {
  id: string
  icon: typeof Eye
  title: string
  badge: string
  badgeColor: string
  iconColor: string
  description: string
}

// Constants extracted outside component to prevent re-creation
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const SUBMIT_DELAY = 2000

const DEPARTMENTS = [
  { value: '', label: '-- Chọn phòng ban --' },
  { value: 'engineering', label: 'Kỹ Thuật & Công Nghệ' },
  { value: 'sales', label: 'Kinh Doanh' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'hr', label: 'Nhân Sự (HR)' },
  { value: 'finance', label: 'Tài Chính & Kế Toán' },
  { value: 'support', label: 'Hỗ Trợ Khách Hàng' },
  { value: 'operations', label: 'Vận Hành' },
  { value: 'legal', label: 'Pháp Lý' },
] as const

const ROLES: RoleOption[] = [
  {
    id: 'viewer',
    icon: Eye,
    title: 'Người Xem (Viewer)',
    badge: 'Cơ bản',
    badgeColor: 'bg-slate-100 text-slate-500',
    iconColor: 'bg-slate-100 text-slate-500',
    description: 'Chỉ xem báo cáo và thông tin nhân sự. Không thể chỉnh sửa dữ liệu.',
  },
  {
    id: 'hr_staff',
    icon: Users,
    title: 'Nhân Viên HR',
    badge: 'Tiêu chuẩn',
    badgeColor: 'bg-blue-100 text-blue-600',
    iconColor: 'bg-blue-100 text-blue-600',
    description: 'Quản lý nhân viên, chấm công, nghỉ phép. Không truy cập bảng lương.',
  },
  {
    id: 'payroll_officer',
    icon: Banknote,
    title: 'Cán Bộ Lương',
    badge: 'Nâng cao',
    badgeColor: 'bg-emerald-100 text-emerald-600',
    iconColor: 'bg-emerald-100 text-emerald-600',
    description: 'Xử lý bảng lương, phúc lợi và các khoản chi trả. Yêu cầu phê duyệt đặc biệt.',
  },
  {
    id: 'manager',
    icon: Crown,
    title: 'Quản Lý (Manager)',
    badge: 'Cao cấp',
    badgeColor: 'bg-purple-100 text-purple-600',
    iconColor: 'bg-purple-100 text-purple-600',
    description: 'Toàn quyền quản lý nhân sự, phê duyệt và xem báo cáo tổng hợp.',
  },
]

const PROCESS_STEPS = [
  { icon: FileText, title: 'Điền thông tin yêu cầu', desc: 'Cung cấp thông tin cá nhân & vai trò' },
  { icon: UserCheck, title: 'Quản trị viên xét duyệt', desc: 'Xem xét và phân quyền phù hợp' },
  { icon: MailCheck, title: 'Nhận thông tin đăng nhập', desc: 'Tài khoản gửi qua email công ty' },
] as const

const STEP_LABELS = [
  { num: 1, label: 'Thông tin cá nhân' },
  { num: 2, label: 'Vai trò & Phòng ban' },
  { num: 3, label: 'Xác nhận' },
] as const

const NEXT_STEPS_INFO = [
  'Kiểm tra email để nhận xác nhận yêu cầu',
  'Admin xét duyệt và phân quyền phù hợp',
  'Nhận thông tin đăng nhập qua email công ty',
] as const

const INITIAL_FORM_DATA: FormData = {
  lastName: '',
  firstName: '',
  workEmail: '',
  phone: '',
  empId: '',
  department: '',
  position: '',
  role: '',
  adminNote: '',
}

const INITIAL_ERRORS = {
  lastName: false,
  firstName: false,
  workEmail: false,
  empId: false,
  department: false,
  position: false,
  role: false,
  terms: false,
}

const validateEmail = (email: string) => EMAIL_REGEX.test(email)

export default function RegisterPage({}: Props) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [showSuccess, setShowSuccess] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA)
  const [errors, setErrors] = useState(INITIAL_ERRORS)

  const validateStep1 = useCallback(() => {
    const newErrors = {
      lastName: !formData.lastName.trim(),
      firstName: !formData.firstName.trim(),
      workEmail: !formData.workEmail.trim() || !validateEmail(formData.workEmail),
      empId: !formData.empId.trim(),
    }

    setErrors(prev => ({ ...prev, ...newErrors }))
    return !Object.values(newErrors).some(error => error)
  }, [formData.lastName, formData.firstName, formData.workEmail, formData.empId])

  const validateStep2 = useCallback(() => {
    const newErrors = {
      department: !formData.department,
      position: !formData.position.trim(),
      role: !formData.role,
    }

    setErrors(prev => ({ ...prev, ...newErrors }))
    return !Object.values(newErrors).some(error => error)
  }, [formData.department, formData.position, formData.role])

  const handleNext = useCallback(() => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2)
    } else if (currentStep === 2 && validateStep2()) {
      setCurrentStep(3)
    }
  }, [currentStep, validateStep1, validateStep2])

  const handleBack = useCallback(() => {
    setCurrentStep(prev => Math.max(1, prev - 1))
  }, [])

  const handleSubmit = useCallback(async () => {
    if (!termsAccepted) {
      setErrors(prev => ({ ...prev, terms: true }))
      return
    }

    setErrors(prev => ({ ...prev, terms: false }))
    setIsSubmitting(true)

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false)
      setShowSuccess(true)
    }, SUBMIT_DELAY)
  }, [termsAccepted])

  const handleReset = useCallback(() => {
    setShowSuccess(false)
    setCurrentStep(1)
    setFormData(INITIAL_FORM_DATA)
    setTermsAccepted(false)
    setErrors(INITIAL_ERRORS)
  }, [])

  const toggleTerms = useCallback(() => {
    setTermsAccepted(prev => !prev)
  }, [])

  const handleFieldChange = useCallback((field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }, [])

  const handleRoleSelect = useCallback((roleId: string) => {
    setFormData(prev => ({ ...prev, role: roleId }))
  }, [])

  const getDepartmentLabel = useCallback(
    (value: string) => DEPARTMENTS.find(d => d.value === value)?.label || value,
    []
  )

  const getRoleLabel = useCallback(
    (value: string) => ROLES.find(r => r.id === value)?.title || value,
    []
  )

  const confirmationData = useMemo(() => [
    { label: 'Họ và tên', value: `${formData.lastName} ${formData.firstName}` },
    { label: 'Email công ty', value: formData.workEmail },
    { label: 'Mã nhân viên', value: formData.empId },
    { label: 'Phòng ban', value: getDepartmentLabel(formData.department) },
    { label: 'Chức vụ', value: formData.position },
    { label: 'Vai trò yêu cầu', value: getRoleLabel(formData.role) },
  ], [formData, getDepartmentLabel, getRoleLabel])

  return (
    <>
      <div className="flex flex-col lg:flex-row min-h-screen">
        <LeftPanel />
        <RightPanel
          currentStep={currentStep}
          formData={formData}
          errors={errors}
          onFieldChange={handleFieldChange}
          onRoleSelect={handleRoleSelect}
          onNext={handleNext}
          onBack={handleBack}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          termsAccepted={termsAccepted}
          onToggleTerms={toggleTerms}
          confirmationData={confirmationData}
        />
      </div>

      {showSuccess && <SuccessModalWrapper onReset={handleReset} onLogin={() => router.push('/login')} />}
    </>
  )
}

// Memoized Left Panel
const LeftPanel = memo(() => (
  <div className="relative w-full lg:w-[45%] flex flex-col justify-between p-8 md:p-12 overflow-hidden min-h-[380px] bg-gradient-to-br from-blue-900 via-blue-700 to-blue-500">
    {/* Background Effects */}
    <div
      className="absolute inset-0 opacity-60"
      style={{
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)',
        backgroundSize: '28px 28px',
      }}
    />
    <div className="absolute -top-24 -left-24 w-80 h-80 bg-blue-400 rounded-full opacity-20 blur-[100px]" />
    <div className="absolute -bottom-32 -right-16 w-96 h-96 bg-indigo-300 rounded-full opacity-20 blur-[100px]" />

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
    <div className="relative z-10 my-8 lg:my-0">
      <div className="animate-fade-in-up opacity-0" style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}>
        <span className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/25 text-blue-100 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          Yêu cầu được xét duyệt trong 24h
        </span>
      </div>

      <div className="animate-fade-in-up opacity-0" style={{ animationDelay: '0.3s', animationFillMode: 'forwards' }}>
        <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-tight mb-4 tracking-tight">
          Tham gia cùng<br />
          <span className="text-blue-200">đội ngũ của bạn.</span>
        </h1>
        <p className="text-blue-100 text-base leading-relaxed max-w-sm opacity-90">
          Gửi yêu cầu cấp tài khoản. Quản trị viên sẽ xem xét và kích hoạt quyền truy cập phù hợp với vai trò của bạn.
        </p>
      </div>

      {/* Process Steps */}
      <div className="mt-10 space-y-4 animate-fade-in-up opacity-0" style={{ animationDelay: '0.4s', animationFillMode: 'forwards' }}>
        {PROCESS_STEPS.map((step, idx) => (
          <div key={idx} className="flex items-center gap-4">
            <div className="w-9 h-9 rounded-full bg-white/20 border border-white/30 flex items-center justify-center shrink-0">
              <step.icon className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-white font-semibold text-sm">{step.title}</div>
              <div className="text-blue-200 text-xs">{step.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Bottom Note */}
    <div className="relative z-10 animate-fade-in-up opacity-0" style={{ animationDelay: '0.5s', animationFillMode: 'forwards' }}>
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 max-w-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-amber-400/20 rounded-full flex items-center justify-center shrink-0">
            <Info className="w-4 h-4 text-amber-300" />
          </div>
          <p className="text-blue-100 text-xs leading-relaxed">
            <span className="text-white font-semibold">Lưu ý:</span> Đây là trang dành cho mục đích kiểm thử. Tài khoản thực tế được cấp bởi quản trị viên hệ thống.
          </p>
        </div>
      </div>
    </div>
  </div>
))
LeftPanel.displayName = 'LeftPanel'

// Memoized Mobile Logo
const MobileLogo = memo(() => (
  <div className="flex items-center gap-3 mb-8 lg:hidden">
    <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-sm">
      <span className="font-bold text-white text-lg">H</span>
    </div>
    <span className="font-bold text-xl text-slate-900">HR Nexus</span>
  </div>
))
MobileLogo.displayName = 'MobileLogo'

// Memoized Step Indicator
const StepIndicator = memo<{ currentStep: number }>(({ currentStep }) => (
  <div className="flex items-center mb-8 animate-fade-in-up opacity-0" style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}>
    {STEP_LABELS.map((step, idx) => (
      <div key={step.num} className="flex items-center flex-1">
        <div className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all ${
              currentStep > step.num
                ? 'bg-emerald-500 border-emerald-500 text-white'
                : currentStep === step.num
                ? 'bg-blue-600 border-blue-600 text-white'
                : 'bg-white border-slate-300 text-slate-400'
            }`}
          >
            {currentStep > step.num ? <Check className="w-4 h-4" /> : step.num}
          </div>
          <span
            className={`text-xs font-semibold hidden sm:block ${
              currentStep >= step.num ? 'text-blue-600' : 'text-slate-400'
            }`}
          >
            {step.label}
          </span>
        </div>
        {idx < 2 && (
          <div
            className={`flex-1 h-0.5 mx-3 transition-all duration-500 ${
              currentStep > step.num ? 'bg-emerald-500' : 'bg-slate-200'
            }`}
          />
        )}
      </div>
    ))}
  </div>
))
StepIndicator.displayName = 'StepIndicator'

// Right Panel Component
type RightPanelProps = {
  currentStep: number
  formData: FormData
  errors: typeof INITIAL_ERRORS
  onFieldChange: (field: keyof FormData, value: string) => void
  onRoleSelect: (roleId: string) => void
  onNext: () => void
  onBack: () => void
  onSubmit: () => void
  isSubmitting: boolean
  termsAccepted: boolean
  onToggleTerms: () => void
  confirmationData: Array<{ label: string; value: string }>
}

const RightPanel = memo<RightPanelProps>(({
  currentStep,
  formData,
  errors,
  onFieldChange,
  onRoleSelect,
  onNext,
  onBack,
  onSubmit,
  isSubmitting,
  termsAccepted,
  onToggleTerms,
  confirmationData,
}) => (
  <div className="w-full lg:w-[55%] flex items-start justify-center bg-white p-6 md:p-10 lg:p-12 overflow-y-auto">
    <div className="w-full max-w-lg py-4">
      <MobileLogo />

      {/* Header */}
      <div className="mb-6 animate-fade-in-up opacity-0" style={{ animationDelay: '0.1s', animationFillMode: 'forwards' }}>
        <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
          <FlaskConical className="w-3.5 h-3.5" />
          Chế độ kiểm thử — Không gửi dữ liệu thật
        </div>
        <h2 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">Yêu Cầu Tài Khoản</h2>
        <p className="text-slate-500 text-sm">Điền đầy đủ thông tin bên dưới. Quản trị viên sẽ xét duyệt và cấp quyền truy cập.</p>
      </div>

      <StepIndicator currentStep={currentStep} />

      {currentStep === 1 && <Step1Form formData={formData} errors={errors} onFieldChange={onFieldChange} onNext={onNext} />}
      {currentStep === 2 && <Step2Form formData={formData} errors={errors} onFieldChange={onFieldChange} onRoleSelect={onRoleSelect} onNext={onNext} onBack={onBack} />}
      {currentStep === 3 && (
        <Step3Form
          formData={formData}
          errors={errors}
          confirmationData={confirmationData}
          termsAccepted={termsAccepted}
          onToggleTerms={onToggleTerms}
          onFieldChange={onFieldChange}
          onBack={onBack}
          onSubmit={onSubmit}
          isSubmitting={isSubmitting}
        />
      )}

      {/* Back to Login */}
      <div className="mt-8 text-center animate-fade-in-up opacity-0" style={{ animationDelay: '0.5s', animationFillMode: 'forwards' }}>
        <p className="text-sm text-slate-500">
          Đã có tài khoản?
          <a href="/login" className="font-semibold text-blue-600 hover:text-blue-800 transition-colors ml-1">
            Đăng nhập ngay
          </a>
        </p>
      </div>

      {/* Security Note */}
      <SecurityNote />
    </div>
  </div>
))
RightPanel.displayName = 'RightPanel'

// Security Note Component
const SecurityNote = memo(() => (
  <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-400">
    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
    <span>Kết nối được mã hóa SSL 256-bit</span>
    <span className="text-slate-300">•</span>
    <span>Tuân thủ ISO 27001</span>
  </div>
))
SecurityNote.displayName = 'SecurityNote'

// Step 1 Form Component
type Step1FormProps = {
  formData: FormData
  errors: typeof INITIAL_ERRORS
  onFieldChange: (field: keyof FormData, value: string) => void
  onNext: () => void
}

const Step1Form = memo<Step1FormProps>(({ formData, errors, onFieldChange, onNext }) => (
  <div className="animate-fade-in-up opacity-0" style={{ animationDelay: '0.3s', animationFillMode: 'forwards' }}>
    <div className="space-y-4">
      {/* Name */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Họ <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <User className="w-4 h-4 text-slate-400" />
            </div>
            <Input
              placeholder="Nguyễn"
              value={formData.lastName}
              onChange={(e) => onFieldChange('lastName', e.target.value)}
              className={`pl-10 ${errors.lastName ? 'border-red-500 ring-2 ring-red-500/20' : ''}`}
              aria-label="Họ"
            />
          </div>
          {errors.lastName && (
            <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> Vui lòng nhập họ
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Tên <span className="text-red-500">*</span>
          </label>
          <Input
            placeholder="Văn An"
            value={formData.firstName}
            onChange={(e) => onFieldChange('firstName', e.target.value)}
            className={errors.firstName ? 'border-red-500 ring-2 ring-red-500/20' : ''}
            aria-label="Tên"
          />
          {errors.firstName && (
            <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> Vui lòng nhập tên
            </p>
          )}
        </div>
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Email Công Ty <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Mail className="w-4 h-4 text-slate-400" />
          </div>
          <Input
            type="email"
            placeholder="ten.ho@company.com"
            value={formData.workEmail}
            onChange={(e) => onFieldChange('workEmail', e.target.value)}
            className={`pl-10 ${errors.workEmail ? 'border-red-500 ring-2 ring-red-500/20' : ''}`}
            aria-label="Email công ty"
          />
        </div>
        {errors.workEmail && (
          <p className="text-xs text-red-500 mt-1">Vui lòng nhập email hợp lệ</p>
        )}
        <p className="text-xs text-slate-400 mt-1.5">Sử dụng email công ty để xác minh danh tính</p>
      </div>

      {/* Phone */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">Số Điện Thoại</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Phone className="w-4 h-4 text-slate-400" />
          </div>
          <Input
            type="tel"
            placeholder="0912 345 678"
            value={formData.phone}
            onChange={(e) => onFieldChange('phone', e.target.value)}
            className="pl-10"
            aria-label="Số điện thoại"
          />
        </div>
      </div>

      {/* Employee ID */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Mã Nhân Viên <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <BadgeIcon className="w-4 h-4 text-slate-400" />
          </div>
          <Input
            placeholder="NV-2024-001"
            value={formData.empId}
            onChange={(e) => onFieldChange('empId', e.target.value)}
            className={`pl-10 ${errors.empId ? 'border-red-500 ring-2 ring-red-500/20' : ''}`}
            aria-label="Mã nhân viên"
          />
        </div>
        {errors.empId && (
          <p className="text-xs text-red-500 mt-1">Vui lòng nhập mã nhân viên</p>
        )}
        <p className="text-xs text-slate-400 mt-1.5">Mã nhân viên do phòng HR cung cấp khi onboarding</p>
      </div>

      <Button onClick={onNext} className="w-full bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
        <span>Tiếp Theo</span>
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </div>
  </div>
))
Step1Form.displayName = 'Step1Form'

// Step 2 Form Component
type Step2FormProps = {
  formData: FormData
  errors: typeof INITIAL_ERRORS
  onFieldChange: (field: keyof FormData, value: string) => void
  onRoleSelect: (roleId: string) => void
  onNext: () => void
  onBack: () => void
}

const Step2Form = memo<Step2FormProps>(({ formData, errors, onFieldChange, onRoleSelect, onNext, onBack }) => (
  <div className="animate-fade-in-up">
    <div className="space-y-5">
      {/* Department */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Phòng Ban <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none z-10">
            <Building2 className="w-4 h-4 text-slate-400" />
          </div>
          <select
            value={formData.department}
            onChange={(e) => onFieldChange('department', e.target.value)}
            className={`w-full pl-10 pr-10 py-2.5 bg-slate-50 border rounded-lg text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none ${
              errors.department ? 'border-red-500 ring-2 ring-red-500/20' : 'border-slate-200'
            }`}
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 12px center',
            }}
            aria-label="Phòng ban"
          >
            {DEPARTMENTS.map((dept) => (
              <option key={dept.value} value={dept.value}>
                {dept.label}
              </option>
            ))}
          </select>
        </div>
        {errors.department && (
          <p className="text-xs text-red-500 mt-1">Vui lòng chọn phòng ban</p>
        )}
      </div>

      {/* Position */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Chức Vụ <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Briefcase className="w-4 h-4 text-slate-400" />
          </div>
          <Input
            placeholder="VD: Senior Developer, HR Manager..."
            value={formData.position}
            onChange={(e) => onFieldChange('position', e.target.value)}
            className={`pl-10 ${errors.position ? 'border-red-500 ring-2 ring-red-500/20' : ''}`}
            aria-label="Chức vụ"
          />
        </div>
        {errors.position && (
          <p className="text-xs text-red-500 mt-1">Vui lòng nhập chức vụ</p>
        )}
      </div>

      {/* Role Selection */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-3">
          Vai Trò Truy Cập Yêu Cầu <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-1 gap-3">
          {ROLES.map((role) => (
            <RoleCard key={role.id} role={role} selectedRoleId={formData.role} onSelect={onRoleSelect} />
          ))}
        </div>
        {errors.role && (
          <p className="text-xs text-red-500 mt-2">Vui lòng chọn vai trò truy cập</p>
        )}
      </div>

      <div className="flex gap-3 mt-2">
        <Button onClick={onBack} variant="outline" className="flex-1">
          <ArrowLeft className="w-4 h-4 mr-2" />
          <span>Quay Lại</span>
        </Button>
        <Button
          onClick={onNext}
          className="flex-1 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
        >
          <span>Tiếp Theo</span>
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  </div>
))
Step2Form.displayName = 'Step2Form'

// Role Card Component
type RoleCardProps = {
  role: RoleOption
  selectedRoleId: string
  onSelect: (roleId: string) => void
}

const RoleCard = memo<RoleCardProps>(({ role, selectedRoleId, onSelect }) => {
  const IconComponent = role.icon
  const isSelected = selectedRoleId === role.id

  return (
    <button
      type="button"
      onClick={() => onSelect(role.id)}
      className={`border-2 rounded-xl p-4 flex items-start gap-3 text-left transition-all ${
        isSelected
          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500/20'
          : 'border-slate-200 hover:border-blue-300 hover:bg-blue-50/50'
      }`}
      aria-label={`Select role: ${role.title}`}
    >
      <div className={`w-9 h-9 ${role.iconColor} rounded-xl flex items-center justify-center shrink-0 mt-0.5`}>
        <IconComponent className="w-4 h-4" />
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-slate-900 text-sm">{role.title}</span>
          <span className={`text-xs ${role.badgeColor} px-2 py-0.5 rounded-full font-medium`}>
            {role.badge}
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-1">{role.description}</p>
      </div>
    </button>
  )
})
RoleCard.displayName = 'RoleCard'

// Step 3 Form Component
type Step3FormProps = {
  formData: FormData
  errors: typeof INITIAL_ERRORS
  confirmationData: Array<{ label: string; value: string }>
  termsAccepted: boolean
  onToggleTerms: () => void
  onFieldChange: (field: keyof FormData, value: string) => void
  onBack: () => void
  onSubmit: () => void
  isSubmitting: boolean
}

const Step3Form = memo<Step3FormProps>(({
  formData,
  errors,
  confirmationData,
  termsAccepted,
  onToggleTerms,
  onFieldChange,
  onBack,
  onSubmit,
  isSubmitting,
}) => (
  <div className="animate-fade-in-up">
    <div className="space-y-5">
      {/* Summary Card */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
        <h3 className="font-semibold text-slate-900 text-sm mb-4 flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-blue-500" />
          Xác Nhận Thông Tin
        </h3>
        <div className="space-y-3">
          {confirmationData.map((item, idx) => (
            <div key={idx} className={`flex justify-between items-center py-2 ${idx < confirmationData.length - 1 ? 'border-b border-slate-200' : ''}`}>
              <span className="text-xs text-slate-500 font-medium">{item.label}</span>
              <span className="text-sm font-semibold text-slate-900">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Note */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">Ghi Chú Cho Quản Trị Viên</label>
        <textarea
          rows={3}
          placeholder="VD: Tôi cần truy cập để xử lý bảng lương tháng 12. Đã được phê duyệt bởi trưởng phòng..."
          value={formData.adminNote}
          onChange={(e) => onFieldChange('adminNote', e.target.value)}
          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
          aria-label="Ghi chú cho quản trị viên"
        />
      </div>

      {/* Test Mode Warning */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <FlaskConical className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-amber-800 text-xs font-semibold">Chế Độ Kiểm Thử</p>
          <p className="text-amber-700 text-xs mt-0.5">
            Yêu cầu này sẽ không được gửi thật. Đây là giao diện demo để kiểm tra luồng đăng ký. Trong môi trường thực, yêu cầu sẽ được gửi đến admin@hrnexus.com.
          </p>
        </div>
      </div>

      {/* Terms */}
      <label className="flex items-start gap-3 cursor-pointer group">
        <div
          onClick={onToggleTerms}
          className={`w-5 h-5 border-2 rounded flex items-center justify-center cursor-pointer transition-all mt-0.5 ${
            termsAccepted ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-300'
          }`}
          role="checkbox"
          aria-checked={termsAccepted}
          aria-label="Đồng ý với điều khoản"
        >
          <Check className={`w-3 h-3 text-white transition-opacity ${termsAccepted ? 'opacity-100' : 'opacity-0'}`} />
        </div>
        <span className="text-sm text-slate-600 leading-relaxed">
          Tôi xác nhận thông tin trên là chính xác và đồng ý với{' '}
          <a href="#" className="text-blue-600 font-semibold hover:underline">
            Điều Khoản Sử Dụng
          </a>{' '}
          và{' '}
          <a href="#" className="text-blue-600 font-semibold hover:underline">
            Chính Sách Bảo Mật
          </a>{' '}
          của HR Nexus.
        </span>
      </label>
      {errors.terms && (
        <p className="text-xs text-red-500 -mt-3">Vui lòng đồng ý với điều khoản để tiếp tục</p>
      )}

      <div className="flex gap-3">
        <Button onClick={onBack} variant="outline" className="flex-1">
          <ArrowLeft className="w-4 h-4 mr-2" />
          <span>Quay Lại</span>
        </Button>
        <Button
          onClick={onSubmit}
          disabled={isSubmitting}
          className="flex-1 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              <span>Đang gửi...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              <span>Gửi Yêu Cầu</span>
            </>
          )}
        </Button>
      </div>
    </div>
  </div>
))
Step3Form.displayName = 'Step3Form'

// Success Modal Wrapper
const SuccessModalWrapper = memo<{ onReset: () => void; onLogin: () => void }>(({ onReset, onLogin }) => (
  <div className="fixed inset-0 bg-white/95 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-8">
    <div className="text-center max-w-md">
      <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce-in">
        <Check className="w-12 h-12 text-emerald-500" strokeWidth={3} />
      </div>
      <h2 className="text-3xl font-bold text-slate-900 mb-3 tracking-tight">Yêu Cầu Đã Gửi!</h2>
      <p className="text-slate-500 text-base mb-2">Yêu cầu tài khoản của bạn đã được ghi nhận thành công.</p>
      <p className="text-slate-400 text-sm mb-8">
        Quản trị viên sẽ xem xét và phản hồi qua email trong vòng{' '}
        <span className="font-semibold text-slate-600">24 giờ làm việc</span>.
      </p>

      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-left mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <span className="font-semibold text-slate-900 text-sm">Các bước tiếp theo</span>
        </div>
        <div className="space-y-2.5 pl-11">
          {NEXT_STEPS_INFO.map((step, idx) => (
            <div key={idx} className="flex items-center gap-2 text-sm text-slate-600">
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full shrink-0" />
              {step}
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3 justify-center">
        <Button onClick={onReset} variant="outline">
          <Plus className="w-4 h-4 mr-2" />
          Gửi Yêu Cầu Khác
        </Button>
        <Button
          onClick={onLogin}
          className="bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
        >
          <LogIn className="w-4 h-4 mr-2" />
          Về Trang Đăng Nhập
        </Button>
      </div>
    </div>
  </div>
))
SuccessModalWrapper.displayName = 'SuccessModalWrapper'


