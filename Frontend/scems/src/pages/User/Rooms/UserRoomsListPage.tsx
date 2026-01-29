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
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2rem'
          }}>
            {rooms.map(room => (
              <div key={room.id} className="glass-panel" style={{
                display: 'flex',
                flexDirection: 'column',
                padding: '0',
                overflow: 'hidden',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                cursor: 'default'
              }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)'
                  e.currentTarget.style.boxShadow = 'var(--shadow-lg)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'none'
                  e.currentTarget.style.boxShadow = 'var(--shadow-glass)'
                }}
              >
                <div style={{
                  padding: '1.5rem',
                  borderBottom: '1px solid var(--border-glass)',
                  background: 'rgba(255, 255, 255, 0.02)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.25rem' }}>{room.roomName}</h3>
                      <span style={{
                        fontSize: '0.875rem',
                        color: 'var(--color-primary)',
                        background: 'rgba(99, 102, 241, 0.1)',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontWeight: 500
                      }}>{room.roomCode}</span>
                    </div>
                  </div>
                </div>

                <div style={{ padding: '1.5rem', flex: 1 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
                  <Link to={`/rooms/${room.id}/calendar`} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', gap: '0.5rem' }}>
                    <Calendar size={18} /> View Calendar
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {rooms.length === 0 && (
            <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem' }}>
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
