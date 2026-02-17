import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Alert } from '../../components/Common/Alert'
import { GoogleLogin } from '@react-oauth/google'
import { authService } from '../../services/auth.service'

export const LoginPage: React.FC = () => {
  const navigate = useNavigate()
  const { login, googleLogin } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(email, password)

      const userStr = localStorage.getItem('user')
      if (userStr) {
        const user = JSON.parse(userStr)
        if (user.role === 'Admin' || user.role === 'AssetStaff' || user.role === 'BookingStaff') {
          navigate('/admin/dashboard')
        } else {
          navigate('/dashboard')
        }
      } else {
        navigate('/dashboard')
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="text-center mb-lg">
          <h1 className="text-gradient" style={{ marginBottom: '0.5rem' }}>SCEMS</h1>
          <p className="text-muted">Smart Classroom & Equipment Management</p>
        </div>

        {error && <Alert type="error" message={error} onClose={() => setError('')} />}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              required
              disabled={loading}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.5rem' }}
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-lg">
          <div style={{ position: 'relative', textAlign: 'center', marginBottom: '1.5rem' }}>
            <div style={{ position: 'absolute', top: '50%', left: '0', right: '0', height: '1px', background: 'var(--slate-600)', opacity: 0.3 }}></div>
            <span style={{ position: 'relative', background: 'var(--bg-surface)', padding: '0 1rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Or continue with</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <GoogleLogin
              onSuccess={async (credentialResponse) => {
                try {
                  setLoading(true)
                  if (credentialResponse.credential) {
                    if (credentialResponse.credential) {
                      await googleLogin(credentialResponse.credential)
                      // State update in context is async but fast enough. 
                      // To be safe, we can read from context or look at localstorage for role navigation
                      const user = authService.getUser()
                      if (user) {
                        if (user.role === 'Admin' || user.role === 'AssetStaff' || user.role === 'BookingStaff') {
                          navigate('/admin/dashboard')
                        } else {
                          navigate('/dashboard')
                        }
                      }
                    }
                  }
                } catch (err: any) {
                  setError('Google Login Failed: ' + (err.response?.data?.message || err.message))
                } finally {
                  setLoading(false)
                }
              }}
              onError={() => {
                setError('Google Login Failed')
              }}
              useOneTap
              shape="circle"
              text="signin_with"
              width="200"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
