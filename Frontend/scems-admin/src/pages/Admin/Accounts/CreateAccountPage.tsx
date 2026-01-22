import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { accountService } from '../../../services/account.service'
import { Alert } from '../../../components/Common/Alert'

export const CreateAccountPage: React.FC = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    role: 'Student'
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await accountService.createAccount(form)
      navigate('/admin/accounts')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-container">
      <h1 style={{ marginBottom: 'var(--spacing-lg)' }}>Create Account</h1>
      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      <div className="card" style={{ maxWidth: '500px' }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input type="text" name="fullName" className="form-input" value={form.fullName} onChange={handleChange} required disabled={loading} />
          </div>

          <div className="form-group">
            <label className="form-label">Email *</label>
            <input type="email" name="email" className="form-input" value={form.email} onChange={handleChange} required disabled={loading} />
          </div>

          <div className="form-group">
            <label className="form-label">Phone</label>
            <input type="tel" name="phone" className="form-input" value={form.phone} onChange={handleChange} disabled={loading} />
          </div>

          <div className="form-group">
            <label className="form-label">Password *</label>
            <input type="password" name="password" className="form-input" value={form.password} onChange={handleChange} required disabled={loading} />
          </div>

          <div className="form-group">
            <label className="form-label">Role *</label>
            <select name="role" className="form-select" value={form.role} onChange={handleChange} disabled={loading}>
              <option>Admin</option>
              <option>Lecturer</option>
              <option>Student</option>
              <option>Technician</option>
              <option>Manager</option>
              <option>Principal</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Creating...' : 'Create'}</button>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/admin/accounts')} disabled={loading}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}
