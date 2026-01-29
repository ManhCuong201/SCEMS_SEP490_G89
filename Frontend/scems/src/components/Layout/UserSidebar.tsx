import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Building2, CalendarDays } from 'lucide-react'

export const UserSidebar: React.FC = () => {
  const location = useLocation()
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
            Menu
          </p>
          <NavLink href="/rooms" label="Rooms" icon={<Building2 size={20} />} active={isActive('/rooms')} />
          <NavLink href="/my-bookings" label="My Bookings" icon={<CalendarDays size={20} />} active={isActive('/my-bookings')} />
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
      marginBottom: '0.5rem',
      borderRadius: 'var(--radius-md)',
      backgroundColor: active ? 'var(--color-primary)' : 'transparent',
      color: active ? 'white' : 'var(--slate-400)',
      fontWeight: active ? 600 : 500,
      textDecoration: 'none',
      transition: 'all 0.2s ease',
      boxShadow: active ? '0 4px 6px -1px rgba(79, 70, 229, 0.3)' : 'none'
    }}
  >
    {icon}
    {label}
  </Link>
)
