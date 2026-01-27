import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { bookingService } from '../../../services/booking.service'
import { roomService } from '../../../services/room.service'
import { configService, BookingSettings } from '../../../services/config.service'
import { authService } from '../../../services/auth.service'
import { Booking, Room, BookingStatus } from '../../../types/api'
import { Alert } from '../../../components/Common/Alert'
import { Loading } from '../../../components/Common/Loading'
import { Button } from '../../../components/Common/Button'
import '../../../styles/calendar.css'

export const RoomCalendarPage: React.FC = () => {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const [room, setRoom] = useState<Room | null>(null)
    const [bookings, setBookings] = useState<Booking[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [currentDate, setCurrentDate] = useState(new Date())
    const [modalOpen, setModalOpen] = useState(false)
    const [selectedSlot, setSelectedSlot] = useState<{ date: Date, hour: number } | null>(null)
    const [reason, setReason] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [successMsg, setSuccessMsg] = useState('')
    const [bookingSettings, setBookingSettings] = useState<BookingSettings | null>(null)

    useEffect(() => {
        configService.getBookingSettings()
            .then(setBookingSettings)
            .catch(err => console.error("Failed to load booking settings", err))
    }, [])

    useEffect(() => {
        loadData()
    }, [id, currentDate])

    const getWeekRange = (date: Date) => {
        const day = date.getDay()
        const diff = date.getDate() - day + (day === 0 ? -6 : 1)
        const monday = new Date(date)
        monday.setDate(diff)
        monday.setHours(0, 0, 0, 0)

        const sunday = new Date(monday)
        sunday.setDate(monday.getDate() + 6)
        sunday.setHours(23, 59, 59, 999)

        return { start: monday, end: sunday }
    }

    const loadData = async () => {
        if (!id) return
        setLoading(true)
        try {
            const roomData = await roomService.getRoomById(id)
            setRoom(roomData)

            const { start, end } = getWeekRange(currentDate)
            const bookingData = await bookingService.getRoomSchedule(id, start.toISOString(), end.toISOString())
            setBookings(bookingData)
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load data')
        } finally {
            setLoading(false)
        }
    }

    const handlePrevWeek = () => {
        const newDate = new Date(currentDate)
        newDate.setDate(newDate.getDate() - 7)
        setCurrentDate(newDate)
    }

    const handleNextWeek = () => {
        const newDate = new Date(currentDate)
        newDate.setDate(newDate.getDate() + 7)
        setCurrentDate(newDate)
    }

    const handleBookClick = (date: Date, hour: number) => {
        const slotDate = new Date(date)
        slotDate.setHours(hour, 0, 0, 0)

        if (new Date() > slotDate) {
            return
        }

        setSelectedSlot({ date: slotDate, hour })
        setModalOpen(true)
        setReason('')
    }



    const renderCalendar = () => {
        if (!room || !bookingSettings) return null
        const { start } = getWeekRange(currentDate)
        const days: Date[] = []
        for (let i = 0; i < 7; i++) {
            const d = new Date(start)
            d.setDate(d.getDate() + i)
            days.push(d)
        }

        const startHour = bookingSettings.startHour
        const endHour = bookingSettings.endHour
        // Ensure we don't loop infinitely if config is weird
        const hoursCount = Math.max(0, endHour - startHour)
        const hours = Array.from({ length: hoursCount }, (_, i) => i + startHour)

        return (
            <div className="calendar-grid">
                <table className="calendar-table">
                    <thead>
                        <tr>
                            <th className="calendar-time-col">Time</th>
                            {days.map(d => (
                                <th key={d.toISOString()}>
                                    {d.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' })}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {hours.map(h => (
                            <tr key={h}>
                                <td className="calendar-time-col">{h}:00 - {h + 1}:00</td>
                                {days.map(d => {
                                    const slotBookings = bookings.filter(b => {
                                        const bStart = new Date(b.timeSlot)
                                        const bEnd = b.endTime ? new Date(b.endTime) : new Date(bStart.getTime() + b.duration * 3600000)

                                        const cellStart = new Date(d)
                                        cellStart.setHours(h, 0, 0, 0)
                                        const cellEnd = new Date(cellStart)
                                        cellEnd.setHours(h + 1, 0, 0, 0)

                                        return bStart < cellEnd && bEnd > cellStart
                                    })

                                    const isApproved = slotBookings.some(b => b.status === BookingStatus.Approved)
                                    const pendingCount = slotBookings.filter(b => b.status === BookingStatus.Pending).length

                                    const currentUser = authService.getUser()
                                    const hasUserRequested = slotBookings.some(b => b.requestedBy === currentUser?.id && b.status === BookingStatus.Pending)

                                    const cellDate = new Date(d);
                                    cellDate.setHours(h, 0, 0, 0);
                                    const isPast = new Date() > cellDate;

                                    let cellContent

                                    if (isApproved) {
                                        // Find the approved one to show details
                                        const approved = slotBookings.find(b => b.status === "Approved" || b.status === "Active")
                                        cellContent = (
                                            <div className="slot-booked" style={{ fontSize: '0.75rem', padding: '2px' }}>
                                                <div style={{ fontWeight: 600 }}>{approved?.reason || 'Booked'}</div>
                                                <div>{approved?.requestedByName || ''}</div>
                                                <div style={{ fontSize: '0.7em', opacity: 0.8 }}>
                                                    {new Date(approved?.timeSlot!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                                                    {approved?.endTime ? new Date(approved.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                                </div>
                                            </div>
                                        )
                                    } else {
                                        if (pendingCount > 0) {
                                            cellContent = (
                                                <div className="slot-pending">
                                                    <span className="slot-pending-text">{pendingCount} Request{pendingCount > 1 ? 's' : ''}</span>
                                                    {!isPast && (
                                                        hasUserRequested ? (
                                                            <button className="btn btn-sm btn-secondary" disabled style={{ padding: '2px 8px', fontSize: '12px', opacity: 0.7, cursor: 'not-allowed' }}>Requested</button>
                                                        ) : (
                                                            <button className="btn btn-sm btn-primary" style={{ padding: '2px 8px', fontSize: '12px' }} onClick={() => handleBookClick(d, h)}>Book</button>
                                                        )
                                                    )}
                                                </div>
                                            )
                                        } else {
                                            if (!isPast) {
                                                cellContent = <div className="slot-available"><button className="btn btn-sm btn-success" style={{ width: '80%', padding: '4px' }} onClick={() => handleBookClick(d, h)}>Book</button></div>
                                            } else {
                                                cellContent = <div className="slot-past">-</div>
                                            }
                                        }
                                    }

                                    return <td key={d.toISOString() + h}>{cellContent}</td>
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )
    }
    // ...


    /* State for Room Change */
    const [bookingType, setBookingType] = useState<'new' | 'change'>('new')
    const [originalRoomId, setOriginalRoomId] = useState('')
    const [allRooms, setAllRooms] = useState<Room[]>([])

    /* Load all rooms for dropdown when modal opens (lazy load) */
    useEffect(() => {
        if (modalOpen && bookingType === 'change' && allRooms.length === 0) {
            roomService.getRooms(1, 100).then(res => setAllRooms(res.items))
        }
    }, [modalOpen, bookingType])

    const handleConfirmBook = async () => {
        if (!selectedSlot || !id || !bookingSettings) return
        setSubmitting(true)
        try {
            const offset = selectedSlot.date.getTimezoneOffset()
            const localDate = new Date(selectedSlot.date.getTime() - (offset * 60 * 1000))
            const isoLocal = localDate.toISOString().slice(0, 19)

            if (bookingType === 'new') {
                await bookingService.createBooking({
                    roomId: id,
                    timeSlot: isoLocal,
                    duration: bookingSettings.slotDurationMinutes / 60,
                    reason: reason
                })
            } else {
                if (!originalRoomId) {
                    setError("Please select the original room you want to change from.")
                    setSubmitting(false)
                    return
                }
                await bookingService.createRoomChangeRequest({
                    newRoomId: id,
                    originalRoomId: originalRoomId,
                    timeSlot: isoLocal,
                    duration: bookingSettings.slotDurationMinutes / 60,
                    reason: reason
                })
            }

            setSuccessMsg(bookingType === 'new' ? 'Booking request sent!' : 'Room change request sent!')
            setModalOpen(false)
            loadData()
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to book slot')
        } finally {
            setSubmitting(false)
        }
    }

    // ... (renderCalendar omitted for brevity, assuming same)

    const currentUser = authService.getUser()
    const isLecturer = currentUser?.role === 'Lecturer'

    return (
        <div className="page-container">
            {/* Header omitted */}
            <div className="card-header" style={{ marginBottom: 'var(--spacing-lg)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Button variant="secondary" onClick={() => navigate('/rooms')}>&larr; Back</Button>
                    <h1>{room?.roomName || 'Room Calendar'} <span style={{ fontSize: '0.6em', color: 'var(--color-text-secondary)' }}>({room?.roomCode})</span></h1>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <Button variant="secondary" onClick={handlePrevWeek}>&lt; Prev Week</Button>
                    <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>
                        {getWeekRange(currentDate).start.toLocaleDateString()} - {getWeekRange(currentDate).end.toLocaleDateString()}
                    </span>
                    <Button variant="secondary" onClick={handleNextWeek}>Next Week &gt;</Button>
                </div>
            </div>

            {error && <Alert type="error" message={error} onClose={() => setError('')} />}
            {successMsg && <Alert type="success" message={successMsg} onClose={() => setSuccessMsg('')} />}

            <div className="card glass-card">
                {loading ? <Loading /> : renderCalendar()}
            </div>

            {modalOpen && selectedSlot && (
                <div className="modal-overlay" style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }}>
                    <div className="modal-content glass-card" style={{
                        backgroundColor: 'var(--bg-surface)', color: 'var(--color-text)', padding: '2rem', borderRadius: 'var(--radius-lg)', width: '450px', maxWidth: '90%'
                    }}>
                        <h3 style={{ marginBottom: '1rem' }}>Confirm Booking</h3>

                        {isLecturer && (
                            <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                                <button
                                    onClick={() => setBookingType('new')}
                                    style={{
                                        padding: '0.5rem 1rem',
                                        borderBottom: bookingType === 'new' ? '2px solid var(--color-primary)' : 'none',
                                        fontWeight: bookingType === 'new' ? 700 : 400,
                                        color: bookingType === 'new' ? 'var(--color-primary)' : 'var(--text-secondary)'
                                    }}
                                >
                                    New Booking
                                </button>
                                <button
                                    onClick={() => setBookingType('change')}
                                    style={{
                                        padding: '0.5rem 1rem',
                                        borderBottom: bookingType === 'change' ? '2px solid var(--color-primary)' : 'none',
                                        fontWeight: bookingType === 'change' ? 700 : 400,
                                        color: bookingType === 'change' ? 'var(--color-primary)' : 'var(--text-secondary)'
                                    }}
                                >
                                    Room Change
                                </button>
                            </div>
                        )}

                        <div style={{ marginBottom: '1rem' }}>
                            <p>
                                <strong>Target Room:</strong> {room?.roomName} ({room?.roomCode})<br />
                                <strong>Time:</strong> {selectedSlot.date.toLocaleDateString()} {selectedSlot.hour}:00 - {selectedSlot.hour + (bookingSettings ? bookingSettings.slotDurationMinutes / 60 : 1)}:00
                            </p>
                        </div>

                        {bookingType === 'change' && (
                            <div className="form-group" style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Original Room (Current Class)</label>
                                <select
                                    className="form-control"
                                    value={originalRoomId}
                                    onChange={(e) => setOriginalRoomId(e.target.value)}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}
                                >
                                    <option value="">Select current room...</option>
                                    {allRooms.map(r => (
                                        <option key={r.id} value={r.roomCode}>{r.roomName} ({r.roomCode})</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Reason {bookingType === 'change' ? 'for Change' : '(Optional)'}</label>
                            <textarea
                                className="form-control"
                                value={reason}
                                onChange={e => setReason(e.target.value)}
                                rows={3}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid var(--border-color)',
                                    backgroundColor: 'var(--bg-secondary)',
                                    color: 'var(--text-primary)',
                                    fontFamily: 'inherit'
                                }}
                                placeholder={bookingType === 'change' ? "Why do you need to change rooms?" : "Enter specific requirements..."}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
                            <Button variant="primary" onClick={handleConfirmBook} disabled={submitting}>
                                {submitting ? 'Processing...' : (bookingType === 'new' ? 'Confirm Booking' : 'Request Change')}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
