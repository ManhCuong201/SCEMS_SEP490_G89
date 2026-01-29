import React, { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { roomService } from '../../../services/room.service'
import { Room } from '../../../types/api'
import { Alert } from '../../../components/Common/Alert'
import { Loading } from '../../../components/Common/Loading'
import { Edit, Trash2, ArrowLeft, Calendar } from 'lucide-react'
import { ConfirmModal } from '../../../components/Common/ConfirmModal'

export const RoomDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [room, setRoom] = useState<Room | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)

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

  const handleDeleteClick = () => {
    setDeleteId(id!)
  }

  const handleConfirmDelete = async () => {
    if (deleteId) {
      try {
        await roomService.deleteRoom(deleteId)
        navigate('/admin/rooms')
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to delete')
      } finally {
        setDeleteId(null)
      }
    }
  }

  if (loading) return <Loading fullPage />
  if (!room) return <Alert type="error" message="Not found" />

  const getStatusColor = (status: string) => {
    if (status === 'Available') return 'var(--color-success)'
    if (status === 'Disabled') return 'var(--color-danger)'
    return 'var(--color-warning)'
  }

  const getStatusBg = (status: string) => {
    if (status === 'Available') return 'rgba(16, 185, 129, 0.1)'
    if (status === 'Disabled') return 'rgba(239, 68, 68, 0.1)'
    return 'rgba(245, 158, 11, 0.1)'
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={() => navigate('/admin/rooms')}
            className="btn btn-secondary"
            style={{ padding: '0.5rem', borderRadius: '50%' }}
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1>{room.roomName}</h1>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>{room.roomCode}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link to={`/admin/rooms/${id}/edit`} className="btn btn-secondary" style={{ gap: '0.5rem' }}>
            <Edit size={18} /> Edit
          </Link>
          <button
            className="btn btn-danger"
            onClick={handleDeleteClick}
            style={{ gap: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-danger)', border: '1px solid rgba(239, 68, 68, 0.2)' }}
          >
            <Trash2 size={18} /> Delete
          </button>
        </div>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      <div className="glass-panel" style={{ padding: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem' }}>
          <div>
            <label style={{ display: 'block', color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
              Capacity
            </label>
            <div style={{ fontSize: '1.25rem', fontWeight: 500 }}>
              {room.capacity} People
            </div>
          </div>

          <div>
            <label style={{ display: 'block', color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
              Equipment Count
            </label>
            <div style={{ fontSize: '1.25rem', fontWeight: 500 }}>
              {room.equipmentCount} Items
            </div>
          </div>

          <div>
            <label style={{ display: 'block', color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
              Status
            </label>
            <span
              className="badge"
              style={{
                backgroundColor: getStatusBg(room.status),
                color: getStatusColor(room.status),
                fontSize: '0.9rem',
                padding: '0.35em 0.8em'
              }}
            >
              {room.status}
            </span>
          </div>

          <div>
            <label style={{ display: 'block', color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
              Created At
            </label>
            <div style={{ fontSize: '1rem', color: 'var(--text-main)' }}>
              {new Date(room.createdAt).toLocaleDateString()}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
              Last Updated
            </label>
            <div style={{ fontSize: '1rem', color: 'var(--text-main)' }}>
              {new Date(room.updatedAt).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={!!deleteId}
        title="Delete Room"
        message={`Are you sure you want to delete "${room.roomName}"? This action cannot be undone.`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteId(null)}
        isDanger
        confirmText="Delete Room"
      />
    </div>
  )
}
