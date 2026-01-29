import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { bookingService } from '../../../services/booking.service'
import { Booking, BookingStatus } from '../../../types/api'
import { Alert } from '../../../components/Common/Alert'
import { Loading } from '../../../components/Common/Loading'
import { Pagination } from '../../../components/Common/Pagination'
import { SearchBar } from '../../../components/Common/SearchBar'
import { CalendarDays, Clock, MapPin, AlertCircle } from 'lucide-react'

export const UserBookingsPage: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')

  const fetchBookings = async (pageIndex: number) => {
    setLoading(true)
    try {
      const data = await bookingService.getBookings(pageIndex, 10, search || undefined)
      setBookings(data.items)
      setTotalPages(Math.ceil(data.total / data.pageSize))
      setTotal(data.total)
      setPage(data.pageIndex)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setPage(1)
  }, [search])

  useEffect(() => {
    fetchBookings(page)
  }, [page, search])

  const getStatusBadge = (status: string) => {
    let className = 'badge-secondary'
    if (status === BookingStatus.Approved) className = 'badge-success'
    if (status === BookingStatus.Pending) className = 'badge-warning'
    if (status === BookingStatus.Rejected) className = 'badge-danger'

    return <span className={`badge ${className}`}>{status}</span>
  }

  return (
    <div className="page-container">
      <div className="card-header" style={{ marginBottom: '2rem' }}>
        <h1>My Bookings</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Track and manage your room reservation requests.</p>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div style={{ marginBottom: '1.5rem', maxWidth: '400px' }}>
          <SearchBar onSearch={setSearch} placeholder="Search bookings..." />
        </div>

        {loading ? (
          <Loading />
        ) : (
          <>
            <div className="table-wrapper">
              <table className="glass-table">
                <thead>
                  <tr>
                    <th>Room</th>
                    <th>Date & Time</th>
                    <th>Duration</th>
                    <th>Reason</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: '4rem', textAlign: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', color: 'var(--text-muted)' }}>
                          <CalendarDays size={48} style={{ opacity: 0.5 }} />
                          <div>
                            <h3 style={{ color: 'var(--text-main)', marginBottom: '0.25rem' }}>No bookings found</h3>
                            <p>You haven't made any room bookings yet.</p>
                          </div>
                          <Link to="/rooms" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
                            Browse Rooms
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    bookings.map((booking) => (
                      <tr key={booking.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                              <MapPin size={18} className="text-primary" />
                            </div>
                            <div>
                              {booking.room ? (
                                <Link to={`/rooms/${booking.room.id}/calendar`} style={{ fontWeight: 600, display: 'block' }}>
                                  {booking.room.roomName}
                                </Link>
                              ) : <span style={{ fontStyle: 'italic' }}>Unknown Room</span>}
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{booking.room?.roomCode}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: 500 }}>{new Date(booking.timeSlot).toLocaleDateString()}</span>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                              {new Date(booking.timeSlot).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Clock size={16} className="text-muted" />
                            {booking.duration} hr{booking.duration > 1 ? 's' : ''}
                          </div>
                        </td>
                        <td style={{ maxWidth: '300px' }}>
                          <div style={{
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            color: booking.reason ? 'var(--text-main)' : 'var(--text-muted)'
                          }}>
                            {booking.reason || 'No reason provided'}
                          </div>
                        </td>
                        <td>{getStatusBadge(booking.status)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {total > 0 && (
              <div style={{ marginTop: '1.5rem' }}>
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={fetchBookings}
                  total={total}
                  pageSize={10}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
