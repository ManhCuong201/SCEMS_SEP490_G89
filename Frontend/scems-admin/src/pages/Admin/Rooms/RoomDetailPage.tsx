import React, { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { roomService } from '../../../services/room.service'
import { Room } from '../../../types/api'
import { Alert } from '../../../components/Common/Alert'
import { Loading } from '../../../components/Common/Loading'

export const RoomDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [room, setRoom] = useState<Room | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const data = await roomService.getRoomById(id!)
        setRoom(data)
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const handleDelete = async () => {
    if (confirm('Delete this room?')) {
      try {
        await roomService.deleteRoom(id!)
        navigate('/admin/rooms')
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to delete')
      }
    }
  }

  if (loading) return <Loading fullPage />
  if (!room) return <Alert type="error" message="Not found" />

  const getBadgeClass = (status: string) => {
    if (status === 'Available') return 'badge-success'
    if (status === 'Disabled') return 'badge-danger'
    return 'badge-warning'
  }

  return (
    <div className="page-container">
      <div className="card-header" style={{ marginBottom: 'var(--spacing-lg)' }}>
        <h1>{room.roomName}</h1>
        <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
          <Link to={`/admin/rooms/${id}/edit`} className="btn btn-primary">Edit</Link>
          <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
          <button className="btn btn-secondary" onClick={() => navigate('/admin/rooms')}>Back</button>
        </div>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      <div className="card">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--spacing-lg)' }}>
          <div>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>Room Code</p>
            <p style={{ fontWeight: 600 }}>{room.roomCode}</p>
          </div>
          <div>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>Capacity</p>
            <p style={{ fontWeight: 600 }}>{room.capacity}</p>
          </div>
          <div>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>Equipment Count</p>
            <p style={{ fontWeight: 600 }}>{room.equipmentCount}</p>
          </div>
          <div>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>Status</p>
            <span className={`badge ${getBadgeClass(room.status)}`}>{room.status}</span>
          </div>
          <div>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>Created</p>
            <p style={{ fontWeight: 600 }}>{new Date(room.createdAt).toLocaleString()}</p>
          </div>
          <div>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>Updated</p>
            <p style={{ fontWeight: 600 }}>{new Date(room.updatedAt).toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
