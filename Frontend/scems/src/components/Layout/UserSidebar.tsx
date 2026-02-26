import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Building2, CalendarDays, Calendar, Users, LayoutGrid, AlertTriangle } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export const UserSidebar: React.FC = () => {
  const location = useLocation()
  const { user } = useAuth()
  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/')

  return (
    <aside className="glass-panel" style={{
      width: '260px',
      display: 'flex',
      flexDirection: 'column',
      padding: '1.5rem',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--border-glass)'
    }}>
      <nav style={{ flex: 1 }}>
        <div style={{ marginBottom: '2rem' }}>
          <p style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            color: 'var(--slate-400)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '1rem'
          }}>
            Danh mục
          </p>
          <NavLink href="/dashboard" label="Lịch trình hôm nay" icon={<LayoutGrid size={20} />} active={isActive('/dashboard')} />
          <NavLink href="/rooms" label="Phòng" icon={<Building2 size={20} />} active={isActive('/rooms')} />
          {user?.role === 'Lecturer' && (
            <NavLink href="/teacher/classes" label="Lớp học của tôi" icon={<Users size={20} />} active={isActive('/teacher/classes')} />
          )}
          {(user?.role === 'Lecturer' || user?.role === 'Student') && (
            <NavLink href="/schedule" label="Lịch học" icon={<Calendar size={20} />} active={isActive('/schedule')} />
          )}
          <NavLink href="/my-bookings" label="Yêu cầu đặt phòng" icon={<CalendarDays size={20} />} active={isActive('/my-bookings')} />
          {(user?.role === 'Lecturer' || user?.role === 'Student') && (
            <NavLink href="/issue-reports" label="Báo cáo sự cố" icon={<AlertTriangle size={20} />} active={isActive('/issue-reports')} />
          )}
        </div>
      </nav>

      <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border-glass)' }}>
        <p style={{ fontSize: '0.75rem', color: 'var(--slate-500)', textAlign: 'center' }}>
          SCEMS v1.0
        </p>
      </div>
    </aside>
  )
}

const NavLink: React.FC<{ href: string; label: string; icon: React.ReactNode; active: boolean }> = ({ href, label, icon, active }) => (
  <Link
    to={href}
    className="sidebar-nav-link"
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
