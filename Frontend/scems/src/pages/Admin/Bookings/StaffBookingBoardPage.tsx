import React, { useEffect, useState } from 'react'
import { useDebounce } from '../../../hooks/useDebounce'
import { createPortal } from 'react-dom'
import { roomService } from '../../../services/room.service'
import { roomTypeService } from '../../../services/roomType.service'
import { scheduleService } from '../../../services/teachingSchedule.service'
import { bookingService } from '../../../services/booking.service'
import { Room, RoomType, ScheduleResponse, Booking, BookingStatus } from '../../../types/api'
import { Alert } from '../../../components/Common/Alert'
import { Loading } from '../../../components/Common/Loading'
import { X, Calendar as CalendarIcon, Clock, Filter, MapPin, Search, Users, Info, Check, MessageSquare, ArrowRight, BookOpen } from 'lucide-react'
import '../../../styles/scheduler.css'
import { useAuth } from '../../../context/AuthContext'
import { departmentService } from '../../../services/department.service'
import { Department } from '../../../types/api'
import { parseChangeRequest } from '../../../helpers/booking.helper'

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
    const debouncedSearch = useDebounce(search, 400)
    const [selectedType, setSelectedType] = useState('')
    const [activeTab, setActiveTab] = useState<'all' | 'pending'>('pending')
    const [departments, setDepartments] = useState<Department[]>([])
    const [selectedDepartment, setSelectedDepartment] = useState('')

    const loadData = async () => {
        setLoading(true)
        setError('')
        try {
            // First, load non-room dependencies
            const [typesData, schedulesData, bookingsData, deptsData] = await Promise.all([
                roomTypeService.getAll(),
                scheduleService.getSchedulesByDay(selectedDate),
                bookingService.getBookingsByDay(selectedDate),
                departmentService.getAll()
            ])

            setDepartments(deptsData)
            setRoomTypes(typesData)
            setSchedules(schedulesData)
            
            // Filter out pending bookings if user is Guard
            const visibleBookings = user?.role === 'Guard' 
                ? bookingsData.filter(b => b.status !== BookingStatus.Pending)
                : bookingsData;
            setBookings(visibleBookings)

            // Then, load rooms INCREMENTALLY
            await roomService.getAllRoomsBatched(
                (batchRooms) => {
                    // Filter rooms by type if selected (frontend filter)
                    const filteredRooms = selectedType
                        ? batchRooms.filter(r => r.roomTypeId === selectedType)
                        : batchRooms;

                    // Sort rooms with Intelligent Prioritization:
                    // Priority 1: Rooms with PENDING bookings for THIS DAY (Staff only)
                    // Priority 2: Rooms with any OTHER booking ACTIVITY (Approved/Rejected/Classes)
                    // Priority 3: All other rooms (Empty)
                    // Within each group, sort by roomName

                    const sortedRooms = [...filteredRooms].sort((a, b) => {
                        if (user?.role !== 'Guard') {
                            // Check for Pending status in overlaps on this day
                            const aHasPending = visibleBookings.some(bk => bk.roomId === a.id && bk.status === BookingStatus.Pending);
                            const bHasPending = visibleBookings.some(bk => bk.roomId === b.id && bk.status === BookingStatus.Pending);

                            if (aHasPending && !bHasPending) return -1;
                            if (!aHasPending && bHasPending) return 1;
                        }

                        // Check for ANY Handled activity (Approved/Rejected or Schedules)
                        const aHasActivity = visibleBookings.some(bk => bk.roomId === a.id) || schedulesData.some(s => s.roomId === a.id);
                        const bHasActivity = visibleBookings.some(bk => bk.roomId === b.id) || schedulesData.some(s => s.roomId === b.id);

                        if (aHasActivity && !bHasActivity) return -1;
                        if (!aHasActivity && bHasActivity) return 1;

                        // Alphabetical fallback
                        return a.roomName.localeCompare(b.roomName);
                    });

                    setRooms(sortedRooms)
                    setLoading(false)
                },
                50,
                debouncedSearch || undefined,
                selectedDepartment || undefined
            )
        } catch (err: any) {
            setError(err.response?.data?.message || 'Tải dữ liệu thất bại')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [selectedDate, debouncedSearch, selectedType, selectedDepartment])

    const handleUpdateStatus = async (id: string, status: BookingStatus) => {
        try {
            await bookingService.updateStatus(id, status)
            setSuccessMsg(status === BookingStatus.Approved ? 'Duyệt yêu cầu thành công' : 'Từ chối yêu cầu thành công')
            setModalOpen(false)
            loadData()
            setTimeout(() => setSuccessMsg(''), 3000)
        } catch (err: any) {
            setError(err.response?.data?.message || 'Cập nhật yêu cầu thất bại')
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

            // For change requests, we want to show them in the TARGET slot
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

        // PRIORITIZE Change Requests for Staff visibility
        const pendingBookings = overlapsForSlot.filter(b => b.status === BookingStatus.Pending)
        if (pendingBookings.length > 0 && user?.role !== 'Guard') {
            const hasSlotChange = pendingBookings.some(b => b.reason?.includes('[Schedule Change Request]'))
            const hasRoomChange = pendingBookings.some(b => b.reason?.includes('[Room Change Request]'))

            let label = `${pendingBookings.length} CHỜ DUYỆT`
            let bgColor = '#fff7ed'
            let textColor = '#c2410c'
            let borderColor = '#fdba74'

            if (hasSlotChange) {
                label = "ĐỔI LỊCH"
                bgColor = 'rgba(236, 72, 153, 0.1)'
                textColor = '#ec4899'
                borderColor = 'rgba(236, 72, 153, 0.2)'
            } else if (hasRoomChange) {
                label = "ĐỔI PHÒNG"
                bgColor = 'rgba(139, 92, 246, 0.1)'
                textColor = '#8b5cf6'
                borderColor = 'rgba(139, 92, 246, 0.2)'
            }

            return (
                <div
                    className="scheduler-cell"
                    style={{ background: bgColor, cursor: 'pointer', border: `1px dashed ${borderColor}` }}
                    onClick={() => handleSlotClick(room, hour, pendingBookings)}
                >
                    <div className="slot-content-wrapper">
                        <span className="slot-status-pill" style={{ background: bgColor, color: textColor, border: `1px solid ${borderColor}`, fontWeight: 800 }}>
                            {label}
                        </span>
                        <div className="slot-main-text" style={{ color: textColor }}>Nhấn để xem</div>
                    </div>
                </div>
            )
        }

        if (classInSlot) {
            // Check if there's a PENDING change request for THIS specific class (outgoing request)
            const outgoingRequest = bookings.find(b => {
                if (b.status !== BookingStatus.Pending) return false;
                const change = parseChangeRequest(b);
                return change.scheduleId === classInSlot.id;
            });

            if (outgoingRequest && user?.role !== 'Guard') {
                const change = parseChangeRequest(outgoingRequest);
                const isSlotChange = change.type === 'ScheduleChange';

                const label = isSlotChange ? "ĐỔI LỊCH" : "ĐỔI PHÒNG";
                const bgColor = isSlotChange ? 'rgba(236, 72, 153, 0.1)' : 'rgba(139, 92, 246, 0.1)';
                const textColor = isSlotChange ? '#ec4899' : '#8b5cf6';
                const borderColor = isSlotChange ? 'rgba(236, 72, 153, 0.2)' : 'rgba(139, 92, 246, 0.2)';

                return (
                    <div
                        className="scheduler-cell"
                        style={{ background: bgColor, cursor: 'pointer', border: `1px dashed ${borderColor}` }}
                        onClick={() => handleSlotClick(room, hour, [outgoingRequest])}
                    >
                        <div className="slot-content-wrapper">
                            <span className="slot-status-pill" style={{ background: bgColor, color: textColor, border: `1px solid ${borderColor}`, fontWeight: 800 }}>
                                {label}
                            </span>
                            <div className="slot-main-text" style={{ color: textColor }}>{classInSlot.subject}</div>
                        </div>
                    </div>
                );
            }

            return (
                <div className="scheduler-cell slot-class">
                    <div className="slot-content-wrapper">
                        <span className="slot-status-pill pill-class">LỚP HỌC</span>
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
                        <span className="slot-status-pill pill-booked">ĐÃ ĐẶT</span>
                        <div className="slot-main-text">{(approvedBooking.requestedByName || '').split(' ').pop()}</div>
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
                    <h1>Bảng Đặt phòng cho Nhân viên</h1>
                    <p className="text-muted">Quản lý yêu cầu đặt phòng và lịch trình theo thời gian thực</p>
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
                            placeholder="Tìm kiếm phòng..."
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
                        <option value="">Tất cả danh mục</option>
                        {roomTypes.map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                    </select>
                </div>

                <div className="form-group" style={{ width: '150px', marginBottom: 0 }}>
                    <select
                        className="form-input"
                        value={selectedDepartment}
                        onChange={(e) => setSelectedDepartment(e.target.value)}
                    >
                        <option value="">Tất cả tòa nhà</option>
                        {departments.map(d => (
                            <option key={d.id} value={d.id}>{d.departmentName}</option>
                        ))}
                    </select>
                </div>
            </div>

            {error && <Alert type="error" message={error} onClose={() => setError('')} />}
            {successMsg && <Alert type="success" message={successMsg} onClose={() => setSuccessMsg('')} />}

            <div className="scheduler-grid-wrapper">
                {loading ? <Loading fullPage={false} /> : (
                    <div className="scheduler-grid">
                        <div className="scheduler-cell scheduler-header-cell scheduler-room-cell">Phòng</div>
                        {timeSlotsArray.map(slot => (
                            <div key={slot.hour} className="scheduler-cell scheduler-header-cell">{slot.label}</div>
                        ))}

                        {rooms.map(room => (
                            <React.Fragment key={room.id}>
                                <div className="scheduler-cell scheduler-room-cell">
                                    <div className="room-name-staff">{room.roomName}</div>
                                    <div className="room-code-staff">{room.roomCode}</div>
                                </div>
                                {timeSlotsArray.map(slot => (
                                    <React.Fragment key={`${room.id}-${slot.hour}`}>
                                        {getSlotContent(room, slot.hour)}
                                    </React.Fragment>
                                ))}
                            </React.Fragment>
                        ))}
                    </div>
                )}
            </div>

            {/* Manage Modal */}
            {modalOpen && selectedSlotRoom && (
                createPortal(
                    <div className="modal-overlay">
                        <div className="modal-panel-premium" style={{ maxWidth: '600px', width: '90%' }}>
                            <div className="modal-header-premium">
                                <h3 style={{ fontSize: '1rem', margin: 0, fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Clock size={18} /> Quản lý Khung giờ: {selectedSlotHour}:00 - {selectedSlotHour! + 1}:00
                                </h3>
                                <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer' }}>
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="modal-body-premium" style={{ paddingTop: '1.5rem', maxHeight: '80vh', overflowY: 'auto' }}>
                                <div style={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{ background: 'var(--color-primary-light)', padding: '0.5rem', borderRadius: '8px', color: 'var(--color-primary)' }}>
                                        <MapPin size={20} />
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{selectedSlotRoom.roomName}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Mã phòng: {selectedSlotRoom.roomCode}</div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                    {slotBookings.map(booking => {
                                        const change = parseChangeRequest(booking);
                                        const isPending = booking.status === BookingStatus.Pending;

                                        return (
                                            <div key={booking.id} style={{
                                                background: isPending ? 'rgba(251, 146, 60, 0.03)' : '#f8fafc',
                                                padding: '1.25rem',
                                                borderRadius: '12px',
                                                border: isPending ? '2px solid #fb923c' : '1px solid #e2e8f0',
                                                position: 'relative',
                                                boxShadow: isPending ? '0 4px 12px rgba(251, 146, 60, 0.1)' : 'none'
                                            }}>
                                                {isPending && (
                                                    <div style={{
                                                        position: 'absolute',
                                                        top: '-10px',
                                                        right: '20px',
                                                        background: change.type === 'ScheduleChange' ? '#ec4899' : (change.type === 'RoomChange' ? '#8b5cf6' : '#fb923c'),
                                                        color: 'white',
                                                        fontSize: '0.65rem',
                                                        padding: '3px 10px',
                                                        borderRadius: '20px',
                                                        fontWeight: 800,
                                                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                                    }}>
                                                        {change.type === 'ScheduleChange' ? 'YÊU CẦU ĐỔI LỊCH' : (change.type === 'RoomChange' ? 'YÊU CẦU ĐỔI PHÒNG' : 'ĐANG CHỜ DUYỆT')}
                                                    </div>
                                                )}

                                                {!change.isChangeRequest ? (
                                                    // Standard Booking Display
                                                    <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '0.75rem 1.5rem', fontSize: '0.95rem' }}>
                                                        <div style={{ color: '#64748b', fontWeight: 600 }}>Người yêu cầu:</div>
                                                        <div style={{ fontWeight: 700, color: '#1e293b' }}>{booking.requestedByName || booking.requestedByAccount?.fullName}</div>

                                                        <div style={{ color: '#64748b', fontWeight: 600 }}>Thời lượng:</div>
                                                        <div style={{ fontWeight: 600 }}>{booking.duration} Giờ</div>

                                                        <div style={{ color: '#64748b', fontWeight: 600 }}>Lý do:</div>
                                                        <div style={{ fontStyle: 'italic', color: '#475569', lineHeight: 1.5 }}>"{booking.reason || 'Không có lý do'}"</div>
                                                    </div>
                                                ) : (
                                                    // Change Request Display (Restored comparison view)
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '1rem', background: 'white', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.05)' }}>
                                                            <div>
                                                                <div style={{ fontSize: '0.6rem', fontWeight: 800, color: '#94a3b8', marginBottom: '0.4rem', letterSpacing: '0.05em' }}>NGUỒN (FROM)</div>
                                                                <div style={{ fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b' }}>
                                                                    <MapPin size={14} /> {change.originalRoomName || 'Lịch cũ'}
                                                                </div>
                                                                {change.originalDate && (
                                                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px', paddingLeft: '20px' }}>
                                                                        {change.originalDate} - Ca {change.originalSlot}
                                                                    </div>
                                                                )}
                                                            </div>

                                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                                                <ArrowRight size={18} style={{ color: 'var(--color-primary)', opacity: 0.6 }} />
                                                            </div>

                                                            <div>
                                                                <div style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--color-primary)', marginBottom: '0.4rem', letterSpacing: '0.05em' }}>MỤC TIÊU (TO)</div>
                                                                <div style={{ fontSize: '0.9rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-primary)' }}>
                                                                    <MapPin size={14} /> {booking.room?.roomName}
                                                                </div>
                                                                <div style={{ fontSize: '0.75rem', color: 'var(--color-primary)', opacity: 0.8, marginTop: '2px', paddingLeft: '20px', fontWeight: 600 }}>
                                                                    {new Date(booking.timeSlot).toLocaleDateString('vi-VN')} - Ca {selectedSlotHour && (selectedSlotHour - 6 > 0 ? (selectedSlotHour - 6) : 1)}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '0.5rem 1.5rem', fontSize: '0.9rem' }}>
                                                            <div style={{ color: '#64748b', fontWeight: 600 }}>Người yêu cầu:</div>
                                                            <div style={{ fontWeight: 700, color: '#1e293b' }}>{booking.requestedByName || booking.requestedByAccount?.fullName}</div>

                                                            <div style={{ color: '#64748b', fontWeight: 600 }}>Lớp/Môn học:</div>
                                                            <div style={{ fontWeight: 700, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                <BookOpen size={14} /> {booking.reason?.match(/Môn học: (.*?) -/)?.[1] || 'Lịch giảng dạy'}
                                                            </div>

                                                            <div style={{ color: '#64748b', fontWeight: 600 }}>Lý do chi tiết:</div>
                                                            <div style={{ fontStyle: 'italic', color: '#475569', lineHeight: 1.4 }}>"{change.displayReason || 'Không có lý do'}"</div>
                                                        </div>
                                                    </div>
                                                )}

                                                {booking.status === BookingStatus.Pending && user?.role !== 'Guard' && (
                                                    <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                                                        <button
                                                            onClick={() => handleUpdateStatus(booking.id, BookingStatus.Rejected)}
                                                            className="btn-status-reject"
                                                            style={{
                                                                padding: '0.6rem 1.25rem',
                                                                borderRadius: '8px',
                                                                border: '1px solid #fca5a5',
                                                                background: 'white',
                                                                color: '#b91c1c',
                                                                cursor: 'pointer',
                                                                fontWeight: 700,
                                                                fontSize: '0.85rem',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '0.4rem'
                                                            }}
                                                        >
                                                            <X size={16} /> Từ chối
                                                        </button>
                                                        <button
                                                            onClick={() => handleUpdateStatus(booking.id, BookingStatus.Approved)}
                                                            className="btn-status-approve"
                                                            style={{
                                                                padding: '0.6rem 1.25rem',
                                                                borderRadius: '8px',
                                                                border: 'none',
                                                                background: isPending ? '#fb923c' : '#10b981',
                                                                color: 'white',
                                                                cursor: 'pointer',
                                                                fontWeight: 700,
                                                                fontSize: '0.85rem',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '0.4rem',
                                                                boxShadow: '0 4px 10px rgba(251, 146, 60, 0.2)'
                                                            }}
                                                        >
                                                            <Check size={16} /> Phê duyệt
                                                        </button>
                                                    </div>
                                                )}

                                                {booking.status === BookingStatus.Approved && (
                                                    <div style={{ marginTop: '1rem', color: '#166534', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', padding: '0.5rem', background: '#f0fdf4', borderRadius: '6px' }}>
                                                        <Check size={16} /> Đã phê duyệt yêu cầu này
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
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
