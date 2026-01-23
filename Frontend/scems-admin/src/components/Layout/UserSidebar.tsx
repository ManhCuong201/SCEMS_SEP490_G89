import React from 'react'
import { Link, useLocation } from 'react-router-dom'

export const UserSidebar: React.FC = () => {
  const location = useLocation()
  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/')

  return (
    <aside style={{
      width: '260px',
      backgroundColor: 'var(--bg-primary)',
      borderRight: '1px solid var(--color-border)',
      position: 'sticky',
      top: '64px',
      height: 'calc(100vh - 64px)',
      overflowY: 'auto'
    }}>
      <nav style={{ padding: 'var(--spacing-md)' }}>
        <div style={{ marginBottom: 'var(--spacing-lg)' }}>
          <p style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', margin: '0 0 var(--spacing-md) 0' }}>
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
