import React from 'react'

interface LoadingProps {
  fullPage?: boolean
}

export const Loading: React.FC<LoadingProps> = ({ fullPage }) => {
  if (fullPage) {
    return (
      <div className="loading-fullpage">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div className="loading-container">
      <div className="spinner"></div>
    </div>
  )
}
