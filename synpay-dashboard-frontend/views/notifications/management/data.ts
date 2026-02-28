import { Alert, AlertStatistics, NotificationSettings, NotificationsData } from './types'

export const generateMockAlerts = (): Alert[] => {
  const now = new Date()
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const thisWeek = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)

  return [
    {
      id: 'ALERT-2024-001',
      title: 'Vượt giới hạn nghỉ phép nghiêm trọng',
      description: 'Nhân viên Nguyễn Văn A (ID: NV-2024-001) đã vượt quá giới hạn nghỉ phép cho phép (20 ngày). Hiện tại: 23 ngày nghỉ phép.',
      severity: 'critical',
      type: 'leave',
      status: 'unread',
      timestamp: new Date(now.getTime() - 5 * 60 * 1000), // 5 minutes ago
      employeeId: 'NV-2024-001',
      employeeName: 'Nguyễn Văn A',
      department: 'Phòng Kỹ Thuật',
      metadata: {
        leaveDaysUsed: 23,
        leaveDaysAllowed: 20,
        excessDays: 3,
      },
      suggestedActions: [
        'Liên hệ với nhân viên để xác nhận tình trạng nghỉ phép',
        'Kiểm tra và cập nhật chính sách nghỉ phép nếu cần',
        'Ghi nhận vào hồ sơ nhân viên để theo dõi',
      ],
    },
    {
      id: 'ALERT-2024-002',
      title: 'Sai lệch bảng lương',
      description: 'Phát hiện sai lệch 2.5 triệu VND trong bảng lương tháng 12/2024 của nhân viên Trần Thị B (ID: NV-2024-045). Lương dự kiến: 25M, Lương thực tế: 22.5M.',
      severity: 'high',
      type: 'salary',
      status: 'unread',
      timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
      employeeId: 'NV-2024-045',
      employeeName: 'Trần Thị B',
      department: 'Phòng Kinh Doanh',
      metadata: {
        expectedSalary: 25000000,
        actualSalary: 22500000,
        difference: 2500000,
      },
      suggestedActions: [
        'Xem xét và điều chỉnh bảng lương ngay lập tức',
        'Kiểm tra nguyên nhân gốc rễ của sai lệch',
        'Thông báo cho nhân viên và giải thích tình hình',
      ],
    },
    {
      id: 'ALERT-2024-003',
      title: 'Kỷ niệm 5 năm làm việc',
      description: 'Nhân viên Lê Văn C (ID: NV-2019-123) tròn 5 năm làm việc tại công ty vào ngày 15/12/2024. Hãy gửi lời chúc mừng!',
      severity: 'low',
      type: 'anniversary',
      status: 'unread',
      timestamp: new Date(now.getTime() - 4 * 60 * 60 * 1000), // 4 hours ago
      employeeId: 'NV-2019-123',
      employeeName: 'Lê Văn C',
      department: 'Phòng Marketing',
      metadata: {
        years: 5,
        startDate: '2019-12-15',
        anniversaryDate: '2024-12-15',
      },
      suggestedActions: [
        'Gửi email chúc mừng đến nhân viên',
        'Tổ chức lễ kỷ niệm nhỏ trong phòng ban',
        'Xem xét trao thưởng hoặc quà tặng kỷ niệm',
      ],
    },
    {
      id: 'ALERT-2024-004',
      title: 'Đi muộn nhiều lần',
      description: 'Nhân viên Phạm Thị D (ID: NV-2023-089) đã đi muộn 5 lần trong tuần này. Thời gian trung bình: 15 phút.',
      severity: 'medium',
      type: 'attendance',
      status: 'read',
      timestamp: yesterday,
      employeeId: 'NV-2023-089',
      employeeName: 'Phạm Thị D',
      department: 'Phòng Hỗ Trợ',
      metadata: {
        lateCount: 5,
        averageLateness: 15,
        period: 'tuần này',
      },
      suggestedActions: [
        'Liên hệ với nhân viên để hiểu rõ tình hình',
        'Đánh giá tác động đến công việc',
        'Cân nhắc biện pháp nhắc nhở hoặc hỗ trợ',
      ],
    },
    {
      id: 'ALERT-2024-005',
      title: 'Nghỉ phép đột xuất không báo trước',
      description: 'Nhân viên Hoàng Văn E (ID: NV-2022-156) nghỉ phép đột xuất không báo trước theo quy định (tối thiểu 2 ngày).',
      severity: 'high',
      type: 'leave',
      status: 'acknowledged',
      timestamp: yesterday,
      employeeId: 'NV-2022-156',
      employeeName: 'Hoàng Văn E',
      department: 'Phòng Tài Chính',
      metadata: {
        noticeGiven: 0,
        noticeRequired: 2,
        leaveDate: '2024-12-14',
      },
      suggestedActions: [
        'Xác nhận lý do nghỉ phép với nhân viên',
        'Nhắc nhở về quy định báo trước',
        'Cập nhật hồ sơ và theo dõi vi phạm',
      ],
    },
    {
      id: 'ALERT-2024-006',
      title: 'Bảo trì hệ thống HR Nexus',
      description: 'Hệ thống HR Nexus sẽ được bảo trì và cập nhật vào Chủ nhật, 22/12/2024 từ 02:00 - 06:00 sáng. Vui lòng hoàn thành công việc trước thời gian này.',
      severity: 'low',
      type: 'system',
      status: 'read',
      timestamp: thisWeek,
      metadata: {
        maintenanceDate: '2024-12-22',
        startTime: '02:00',
        endTime: '06:00',
      },
      suggestedActions: [
        'Thông báo cho toàn bộ nhân viên về thời gian bảo trì',
        'Hoàn thành các tác vụ quan trọng trước khi bảo trì',
        'Chuẩn bị kế hoạch dự phòng nếu cần',
      ],
    },
    {
      id: 'ALERT-2024-007',
      title: 'Kỷ niệm 10 năm làm việc',
      description: 'Nhân viên Vũ Thị F (ID: NV-2014-234) tròn 10 năm làm việc tại công ty. Đây là cột mốc quan trọng, hãy tổ chức lễ kỷ niệm!',
      severity: 'low',
      type: 'anniversary',
      status: 'acknowledged',
      timestamp: thisWeek,
      employeeId: 'NV-2014-234',
      employeeName: 'Vũ Thị F',
      department: 'Phòng Nhân Sự',
      metadata: {
        years: 10,
        startDate: '2014-12-18',
        anniversaryDate: '2024-12-18',
      },
      suggestedActions: [
        'Tổ chức lễ kỷ niệm đặc biệt cho cột mốc 10 năm',
        'Xem xét trao thưởng hoặc quà tặng giá trị',
        'Gửi thư cảm ơn từ Ban Giám Đốc',
      ],
    },
  ]
}

export const getMockStatistics = (): AlertStatistics => {
  return {
    critical: 8,
    high: 12,
    info: 24,
    acknowledged: 156,
  }
}

export const getDefaultSettings = (): NotificationSettings => {
  return {
    email: true,
    push: true,
    inApp: true,
    criticalOnly: false,
  }
}

export const getMockNotificationsData = (): NotificationsData => {
  return {
    alerts: generateMockAlerts(),
    statistics: getMockStatistics(),
    settings: getDefaultSettings(),
  }
}

// Required by Next.js Pages Router — this file is not a page
export default function _NotAPage() { return null }
