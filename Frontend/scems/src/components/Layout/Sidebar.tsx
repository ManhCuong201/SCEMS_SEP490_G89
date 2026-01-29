import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Building2,
  CalendarDays,
  Calendar,
  Wrench,
  Settings
} from 'lucide-react'

export const Sidebar: React.FC = () => {
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
      border: '1px solid var(--border-glass)'
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
            Main
          </p>
          <NavLink href="/admin/dashboard" label="Dashboard" icon={<LayoutDashboard size={20} />} active={isActive('/admin/dashboard')} />
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
            Management
          </p>
          <NavLink href="/admin/accounts" label="Accounts" icon={<Users size={20} />} active={isActive('/admin/accounts')} />
          <NavLink href="/admin/rooms" label="Rooms" icon={<Building2 size={20} />} active={isActive('/admin/rooms')} />
          <NavLink href="/admin/room-types" label="Room Categories" icon={<Building2 size={20} />} active={isActive('/admin/room-types')} />
          <NavLink href="/admin/bookings" label="Bookings" icon={<CalendarDays size={20} />} active={isActive('/admin/bookings')} />
          <NavLink href="/admin/equipment" label="Equipment" icon={<Wrench size={20} />} active={isActive('/admin/equipment')} />
          <NavLink href="/admin/equipment-types" label="Equipment Types" icon={<Settings size={20} />} active={isActive('/admin/equipment-types')} />
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

const NavLink: React.FC<{ href: string; label: string; icon: React.ReactNode; active: boolean }> = ({ href, label, icon, active }) => (
  <Link
    to={href}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      padding: '0.75rem 1rem',
      marginBottom: '0.5rem',
      borderRadius: 'var(--radius-md)',
      backgroundColor: active ? 'var(--color-primary)' : 'transparent',
      color: active ? 'white' : 'var(--slate-400)',
      fontWeight: active ? 600 : 500,
      textDecoration: 'none',
      transition: 'all 0.2s ease',
      borderLeft: 'none',
      boxShadow: active ? '0 4px 6px -1px rgba(79, 70, 229, 0.3)' : 'none'
    }}
  >
    {icon}
    {label}
  </Link>
)
