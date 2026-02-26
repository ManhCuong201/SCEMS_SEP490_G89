import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { accountService } from '../../../services/account.service'
import { Alert } from '../../../components/Common/Alert'
import { Eye, EyeOff } from 'lucide-react'

export const CreateAccountPage: React.FC = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState<{
    fullName: string
    email: string
    phone: string
    password: string
    role: string
    studentCode: string
  }>({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    role: 'Student',
    studentCode: ''
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (form.role === 'Student') {
      const regex = /^[a-zA-Z]{2}\d+$/
      if (!form.studentCode || !regex.test(form.studentCode)) {
        setError('Mã sinh viên phải bắt đầu bằng 2 chữ cái theo sau là các chữ số (VD: HE173561)')
        return
      }
    }

    setLoading(true)

    try {
      await accountService.createAccount(form)
      navigate('/admin/accounts')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Tạo tài khoản thất bại')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-container">
      <h1 style={{ marginBottom: 'var(--spacing-lg)' }}>Tạo Tài khoản</h1>
      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      <div className="card" style={{ maxWidth: '500px' }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Họ và tên *</label>
            <input type="text" name="fullName" className="form-input" value={form.fullName} onChange={handleChange} required disabled={loading} />
          </div>

          <div className="form-group">
            <label className="form-label">Email *</label>
            <input type="email" name="email" className="form-input" value={form.email} onChange={handleChange} required disabled={loading} />
          </div>

          <div className="form-group">
            <label className="form-label">Số điện thoại</label>
            <input type="tel" name="phone" className="form-input" value={form.phone} onChange={handleChange} disabled={loading} />
          </div>

          <div className="form-group">
            <label className="form-label">Mật khẩu *</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                className="form-input"
                value={form.password}
                onChange={handleChange}
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

          <div className="form-group">
            <label className="form-label">Vai trò *</label>
            <select name="role" className="form-select" value={form.role} onChange={handleChange} disabled={loading}>
              <option value="Admin">Quản trị viên</option>
              <option value="BookingStaff">Nhân viên Duyệt mượn</option>
              <option value="AssetStaff">Nhân viên Tài sản</option>
              <option value="Guard">Bảo vệ</option>
              <option value="Lecturer">Giảng viên</option>
              <option value="Student">Sinh viên</option>
            </select>
          </div>

          {form.role === 'Student' && (
            <div className="form-group">
              <label className="form-label">Mã sinh viên *</label>
              <input
                type="text"
                name="studentCode"
                className="form-input"
                value={form.studentCode}
                onChange={handleChange}
                placeholder="VD: HE173561"
                required
                disabled={loading}
              />
              <small className="text-muted">Định dạng: 2 chữ cái đầu theo sau là các chữ số (VD: HE173561)</small>
            </div>
          )}

          <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Đang tạo...' : 'Tạo mới'}</button>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/admin/accounts')} disabled={loading}>Hủy</button>
          </div>
        </form>
      </div>
    </div>
  )
}
