import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { accountService } from '../../../services/account.service'
import { Alert } from '../../../components/Common/Alert'
import { Loading } from '../../../components/Common/Loading'

export const EditAccountPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<{
    fullName: string
    email: string
    phone: string
    role: string
    studentCode: string
  }>({
    fullName: '',
    email: '',
    phone: '',
    role: 'Student',
    studentCode: ''
  })

  useEffect(() => {
    const load = async () => {
      try {
        const account = await accountService.getAccountById(id!)
        if (account.email === 'admin@scems.com') {
          setError('System account cannot be modified')
          return
        }

        setForm({
          fullName: account.fullName,
          email: account.email,
          phone: account.phone,
          role: account.role,
          studentCode: account.studentCode || ''
        })
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

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
        setError('Student Code must start with 2 letters followed by digits (e.g. HE173561)')
        return
      }
    }

    setSaving(true)

    try {
      await accountService.updateAccount(id!, form)
      navigate('/admin/accounts')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Loading fullPage />

  return (
    <div className="page-container">
      <h1 style={{ marginBottom: 'var(--spacing-lg)' }}>Edit Account</h1>
      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      <div className="card" style={{ maxWidth: '500px' }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input type="text" name="fullName" className="form-input" value={form.fullName} onChange={handleChange} disabled={saving} />
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <input type="email" name="email" className="form-input" value={form.email} onChange={handleChange} disabled={saving} />
          </div>

          <div className="form-group">
            <label className="form-label">Phone</label>
            <input type="tel" name="phone" className="form-input" value={form.phone} onChange={handleChange} disabled={saving} />
          </div>

          <div className="form-group">
            <label className="form-label">Role</label>
            <select name="role" className="form-select" value={form.role} onChange={handleChange} disabled={saving}>
              <option>Admin</option>
              <option>Lecturer</option>
              <option>Student</option>
              <option>BookingStaff</option>
              <option>AssetStaff</option>
              <option>Guard</option>
            </select>
          </div>

          {form.role === 'Student' && (
            <div className="form-group">
              <label className="form-label">Student Code</label>
              <input
                type="text"
                name="studentCode"
                className="form-input"
                value={form.studentCode}
                onChange={handleChange}
                placeholder="e.g. HE173561"
                disabled={saving}
              />
              <small className="text-muted">Format: 2 letters followed by digits (e.g. HE173561)</small>
            </div>
          )}

          <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/admin/accounts')} disabled={saving}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}
