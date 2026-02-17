import React, { useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { roomService } from '../../../services/room.service'
import { roomTypeService } from '../../../services/roomType.service'
import { scheduleService } from '../../../services/teachingSchedule.service'
import { bookingService } from '../../../services/booking.service'
import { configService, BookingSettings } from '../../../services/config.service'
import { Room, RoomType, ScheduleResponse, Booking, BookingStatus } from '../../../types/api'
import { Alert } from '../../../components/Common/Alert'
import { Loading } from '../../../components/Common/Loading'
import { X, Calendar as CalendarIcon, Clock, Filter, MapPin, Search, Users, Info, ArrowRight, MessageSquare } from 'lucide-react'
import '../../../styles/scheduler.css'
import { useAuth } from '../../../context/AuthContext'

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

export const DailySchedulerPage: React.FC = () => {
    const { user } = useAuth()
    const [rooms, setRooms] = useState<Room[]>([])
    const [roomTypes, setRoomTypes] = useState<RoomType[]>([])
    const [schedules, setSchedules] = useState<ScheduleResponse[]>([])
    const [bookings, setBookings] = useState<Booking[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [successMsg, setSuccessMsg] = useState('')

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
    const [availableOnly, setAvailableOnly] = useState(false)
    const [bookingSettings, setBookingSettings] = useState<BookingSettings | null>(null)

    const [modalOpen, setModalOpen] = useState(false)
    const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
    const [selectedSlot, setSelectedSlot] = useState<{ date: string, hour: number } | null>(null)
    const [reason, setReason] = useState('')
    const [duration, setDuration] = useState(1)
    const [submitting, setSubmitting] = useState(false)

    const [hoveredTooltip, setHoveredTooltip] = useState<PortalTooltipProps | null>(null);

    useEffect(() => {
        configService.getBookingSettings()
            .then(setBookingSettings)
            .catch(err => console.error("Failed to load booking settings", err))
    }, [])

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

    const handleBookClick = (room: Room, hour: number, alreadyRequested: boolean) => {
        if (alreadyRequested) return
        setSelectedRoom(room)
        setSelectedSlot({ date: selectedDate, hour })

        // Ensure initial duration is valid for the new slot
        const maxForSlot = 23 - hour;
        setDuration(Math.min(1, maxForSlot)); // Default to 1 or max if 1 is too much

        setModalOpen(true)
        setReason('')
    }

    const handleConfirmBook = async () => {
        if (!selectedSlot || !selectedRoom || !bookingSettings) return
        setSubmitting(true)
        try {
            const slotDate = new Date(selectedSlot.date)
            slotDate.setHours(selectedSlot.hour, 0, 0, 0)
            const isoLocal = slotDate.toLocaleString('sv-SE').replace(' ', 'T')

            await bookingService.createBooking({
                roomId: selectedRoom.id,
                timeSlot: isoLocal,
                duration: duration,
                reason: reason
            })

            setSuccessMsg('Booking request sent!')
            setModalOpen(false)
            setDuration(1) // Reset
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

        const pendingForSlot = overlapsForSlot.filter(b => b.status === "Pending")
        const alreadyRequested = pendingForSlot.some(b => b.requestedBy?.toLowerCase() === user?.id?.toLowerCase())

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
                <div
                    className="scheduler-cell slot-class"
                    onMouseEnter={(e) => setHoveredTooltip({
                        title: 'Schedule',
                        icon: <CalendarIcon size={12} />,
                        lines: [
                            { label: 'Subject', value: classInSlot.subject },
                            { label: 'Class', value: classInSlot.classCode },
                            { label: 'Teacher', value: getTeacherId(classInSlot.lecturerName, (classInSlot as any).lecturerEmail) },
                            { label: 'Time', value: `${classInSlot.startTime} - ${classInSlot.endTime}` }
                        ],
                        targetRect: e.currentTarget.getBoundingClientRect()
                    })}
                    onMouseLeave={() => setHoveredTooltip(null)}
                >
                    <div className="slot-content-wrapper">
                        <span className="slot-status-pill pill-class">CLASS</span>
                        <div className="slot-main-text">{classInSlot.subject}</div>
                    </div>
                </div>
            )
        }

        const approvedBooking = overlapsForSlot.find(b => b.status === 'Approved')

        if (approvedBooking) {
            return (
                <div
                    className="scheduler-cell slot-booked"
                    onMouseEnter={(e) => setHoveredTooltip({
                        title: 'Booking',
                        icon: <Clock size={12} />,
                        lines: [
                            { label: 'By', value: getTeacherId(approvedBooking.requestedByName || '', approvedBooking.requestedByAccount?.email) },
                            { label: 'Reason', value: approvedBooking.reason || 'No reason provided' }
                        ],
                        targetRect: e.currentTarget.getBoundingClientRect()
                    })}
                    onMouseLeave={() => setHoveredTooltip(null)}
                >
                    <div className="slot-content-wrapper">
                        <span className="slot-status-pill pill-booked">BOOKED</span>
                        <div className="slot-main-text">{(approvedBooking.requestedByName || '').split(' ').pop()}</div>
                    </div>
                </div>
            )
        }

        const isPast = new Date() > slotStart
        if (isPast) {
            return <div className="scheduler-cell" style={{ background: 'rgba(0,0,0,0.01)', opacity: 0.2 }}></div>
        }

        return (
            <div
                className={`scheduler-cell slot-available ${alreadyRequested ? 'already-requested' : ''}`}
                onClick={() => handleBookClick(room, hour, alreadyRequested)}
                onMouseEnter={(e) => setHoveredTooltip({
                    title: 'Availability',
                    icon: <Users size={12} />,
                    lines: [
                        { label: 'Pending', value: pendingForSlot.length },
                        alreadyRequested ? { label: 'Status', value: 'Already Requested' } : { label: 'Action', value: 'Click to Book' }
                    ],
                    targetRect: e.currentTarget.getBoundingClientRect()
                })}
                onMouseLeave={() => setHoveredTooltip(null)}
            >
                {pendingForSlot.length > 0 && (
                    <span className="slot-requests-badge">+{pendingForSlot.length}</span>
                )}
                <div className="slot-content-wrapper">
                    <span className={`slot-status-pill ${alreadyRequested ? 'pill-requested' : 'pill-available'}`}>
                        {alreadyRequested ? 'REQUESTED' : 'AVAILABLE'}
                    </span>
                </div>
            </div>
        )
    }

    const timeSlotsArray = Array.from({ length: 16 }, (_, i) => {
        const h = i + 7
        const start = `${h.toString().padStart(2, '0')}:00`
        return { hour: h, label: start }
    })

    // Filter rooms logic: A room is "available" if at least one slot is NOT a class and NOT a booked session.
    const filteredRooms = rooms.filter(room => {
        if (!availableOnly) return true;

        // Check if ANY of the 16 slots is available (not a class, not approved booking)
        return timeSlotsArray.some(slot => {
            const hour = slot.hour;
            const slotStart = new Date(selectedDate)
            slotStart.setHours(hour, 0, 0, 0)
            const slotEnd = new Date(selectedDate)
            slotEnd.setHours(hour + 1, 0, 0, 0)

            const hasClass = schedules.some(s => {
                if (s.roomId !== room.id) return false;
                const [sh, sm] = s.startTime.split(':').map(Number);
                const [eh, em] = s.endTime.split(':').map(Number);
                const sTotalStart = sh + sm / 60;
                const sTotalEnd = eh + em / 60;
                return sTotalStart < (hour + 1) && sTotalEnd > hour;
            });

            const hasApprovedBooking = bookings.some(b => {
                if (b.roomId !== room.id || b.status !== 'Approved') return false;
                const bStart = new Date(b.timeSlot);
                const bEndRaw = b.endTime ? new Date(b.endTime) : null;
                const bEnd = !bEndRaw || isNaN(bEndRaw.getTime()) || bEndRaw.getFullYear() < 2000
                    ? new Date(bStart.getTime() + b.duration * 3600000)
                    : bEndRaw;
                return bStart < slotEnd && bEnd > slotStart;
            });

            return !hasClass && !hasApprovedBooking;
        });
    });

    return (
        <div className="scheduler-container">
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
                            placeholder="Find room..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{ paddingLeft: '2rem' }}
                        />
                        <Search size={12} style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                    </div>
                </div>

                <div className="form-group" style={{ width: '120px', marginBottom: 0 }}>
                    <select
                        className="form-input"
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value)}
                    >
                        <option value="">All Types</option>
                        {roomTypes.map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                    </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', height: '32px' }}>
                    <label className="custom-checkbox-wrapper" htmlFor="availableOnly">
                        <input
                            type="checkbox"
                            id="availableOnly"
                            checked={availableOnly}
                            onChange={(e) => setAvailableOnly(e.target.checked)}
                            className="custom-checkbox"
                        />
                        <span className="custom-checkbox-label">Available Only</span>
                    </label>
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

                        {filteredRooms.map(room => (
                            <React.Fragment key={room.id}>
                                <div className="scheduler-cell scheduler-room-cell">
                                    <div style={{ fontWeight: 950, fontSize: '0.65rem', color: '#0f172a', marginBottom: '0.05rem', lineHeight: 1.1 }}>{room.roomName}</div>
                                    <div style={{ fontSize: '0.55rem', color: '#64748b', fontWeight: 800 }}>{room.roomCode}</div>
                                </div>
                                {timeSlotsArray.map(slot => getSlotContent(room, slot.hour))}
                            </React.Fragment>
                        ))}
                    </div>
                )}
            </div>

            {hoveredTooltip && <PortalTooltip {...hoveredTooltip} />}

            {modalOpen && selectedSlot && selectedRoom && createPortal(
                <div className="modal-overlay">
                    <div className="modal-panel-premium">
                        <div className="modal-header-premium">
                            <h3 style={{ fontSize: '1rem', margin: 0, fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <CalendarIcon size={18} /> Request Booking
                            </h3>
                            <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = 'white'} onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}>
                                <X size={20} />
                            </button>
                        </div>

                        {(() => {
                            const maxPossibleDuration = 23 - selectedSlot.hour
                            const durationOptions = [1, 2, 3, 4, 5, 6, 7, 8].filter(h => h <= maxPossibleDuration)

                            return (
                                <>
                                    <div className="modal-room-card">
                                        <div className="modal-info-row">
                                            <MapPin size={14} style={{ color: '#0f172a' }} />
                                            <span>Room: <strong>{selectedRoom.roomName} ({selectedRoom.roomCode})</strong></span>
                                        </div>
                                        <div className="modal-info-row">
                                            <Clock size={14} style={{ color: '#0f172a' }} />
                                            <span>Time: <strong>{selectedSlot.hour}:00 - {selectedSlot.hour + duration}:00</strong></span>
                                        </div>
                                        <div className="modal-info-row">
                                            <CalendarIcon size={14} style={{ color: '#0f172a' }} />
                                            <span>Date: <strong>{new Date(selectedSlot.date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</strong></span>
                                        </div>
                                    </div>

                                    <div className="modal-body-premium">
                                        <div className="modal-input-group">
                                            <label className="modal-label-premium">
                                                <Clock size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                                                Duration (Hours)
                                            </label>
                                            <select
                                                className="form-input"
                                                style={{ width: '100%', marginBottom: '1rem' }}
                                                value={duration}
                                                onChange={(e) => setDuration(Number(e.target.value))}
                                            >
                                                {durationOptions.map(h => (
                                                    <option key={h} value={h}>{h} {h === 1 ? 'Hour' : 'Hours'}</option>
                                                ))}
                                            </select>

                                            <label className="modal-label-premium">
                                                <MessageSquare size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                                                Purpose of Booking
                                            </label>
                                            <textarea
                                                className="modal-textarea-premium"
                                                value={reason}
                                                onChange={(e) => setReason(e.target.value)}
                                                placeholder="Briefly explain why you need this room... (Optional)"
                                                rows={3}
                                            />
                                            <div style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Info size={10} /> Your request will be reviewed by the room management staff.
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )
                        })()}

                        <div className="modal-footer-premium">
                            <button className="btn-modal btn-modal-cancel" onClick={() => setModalOpen(false)}>
                                Cancel
                            </button>
                            <button
                                className="btn-modal btn-modal-primary"
                                onClick={handleConfirmBook}
                                disabled={submitting}
                            >
                                {submitting ? 'Processing...' : (
                                    <>
                                        Confirm Request <ArrowRight size={16} />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )
            }
        </div >
    )
}
