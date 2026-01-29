import React from 'react'
import { Header } from './Header'
import { Sidebar } from './Sidebar'

interface AdminLayoutProps {
  children: React.ReactNode
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'radial-gradient(circle at top right, #1e293b 0%, #0f172a 100%)' }}>
      <Header />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', padding: '0 1rem 1rem 1rem', gap: '1rem' }}>
        <Sidebar />
        <main className="glass-panel" style={{
          flex: 1,
          overflowY: 'auto',
          borderRadius: 'var(--radius-lg)',
          padding: '2rem',
          border: '1px solid var(--border-glass)'
        }}>
          {children}
        </main>
      </div>
    </div>
  )
}
