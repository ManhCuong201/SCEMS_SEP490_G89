import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { equipmentTypeService } from '../../../services/equipment-type.service'
import { Alert } from '../../../components/Common/Alert'

export const CreateEquipmentTypePage: React.FC = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '',
    description: ''
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await equipmentTypeService.createEquipmentType(form)
      navigate('/admin/equipment-types')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-container">
      <h1 style={{ marginBottom: 'var(--spacing-lg)' }}>Create Equipment Type</h1>
      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      <div className="card" style={{ maxWidth: '500px' }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Name *</label>
            <input type="text" name="name" className="form-input" value={form.name} onChange={handleChange} required disabled={loading} />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea name="description" className="form-textarea" value={form.description} onChange={handleChange} disabled={loading} />
          </div>

          <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Creating...' : 'Create'}</button>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/admin/equipment-types')} disabled={loading}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}
