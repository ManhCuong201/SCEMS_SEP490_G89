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
    <header style={{
      backgroundColor: 'var(--color-primary)',
      color: 'var(--color-white)',
      padding: 'var(--spacing-md) var(--spacing-lg)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      boxShadow: 'var(--shadow-md)',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <h2 style={{ margin: 0 }}>SCEMS Admin</h2>
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setShowMenu(!showMenu)}
          style={{
            background: 'rgba(255,255,255,0.2)',
            border: 'none',
            color: 'inherit',
            padding: 'var(--spacing-sm) var(--spacing-md)',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            fontSize: 'var(--font-size-base)'
          }}
        >
          {user?.fullName || 'User'} ▼
        </button>
        {showMenu && (
          <div style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: 'var(--spacing-sm)',
            backgroundColor: 'var(--color-white)',
            color: 'var(--color-text)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            minWidth: '200px',
            zIndex: 101
          }}>
            <div style={{ padding: 'var(--spacing-md)', borderBottom: '1px solid var(--color-border)' }}>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', margin: 0 }}>
                {user?.email}
              </p>
            </div>
            <button
              onClick={handleLogout}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: 'var(--spacing-md)',
                border: 'none',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                color: 'var(--color-danger)',
                fontSize: 'var(--font-size-base)'
              }}
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
