import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { accountService } from '../../../services/account.service'
import { roomService } from '../../../services/room.service'
import { equipmentTypeService } from '../../../services/equipment-type.service'
import { departmentService } from '../../../services/department.service'
import classService from '../../../services/class.service'
import { scheduleService } from '../../../services/teachingSchedule.service'
import { roomCheckService } from '../../../services/roomCheck.service'
import { issueReportService } from '../../../services/issueReport.service'
import { Loading } from '../../../components/Common/Loading'
import { useAuth } from '../../../context/AuthContext'
import api from '../../../services/api'

import { Box, Home, Users, Layers, Calendar, Clock, CheckCircle, BookOpen, ShieldCheck, AlertTriangle, Building2 } from 'lucide-react'
import { UsagePieChart } from '../../../components/Dashboard/UsagePieChart'
import { UsageBarChart } from '../../../components/Dashboard/UsageBarChart'

export const DashboardPage: React.FC = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    totalAccounts: 0,
    totalRooms: 0,
    totalEquipmentTypes: 0,
    totalDepartments: 0,
    pendingBookings: 0,
    approvedToday: 0,
    totalClasses: 0,
    schedulesToday: 0,
    pendingIssueReports: 0,
    pendingRoomChecks: 0
  })
  
  // Advanced stats
  const [usageStats, setUsageStats] = useState<{ name: string; value: number }[]>([])
  const [bookingStatusStats, setBookingStatusStats] = useState<{ name: string; value: number }[]>([])
  const [topRoomsStats, setTopRoomsStats] = useState<{ name: string; value: number }[]>([])
  const [issueStats, setIssueStats] = useState<{ name: string; value: number }[]>([])
  
  // Date range for room usage (default last 3 months)
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  })

  const [loading, setLoading] = useState(true)

  const loadStats = async () => {
    try {
      setLoading(true)
      const today = new Date().toLocaleDateString('sv');
      
      const newStats = {
        totalAccounts: 0,
        totalRooms: 0,
        totalEquipmentTypes: 0,
        totalDepartments: 0,
        pendingBookings: 0,
        approvedToday: 0,
        totalClasses: 0,
        schedulesToday: 0,
        pendingIssueReports: 0,
        pendingRoomChecks: 0
      };

      const promises: Promise<void>[] = [];

      if (user?.role === 'Admin') {
        promises.push(
          Promise.all([
            accountService.getAccounts(1, 1).catch(() => ({ total: 0 })),
            departmentService.getAll().catch(() => [])
          ]).then(([accounts, departments]) => {
            newStats.totalAccounts = accounts.total || 0;
            newStats.totalDepartments = departments.length || 0;
          })
        );
      }

      if (user?.role === 'Admin' || user?.role === 'AssetStaff') {
        promises.push(
          Promise.all([
            roomService.getRooms(1, 1).catch(() => ({ total: 0 })),
            equipmentTypeService.getEquipmentTypes(1, 1).catch(() => ({ total: 0 }))
          ]).then(([rooms, types]) => {
            newStats.totalRooms = rooms.total || 0;
            newStats.totalEquipmentTypes = types.total || 0;
          })
        );
      }

      if (user?.role === 'BookingStaff') {
        const now = new Date();
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(new Date(now).setDate(diff)).toLocaleDateString('sv');
        const sunday = new Date(new Date(now).setDate(diff + 6)).toLocaleDateString('sv');

        promises.push(
          Promise.all([
            api.get(`/booking?pageIndex=1&pageSize=1&status=Pending`).catch(() => ({ data: { total: 0 } })),
            api.get(`/booking?pageIndex=1&pageSize=1&status=Approved&date=${today}`).catch(() => ({ data: { total: 0 } })),
            classService.getAllClasses().catch(() => []),
            scheduleService.getAllSchedules(monday, sunday).catch(() => [])
          ]).then(([pendingRes, approvedTodayRes, classes, schedules]) => {
            newStats.pendingBookings = pendingRes.data?.total || 0;
            newStats.approvedToday = approvedTodayRes.data?.total || 0;
            newStats.totalClasses = classes.length || 0;
            newStats.schedulesToday = schedules.length || 0;
          })
        );
      }

      if (user?.role === 'Guard') {
        promises.push(
          Promise.all([
            issueReportService.getIssueReports(1, 1, undefined, 'Open' as any).catch(() => ({ total: 0 })),
            roomCheckService.getPendingChecks().catch(() => [])
          ]).then(([issueReports, roomChecks]) => {
            newStats.pendingIssueReports = issueReports.total || 0;
            newStats.pendingRoomChecks = roomChecks.length || 0;
          })
        );
      }

      if (user?.role === 'Admin' || user?.role === 'BookingStaff') {
        promises.push(
          Promise.all([
            api.get(`/statistics/room-usage?startDate=${dateRange.start}&endDate=${dateRange.end}`).catch(() => ({ data: [] })),
            api.get(`/statistics/booking-status`).catch(() => ({ data: [] })),
            api.get(`/statistics/top-rooms?startDate=${dateRange.start}&endDate=${dateRange.end}`).catch(() => ({ data: [] })),
            api.get(`/statistics/issue-reports`).catch(() => ({ data: [] }))
          ]).then(([usageRes, bookingStatusRes, topRoomsRes, issueRes]) => {
            setUsageStats(usageRes.data);
            setBookingStatusStats(bookingStatusRes.data);
            setTopRoomsStats(topRoomsRes.data);
            setIssueStats(issueRes.data);
          })
        );
      }

      await Promise.all(promises);
      setStats(newStats);
    } catch (error) {
      console.error('Error loading dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStats()
  }, [user?.role, dateRange])

  const StatCard: React.FC<{ title: string; value: number; href?: string; icon: React.ReactNode; color: string; trend?: string }> = ({ title, value, href, icon, color, trend }) => (
    <Link
      to={href || '#'}
      style={{
        padding: '1.75rem',
        textDecoration: 'none',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 'var(--radius-lg)',
        borderLeft: `5px solid ${color}`,
        borderTop: `1px solid ${color}30`,
        borderRight: `1px solid ${color}30`,
        borderBottom: `1px solid ${color}30`,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        background: 'var(--slate-100)',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-5px)';
        e.currentTarget.style.boxShadow = 'var(--shadow-xl)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, margin: '0 0 0.25rem 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {title}
          </p>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 800, margin: 0, color: 'var(--text-main)', letterSpacing: '-0.03em', lineHeight: 1 }}>
            {value}
          </h2>
        </div>
        <div style={{
          background: `${color}15`,
          color: color,
          padding: '0.75rem',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `0 4px 6px -2px ${color}20`
        }}>
          {React.cloneElement(icon as React.ReactElement, { size: 28 })}
        </div>
      </div>
      {trend && <div style={{ marginTop: 'auto', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>{trend}</div>}
    </Link>
  )

  return (
    <div className="page-container">
      <div style={{ marginBottom: 'var(--spacing-xl)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>Bảng điều khiển</h1>
          <p style={{ color: 'var(--color-text-secondary)', margin: '8px 0 0 0' }}>
            Chào mừng đến với Trang quản trị SCEMS
          </p>
        </div>

        {(user?.role === 'Admin' || user?.role === 'BookingStaff') && (
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', background: 'var(--bg-surface)', padding: '1rem', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)' }}>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>TỪ NGÀY</label>
                <input 
                  type="date" 
                  value={dateRange.start} 
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  style={{ border: '1px solid var(--border-color)', padding: '0.4rem', borderRadius: '4px' }}
                />
             </div>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>ĐẾN NGÀY</label>
                <input 
                  type="date" 
                  value={dateRange.end} 
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  style={{ border: '1px solid var(--border-color)', padding: '0.4rem', borderRadius: '4px' }}
                />
             </div>
          </div>
        )}
      </div>

      {loading ? (
        <Loading />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
          {user?.role === 'Admin' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
              <StatCard title="Tòa nhà & Cơ sở" value={stats.totalDepartments} icon={<Building2 size={24} />} trend="Hệ thống" color="var(--color-primary)" />
              <StatCard title="Tổng số Tài khoản" value={stats.totalAccounts} href="/admin/accounts" icon={<Users size={24} />} trend="Người dùng" color="#8b5cf6" />
              <StatCard title="Tổng số Phòng" value={stats.totalRooms} href="/admin/rooms" icon={<Home size={24} />} trend="Cơ sở vật chất" color="#ec4899" />
              <StatCard title="Loại Thiết bị" value={stats.totalEquipmentTypes} href="/admin/equipment-types" icon={<Layers size={24} />} trend="Quản lý" color="#f59e0b" />
            </div>
          )}

          {user?.role === 'AssetStaff' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
              <StatCard title="Tổng số Phòng" value={stats.totalRooms} href="/admin/rooms" icon={<Home size={24} />} trend="Cơ sở vật chất" color="#ec4899" />
              <StatCard title="Loại Thiết bị" value={stats.totalEquipmentTypes} href="/admin/equipment-types" icon={<Layers size={24} />} trend="Quản lý" color="#f59e0b" />
            </div>
          )}
          
          {(user?.role === 'BookingStaff') && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
              <StatCard title="Yêu cầu đang chờ" value={stats.pendingBookings} href="/admin/bookings" icon={<Clock size={24} />} trend="Cần phê duyệt" color="#f59e0b" />
              <StatCard title="Đã duyệt hôm nay" value={stats.approvedToday} href="/admin/bookings" icon={<CheckCircle size={24} />} trend="Hôm nay" color="#10b981" />
              <StatCard title="Quản lý Lớp học" value={stats.totalClasses} href="/admin/classes" icon={<BookOpen size={24} />} trend="Hệ thống" color="#3b82f6" />
              <StatCard title="Quản lý Lịch trình" value={stats.schedulesToday} href="/admin/schedules" icon={<Calendar size={24} />} trend="Tuần này" color="#8b5cf6" />
            </div>
          )}

          {(user?.role === 'Guard') && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
              <StatCard title="Kiểm tra an ninh" value={stats.pendingRoomChecks} href="/admin/security-checks" icon={<ShieldCheck size={24} />} trend="Cần thực hiện" color="var(--color-primary)" />
              <StatCard title="Báo cáo sự cố" value={stats.pendingIssueReports} href="/admin/issue-reports" icon={<AlertTriangle size={24} />} trend="Yêu cầu mới" color="var(--color-danger)" />
            </div>
          )}

          {(user?.role === 'Admin' || user?.role === 'BookingStaff') && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '2rem', marginTop: '1rem' }}>
              <UsagePieChart title="Thời lượng sử dụng theo Loại phòng" data={usageStats} />
              <UsageBarChart title="Top 5 phòng được sử dụng nhiều nhất" data={topRoomsStats} />
              <UsagePieChart title="Trạng thái yêu cầu đặt phòng" data={bookingStatusStats} unit="yêu cầu" />
              <UsagePieChart title="Trạng thái báo cáo sự cố" data={issueStats} unit="báo cáo" />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
