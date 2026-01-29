import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { roomService } from '../../../services/room.service'
import { roomTypeService } from '../../../services/roomType.service'
import { Alert } from '../../../components/Common/Alert'
import { RoomType } from '../../../types/api'

export const CreateRoomPage: React.FC = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([])

  const [form, setForm] = useState({
    roomCode: '',
    roomName: '',
    capacity: 20,
    roomTypeId: ''
  })

  useEffect(() => {
    const loadTypes = async () => {
      try {
        const types = await roomTypeService.getAll()
        setRoomTypes(types)
        if (types.length > 0) {
          setForm(prev => ({ ...prev, roomTypeId: types[0].id }))
        }
      } catch (err) {
        console.error("Failed to load room types")
      }
    }
    loadTypes()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
      <h1 style={{ marginBottom: '1.5rem' }}>Create Room</h1>
      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      <div className="glass-panel" style={{ maxWidth: '600px', padding: '2rem' }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Room Code *</label>
            <input type="text" name="roomCode" className="form-input" value={form.roomCode} onChange={handleChange} required disabled={loading} placeholder="e.g. A201" />
          </div>

          <div className="form-group">
            <label className="form-label">Room Name *</label>
            <input type="text" name="roomName" className="form-input" value={form.roomName} onChange={handleChange} required disabled={loading} placeholder="e.g. Computer Lab 01" />
          </div>

          <div className="form-group">
            <label className="form-label">Capacity *</label>
            <input type="number" name="capacity" className="form-input" value={form.capacity} onChange={handleChange} min="1" required disabled={loading} />
          </div>

          <div className="form-group">
            <label className="form-label">Room Type</label>
            <select
              name="roomTypeId"
              className="form-input"
              value={form.roomTypeId}
              onChange={handleChange}
              disabled={loading}
            >
              <option value="">-- Select Type --</option>
              {roomTypes.map(type => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Creating...' : 'Create Room'}</button>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/admin/rooms')} disabled={loading}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}
