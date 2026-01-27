import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { roomService } from '../../../services/room.service'
import { Room } from '../../../types/api'
import { Alert } from '../../../components/Common/Alert'
import { Loading } from '../../../components/Common/Loading'
import { Pagination } from '../../../components/Common/Pagination'
import { SearchBar } from '../../../components/Common/SearchBar'
import '../../../styles/rooms.css'

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
      const result = await roomService.getRooms(currentPage, 10, search || undefined)
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
        <h1>Available Rooms</h1>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      <div className="search-container">
        <div style={{ flex: 1 }}>
          <SearchBar onSearch={setSearch} placeholder="Search by room name or code..." />
        </div>
      </div>

      {loading ? <Loading /> : (
        <>
          <div className="rooms-grid">
            {rooms.map(room => (
              <div key={room.id} className="room-card glass-card">
                <div className="room-card-header">
                  <div className="room-name">
                    {room.roomName}
                    <span className="room-code">{room.roomCode}</span>
                  </div>
                </div>

                <div className="room-card-body">
                  <div className="room-info-row">
                    <span className="room-info-label">Capacity:</span>
                    <span>{room.capacity} People</span>
                  </div>

                  <div className="room-info-row">
                    <span className="room-info-label">Equipment:</span>
                    <span className="room-stat-badge stat-equipment">
                      {room.equipmentCount} Items
                    </span>
                  </div>

                  <div className="room-info-row">
                    <span className="room-info-label">Requests:</span>
                    <span className={`room-stat-badge ${room.pendingRequestsCount > 0 ? 'stat-pending' : ''}`}>
                      {room.pendingRequestsCount} Pending
                    </span>
                  </div>
                </div>

                <div className="room-card-footer">
                  <Link to={`/rooms/${room.id}/calendar`} className="btn btn-primary">
                    View Calendar
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {rooms.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
              <h3>No rooms found matching your search.</h3>
            </div>
          )}

          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(total / 10)}
            onPageChange={setCurrentPage}
            total={total}
            pageSize={10}
          />
        </>
      )}
    </div>
  )
}
