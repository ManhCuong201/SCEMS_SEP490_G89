import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { roomService } from '../../../services/room.service'
import { Alert } from '../../../components/Common/Alert'

export const CreateRoomPage: React.FC = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    roomCode: '',
    roomName: '',
    capacity: 20
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: name === 'capacity' ? parseInt(value) : value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await roomService.createRoom(form)
      navigate('/admin/rooms')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-container">
      <h1 style={{ marginBottom: 'var(--spacing-lg)' }}>Create Room</h1>
      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      <div className="card" style={{ maxWidth: '500px' }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Room Code *</label>
            <input type="text" name="roomCode" className="form-input" value={form.roomCode} onChange={handleChange} required disabled={loading} />
          </div>

          <div className="form-group">
            <label className="form-label">Room Name *</label>
            <input type="text" name="roomName" className="form-input" value={form.roomName} onChange={handleChange} required disabled={loading} />
          </div>

          <div className="form-group">
            <label className="form-label">Capacity *</label>
            <input type="number" name="capacity" className="form-input" value={form.capacity} onChange={handleChange} min="1" required disabled={loading} />
          </div>

          <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Creating...' : 'Create'}</button>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/admin/rooms')} disabled={loading}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}
