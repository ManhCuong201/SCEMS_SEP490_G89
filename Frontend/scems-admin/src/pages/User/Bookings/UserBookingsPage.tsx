import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { bookingService } from '../../../services/booking.service'
import { Booking, BookingStatus } from '../../../types/api'
import { Alert } from '../../../components/Common/Alert'
import { Loading } from '../../../components/Common/Loading'
import { Pagination } from '../../../components/Common/Pagination'
import { SearchBar } from '../../../components/Common/SearchBar'

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
      // Assuming getBookings supports search param now
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

  const getStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case BookingStatus.Pending: return <span className="badge badge-warning">Pending</span>
      case BookingStatus.Approved: return <span className="badge badge-success">Approved</span>
      case BookingStatus.Rejected: return <span className="badge badge-danger">Rejected</span>
      case BookingStatus.Cancelled: return <span className="badge badge-secondary">Cancelled</span>
      default: return <span className="badge badge-secondary">Unknown</span>
    }
  }

  return (
    <div className="page-container">
      <div className="card-header">
        <h1>My Bookings</h1>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}
      
      <div style={{ marginBottom: 'var(--spacing-lg)', maxWidth: '400px' }}>
          <SearchBar onSearch={setSearch} placeholder="Search by room name..." />
      </div>

      <div className="card">
        {loading ? (
          <Loading />
        ) : (
          <>
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Room</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Duration</th>
                    <th>Reason</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center' }}>No bookings found</td>
                    </tr>
                  ) : (
                    bookings.map((booking) => (
                      <tr key={booking.id}>
                        <td>
                            {booking.room ? (
                                <Link to={`/rooms/${booking.room.id}/calendar`} style={{ fontWeight: '500' }}>
                                    {booking.room.roomName}
                                </Link>
                            ) : 'Unknown Room'}
                        </td>
                        <td>{new Date(booking.timeSlot).toLocaleDateString()}</td>
                        <td>{new Date(booking.timeSlot).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                        <td>{booking.duration} hour(s)</td>
                        <td>{booking.reason || '-'}</td>
                        <td>{getStatusBadge(booking.status)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={fetchBookings}
              total={total}
              pageSize={10}
            />
          </>
        )}
      </div>
    </div>
  )
}
