import React from 'react'
import { Header } from './Header'
import { Sidebar } from './Sidebar'

interface AdminLayoutProps {
  children: React.ReactNode
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Header />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar />
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
