import React from 'react'
import { Header } from './Header'
import { UserSidebar } from './UserSidebar'

interface UserLayoutProps {
  children: React.ReactNode
}

export const UserLayout: React.FC<UserLayoutProps> = ({ children }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg-app)' }}>
      <Header />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', padding: '0 1rem 1rem 1rem', gap: '1rem' }}>
        <UserSidebar />
        <main className="glass-panel" style={{
          flex: 1,
          overflowY: 'auto',
          padding: '2rem',
          borderRadius: 'var(--radius-lg)'
        }}>
          {children}
        </main>
      </div>
    </div>
  )
}
