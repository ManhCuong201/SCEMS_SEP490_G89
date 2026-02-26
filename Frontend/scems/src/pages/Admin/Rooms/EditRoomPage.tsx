import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { roomService } from '../../../services/room.service'
import { roomTypeService } from '../../../services/roomType.service'
import { departmentService } from '../../../services/department.service'
import { Alert } from '../../../components/Common/Alert'
import { Loading } from '../../../components/Common/Loading'
import { RoomType, Department } from '../../../types/api'

export const EditRoomPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
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
    const load = async () => {
      try {
        const [room, types, depts] = await Promise.all([
          roomService.getRoomById(id!),
          roomTypeService.getAll(),
          departmentService.getAll()
        ])
        setRoomTypes(types)
        setDepartments(depts)
        setForm({
          roomCode: room.roomCode,
          roomName: room.roomName,
          building: room.building || '',
          capacity: room.capacity,
          roomTypeId: room.roomTypeId || (types.length > 0 ? types[0].id : ''),
          departmentId: room.departmentId || (depts.length > 0 ? depts[0].id : '')
        })
      } catch (err: any) {
        setError(err.response?.data?.message || 'Tải dữ liệu thất bại')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target

    if (name === 'departmentId') {
      const selectedDept = departments.find(d => d.id === value);
      setForm(prev => ({
        ...prev,
        departmentId: value,
        building: selectedDept ? selectedDept.departmentName : prev.building
      }));
    } else {
      setForm(prev => ({ ...prev, [name]: name === 'capacity' ? parseInt(value) : value }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      await roomService.updateRoom(id!, form)
      navigate('/admin/rooms')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Lưu thất bại')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Loading fullPage />

  return (
    <div className="page-container">
      <h1 style={{ marginBottom: '1.5rem' }}>Chỉnh sửa phòng</h1>
      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      <div className="glass-panel" style={{ maxWidth: '600px', padding: '2rem' }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Mã phòng</label>
            <input type="text" name="roomCode" className="form-input" value={form.roomCode} onChange={handleChange} disabled={saving} />
          </div>

          <div className="form-group">
            <label className="form-label">Tên phòng</label>
            <input type="text" name="roomName" className="form-input" value={form.roomName} onChange={handleChange} disabled={saving} />
          </div>

          <div className="form-group">
            <label className="form-label">Sức chứa</label>
            <input type="number" name="capacity" className="form-input" value={form.capacity} onChange={handleChange} min="1" disabled={saving} />
          </div>

          <div className="form-group">
            <label className="form-label">Loại phòng</label>
            <select
              name="roomTypeId"
              className="form-input"
              value={form.roomTypeId}
              onChange={handleChange}
              disabled={saving}
            >
              <option value="">-- Chọn Loại phòng --</option>
              {roomTypes.map(type => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Tòa nhà</label>
            <select
              name="departmentId"
              className="form-input"
              value={form.departmentId}
              onChange={handleChange}
              disabled={saving}
              required
            >
              <option value="">-- Chọn Tòa nhà --</option>
              {departments.map(dept => (
                <option key={dept.id} value={dept.id}>
                  {dept.departmentName} ({dept.departmentCode})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu'}</button>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/admin/rooms')} disabled={saving}>Hủy</button>
          </div>
        </form>
      </div>
    </div>
  )
}
