import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { roomService } from '../../../services/room.service'
import { roomTypeService } from '../../../services/roomType.service'
import { departmentService } from '../../../services/department.service'
import { Alert } from '../../../components/Common/Alert'
import { RoomType, Department } from '../../../types/api'

export const CreateRoomPage: React.FC = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([])
  const [departments, setDepartments] = useState<Department[]>([])

  const [form, setForm] = useState({
    roomCode: '',
    roomName: '',
    building: '',
    capacity: 20,
    roomTypeId: '',
    departmentId: ''
  })

  useEffect(() => {
    const loadData = async () => {
      try {
        const [types, depts] = await Promise.all([
          roomTypeService.getAll(),
          departmentService.getAll()
        ])
        setRoomTypes(types)
        setDepartments(depts)
        if (types.length > 0 || depts.length > 0) {
          setForm(prev => ({
            ...prev,
            roomTypeId: types.length > 0 ? types[0].id : '',
            departmentId: depts.length > 0 ? depts[0].id : '',
            building: depts.length > 0 ? depts[0].departmentName : ''
          }))
        }
      } catch (err) {
        console.error("Failed to load dependency data")
      }
    }
    loadData()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target

    if (name === 'departmentId') {
      const selectedDept = departments.find(d => d.id === value);
      setForm(prev => ({
        ...prev,
        departmentId: value,
        building: selectedDept ? selectedDept.departmentName : ''
      }));
    } else {
      setForm(prev => ({ ...prev, [name]: name === 'capacity' ? parseInt(value) : value }))
    }
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

          <div className="form-group">
            <label className="form-label">Department / Building *</label>
            <select
              name="departmentId"
              className="form-input"
              value={form.departmentId}
              onChange={handleChange}
              disabled={loading}
              required
            >
              <option value="">-- Select Department --</option>
              {departments.map(dept => (
                <option key={dept.id} value={dept.id}>
                  {dept.departmentName} ({dept.departmentCode})
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
