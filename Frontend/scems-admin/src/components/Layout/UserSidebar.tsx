import React from 'react'
import { Link, useLocation } from 'react-router-dom'

export const UserSidebar: React.FC = () => {
  const location = useLocation()
  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/')

  return (
    <aside className="glass-panel" style={{
      width: '260px',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      padding: '1rem'
    }}>
      <nav style={{ flex: 1 }}>
        <div style={{ marginBottom: '2rem' }}>
          <p style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '1rem',
            paddingLeft: '0.75rem'
          }}>
            Menu
          </p>
          <NavLink href="/rooms" label="🏢 Rooms" active={isActive('/rooms')} />
          <NavLink href="/my-bookings" label="📅 My Bookings" active={isActive('/my-bookings')} />
        </div>
      </nav>
    </aside>
  )
}

const NavLink: React.FC<{ href: string; label: string; active: boolean }> = ({ href, label, active }) => (
  <Link
    to={href}
    style={{
      display: 'block',
      padding: 'var(--spacing-sm) var(--spacing-md)',
      margin: '4px 0',
      borderRadius: 'var(--radius-md)',
      backgroundColor: active ? 'rgba(31,71,136,0.1)' : 'transparent',
      color: active ? 'var(--color-primary)' : 'var(--color-text)',
      fontWeight: active ? 600 : 500,
      textDecoration: 'none',
      borderLeft: active ? '4px solid var(--color-primary)' : '4px solid transparent',
      paddingLeft: active ? 'calc(var(--spacing-md) - 4px)' : 'var(--spacing-md)',
      transition: 'var(--transition-base)'
    }}
  >
    {label}
  </Link>
)
