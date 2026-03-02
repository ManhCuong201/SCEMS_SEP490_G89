import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Alert } from '../../components/Common/Alert'
import { GoogleLogin } from '@react-oauth/google'
import { authService } from '../../services/auth.service'
import { Eye, EyeOff } from 'lucide-react'

export const LoginPage: React.FC = () => {
  const navigate = useNavigate()
  const { login, googleLogin } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(email, password)

      const userStr = localStorage.getItem('user')
      if (userStr) {
        const user = JSON.parse(userStr)
        if (user.role === 'Admin' || user.role === 'AssetStaff' || user.role === 'BookingStaff' || user.role === 'Guard') {
          navigate('/admin/dashboard')
        } else {
          navigate('/dashboard')
        }
      } else {
        navigate('/dashboard')
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Đăng nhập thất bại')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="text-center mb-lg">
          <h1 className="text-gradient" style={{ marginBottom: '0.5rem' }}>SCEMS</h1>
          <p className="text-muted">Hệ thống Quản lý Thiết bị & Lớp học Thông minh</p>
        </div>

        {error && <Alert type="error" message={error} onClose={() => setError('')} />}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Địa chỉ Email</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ten@vidu.com"
              autoComplete="username"
              required
              disabled={loading}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Mật khẩu</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu của bạn"
                autoComplete="current-password"
                required
                disabled={loading}
                style={{ paddingRight: '2.75rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--slate-400)',
                  padding: '0.25rem',
                  display: 'flex',
                  alignItems: 'center'
                }}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.5rem' }}
            disabled={loading}
          >
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>

        <div className="mt-lg">
          <div style={{ position: 'relative', textAlign: 'center', marginBottom: '1.5rem' }}>
            <div style={{ position: 'absolute', top: '50%', left: '0', right: '0', height: '1px', background: 'var(--slate-600)', opacity: 0.3 }}></div>
            <span style={{ position: 'relative', background: 'var(--bg-surface)', padding: '0 1rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Hoặc tiếp tục với</span>
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
                        if (user.role === 'Admin' || user.role === 'AssetStaff' || user.role === 'BookingStaff' || user.role === 'Guard') {
                          navigate('/admin/dashboard')
                        } else {
                          navigate('/dashboard')
                        }
                      }
                    }
                  }
                } catch (err: any) {
                  setError('Google đăng nhập thất bại: ' + (err.response?.data?.message || err.message))
                } finally {
                  setLoading(false)
                }
              }}
              onError={() => {
                setError('Google đăng nhập thất bại')
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
