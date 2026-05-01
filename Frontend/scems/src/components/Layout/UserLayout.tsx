import React from 'react'
import { Header } from './Header'
import { UserSidebar } from './UserSidebar'

interface UserLayoutProps {
  children: React.ReactNode
}

export const UserLayout: React.FC<UserLayoutProps> = ({ children }) => {
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
          <UserSidebar onClose={() => setIsSidebarOpen(false)} />
        </aside>

        <main className="glass-panel mob-main-content" style={{
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
