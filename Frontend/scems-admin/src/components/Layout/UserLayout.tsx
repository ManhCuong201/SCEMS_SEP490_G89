import React from 'react'
import { Header } from './Header'
import { UserSidebar } from './UserSidebar'

interface UserLayoutProps {
  children: React.ReactNode
}

export const UserLayout: React.FC<UserLayoutProps> = ({ children }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Header />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <UserSidebar />
        <main style={{
          flex: 1,
          overflowY: 'auto',
          backgroundColor: 'var(--color-background)'
        }}>
          {children}
        </main>
      </div>
    </div>
  )
}
