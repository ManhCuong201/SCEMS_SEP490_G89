import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../Common/Button'

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate()

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: 'var(--spacing-lg)',
      textAlign: 'center'
    }}>
      <h1 style={{ fontSize: 'var(--font-size-4xl)', marginBottom: 'var(--spacing-md)' }}>
        404
      </h1>
      <h2 style={{ marginBottom: 'var(--spacing-lg)', color: 'var(--text-secondary)' }}>
        Page Not Found
      </h2>
      <p style={{ marginBottom: 'var(--spacing-xl)', color: 'var(--text-secondary)' }}>
        The page you're looking for doesn't exist.
      </p>
      <Button onClick={() => navigate('/admin/dashboard')}>
        Back to Dashboard
      </Button>
    </div>
  )
}
