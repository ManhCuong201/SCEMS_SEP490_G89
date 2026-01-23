import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { roomService } from '../../../services/room.service'
import { bookingService } from '../../../services/booking.service'
import { Room, Booking, BookingStatus } from '../../../types/api'
import { Loading } from '../../../components/Common/Loading'
import { Alert } from '../../../components/Common/Alert'

export const BookRoomPage: React.FC = () => {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const [room, setRoom] = useState<Room | null>(null)
    const [bookings, setBookings] = useState<Booking[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [selectedDate, setSelectedDate] = useState(new Date())

    // Modal State
    const [showModal, setShowModal] = useState(false)
    const [selectedSlot, setSelectedSlot] = useState<number | null>(null)
    const [reason, setReason] = useState('')
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        if (id) loadData()
    }, [id, selectedDate])

    const loadData = async () => {
        setLoading(true)
        try {
            const [roomData, bookingsData] = await Promise.all([
                roomService.getRoomById(id!),
                bookingService.getBookings(1, 100, undefined) // TODO: Filter by Date/Room in API ideally
            ])
            setRoom(roomData)
            // Filter client side for MVP since API GetBookings searches Room Name
            // Ideally backend GetBookings supports RoomId and DateRange
            const dayStart = new Date(selectedDate)
            dayStart.setHours(0, 0, 0, 0)
            const dayEnd = new Date(selectedDate)
            dayEnd.setHours(23, 59, 59, 999)

            const dayBookings = bookingsData.items.filter(b =>
                b.roomId === id &&
                new Date(b.timeSlot) >= dayStart &&
                new Date(b.timeSlot) <= dayEnd &&
                b.status !== BookingStatus.Rejected
            )
            setBookings(dayBookings)
        } catch (err: any) {
            setError('Failed to load room data')
        } finally {
            setLoading(false)
        }
    }

    const handleDateChange = (days: number) => {
        const newDate = new Date(selectedDate)
        newDate.setDate(selectedDate.getDate() + days)
        setSelectedDate(newDate)
    }

    const getSlotStatus = (hour: number) => {
        const time = new Date(selectedDate)
        time.setHours(hour, 0, 0, 0)

        const booking = bookings.find(b => {
            const bTime = new Date(b.timeSlot)
            // Check overlap
            return bTime.getHours() === hour
        })

        if (!booking) return 'available'
        return booking.status === BookingStatus.Pending ? 'pending' : 'booked'
    }

    const handleSlotClick = (hour: number) => {
        if (getSlotStatus(hour) !== 'available') return
        setSelectedSlot(hour)
        setShowModal(true)
    }

    const confirmBooking = async () => {
        if (selectedSlot === null || !id) return
        setSubmitting(true)
        try {
            const timeSlot = new Date(selectedDate)
            timeSlot.setHours(selectedSlot, 0, 0, 0)

            // Adjust for timezone offset to send correct ISO string?
            // Sending local time as ISO might be shifted. 
            // Simple approach: Use local string or ensure backend handles UTC.
            // Let's send ISO string of the local time constructed.
            // Actually, Date.toISOString() converts to UTC.
            // If I construct 7:00 AM Local, ISO might be 00:00 UTC. Backend should handle checks.
            // Let's try to send simple simplified ISO.

            const offset = timeSlot.getTimezoneOffset() * 60000
            const localISOTime = new Date(timeSlot.getTime() - offset).toISOString().slice(0, -1)

            await bookingService.createBooking({
                roomId: id,
                timeSlot: localISOTime, // Send local time string roughly
                duration: 1
            })
            // Wait, CreateBookingDto doesn't have reason?
            // I updated backend entity but did I update UI service? 
            // CreateBookingRequest in api.ts needs reason.
            // I need to update api.ts first? Or I can cast.
            // Wait, I updated CreateBookingDto in backend. I need to update CreateBookingRequest in frontend types.

            // Let's assume passed in request (I'll update types next) or append to object.
            await (bookingService as any).createBooking({
                roomId: id,
                timeSlot: localISOTime,
                duration: 1,
                reason: reason
            })

            setShowModal(false)
            setReason('')
            loadData()
            alert('Booking requested! Waiting for approval.')
        } catch (err: any) {
            alert('Booking failed: ' + (err.response?.data?.message || err.message))
        } finally {
            setSubmitting(false)
        }
    }

    // Slots from 7 AM to 12 PM (Midnight? or 9 PM?)
    // "Available time to book will start from 7 AM". Let's go until 7 PM (19).
    const slots = Array.from({ length: 13 }, (_, i) => i + 7) // 7 to 19

    if (loading) return <Loading />
    if (!room) return <Alert type="error" message="Room not found" />

    return (
        <div className="page-container">
            <div style={{ marginBottom: 'var(--spacing-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ marginBottom: 'var(--spacing-xs)' }}>Book {room.roomName}</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>{selectedDate.toDateString()}</p>
                </div>
                <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
                    <button className="btn btn-secondary" onClick={() => handleDateChange(-1)}>← Prev Day</button>
                    <button className="btn btn-secondary" onClick={() => handleDateChange(1)}>Next Day →</button>
                </div>
            </div>

            <div className="card">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 'var(--spacing-md)' }}>
                    {slots.map(hour => {
                        const status = getSlotStatus(hour)
                        let bg = 'var(--bg-secondary)'
                        let cursor = 'pointer'
                        let text = 'Available'

                        if (status === 'pending') {
                            bg = 'var(--color-warning-light)'
                            cursor = 'not-allowed'
                            text = 'Pending'
                        } else if (status === 'booked') {
                            bg = 'var(--color-danger-light)'
                            cursor = 'not-allowed'
                            text = 'Booked'
                        }

                        return (
                            <div
                                key={hour}
                                onClick={() => handleSlotClick(hour)}
                                style={{
                                    backgroundColor: bg,
                                    padding: 'var(--spacing-md)',
                                    borderRadius: 'var(--radius-md)',
                                    textAlign: 'center',
                                    cursor: cursor,
                                    border: '1px solid var(--color-border)'
                                }}
                            >
                                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '4px' }}>
                                    {hour}:00
                                </div>
                                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                    {text}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div className="card" style={{ width: '400px', maxWidth: '90%' }}>
                        <h2>Confirm Booking</h2>
                        <p style={{ marginBottom: 'var(--spacing-md)' }}>
                            Book <strong>{room.roomName}</strong> for <strong>{selectedSlot}:00 - {selectedSlot! + 1}:00</strong>?
                        </p>

                        <div className="form-group">
                            <label className="form-label">Reason (Optional)</label>
                            <textarea
                                className="form-input"
                                rows={3}
                                value={reason}
                                onChange={e => setReason(e.target.value)}
                                placeholder="e.g. Class Meeting"
                            />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-lg)' }}>
                            <button className="btn btn-secondary" onClick={() => setShowModal(false)} disabled={submitting}>Cancel</button>
                            <button className="btn btn-primary" onClick={confirmBooking} disabled={submitting}>
                                {submitting ? 'Booking...' : 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
