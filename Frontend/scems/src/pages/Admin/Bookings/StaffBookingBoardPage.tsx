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
import { parseChangeRequest, cleanDisplayReason, formatDate } from '../../../helpers/booking.helper'
import { NEW_SLOTS, OLD_SLOTS, Slot } from '../../../helpers/slot.helper'

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
    const [slotSystem, setSlotSystem] = useState<'New' | 'Old'>('New')
    const [selectedSlotRoom, setSelectedSlotRoom] = useState<Room | null>(null)
    const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
    const [slotBookings, setSlotBookings] = useState<Booking[]>([])
    const [modalOpen, setModalOpen] = useState(false)
    const [rejectingBookingId, setRejectingBookingId] = useState<string | null>(null)
    const [rejectReason, setRejectReason] = useState('')

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

    const loadDependencies = async () => {
        setLoading(true)
        setError('')
        try {
            const [typesData, schedulesData, bookingsData, deptsData] = await Promise.all([
                roomTypeService.getAll(),
                scheduleService.getSchedulesByDay(selectedDate),
                bookingService.getBookingsByDay(selectedDate),
                departmentService.getAll()
            ])

            setDepartments(deptsData)
            setRoomTypes(typesData)
            setSchedules(schedulesData)
            
            const visibleBookings = user?.role === 'Guard' 
                ? bookingsData.filter(b => b.status !== BookingStatus.Pending)
                : bookingsData;
            setBookings(visibleBookings)
            
            // Core data done
            setLoading(false)

            // Now load rooms incrementally in background
            loadRoomsBatched(visibleBookings, schedulesData)
        } catch (err: any) {
            setError(err.response?.data?.message || 'Tải dữ liệu thất bại')
            setLoading(false)
        }
    }

    const loadRoomsBatched = async (visibleBookings: Booking[], schedulesData: ScheduleResponse[]) => {
        await roomService.getAllRoomsBatched(
            (batchRooms) => {
                const filteredRooms = selectedType
                    ? batchRooms.filter(r => r.roomTypeId === selectedType)
                    : batchRooms;

                const sortedRooms = [...filteredRooms].sort((a, b) => {
                    if (user?.role !== 'Guard') {
                        const aHasPending = visibleBookings.some(bk => bk.roomId === a.id && bk.status === BookingStatus.Pending);
                        const bHasPending = visibleBookings.some(bk => bk.roomId === b.id && bk.status === BookingStatus.Pending);
                        if (aHasPending && !bHasPending) return -1;
                        if (!aHasPending && bHasPending) return 1;
                    }

                    const aHasActivity = visibleBookings.some(bk => bk.roomId === a.id) || schedulesData.some(s => s.roomId === a.id);
                    const bHasActivity = visibleBookings.some(bk => bk.roomId === b.id) || schedulesData.some(s => s.roomId === b.id);
                    if (aHasActivity && !bHasActivity) return -1;
                    if (!aHasActivity && bHasActivity) return 1;

                    return a.roomName.localeCompare(b.roomName);
                });

                setRooms(sortedRooms)
            },
            50,
            debouncedSearch || undefined,
            selectedDepartment || undefined
        )
    }

    useEffect(() => {
        loadDependencies()
    }, [selectedDate, debouncedSearch, selectedType, selectedDepartment])

    const handleUpdateStatus = async (id: string, status: BookingStatus, reason?: string) => {
        try {
            await bookingService.updateStatus(id, status, reason)
            setSuccessMsg(status === BookingStatus.Approved ? 'Duyệt yêu cầu thành công' : 'Từ chối yêu cầu thành công')
            setModalOpen(false)
            setRejectingBookingId(null)
            setRejectReason('')
            loadDependencies()
            setTimeout(() => setSuccessMsg(''), 3000)
        } catch (err: any) {
            setError(err.response?.data?.message || 'Cập nhật yêu cầu thất bại')
        }
    }

    const handleSlotClick = (room: Room, slot: Slot, bookingsInSlot: Booking[]) => {
        if (bookingsInSlot.length === 0) return
        setSelectedSlotRoom(room)
        setSelectedSlot(slot)
        setSlotBookings(bookingsInSlot)
        setModalOpen(true)
    }

    const getSlotContent = (room: Room, slot: Slot) => {
        const roomId = room.id
        const [sh, sm] = slot.startTime.split(':').map(Number)
        const [eh, em] = slot.endTime.split(':').map(Number)
        const [y, m, d] = selectedDate.split('-').map(Number)
        const slotStartMs = new Date(y, m - 1, d, sh, sm, 0).getTime()
        const slotEndMs = new Date(y, m - 1, d, eh, em, 0).getTime()
        const slotStart = new Date(slotStartMs)
        const slotEnd = new Date(slotEndMs)

        const overlapsForSlot = bookings.filter(b => {
            if (b.roomId !== roomId) return false
            const bStart = new Date(b.timeSlot).getTime()
            const bEnd = b.endTime ? new Date(b.endTime).getTime() : bStart + (b.duration * 3600000)
            return bStart < slotEndMs && bEnd > slotStartMs
        })

        const classInSlot = schedules.find(s => {
            if (s.roomId !== roomId) return false
            const sDate = s.date.split('T')[0]
            if (sDate !== selectedDate) return false
            const [ssh, ssm] = s.startTime.split(':').map(Number)
            const [seh, sem] = s.endTime.split(':').map(Number)
            const sStartMs = new Date(y, m - 1, d, ssh, ssm, 0).getTime()
            const sEndMs = new Date(y, m - 1, d, seh, sem, 0).getTime()
            return sStartMs < slotEndMs && sEndMs > slotStartMs
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
                    onClick={() => handleSlotClick(room, slot, pendingBookings)}
                >
                    <div className="slot-content-wrapper">
                        <span className="slot-status-pill" style={{ background: bgColor, color: textColor, border: `1px solid ${borderColor}`, fontWeight: 800 }}>
                            {label}
                        </span>
                        <div className="slot-main-text" style={{ color: textColor }}>Nhấn để xem {pendingBookings.length > 1 ? `(${pendingBookings.length})` : ''}</div>
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
                        onClick={() => handleSlotClick(room, slot, [outgoingRequest])}
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

        const approvedBookings = overlapsForSlot.filter(b => b.status === BookingStatus.Approved || b.status === BookingStatus.CheckedIn)
        const isPartiallyBooked = approvedBookings.length > 0;
        const isFullyBooked = approvedBookings.length > 0 && (() => {
            let occ = 0;
            approvedBookings.forEach(b => {
                const bs = new Date(b.timeSlot).getTime();
                const be = bs + b.duration * 3600000;
                const is2 = Math.max(slotStartMs, bs);
                const ie2 = Math.min(slotEndMs, be);
                if (ie2 > is2) occ += (ie2 - is2);
            });
            return occ >= (slotEndMs - slotStartMs - 5 * 60000);
        })();

        if (isFullyBooked) {
            const main = approvedBookings[0];
            return (
                <div className="scheduler-cell slot-booked" style={{ position: 'relative', cursor: 'pointer' }} onClick={() => handleSlotClick(room, slot, approvedBookings)}>
                    <div className="slot-timeline" style={{ position: 'absolute', bottom: 3, left: '5%', width: '90%', height: '4px', background: '#e2e8f0', borderRadius: '2px', overflow: 'hidden' }}>
                        {approvedBookings.map((b, idx) => {
                            const bs = new Date(b.timeSlot).getTime();
                            const be = bs + b.duration * 3600000;
                            const is2 = Math.max(slotStartMs, bs);
                            const ie2 = Math.min(slotEndMs, be);
                            if (ie2 <= is2) return null;
                            return <div key={idx} style={{ position: 'absolute', left: `${((is2-slotStartMs)/(slotEndMs-slotStartMs))*100}%`, width: `${((ie2-is2)/(slotEndMs-slotStartMs))*100}%`, height: '100%', background: '#ef4444' }} />;
                        })}
                    </div>
                    <div className="slot-content-wrapper" style={{ marginBottom: '8px' }}>
                        <span className="slot-status-pill pill-booked">ĐÃ ĐẶT</span>
                        <div className="slot-main-text">{(main?.requestedByName || '').split(' ').pop()}{approvedBookings.length > 1 ? ` +${approvedBookings.length - 1}` : ''}</div>
                    </div>
                </div>
            )
        }

        if (isPartiallyBooked) {
            return (
                <div className="scheduler-cell slot-available" style={{ position: 'relative', cursor: 'pointer' }} onClick={() => handleSlotClick(room, slot, approvedBookings)}>
                    <div className="slot-timeline" style={{ position: 'absolute', bottom: 3, left: '5%', width: '90%', height: '4px', background: '#e2e8f0', borderRadius: '2px', overflow: 'hidden' }}>
                        {approvedBookings.map((b, idx) => {
                            const bs = new Date(b.timeSlot).getTime();
                            const be = bs + b.duration * 3600000;
                            const is2 = Math.max(slotStartMs, bs);
                            const ie2 = Math.min(slotEndMs, be);
                            if (ie2 <= is2) return null;
                            return <div key={idx} style={{ position: 'absolute', left: `${((is2-slotStartMs)/(slotEndMs-slotStartMs))*100}%`, width: `${((ie2-is2)/(slotEndMs-slotStartMs))*100}%`, height: '100%', background: '#ef4444' }} />;
                        })}
                    </div>
                    <div className="slot-content-wrapper" style={{ marginBottom: '8px' }}>
                        <span className="slot-status-pill pill-available" style={{ fontSize: '0.6rem', padding: '2px 6px' }}>KHẢ DỤNG</span>
                        <div className="slot-main-text" style={{ color: '#f59e0b' }}>{approvedBookings.length} đặt riêng</div>
                    </div>
                </div>
            )
        }

        return (
            <div className="scheduler-cell slot-available" style={{ pointerEvents: 'none' }}>
                <span className="slot-status-pill pill-available" style={{ fontSize: '0.6rem', padding: '2px 6px' }}>TRỐNG</span>
            </div>
        )
    }

    const currentSlots = slotSystem === 'New' ? NEW_SLOTS : OLD_SLOTS;

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

                {/* Slot System Toggle */}
                <div style={{ display: 'flex', background: 'var(--bg-secondary)', padding: '4px', borderRadius: 'var(--radius-md)', gap: '4px', height: '32px', alignItems: 'center' }}>
                    <button 
                        className={`btn ${slotSystem === 'New' ? 'btn-primary' : 'btn-ghost'}`}
                        onClick={() => setSlotSystem('New')}
                        style={{ padding: '0.2rem 0.6rem', fontSize: '0.7rem', height: '24px' }}
                    >
                        Ca Mới
                    </button>
                    <button 
                        className={`btn ${slotSystem === 'Old' ? 'btn-primary' : 'btn-ghost'}`}
                        onClick={() => setSlotSystem('Old')}
                        style={{ padding: '0.2rem 0.6rem', fontSize: '0.7rem', height: '24px' }}
                    >
                        Ca Cũ
                    </button>
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
                    <div className="scheduler-grid" style={{ gridTemplateColumns: `160px repeat(${currentSlots.length}, 1fr)` }}>
                        <div className="scheduler-cell scheduler-header-cell scheduler-room-cell">Phòng</div>
                        {currentSlots.map(slot => (
                            <div key={slot.number} className="scheduler-cell scheduler-header-cell" style={{ fontSize: '0.65rem' }}>
                                Ca {slot.number}<br/>
                                <span style={{ fontWeight: 400, opacity: 0.8 }}>{slot.startTime}-{slot.endTime}</span>
                            </div>
                        ))}

                        {rooms.map(room => (
                            <React.Fragment key={room.id}>
                                <div className="scheduler-cell scheduler-room-cell">
                                    <div className="room-name-staff">{room.roomName}</div>
                                    <div className="room-code-staff">{room.roomCode}</div>
                                </div>
                                {currentSlots.map(slot => (
                                    <React.Fragment key={`${room.id}-${slot.number}`}>
                                        {getSlotContent(room, slot)}
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
                                     <Clock size={18} /> Quản lý Khung giờ: Ca {selectedSlot?.number} ({selectedSlot?.startTime} - {selectedSlot?.endTime})
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
                                                    // Standard Booking Display with mini-timeline
                                                    (() => {
                                                        const [y2, m2, d2] = selectedDate.split('-').map(Number);
                                                        const [sh2, sm2] = (selectedSlot?.startTime || '00:00').split(':').map(Number);
                                                        const [eh2, em2] = (selectedSlot?.endTime || '00:00').split(':').map(Number);
                                                        const slotS = new Date(y2, m2-1, d2, sh2, sm2, 0).getTime();
                                                        const slotE = new Date(y2, m2-1, d2, eh2, em2, 0).getTime();
                                                        const slotTotal = slotE - slotS;
                                                        const bS = new Date(booking.timeSlot).getTime();
                                                        const bE = bS + booking.duration * 3600000;
                                                        const is2 = Math.max(slotS, bS);
                                                        const ie2 = Math.min(slotE, bE);
                                                        const leftPct = slotTotal > 0 ? ((is2 - slotS) / slotTotal) * 100 : 0;
                                                        const widthPct = slotTotal > 0 ? ((ie2 - is2) / slotTotal) * 100 : 0;
                                                        const pad2 = (n: number) => n.toString().padStart(2, '0');
                                                        const fmtMs = (ms: number) => { const dt = new Date(ms); return `${pad2(dt.getHours())}:${pad2(dt.getMinutes())}`; };
                                                        return (
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                                                {/* Mini timeline */}
                                                                <div>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: '#94a3b8', marginBottom: '3px' }}>
                                                                        <span>{selectedSlot?.startTime}</span>
                                                                        <span style={{ color: '#6366f1', fontWeight: 700 }}>{fmtMs(bS)} → {fmtMs(bE)}</span>
                                                                        <span>{selectedSlot?.endTime}</span>
                                                                    </div>
                                                                    <div style={{ position: 'relative', height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                                                                        <div style={{ position: 'absolute', left: `${leftPct}%`, width: `${widthPct}%`, height: '100%', background: booking.status === BookingStatus.Approved || booking.status === BookingStatus.CheckedIn ? '#6366f1' : '#fb923c', borderRadius: '2px' }} />
                                                                    </div>
                                                                </div>
                                                                {/* Fields */}
                                                                <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '0.5rem 1.5rem', fontSize: '0.9rem' }}>
                                                                    <div style={{ color: '#64748b', fontWeight: 600 }}>Người yêu cầu:</div>
                                                                    <div style={{ fontWeight: 700, color: '#1e293b' }}>{booking.requestedByName || booking.requestedByAccount?.fullName}</div>
                                                                    <div style={{ color: '#64748b', fontWeight: 600 }}>Thời lượng:</div>
                                                                    <div style={{ fontWeight: 600 }}>{Math.round(booking.duration * 60)} Phút</div>
                                                                    <div style={{ color: '#64748b', fontWeight: 600 }}>Lý do:</div>
                                                                    <div style={{ fontStyle: 'italic', color: '#475569', lineHeight: 1.5 }}>"{cleanDisplayReason(booking.reason)}"</div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })()
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
                                                                    {formatDate(booking.timeSlot)} - Ca {selectedSlot?.number}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '0.5rem 1.5rem', fontSize: '0.9rem' }}>
                                                            <div style={{ color: '#64748b', fontWeight: 600 }}>Người yêu cầu:</div>
                                                            <div style={{ fontWeight: 700, color: '#1e293b' }}>{booking.requestedByName || booking.requestedByAccount?.fullName}</div>

                                                            <div style={{ color: '#64748b', fontWeight: 600 }}>Lớp/Môn học:</div>
                                                            <div style={{ fontWeight: 700, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                <BookOpen size={14} /> {change.subject && change.classCode ? `${change.subject} - Lớp: ${change.classCode}` : 'Lịch giảng dạy'}
                                                            </div>

                                                            <div style={{ color: '#64748b', fontWeight: 600 }}>Lý do chi tiết:</div>
                                                            <div style={{ fontStyle: 'italic', color: '#475569', lineHeight: 1.4 }}>"{change.displayReason || 'Không có lý do'}"</div>
                                                        </div>
                                                    </div>
                                                )}

                                                {booking.status === BookingStatus.Pending && user?.role !== 'Guard' && (
                                                    <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                                                        {rejectingBookingId === booking.id ? (
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
                                                                <textarea
                                                                    placeholder="Lý do từ chối (bắt buộc)..."
                                                                    value={rejectReason}
                                                                    onChange={(e) => setRejectReason(e.target.value)}
                                                                    style={{
                                                                        width: '100%',
                                                                        padding: '0.75rem',
                                                                        borderRadius: '8px',
                                                                        border: '2px solid #fee2e2',
                                                                        fontSize: '0.9rem',
                                                                        minHeight: '80px',
                                                                        outline: 'none',
                                                                        transition: 'border-color 0.2s',
                                                                        boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                                                                    }}
                                                                    onFocus={(e) => e.target.style.borderColor = '#fca5a5'}
                                                                    onBlur={(e) => e.target.style.borderColor = '#fee2e2'}
                                                                />
                                                                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                                                                    <button
                                                                        onClick={() => setRejectingBookingId(null)}
                                                                        style={{
                                                                            padding: '0.5rem 1rem',
                                                                            borderRadius: '6px',
                                                                            border: '1px solid #e2e8f0',
                                                                            background: 'white',
                                                                            color: '#64748b',
                                                                            fontWeight: 600,
                                                                            cursor: 'pointer'
                                                                        }}
                                                                    >
                                                                        Hủy
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleUpdateStatus(booking.id, BookingStatus.Rejected, rejectReason)}
                                                                        disabled={!rejectReason.trim()}
                                                                        style={{
                                                                            padding: '0.5rem 1rem',
                                                                            borderRadius: '6px',
                                                                            border: 'none',
                                                                            background: rejectReason.trim() ? '#ef4444' : '#fca5a5',
                                                                            color: 'white',
                                                                            fontWeight: 600,
                                                                            cursor: rejectReason.trim() ? 'pointer' : 'not-allowed',
                                                                            boxShadow: '0 4px 6px -1px rgba(239, 68, 68, 0.2)'
                                                                        }}
                                                                    >
                                                                        Xác nhận Từ chối
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <button
                                                                    onClick={() => setRejectingBookingId(booking.id)}
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
                                                            </>
                                                        )}
                                                    </div>
                                                )}

                                                {booking.status === BookingStatus.Approved && (
                                                    <div style={{ marginTop: '1rem', color: '#166534', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', padding: '0.5rem', background: '#f0fdf4', borderRadius: '6px' }}>
                                                        <Check size={16} /> Đã phê duyệt yêu cầu này
                                                    </div>
                                                )}

                                                {booking.status === BookingStatus.Rejected && (
                                                    <div style={{ 
                                                        marginTop: '1rem', 
                                                        padding: '0.75rem', 
                                                        background: '#fef2f2', 
                                                        borderLeft: '4px solid #ef4444',
                                                        borderRadius: '6px',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        gap: '4px'
                                                    }}>
                                                        <div style={{ color: '#991b1b', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                            <X size={14} /> Đã từ chối
                                                        </div>
                                                        {booking.rejectReason && (
                                                            <div style={{ color: '#b91c1c', fontSize: '0.85rem', fontWeight: 500, lineHeight: '1.4', paddingLeft: '20px' }}>
                                                                Lý do: {booking.rejectReason}
                                                            </div>
                                                        )}
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
