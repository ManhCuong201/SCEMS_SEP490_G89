import React from 'react'
import { Header } from './Header'
import { Sidebar } from './Sidebar'

interface AdminLayoutProps {
  children: React.ReactNode
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #eef2ff 50%, #f0fdfa 100%)' }}>
      {/* Click-away overlay — only appears on mobile when sidebar is open */}
      <div
        className={`mob-sidebar-overlay${isSidebarOpen ? ' mob-open' : ''}`}
        onClick={() => setIsSidebarOpen(false)}
      />

      <Header onToggleSidebar={() => setIsSidebarOpen(o => !o)} />

      <div className="mob-content-wrapper" style={{ display: 'flex', flex: 1, overflow: 'hidden', padding: '0 1rem 1rem 1rem', gap: '1rem' }}>
        <aside className={`mob-sidebar${isSidebarOpen ? ' mob-open' : ''}`}>
          <Sidebar onClose={() => setIsSidebarOpen(false)} />
        </aside>

        <main className="glass-panel mob-main-content" style={{
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
