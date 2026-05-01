import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Building2,
  CalendarDays,
  Calendar,
  Wrench,
  Settings,
  AlertTriangle,
  ShieldCheck
} from 'lucide-react'

import { useAuth } from '../../context/AuthContext'

interface SidebarProps {
  onClose?: () => void
}

export const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const { user } = useAuth()
  const location = useLocation()
  const isActive = (path: string) => {
    if (path === '/admin/dashboard') return location.pathname === path
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  return (
    <aside className="glass-panel" style={{
      width: '280px',
      display: 'flex',
      flexDirection: 'column',
      padding: '1.5rem',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--border-glass)',
      height: '100%'
    }}>
      <nav style={{ flex: 1 }}>
        <div style={{ marginBottom: '2rem' }}>
          <p style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            color: 'var(--slate-500)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '1rem'
          }}>
            Chính
          </p>
          <NavLink href="/admin/dashboard" label="Bảng điều khiển" icon={<LayoutDashboard size={20} />} active={isActive('/admin/dashboard')} onClose={onClose} />
        </div>

        <div>
          <p style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            color: 'var(--slate-400)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '1rem'
          }}>
            Quản lý
          </p>
          {user?.role === 'Admin' && (
            <>
              <NavLink href="/admin/accounts" label="Tài khoản" icon={<Users size={20} />} active={isActive('/admin/accounts')} onClose={onClose} />
              <NavLink href="/admin/rooms" label="Phòng" icon={<Building2 size={20} />} active={isActive('/admin/rooms')} onClose={onClose} />
              <NavLink href="/admin/departments" label="Tòa nhà" icon={<Users size={20} />} active={isActive('/admin/departments')} onClose={onClose} />
              <NavLink href="/admin/room-types" label="Loại phòng" icon={<Building2 size={20} />} active={isActive('/admin/room-types')} onClose={onClose} />
              <NavLink href="/admin/equipment-types" label="Loại thiết bị" icon={<Settings size={20} />} active={isActive('/admin/equipment-types')} onClose={onClose} />
              <NavLink href="/admin/issue-reports" label="Báo cáo sự cố" icon={<AlertTriangle size={20} />} active={isActive('/admin/issue-reports')} onClose={onClose} />
              <NavLink href="/admin/settings" label="Cài đặt hệ thống" icon={<Settings size={20} />} active={isActive('/admin/settings')} onClose={onClose} />
            </>
          )}
          {user?.role === 'AssetStaff' && (
            <>
              <NavLink href="/admin/rooms" label="Phòng" icon={<Building2 size={20} />} active={isActive('/admin/rooms')} onClose={onClose} />
              <NavLink href="/admin/equipment" label="Thiết bị" icon={<Wrench size={20} />} active={isActive('/admin/equipment')} onClose={onClose} />
              <NavLink href="/admin/issue-reports" label="Báo cáo sự cố" icon={<AlertTriangle size={20} />} active={isActive('/admin/issue-reports')} onClose={onClose} />
            </>
          )}
          {user?.role === 'BookingStaff' && (
            <>
              <NavLink href="/admin/booking-board" label="Bảng đặt phòng" icon={<Calendar size={20} />} active={isActive('/admin/booking-board')} onClose={onClose} />
              <NavLink href="/admin/bookings" label="Yêu cầu đặt phòng" icon={<CalendarDays size={20} />} active={isActive('/admin/bookings')} onClose={onClose} />
              <div style={{ margin: '0.5rem 0', borderTop: '1px solid var(--border-glass)' }}></div>
              <NavLink href="/admin/classes" label="Quản lý Lớp học" icon={<Users size={20} />} active={isActive('/admin/classes')} onClose={onClose} />
              <NavLink href="/admin/schedules" label="Lịch trình" icon={<CalendarDays size={20} />} active={isActive('/admin/schedules')} onClose={onClose} />
            </>
          )}
          {user?.role === 'Guard' && (
            <>
              <NavLink href="/admin/live-status" label="Giám sát phòng" icon={<ShieldCheck size={20} />} active={isActive('/admin/live-status')} onClose={onClose} />
              <NavLink href="/admin/booking-board" label="Bảng đặt phòng" icon={<Calendar size={20} />} active={isActive('/admin/booking-board')} onClose={onClose} />
              <NavLink href="/admin/schedules" label="Lịch trình" icon={<CalendarDays size={20} />} active={isActive('/admin/schedules')} onClose={onClose} />
              <NavLink href="/admin/security-checks" label="Kiểm tra an ninh" icon={<ShieldCheck size={20} />} active={isActive('/admin/security-checks')} onClose={onClose} />
              <NavLink href="/admin/issue-reports" label="Báo cáo sự cố" icon={<AlertTriangle size={20} />} active={isActive('/admin/issue-reports')} onClose={onClose} />
            </>
          )}
        </div>
      </nav>

      <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border-glass)' }}>
        <p style={{ fontSize: '0.75rem', color: 'var(--slate-500)', textAlign: 'center' }}>
          SCEMS Admin v1.0
        </p>
      </div>
    </aside>
  )
}

const NavLink: React.FC<{ href: string; label: string; icon: React.ReactNode; active: boolean; onClose?: () => void }> = ({ href, label, icon, active, onClose }) => (
  <Link
    to={href}
    onClick={onClose}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      padding: '0.75rem 1rem',
      marginBottom: '0.25rem',
      borderRadius: 'var(--radius-md)',
      backgroundColor: active ? 'var(--color-primary)' : 'transparent',
      color: active ? 'white' : 'var(--slate-500)',
      fontWeight: active ? 600 : 500,
      fontSize: '0.925rem',
      textDecoration: 'none',
      transition: 'all 0.2s ease',
      boxShadow: active ? '0 4px 6px -1px rgba(79, 70, 229, 0.3)' : 'none'
    }}
    onMouseEnter={(e) => {
      if (!active) {
        e.currentTarget.style.backgroundColor = 'var(--primary-50)';
        e.currentTarget.style.color = 'var(--primary-600)';
      }
    }}
    onMouseLeave={(e) => {
      if (!active) {
        e.currentTarget.style.backgroundColor = 'transparent';
        e.currentTarget.style.color = 'var(--slate-500)';
      }
    }}
  >
    {icon}
    {label}
  </Link>
)
