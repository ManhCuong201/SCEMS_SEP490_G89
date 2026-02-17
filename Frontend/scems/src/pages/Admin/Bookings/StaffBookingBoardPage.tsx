import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { roomService } from '../../../services/room.service'
import { roomTypeService } from '../../../services/roomType.service'
import { scheduleService } from '../../../services/teachingSchedule.service'
import { bookingService } from '../../../services/booking.service'
import { Room, RoomType, ScheduleResponse, Booking, BookingStatus } from '../../../types/api'
import { Alert } from '../../../components/Common/Alert'
import { Loading } from '../../../components/Common/Loading'
import { X, Calendar as CalendarIcon, Clock, Filter, MapPin, Search, Users, Info, Check, MessageSquare } from 'lucide-react'
import '../../../styles/scheduler.css'
import { useAuth } from '../../../context/AuthContext'

export const StaffBookingBoardPage: React.FC = () => {
    const { user } = useAuth()
    const [rooms, setRooms] = useState<Room[]>([])
    const [roomTypes, setRoomTypes] = useState<RoomType[]>([])
    const [schedules, setSchedules] = useState<ScheduleResponse[]>([])
    const [bookings, setBookings] = useState<Booking[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [successMsg, setSuccessMsg] = useState('')

    // Modal State
    const [selectedSlotRoom, setSelectedSlotRoom] = useState<Room | null>(null)
    const [selectedSlotHour, setSelectedSlotHour] = useState<number | null>(null)
    const [slotBookings, setSlotBookings] = useState<Booking[]>([])
    const [modalOpen, setModalOpen] = useState(false)

    const getLocalToday = () => {
        const now = new Date()
        const year = now.getFullYear()
        const month = String(now.getMonth() + 1).padStart(2, '0')
        const day = String(now.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
    }

    const [selectedDate, setSelectedDate] = useState(getLocalToday())
    const [search, setSearch] = useState('')
    const [selectedType, setSelectedType] = useState('')
    const [activeTab, setActiveTab] = useState<'all' | 'pending'>('pending')

    const loadData = async () => {
        setLoading(true)
        try {
            const [roomsData, typesData, schedulesData, bookingsData] = await Promise.all([
                roomService.getRooms(1, 100, search || undefined),
                roomTypeService.getAll(),
                scheduleService.getSchedulesByDay(selectedDate),
                bookingService.getBookingsByDay(selectedDate)
            ])

            setRooms(roomsData.items)
            setRoomTypes(typesData)
            setSchedules(schedulesData)
            setBookings(bookingsData)
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load data')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [selectedDate, search, selectedType])

    const handleUpdateStatus = async (id: string, status: BookingStatus) => {
        try {
            await bookingService.updateStatus(id, status)
            setSuccessMsg(`Booking ${status.toLowerCase()} successfully`)
            loadData()
            setTimeout(() => setSuccessMsg(''), 3000)
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to update booking')
        }
    }

    const handleSlotClick = (room: Room, hour: number, bookingsInSlot: Booking[]) => {
        if (bookingsInSlot.length === 0) return
        setSelectedSlotRoom(room)
        setSelectedSlotHour(hour)
        setSlotBookings(bookingsInSlot)
        setModalOpen(true)
    }

    const getSlotContent = (room: Room, hour: number) => {
        const roomId = room.id
        const slotStart = new Date(selectedDate)
        slotStart.setHours(hour, 0, 0, 0)
        const slotEnd = new Date(selectedDate)
        slotEnd.setHours(hour + 1, 0, 0, 0)

        const overlapsForSlot = bookings.filter(b => {
            if (b.roomId !== roomId) return false
            const bStart = new Date(b.timeSlot)
            const bEndRaw = b.endTime ? new Date(b.endTime) : null
            const bEnd = !bEndRaw || isNaN(bEndRaw.getTime()) || bEndRaw.getFullYear() < 2000
                ? new Date(bStart.getTime() + b.duration * 3600000)
                : bEndRaw
            return bStart < slotEnd && bEnd > slotStart
        })

        const classInSlot = schedules.find(s => {
            if (s.roomId !== roomId) return false
            const sDate = s.date.split('T')[0]
            if (sDate !== selectedDate) return false
            const [sh, sm] = s.startTime.split(':').map(Number)
            const [eh, em] = s.endTime.split(':').map(Number)
            const sTotalStart = sh + sm / 60
            const sTotalEnd = eh + em / 60
            return sTotalStart < (hour + 1) && sTotalEnd > hour
        })

        if (classInSlot) {
            return (
                <div className="scheduler-cell slot-class">
                    <div className="slot-content-wrapper">
                        <span className="slot-status-pill pill-class">CLASS</span>
                        <div className="slot-main-text">{classInSlot.subject}</div>
                    </div>
                </div>
            )
        }

        const approvedBooking = overlapsForSlot.find(b => b.status === BookingStatus.Approved)
        if (approvedBooking) {
            return (
                <div className="scheduler-cell slot-booked" onClick={() => handleSlotClick(room, hour, [approvedBooking])}>
                    <div className="slot-content-wrapper">
                        <span className="slot-status-pill pill-booked">BOOKED</span>
                        <div className="slot-main-text">{(approvedBooking.requestedByName || '').split(' ').pop()}</div>
                    </div>
                </div>
            )
        }

        const pendingBookings = overlapsForSlot.filter(b => b.status === BookingStatus.Pending)
        if (pendingBookings.length > 0) {
            return (
                <div
                    className="scheduler-cell"
                    style={{ background: '#fff7ed', cursor: 'pointer', border: '1px dashed #f97316' }}
                    onClick={() => handleSlotClick(room, hour, pendingBookings)}
                >
                    <div className="slot-content-wrapper">
                        <span className="slot-status-pill" style={{ background: '#ffedd5', color: '#c2410c', border: '1px solid #fdba74' }}>
                            {pendingBookings.length} PENDING
                        </span>
                        <div className="slot-main-text" style={{ color: '#ea580c' }}>Click to Review</div>
                    </div>
                </div>
            )
        }

        return <div className="scheduler-cell slot-empty-staff"></div>
    }

    const timeSlotsArray = Array.from({ length: 16 }, (_, i) => {
        const h = i + 7
        return { hour: h, label: `${h.toString().padStart(2, '0')}:00` }
    })

    return (
        <div className="scheduler-container staff-mode">
            <div className="page-header-simple">
                <div>
                    <h1>Staff Booking Board</h1>
                    <p className="text-muted">Manage real-time room bookings and schedules</p>
                </div>
            </div>

            <div className="scheduler-header">
                <div className="form-group" style={{ marginBottom: 0 }}>
                    <div style={{ position: 'relative' }}>
                        <input
                            type="date"
                            className="form-input"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                        />
                        <CalendarIcon size={12} style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                    </div>
                </div>

                <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                    <div style={{ position: 'relative' }}>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Search rooms..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{ paddingLeft: '2rem' }}
                        />
                        <Search size={12} style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                    </div>
                </div>

                <div className="form-group" style={{ width: '150px', marginBottom: 0 }}>
                    <select
                        className="form-input"
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value)}
                    >
                        <option value="">All Categories</option>
                        {roomTypes.map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {error && <Alert type="error" message={error} onClose={() => setError('')} />}
            {successMsg && <Alert type="success" message={successMsg} onClose={() => setSuccessMsg('')} />}

            <div className="scheduler-grid-wrapper">
                {loading ? <Loading fullPage={false} /> : (
                    <div className="scheduler-grid">
                        <div className="scheduler-cell scheduler-header-cell scheduler-room-cell">Rooms</div>
                        {timeSlotsArray.map(slot => (
                            <div key={slot.hour} className="scheduler-cell scheduler-header-cell">{slot.label}</div>
                        ))}

                        {rooms.map(room => (
                            <React.Fragment key={room.id}>
                                <div className="scheduler-cell scheduler-room-cell">
                                    <div className="room-name-staff">{room.roomName}</div>
                                    <div className="room-code-staff">{room.roomCode}</div>
                                </div>
                                {timeSlotsArray.map(slot => getSlotContent(room, slot.hour))}
                            </React.Fragment>
                        ))}
                    </div>
                )}
            </div>
            {/* Manage Modal */}
            {modalOpen && selectedSlotRoom && (
                createPortal(
                    <div className="modal-overlay">
                        <div className="modal-panel-premium" style={{ maxWidth: '500px' }}>
                            <div className="modal-header-premium">
                                <h3 style={{ fontSize: '1rem', margin: 0, fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Clock size={18} /> Manage Slot: {selectedSlotHour}:00 - {selectedSlotHour! + 1}:00
                                </h3>
                                <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer' }}>
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="modal-body-premium" style={{ paddingTop: '1.5rem' }}>
                                <div style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #e2e8f0' }}>
                                    <strong>Room:</strong> {selectedSlotRoom.roomName} ({selectedSlotRoom.roomCode})
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {slotBookings.map(booking => (
                                        <div key={booking.id} style={{
                                            background: '#f8fafc',
                                            padding: '1rem',
                                            borderRadius: '8px',
                                            border: booking.status === 'Pending' ? '1px solid #fb923c' : '1px solid #e2e8f0',
                                            position: 'relative'
                                        }}>
                                            {booking.status === 'Pending' && (
                                                <div style={{ position: 'absolute', top: '-8px', right: '10px', background: '#fb923c', color: 'white', fontSize: '0.6rem', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>PENDING REVIEW</div>
                                            )}
                                            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '0.5rem 1rem', fontSize: '0.9rem' }}>
                                                <div style={{ color: '#64748b', fontWeight: 600 }}>Requester:</div>
                                                <div style={{ fontWeight: 700 }}>{booking.requestedByName || booking.requestedByAccount?.fullName}</div>

                                                <div style={{ color: '#64748b', fontWeight: 600 }}>Duration:</div>
                                                <div>{booking.duration} Hour(s)</div>

                                                <div style={{ color: '#64748b', fontWeight: 600 }}>Reason:</div>
                                                <div style={{ fontStyle: 'italic', color: '#334155' }}>"{booking.reason || 'No reason provided'}"</div>
                                            </div>

                                            {booking.status === 'Pending' && (
                                                <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                    <button
                                                        onClick={() => handleUpdateStatus(booking.id, BookingStatus.Rejected)}
                                                        style={{
                                                            padding: '0.5rem 1rem',
                                                            borderRadius: '6px',
                                                            border: '1px solid #fca5a5',
                                                            background: '#fef2f2',
                                                            color: '#b91c1c',
                                                            cursor: 'pointer',
                                                            fontWeight: 600
                                                        }}
                                                    >
                                                        Reject
                                                    </button>
                                                    <button
                                                        onClick={() => handleUpdateStatus(booking.id, BookingStatus.Approved)}
                                                        style={{
                                                            padding: '0.5rem 1rem',
                                                            borderRadius: '6px',
                                                            border: '1px solid #86efac',
                                                            background: '#f0fdf4',
                                                            color: '#15803d',
                                                            cursor: 'pointer',
                                                            fontWeight: 600
                                                        }}
                                                    >
                                                        Approve
                                                    </button>
                                                </div>
                                            )}

                                            {booking.status === 'Approved' && (
                                                <div style={{ marginTop: '1rem', color: '#166534', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <Check size={14} /> This booking is approved.
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>,
                    document.body
                )
            )}
        </div>
    )
}
