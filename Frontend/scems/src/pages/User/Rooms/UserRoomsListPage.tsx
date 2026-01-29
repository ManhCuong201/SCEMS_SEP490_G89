import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { roomService } from '../../../services/room.service'
import { Room } from '../../../types/api'
import { Alert } from '../../../components/Common/Alert'
import { Loading } from '../../../components/Common/Loading'
import { Pagination } from '../../../components/Common/Pagination'
import { SearchBar } from '../../../components/Common/SearchBar'
import { Users, Package, Clock, Calendar } from 'lucide-react'

export const UserRoomsListPage: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [search, setSearch] = useState('')
  const [expandedRoomId, setExpandedRoomId] = useState<string | null>(null)
  const [total, setTotal] = useState(0)

  const loadRooms = async () => {
    setLoading(true)
    setError('')
    try {
      const result = await roomService.getRooms(currentPage, 9, search || undefined) // Load 9 per page for better grid alignment
      setRooms(result.items)
      setTotal(result.total)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load rooms')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setCurrentPage(1)
  }, [search])

  useEffect(() => {
    loadRooms()
  }, [currentPage, search])

  // Handle click outside to collapse
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (expandedRoomId && !(e.target as HTMLElement).closest('.room-card-user')) {
        setExpandedRoomId(null)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [expandedRoomId])

  const toggleRoom = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setExpandedRoomId(prev => prev === id ? null : id)
  }

  return (
    <div className="page-container">
      <div className="card-header" style={{ marginBottom: 'var(--spacing-lg)' }}>
        <div>
          <h1>Available Rooms</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Browse and book available spaces for your classes and meetings.</p>
        </div>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      <div style={{ marginBottom: '2rem', maxWidth: '500px' }}>
        <SearchBar onSearch={setSearch} placeholder="Search by room name or code..." />
      </div>

      {loading ? <Loading fullPage={false} /> : (
        <>
          <div className="rooms-flex-container">
            {rooms.map(room => (
              <div
                key={room.id}
                className={`glass-panel room-card-user ${expandedRoomId === room.id ? 'active' : ''}`}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '0'
                }}
                onClick={(e) => toggleRoom(room.id, e)}
              >
                <div style={{
                  padding: '1.5rem',
                  borderBottom: expandedRoomId === room.id ? '1px solid var(--border-glass)' : 'none',
                  background: 'rgba(255, 255, 255, 0.02)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ width: '100%' }}>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.25rem' }}>{room.roomName}</h3>
                      <span style={{
                        fontSize: '0.75rem',
                        color: 'var(--color-primary)',
                        background: 'rgba(99, 102, 241, 0.1)',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        fontWeight: 500
                      }}>{room.roomCode}</span>
                    </div>
                  </div>
                </div>

                <div className="room-details-expand">
                  <div style={{ padding: '1.5rem', flex: 1 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)' }}>
                        <Package size={18} />
                        <span>Type: <strong style={{ color: 'var(--text-main)' }}>{room.roomTypeName || 'N/A'}</strong></span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)' }}>
                        <Users size={18} />
                        <span>Capacity: <strong style={{ color: 'var(--text-main)' }}>{room.capacity} People</strong></span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)' }}>
                        <Package size={18} />
                        <span>Equipment: <strong style={{ color: 'var(--text-main)' }}>{room.equipmentCount} Items</strong></span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)' }}>
                        <Clock size={18} />
                        <span>Requests: <strong style={{ color: room.pendingRequestsCount > 0 ? 'var(--color-warning)' : 'var(--text-main)' }}>
                          {room.pendingRequestsCount} Pending
                        </strong></span>
                      </div>
                    </div>
                  </div>

                  <div style={{ padding: '1.5rem', paddingTop: '0' }}>
                    <Link
                      to={`/rooms/${room.id}/calendar`}
                      className="btn btn-primary"
                      style={{ width: '100%', justifyContent: 'center', gap: '0.5rem' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Calendar size={18} /> View Calendar
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {rooms.length === 0 && (
            <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem', width: '100%' }}>
              <div style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>
                <Package size={48} style={{ opacity: 0.5 }} />
              </div>
              <h3 style={{ marginBottom: '0.5rem' }}>No rooms found</h3>
              <p style={{ color: 'var(--text-secondary)' }}>Try adjusting your search terms.</p>
            </div>
          )}

          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(total / 9)}
            onPageChange={setCurrentPage}
            total={total}
            pageSize={9}
          />
        </>
      )}
    </div>
  )
}
