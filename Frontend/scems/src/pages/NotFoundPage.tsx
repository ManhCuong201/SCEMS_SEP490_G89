import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Home, AlertCircle } from 'lucide-react'

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate()

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at top right, #1e1b4b 0%, #0f172a 100%)',
      padding: '1rem'
    }}>
      <div className="glass-panel" style={{
        padding: '4rem 2rem',
        textAlign: 'center',
        maxWidth: '480px',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1.5rem',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative background glow inside card */}
        <div style={{
          position: 'absolute',
          top: '-50%',
          left: '-50%',
          width: '200%',
          height: '200%',
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          padding: '1rem',
          borderRadius: '50%',
          color: 'var(--color-danger)',
          display: 'flex',
          marginBottom: '0.5rem'
        }}>
          <AlertCircle size={48} strokeWidth={1.5} />
        </div>

        <h1 className="text-gradient" style={{
          fontSize: '5rem',
          fontWeight: 800,
          lineHeight: 1,
          margin: 0
        }}>
          404
        </h1>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Page Not Found</h2>
          <p className="text-muted">
            The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => navigate('/')}
          style={{
            marginTop: '1rem',
            padding: '0.75rem 2rem',
            fontSize: '1rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Home size={18} />
          Back to Home
        </button>
      </div>
    </div>
  )
}
