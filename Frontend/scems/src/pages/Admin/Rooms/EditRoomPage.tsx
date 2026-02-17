import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { roomService } from '../../../services/room.service'
import { roomTypeService } from '../../../services/roomType.service'
import { Alert } from '../../../components/Common/Alert'
import { Loading } from '../../../components/Common/Loading'
import { RoomType } from '../../../types/api'

export const EditRoomPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([])
  const [form, setForm] = useState({
    roomCode: '',
    roomName: '',
    building: '',
    capacity: 20,
    roomTypeId: ''
  })

  useEffect(() => {
    const load = async () => {
      try {
        const [room, types] = await Promise.all([
          roomService.getRoomById(id!),
          roomTypeService.getAll()
        ])
        setRoomTypes(types)
        setForm({
          roomCode: room.roomCode,
          roomName: room.roomName,
          building: room.building || '',
          capacity: room.capacity,
          roomTypeId: room.roomTypeId || (types.length > 0 ? types[0].id : '')
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
      <h1 style={{ marginBottom: '1.5rem' }}>Edit Room</h1>
      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      <div className="glass-panel" style={{ maxWidth: '600px', padding: '2rem' }}>
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
            <label className="form-label">Building</label>
            <input type="text" name="building" className="form-input" value={form.building} onChange={handleChange} disabled={saving} />
          </div>

          <div className="form-group">
            <label className="form-label">Capacity</label>
            <input type="number" name="capacity" className="form-input" value={form.capacity} onChange={handleChange} min="1" disabled={saving} />
          </div>

          <div className="form-group">
            <label className="form-label">Room Type</label>
            <select
              name="roomTypeId"
              className="form-input"
              value={form.roomTypeId}
              onChange={handleChange}
              disabled={saving}
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
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/admin/rooms')} disabled={saving}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}
