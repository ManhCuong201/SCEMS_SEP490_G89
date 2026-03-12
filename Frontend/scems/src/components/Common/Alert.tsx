import React from 'react'

interface AlertProps {
  type: 'success' | 'error' | 'warning' | 'info'
  message: string | React.ReactNode
  onClose?: () => void
}

export const Alert: React.FC<AlertProps> = ({ type, message, onClose }) => {
  const className = `alert alert-${type}`

  return (
    <div className={className}>
      <span style={{ whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>{message}</span>
      {onClose && (
        <button onClick={onClose} aria-label="Close alert">
          ×
        </button>
      )}
    </div>
  )
}
