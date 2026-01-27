import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export const Header: React.FC = () => {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [showMenu, setShowMenu] = React.useState(false)

  const handleLogout = () => {
    logout()
    navigate('/auth/login')
  }

  return (
    <header className="glass-panel" style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '0.75rem 1.5rem',
      margin: '0.5rem 1rem',
      borderRadius: 'var(--radius-lg)',
      position: 'sticky',
      top: '0.5rem',
      zIndex: 1000
    }}>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, background: 'linear-gradient(to right, var(--primary-600), var(--secondary-500))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>SCEMS Admin</h2>
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setShowMenu(!showMenu)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            borderRadius: 'var(--radius-md)',
            background: 'var(--slate-100)',
            color: 'var(--text-main)',
            fontWeight: 500,
            fontSize: '0.875rem'
          }}
        >
          {user?.fullName || 'User'}
          <span style={{ fontSize: '0.75rem' }}>▼</span>
        </button>
        {showMenu && (
          <div className="glass-card" style={{
            position: 'absolute',
            top: 'calc(100% + 0.5rem)',
            right: 0,
            width: '200px',
            padding: '0.5rem',
            zIndex: 101
          }}>
            <div style={{ padding: '0.75rem', borderBottom: '1px solid var(--slate-200)', marginBottom: '0.5rem' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Signed in as</p>
              <p style={{ fontSize: '0.875rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '0.5rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--color-danger)',
                fontSize: '0.875rem',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--slate-50)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
