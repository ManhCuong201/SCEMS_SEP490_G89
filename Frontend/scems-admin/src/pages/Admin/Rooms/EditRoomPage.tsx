import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { roomService } from '../../../services/room.service'
import { Alert } from '../../../components/Common/Alert'
import { Loading } from '../../../components/Common/Loading'

export const EditRoomPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    roomCode: '',
    roomName: '',
    capacity: 20
  })

  useEffect(() => {
    const load = async () => {
      try {
        const room = await roomService.getRoomById(id!)
        setForm({
          roomCode: room.roomCode,
          roomName: room.roomName,
          capacity: room.capacity
        })
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: name === 'capacity' ? parseInt(value) : value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      await roomService.updateRoom(id!, form)
      navigate('/admin/rooms')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Loading fullPage />

  return (
    <div className="page-container">
      <h1 style={{ marginBottom: 'var(--spacing-lg)' }}>Edit Room</h1>
      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      <div className="card" style={{ maxWidth: '500px' }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Room Code</label>
            <input type="text" name="roomCode" className="form-input" value={form.roomCode} onChange={handleChange} disabled={saving} />
          </div>

          <div className="form-group">
            <label className="form-label">Room Name</label>
            <input type="text" name="roomName" className="form-input" value={form.roomName} onChange={handleChange} disabled={saving} />
          </div>

          <div className="form-group">
            <label className="form-label">Capacity</label>
            <input type="number" name="capacity" className="form-input" value={form.capacity} onChange={handleChange} min="1" disabled={saving} />
          </div>

          <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/admin/rooms')} disabled={saving}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}
