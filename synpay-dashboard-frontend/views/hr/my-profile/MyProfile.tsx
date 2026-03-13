'use client'

import { useState, useCallback } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useLanguage } from '@/components/providers/LanguageProvider'
import { useAuth } from '@/components/providers/AuthProvider'
import {
  Mail,
  Phone,
  Calendar,
  Lock,
  Pencil,
  Save,
  X as XIcon,
  HelpCircle,
  CheckCircle,
} from 'lucide-react'

interface ProfileFormData {
  personalEmail: string
  phone: string
  dateOfBirth: string
}

interface ProfileData extends ProfileFormData {
  fullName: string
  position: string
  companyEmail: string
  employeeId: string
  status: string
  department: string
  startDate: string
  directManager: string
  profileImage: string
}

export default function MyProfile() {
  const { language, t } = useLanguage()
  const { user } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // Profile data - would typically come from API
  const [profileData] = useState<ProfileData>({
    fullName: 'Alex Morgan',
    position: 'Giám Đốc Nhân Sự',
    companyEmail: 'alex.morgan@hrnexus.com',
    employeeId: 'NV-0042',
    status: 'Chính Thức',
    department: 'Nhân Sự (HR)',
    startDate: '15/03/2021',
    directManager: 'Sarah Connor',
    profileImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    personalEmail: 'alex.morgan.personal@gmail.com',
    phone: '+84 912 345 678',
    dateOfBirth: '1990-06-15',
  })

  const [formData, setFormData] = useState<ProfileFormData>({
    personalEmail: profileData.personalEmail,
    phone: profileData.phone,
    dateOfBirth: profileData.dateOfBirth,
  })

  const handleInputChange = useCallback(
    (field: keyof ProfileFormData, value: string) => {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }))
      setHasChanges(true)
    },
    []
  )

  const handleSave = useCallback(async () => {
    setIsSaving(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      console.log('Saving profile:', formData)
      setIsEditing(false)
      setHasChanges(false)
      // Show success notification here
    } catch (error) {
      console.error('Error saving profile:', error)
    } finally {
      setIsSaving(false)
    }
  }, [formData])

  const handleCancel = useCallback(() => {
    setFormData({
      personalEmail: profileData.personalEmail,
      phone: profileData.phone,
      dateOfBirth: profileData.dateOfBirth,
    })
    setIsEditing(false)
    setHasChanges(false)
  }, [profileData])

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900">
      <Sidebar language={language} t={t} activeRoute="/myprofile" />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          language={language}
          t={t}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Profile Card - Left Column */}
              <div className="lg:col-span-1">
                <Card className="sticky top-24">
                  <CardContent className="p-6">
                    <div className="text-center">
                      {/* Profile Image */}
                      <div className="relative inline-block mb-4">
                        <img
                          src={profileData.profileImage}
                          alt={profileData.fullName}
                          className="w-32 h-32 rounded-full border-4 border-slate-50 dark:border-slate-700 object-cover"
                        />
                        <div
                          className="absolute bottom-1 right-1 w-5 h-5 bg-emerald-500 border-2 border-white dark:border-slate-800 rounded-full"
                          title="Đang hoạt động"
                        />
                      </div>

                      {/* Name and Position */}
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                        {profileData.fullName}
                      </h2>
                      <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-4">
                        {profileData.position}
                      </p>

                      {/* Badges */}
                      <div className="flex items-center justify-center gap-2 mb-6">
                        <span className="px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-full">
                          #{profileData.employeeId}
                        </span>
                        <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-semibold rounded-full">
                          {profileData.status}
                        </span>
                      </div>

                      {/* Static Info */}
                      <div className="border-t border-slate-100 dark:border-slate-700 pt-4 text-left">
                        <p className="text-xs text-slate-400 dark:text-slate-500 mb-3 text-center">
                          Thông tin này được quản lý bởi Admin
                        </p>

                        <div className="space-y-3">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-500 dark:text-slate-400">Phòng Ban</span>
                            <span className="font-medium text-slate-900 dark:text-white">
                              {profileData.department}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-500 dark:text-slate-400">Ngày Vào Làm</span>
                            <span className="font-medium text-slate-900 dark:text-white">
                              {profileData.startDate}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-500 dark:text-slate-400">Quản Lý Trực Tiếp</span>
                            <span className="font-medium text-slate-900 dark:text-white">
                              {profileData.directManager}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Edit Form - Right Column */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader className="flex flex-row items-start justify-between">
                    <div>
                      <CardTitle>Thông Tin Cá Nhân</CardTitle>
                      <CardDescription>Cập nhật thông tin liên hệ của bạn</CardDescription>
                    </div>
                    <Button variant="ghost" size="icon">
                      <HelpCircle className="w-5 h-5" />
                    </Button>
                  </CardHeader>

                  <CardContent>
                    <form className="space-y-6">
                      {/* Editable Section */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                            <Pencil className="w-4 h-4" />
                          </div>
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide">
                            Thông Tin Có Thể Chỉnh Sửa
                          </h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Personal Email */}
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                              Email Cá Nhân <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                              <input
                                type="email"
                                value={formData.personalEmail}
                                onChange={(e) => handleInputChange('personalEmail', e.target.value)}
                                disabled={!isEditing}
                                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                              />
                            </div>
                          </div>

                          {/* Phone */}
                          <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                              Số Điện Thoại <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                              <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => handleInputChange('phone', e.target.value)}
                                disabled={!isEditing}
                                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                              />
                            </div>
                          </div>

                          {/* Date of Birth */}
                          <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                              Ngày Sinh
                            </label>
                            <div className="relative">
                              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                              <input
                                type="date"
                                value={formData.dateOfBirth}
                                onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                                disabled={!isEditing}
                                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-slate-100 dark:border-slate-700" />

                      {/* Locked Section */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400">
                            <Lock className="w-4 h-4" />
                          </div>
                          <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                            Thông Tin Bị Khóa (Chỉ Xem)
                          </h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Full Name */}
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1.5">
                              Họ và Tên
                            </label>
                            <div className="relative">
                              <input
                                type="text"
                                value={profileData.fullName}
                                readOnly
                                className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-md text-sm text-slate-500 dark:text-slate-400 focus:outline-none select-none"
                              />
                              <Lock className="w-3 h-3 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                            </div>
                          </div>

                          {/* Position */}
                          <div>
                            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1.5">
                              Chức Danh
                            </label>
                            <div className="relative">
                              <input
                                type="text"
                                value={profileData.position}
                                readOnly
                                className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-md text-sm text-slate-500 dark:text-slate-400 focus:outline-none select-none"
                              />
                              <Lock className="w-3 h-3 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                            </div>
                          </div>

                          {/* Company Email */}
                          <div>
                            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1.5">
                              Email Công Ty
                            </label>
                            <div className="relative">
                              <input
                                type="text"
                                value={profileData.companyEmail}
                                readOnly
                                className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-md text-sm text-slate-500 dark:text-slate-400 focus:outline-none select-none"
                              />
                              <Lock className="w-3 h-3 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                            </div>
                          </div>
                        </div>

                        <p className="text-xs text-slate-400 dark:text-slate-500 italic mt-2">
                          * Để thay đổi thông tin bị khóa, vui lòng liên hệ bộ phận IT hoặc Admin.
                        </p>
                      </div>

                      {/* Action Buttons */}
                      <div className="border-t border-slate-100 dark:border-slate-700 pt-4 flex items-center justify-end gap-3">
                        {isEditing ? (
                          <>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={handleCancel}
                              disabled={isSaving}
                            >
                              <XIcon className="w-4 h-4 mr-2" />
                              Hủy Bỏ
                            </Button>
                            <Button
                              type="button"
                              onClick={handleSave}
                              disabled={isSaving || !hasChanges}
                            >
                              <Save className="w-4 h-4 mr-2" />
                              {isSaving ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                            </Button>
                          </>
                        ) : (
                          <Button onClick={() => setIsEditing(true)}>
                            <Pencil className="w-4 h-4 mr-2" />
                            Chỉnh Sửa
                          </Button>
                        )}
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
