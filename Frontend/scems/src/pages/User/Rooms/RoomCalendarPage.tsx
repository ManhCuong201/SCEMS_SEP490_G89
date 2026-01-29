import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useParams, useNavigate } from 'react-router-dom'
import { bookingService } from '../../../services/booking.service'
import { roomService } from '../../../services/room.service'
import { configService, BookingSettings } from '../../../services/config.service'
import { authService } from '../../../services/auth.service'
import { Booking, Room, BookingStatus } from '../../../types/api'
import { Alert } from '../../../components/Common/Alert'
import { Loading } from '../../../components/Common/Loading'
import { Button } from '../../../components/Common/Button'
import { ArrowLeft, ChevronLeft, ChevronRight, Clock, Calendar as CalendarIcon, X, MapPin, Users } from 'lucide-react'
import '../../../styles/calendar.css'
import '../../../styles/compact-calendar.css'
import '../../../styles/scheduler.css' // Import scheduler styles for tooltip

/* --- Portal Tooltip Component --- */
interface PortalTooltipProps {
    title: string;
    icon: React.ReactNode;
    lines: { label: string; value: string | number }[];
    targetRect: DOMRect | null;
}

const PortalTooltip: React.FC<PortalTooltipProps> = ({ title, icon, lines, targetRect }) => {
    if (!targetRect) return null;

    const style: React.CSSProperties = {
        position: 'fixed',
        zIndex: 11000,
        top: `${targetRect.top - 12}px`,
        left: `${targetRect.left + targetRect.width / 2}px`,
        transform: 'translateX(-50%) translateY(-100%)'
    };

    if (targetRect.left + 220 > window.innerWidth) {
        style.left = 'auto';
        style.right = `${window.innerWidth - targetRect.right}px`;
        style.transform = 'translateY(-100%)';
    }

    return createPortal(
        <div className="portal-scheduler-tooltip" style={style}>
            <div className="portal-tooltip-header">
                {icon} {title}
            </div>
            {lines.map((line, idx) => (
                <div key={idx} className="portal-tooltip-line">
                    <span>{line.label}</span>
                    <strong>{line.value}</strong>
                </div>
            ))}
        </div>,
        document.body
    );
};

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
    const [hoveredTooltip, setHoveredTooltip] = useState<PortalTooltipProps | null>(null);

    /* State for Room Change */
    const [bookingType, setBookingType] = useState<'new' | 'change'>('new')
    const [originalRoomId, setOriginalRoomId] = useState('')
    const [allRooms, setAllRooms] = useState<Room[]>([])

    const currentUser = authService.getUser()

    useEffect(() => {
        configService.getBookingSettings()
            .then(setBookingSettings)
            .catch(err => console.error("Failed to load booking settings", err))
    }, [])

    useEffect(() => {
        loadData()
    }, [id, currentDate])

    /* Load all rooms for dropdown when modal opens (lazy load) */
    useEffect(() => {
        if (modalOpen && bookingType === 'change' && allRooms.length === 0) {
            roomService.getRooms(1, 100).then(res => setAllRooms(res.items))
        }
    }, [modalOpen, bookingType])

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

        const slotEnd = new Date(slotDate)
        slotEnd.setHours(hour + 1, 0, 0, 0)

        if (new Date() > slotEnd) {
            return
        }

        setSelectedSlot({ date: slotDate, hour })
        setModalOpen(true)
        setReason('')
    }

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
            setTimeout(() => setSuccessMsg(''), 3000)
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to book slot')
        } finally {
            setSubmitting(false)
        }
    }

    // Helper for teacher identification
    const getTeacherId = (name: string, email?: string) => {
        if (!email) return name.split(' ').pop() || 'N/A';
        return email.split('@')[0];
    };

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
        const hoursCount = Math.max(0, endHour - startHour)
        const hours = Array.from({ length: hoursCount }, (_, i) => i + startHour)

        return (
            <div className="table-wrapper">
                <table className="glass-table calendar-table compact-grid">
                    <thead>
                        <tr>
                            <th className="calendar-time-col">Time</th>
                            {days.map(d => (
                                <th key={d.toISOString()} style={{ textAlign: 'center', minWidth: '120px' }}>
                                    <div style={{ fontWeight: 600 }}>{d.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                                    <div style={{ fontSize: '0.8em', color: 'var(--text-muted)' }}>{d.getDate()}/{d.getMonth() + 1}</div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {hours.map(h => (
                            <tr key={h}>
                                <td className="calendar-time-col" style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                                    {h}:00 - {h + 1}:00
                                </td>
                                {days.map(d => {
                                    const slotBookings = bookings.filter(b => {
                                        const bDate = new Date(b.timeSlot)
                                        const sameDay = bDate.getDate() === d.getDate() &&
                                            bDate.getMonth() === d.getMonth() &&
                                            bDate.getFullYear() === d.getFullYear()
                                        const sameHour = bDate.getHours() === h
                                        if (sameDay && sameHour) return true

                                        const bStart = bDate.getTime()
                                        const durationMs = b.duration * 60 * 60 * 1000
                                        const bEnd = b.endTime ? new Date(b.endTime).getTime() : bStart + durationMs

                                        const cellStart = new Date(d)
                                        cellStart.setHours(h, 0, 0, 0)
                                        const cellStartMs = cellStart.getTime()

                                        const cellEnd = new Date(cellStart)
                                        cellEnd.setHours(h + 1, 0, 0, 0)
                                        const cellEndMs = cellEnd.getTime()

                                        return bStart < cellEndMs && bEnd > cellStartMs
                                    })

                                    const approved = slotBookings.find(b => {
                                        const s = String(b.status || '').toLowerCase()
                                        return s === 'approved' || s === 'active'
                                    })
                                    const isApproved = !!approved
                                    const isSystemBooking = !approved?.requestedBy || approved?.requestedBy === '00000000-0000-0000-0000-000000000000'

                                    const userName = currentUser?.fullName?.trim().toLowerCase()
                                    const requestedName = approved?.requestedByName?.trim().toLowerCase()

                                    const isMyClass = isApproved && isSystemBooking && requestedName === userName && !!userName
                                    const isMyBooking = isApproved && !isSystemBooking && approved?.requestedBy === currentUser?.id

                                    const slotStart = new Date(d);
                                    slotStart.setHours(h, 0, 0, 0);
                                    const slotEnd = new Date(slotStart);
                                    slotEnd.setHours(h + 1, 0, 0, 0);

                                    const now = new Date();
                                    const isEnded = now > slotEnd;
                                    const isStarted = now > slotStart;

                                    const pendingBookings = slotBookings.filter(b => {
                                        const s = String(b.status || '').toLowerCase()
                                        return s === 'pending'
                                    })

                                    // Logic: We show all pending requests during the hour. 
                                    // The backend now handles the hard rejection once the hour ends.
                                    const visiblePending = pendingBookings;
                                    const pendingCount = visiblePending.length;
                                    const hasUserRequested = visiblePending.some(b => b.requestedBy == currentUser?.id)

                                    let cellContent

                                    if (isApproved) {
                                        let label = "BOOKED"
                                        let className = "slot-booked"

                                        if (isMyClass) {
                                            label = "MY CLASS"
                                            className = "slot-my-class"
                                        } else if (isMyBooking) {
                                            label = "MY BOOKING"
                                            className = "slot-my-booking"
                                        }

                                        cellContent = (
                                            <div
                                                className={className}
                                                onMouseEnter={(e) => {
                                                    const isClass = isSystemBooking;
                                                    const lines = isClass ? [
                                                        { label: 'Subject', value: approved.reason?.split(': ')[1]?.split(' (')[0] || 'N/A' },
                                                        { label: 'Class', value: approved.reason?.split('(')[1]?.split(')')[0] || 'N/A' },
                                                        { label: 'Lecturer', value: approved.requestedByName || 'N/A' },
                                                        { label: 'Time', value: `${formatLocalTime(approved.timeSlot)} - ${formatLocalTime(approved.endTime || new Date())}` }
                                                    ] : [
                                                        { label: 'By', value: getTeacherId(approved.requestedByName || '', approved.requestedByAccount?.email) },
                                                        { label: 'Reason', value: approved.reason || 'No reason provided' }
                                                    ];

                                                    setHoveredTooltip({
                                                        title: isClass ? 'Schedule' : 'Booking',
                                                        icon: isClass ? <CalendarIcon size={12} /> : <Clock size={12} />,
                                                        lines: lines,
                                                        targetRect: e.currentTarget.getBoundingClientRect()
                                                    });
                                                }}
                                                onMouseLeave={() => setHoveredTooltip(null)}
                                            >
                                                <div style={{ fontWeight: 700, fontSize: '0.65rem', textTransform: 'uppercase' }}>
                                                    {label}
                                                </div>
                                            </div>
                                        )
                                    } else if (!isEnded && !hasUserRequested) {
                                        // Still time to book & no active request by user
                                        // If someone else has a request, we show a badge on our book button
                                        cellContent = (
                                            <div className="slot-available">
                                                <button
                                                    className="btn-book-slot"
                                                    onClick={() => handleBookClick(d, h)}
                                                    style={{ position: 'relative' }}
                                                >
                                                    Book
                                                    {pendingCount > 0 && (
                                                        <span className="req-badge">
                                                            {pendingCount}
                                                        </span>
                                                    )}
                                                </button>
                                            </div>
                                        )
                                    } else if (pendingCount > 0) {
                                        // User has an active pending request (not yet started)
                                        cellContent = (
                                            <div className="slot-pending">
                                                <span className="slot-pending-text">
                                                    {pendingCount} Request{pendingCount > 1 ? 's' : ''}
                                                </span>
                                                <div style={{ fontSize: '0.6rem', color: '#34d399', fontWeight: 700, marginTop: '2px' }}>✓ SENT</div>
                                            </div>
                                        )
                                    } else if (isEnded) {
                                        cellContent = <div className="slot-past" />
                                    }

                                    return <td key={d.toISOString() + h} style={{ padding: '0', height: '32px', verticalAlign: 'middle' }}>{cellContent}</td>
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )
    }

    const formatLocalTime = (date: string | Date) => {
        const d = new Date(date);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    };

    const isLecturer = currentUser?.role === 'Lecturer'

    return (
        <div className="page-container">
            {/* Header with strict single-line layout */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 'var(--spacing-lg)',
                width: '100%',
                flexWrap: 'nowrap'
            }}>
                {/* Left Side: Back Button & Room Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: 0 }}>
                    <button
                        onClick={() => navigate('/rooms')}
                        className="btn btn-secondary"
                        style={{ padding: '0.5rem', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
                        <h1 style={{ fontSize: '1.25rem', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{room?.roomName || 'Room'}</h1>
                        <span style={{
                            background: 'rgba(255,255,255,0.1)',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            color: 'var(--text-muted)',
                            whiteSpace: 'nowrap',
                            flexShrink: 0
                        }}>
                            {room?.roomCode}
                        </span>
                    </div>
                </div>

                {/* Right Side: Week Navigation */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0, marginLeft: '1rem' }}>
                    <button className="btn btn-secondary" onClick={handlePrevWeek} style={{ height: '36px', width: '36px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ChevronLeft size={18} />
                    </button>

                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        background: 'var(--bg-secondary)',
                        padding: '0 1rem',
                        borderRadius: 'var(--radius-md)',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        height: '36px',
                        whiteSpace: 'nowrap'
                    }}>
                        <CalendarIcon size={14} className="text-muted" />
                        {getWeekRange(currentDate).start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - {getWeekRange(currentDate).end.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </div>

                    <button className="btn btn-secondary" onClick={handleNextWeek} style={{ height: '36px', width: '36px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ChevronRight size={18} />
                    </button>
                </div>
            </div>

            {error && <Alert type="error" message={error} onClose={() => setError('')} />}
            {successMsg && <Alert type="success" message={successMsg} onClose={() => setSuccessMsg('')} />}

            <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
                {loading ? <div style={{ padding: '2rem' }}><Loading /></div> : renderCalendar()}
            </div>



            {hoveredTooltip && <PortalTooltip {...hoveredTooltip} />}

            {modalOpen && selectedSlot && createPortal(
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.7)', zIndex: 9999,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backdropFilter: 'blur(4px)'
                }}>
                    <div className="glass-panel" style={{
                        width: '450px',
                        maxWidth: '95%',
                        padding: '0',
                        margin: '1rem',
                        backgroundColor: 'var(--bg-surface)',
                        overflow: 'hidden'
                    }}>
                        {/* ... modal content ... */}
                        <div style={{
                            padding: '1.25rem 1.5rem',
                            borderBottom: '1px solid var(--border-glass)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            background: 'rgba(255,255,255,0.02)'
                        }}>
                            <div>
                                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>Confirm Booking</h3>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{room?.roomName} ({room?.roomCode})</p>
                            </div>
                            <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}>
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{ padding: '1.5rem' }}>
                            {isLecturer && (
                                <div style={{
                                    marginBottom: '1.5rem',
                                    display: 'flex',
                                    background: 'var(--bg-secondary)',
                                    padding: '4px',
                                    borderRadius: 'var(--radius-md)'
                                }}>
                                    <button
                                        onClick={() => setBookingType('new')}
                                        style={{
                                            flex: 1,
                                            padding: '0.5rem',
                                            borderRadius: 'var(--radius-sm)',
                                            background: bookingType === 'new' ? 'var(--bg-surface)' : 'transparent',
                                            color: bookingType === 'new' ? 'var(--color-primary)' : 'var(--text-muted)',
                                            fontWeight: bookingType === 'new' ? 600 : 500,
                                            border: 'none',
                                            cursor: 'pointer',
                                            boxShadow: bookingType === 'new' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        New Booking
                                    </button>
                                    <button
                                        onClick={() => setBookingType('change')}
                                        style={{
                                            flex: 1,
                                            padding: '0.5rem',
                                            borderRadius: 'var(--radius-sm)',
                                            background: bookingType === 'change' ? 'var(--bg-surface)' : 'transparent',
                                            color: bookingType === 'change' ? 'var(--color-primary)' : 'var(--text-muted)',
                                            fontWeight: bookingType === 'change' ? 600 : 500,
                                            border: 'none',
                                            cursor: 'pointer',
                                            boxShadow: bookingType === 'change' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        Room Change
                                    </button>
                                </div>
                            )}

                            <div style={{
                                background: 'linear-gradient(to right, rgba(99, 102, 241, 0.1), rgba(99, 102, 241, 0.05))',
                                border: '1px solid rgba(99, 102, 241, 0.2)',
                                borderRadius: 'var(--radius-md)',
                                padding: '1rem',
                                marginBottom: '1.5rem'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                    <div style={{ background: 'rgba(99, 102, 241, 0.2)', padding: '6px', borderRadius: '50%', color: 'var(--color-primary)' }}>
                                        <Clock size={18} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Time Slot</div>
                                        <div style={{ fontSize: '1rem', fontWeight: 600 }}>
                                            {selectedSlot.date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                            <span style={{ margin: '0 0.5rem', opacity: 0.3 }}>|</span>
                                            <span style={{ color: 'var(--color-primary)' }}>
                                                {selectedSlot.hour}:00 - {selectedSlot.hour + (bookingSettings ? bookingSettings.slotDurationMinutes / 60 : 1)}:00
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.75rem' }}>
                                    <div style={{ background: 'rgba(99, 102, 241, 0.2)', padding: '6px', borderRadius: '50%', color: 'var(--color-primary)' }}>
                                        <MapPin size={18} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Location</div>
                                        <div style={{ fontSize: '0.95rem' }}>{room?.roomName} ({room?.roomCode})</div>
                                    </div>
                                </div>
                            </div>

                            {bookingType === 'change' && (
                                <div className="form-group">
                                    <label className="form-label">Original Room (Current Class)</label>
                                    <select
                                        className="form-select"
                                        value={originalRoomId}
                                        onChange={(e) => setOriginalRoomId(e.target.value)}
                                    >
                                        <option value="">Select current room...</option>
                                        {allRooms.map(r => (
                                            <option key={r.id} value={r.roomCode}>{r.roomName} ({r.roomCode})</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">Note {bookingType === 'change' ? 'for Change' : '(Optional)'}</label>
                                <textarea
                                    className="form-textarea"
                                    value={reason}
                                    onChange={e => setReason(e.target.value)}
                                    rows={3}
                                    placeholder={bookingType === 'change' ? "Why do you need to change rooms?" : "Enter specific requirements or reason..."}
                                    style={{ resize: 'none' }}
                                />
                            </div>
                        </div>

                        <div style={{
                            padding: '1.25rem 1.5rem',
                            background: 'rgba(0,0,0,0.05)',
                            borderTop: '1px solid var(--border-glass)',
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: '1rem'
                        }}>
                            <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={submitting}>
                                Cancel
                            </Button>
                            <Button variant="primary" onClick={handleConfirmBook} disabled={submitting}>
                                {submitting ? <><Loading /> Processing</> : (bookingType === 'new' ? 'Confirm Booking' : 'Request Change')}
                            </Button>
                        </div>
                    </div>
                </div>, document.body
            )}
        </div>
    )
}
