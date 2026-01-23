import React, { useEffect, useState } from 'react'
import { bookingService } from '../../../services/booking.service'
import { Booking, BookingStatus } from '../../../types/api'
import { Alert } from '../../../components/Common/Alert'
import { Loading } from '../../../components/Common/Loading'
import { Pagination } from '../../../components/Common/Pagination'
import { SearchBar } from '../../../components/Common/SearchBar'

export const BookingManagementPage: React.FC = () => {
    const [bookings, setBookings] = useState<Booking[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [total, setTotal] = useState(0)

    const loadBookings = async () => {
        setLoading(true)
        setError('')
        try {
            const result = await bookingService.getBookings(currentPage, 10)
            setBookings(result.items)
            setTotal(result.total)
        } catch (err: any) {
            setError('Failed to load bookings')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadBookings()
    }, [currentPage])

    const handleStatusUpdate = async (id: string, newStatus: BookingStatus) => {
        try {
            await bookingService.updateStatus(id, newStatus)
            setSuccess('Booking updated')
            loadBookings()
        } catch (err: any) {
            setError('Failed to update status')
        }
    }

    const getStatusBadge = (status: BookingStatus) => {
        switch (status) {
            case BookingStatus.Pending: return <span className="badge" style={{ backgroundColor: 'var(--color-warning)', color: '#fff' }}>Pending</span>
            case BookingStatus.Approved: return <span className="badge" style={{ backgroundColor: 'var(--color-success)', color: '#fff' }}>Approved</span>
            case BookingStatus.Rejected: return <span className="badge" style={{ backgroundColor: 'var(--color-danger)', color: '#fff' }}>Rejected</span>
            default: return null
        }
    }

    return (
        <div className="page-container">
            <div className="card-header" style={{ marginBottom: 'var(--spacing-lg)' }}>
                <h1>Booking Management</h1>
            </div>

            {error && <Alert type="error" message={error} onClose={() => setError('')} />}
            {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

            <div className="card">
                {loading ? <Loading /> : bookings.length === 0 ? <p style={{ textAlign: 'center' }}>No bookings found</p> : (
                    <>
                        <div className="table-wrapper">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Room</th>
                                        <th>Requester</th>
                                        <th>Time Slot</th>
                                        <th>Duration</th>
                                        <th>Reason</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {bookings.map((b) => (
                                        <tr key={b.id}>
                                            <td>{b.room?.roomName || 'Unknown'}</td>
                                            <td>{b.requestedByAccount?.fullName || 'Unknown'}</td>
                                            <td>{new Date(b.timeSlot).toLocaleString()}</td>
                                            <td>{b.duration}h</td>
                                            <td>{b.reason || '-'}</td>
                                            <td>{getStatusBadge(b.status)}</td>
                                            <td>
                                                {b.status === BookingStatus.Pending && (
                                                    <div style={{ display: 'flex', gap: '4px' }}>
                                                        <button className="btn btn-sm btn-success" onClick={() => handleStatusUpdate(b.id, BookingStatus.Approved)}>Approve</button>
                                                        <button className="btn btn-sm btn-danger" onClick={() => handleStatusUpdate(b.id, BookingStatus.Rejected)}>Reject</button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <Pagination currentPage={currentPage} totalPages={Math.ceil(total / 10)} onPageChange={setCurrentPage} total={total} pageSize={10} />
                    </>
                )}
            </div>
        </div>
    )
}
