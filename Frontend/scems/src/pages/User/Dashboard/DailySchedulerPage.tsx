import React, { useEffect, useState, useRef } from 'react'
import { useDebounce } from '../../../hooks/useDebounce'
import { createPortal } from 'react-dom'
import { roomService } from '../../../services/room.service'
import { roomTypeService } from '../../../services/roomType.service'
import { scheduleService } from '../../../services/teachingSchedule.service'
import { bookingService } from '../../../services/booking.service'
import { configService, BookingSettings } from '../../../services/config.service'
import { Room, RoomType, ScheduleResponse, Booking, BookingStatus, CreateScheduleChangeRequest } from '../../../types/api'
import { Alert } from '../../../components/Common/Alert'
import { Loading } from '../../../components/Common/Loading'
import { X, Calendar as CalendarIcon, Clock, Filter, MapPin, Search, Users, Info, ArrowRight, MessageSquare } from 'lucide-react'
import '../../../styles/scheduler.css'
import { useAuth } from '../../../context/AuthContext'
import { departmentService } from '../../../services/department.service'
import { Department } from '../../../types/api'

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
    const debouncedSearch = useDebounce(search, 400)
    const [selectedType, setSelectedType] = useState('')
    const [availableOnly, setAvailableOnly] = useState(false)
    const [bookingSettings, setBookingSettings] = useState<BookingSettings | null>(null)
    const [departments, setDepartments] = useState<Department[]>([])
    const [selectedDepartment, setSelectedDepartment] = useState('')

    const [modalOpen, setModalOpen] = useState(false)
    const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
    const [selectedSlot, setSelectedSlot] = useState<{ date: string, hour: number } | null>(null)
    const [reason, setReason] = useState('')
    const [duration, setDuration] = useState(1)
    const [submitting, setSubmitting] = useState(false)
    const [modalError, setModalError] = useState<string | React.ReactNode>('')
    const [modalSuccess, setModalSuccess] = useState('')

    const [isChangeRequest, setIsChangeRequest] = useState(false)
    const [selectedSchedule, setSelectedSchedule] = useState<ScheduleResponse | null>(null)
    const [newRoomId, setNewRoomId] = useState('')

    const [hoveredTooltip, setHoveredTooltip] = useState<PortalTooltipProps | null>(null);

    useEffect(() => {
        configService.getBookingSettings()
            .then(setBookingSettings)
            .catch(err => console.error("Failed to load booking settings", err))

        departmentService.getAll()
            .then(setDepartments)
            .catch(err => console.error("Failed to load departments", err))
    }, [])

    const loadData = async () => {
        setLoading(true)
        try {
            const allRooms = await roomService.getAllRoomsBatched(undefined, 50, debouncedSearch || undefined, selectedDepartment || undefined)
            const [typesData, schedulesData, bookingsData] = await Promise.all([
                roomTypeService.getAll(),
                scheduleService.getSchedulesByDay(selectedDate),
                bookingService.getBookingsByDay(selectedDate)
            ])

            // Apply remaining client-side filters
            let filtered = allRooms;
            if (selectedDepartment) {
                filtered = filtered.filter(r => r.departmentId === selectedDepartment);
            }
            // Sort rooms alphabetically by roomName
            const sortedRooms = filtered.sort((a, b) => a.roomName.localeCompare(b.roomName))
            setRooms(sortedRooms)
            setRoomTypes(typesData)
            setSchedules(schedulesData)
            setBookings(bookingsData)
        } catch (err: any) {
            setError(err.response?.data?.message || 'Tải dữ liệu thất bại')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [selectedDate, debouncedSearch, selectedType, selectedDepartment])

    const handleBookClick = (room: Room, hour: number, alreadyRequested: boolean, classSchedule?: ScheduleResponse) => {
        if (alreadyRequested) return

        setModalError('')
        setModalSuccess('')

        if (classSchedule) {
            setIsChangeRequest(true)
            const [sh] = (classSchedule.startTime || "0:0").split(':').map(Number)
            const [eh] = (classSchedule.endTime || "0:0").split(':').map(Number)
            const dur = eh - sh

            const sDate = classSchedule.date.split('T')[0]
            setSelectedSlot({ date: sDate, hour: sh })
            setSelectedRoom(room)
            setSelectedSchedule(classSchedule)
            setNewRoomId('')
            setReason('')
            setDuration(dur > 0 ? dur : 1)
        } else {
            setIsChangeRequest(false)
            setSelectedSchedule(null)
            setSelectedRoom(room)
            setSelectedSlot({ date: selectedDate, hour })
            setDuration(1)
        }

        setModalOpen(true)
        setReason('')
    }

    const handleConfirmBook = async () => {
        if (!selectedSlot || !selectedRoom || !bookingSettings) return
        setSubmitting(true)
        setModalError('')
        setModalSuccess('')

        try {
            // Use local date parsing to avoid UTC shift
            const [y, m, d] = selectedSlot.date.split('-').map(Number)
            const slotDate = new Date(y, m - 1, d, selectedSlot.hour, 0, 0)

            // Check if slot end is in the past
            const slotEndTime = new Date(y, m - 1, d, selectedSlot.hour + duration, 0, 0)

            const now = new Date()
            if (slotEndTime < now) {
                setModalError('Không thể đặt hoặc đổi phòng vào thời gian đã qua.')
                setSubmitting(false)
                return
            }

            // Format as YYYY-MM-DDTHH:mm:ss for backend
            const pad = (n: number) => n.toString().padStart(2, '0')
            const isoLocal = `${y}-${pad(m)}-${pad(d)}T${pad(selectedSlot.hour)}:00:00`

            if (isChangeRequest && selectedSchedule) {
                if (!newRoomId) {
                    setModalError('Vui lòng chọn phòng mới')
                    setSubmitting(false)
                    return
                }

                await bookingService.createRoomChangeRequest({
                    scheduleId: selectedSchedule.id,
                    originalRoomId: selectedRoom.id,
                    newRoomId: newRoomId,
                    timeSlot: isoLocal,
                    duration: duration,
                    reason: `[Room Change Request] Original: [Room: ${selectedRoom.roomCode}, Date: ${new Date(selectedSchedule.date).toLocaleDateString('vi-VN')}, Slot: ${selectedSchedule.slot}]. Reason: ${reason}`
                })
                setModalSuccess('Đã gửi yêu cầu đổi phòng!')
            } else {
                await bookingService.createBooking({
                    roomId: selectedRoom.id,
                    timeSlot: isoLocal,
                    duration: duration,
                    reason: reason
                })
                setModalSuccess('Đã gửi yêu cầu mượn phòng!')
            }

            loadData()
            setTimeout(() => {
                setModalOpen(false)
                setModalSuccess('')
            }, 2000)
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Gửi yêu cầu thất bại';
            if (msg.includes('|')) {
                const errorList = msg.split('|').filter((m: string) => m.trim() !== '');
                setModalError(
                    <ul style={{ margin: 0, paddingLeft: '1.2rem', textAlign: 'left' }}>
                        {errorList.map((m: string, i: number) => (
                            <li key={i}>{m}</li>
                        ))}
                    </ul>
                );
            } else {
                setModalError(msg);
            }
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

        const isPast = new Date() > slotEnd

        if (classInSlot) {
            const isMyClass = classInSlot.lecturerId?.toLowerCase() === user?.id?.toLowerCase() || (classInSlot as any).lecturerEmail?.toLowerCase() === user?.email?.toLowerCase()

            return (
                <div
                    className={`scheduler-cell slot-class ${isMyClass ? 'my-class' : ''} ${isPast ? 'slot-past' : ''}`}
                    onClick={() => !isPast && isMyClass && handleBookClick(room, hour, false, classInSlot)}
                    onMouseEnter={(e) => setHoveredTooltip({
                        title: 'Lịch học',
                        icon: <CalendarIcon size={12} />,
                        lines: [
                            { label: 'Môn học', value: classInSlot.subject },
                            { label: 'Lớp', value: classInSlot.classCode },
                            { label: 'Giảng viên', value: getTeacherId(classInSlot.lecturerName, (classInSlot as any).lecturerEmail) },
                            { label: 'Thời gian', value: `${classInSlot.startTime} - ${classInSlot.endTime}` },
                            isMyClass ? { label: 'Hành động', value: 'Nhấn để đổi phòng' } : { label: 'Trạng thái', value: 'Đang bận' }
                        ],
                        targetRect: e.currentTarget.getBoundingClientRect()
                    })}
                    onMouseLeave={() => setHoveredTooltip(null)}
                >
                    <div className="slot-content-wrapper">
                        <span className="slot-status-pill pill-class">LỚP HỌC</span>
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
                        title: 'Yêu cầu mượn phòng',
                        icon: <Clock size={12} />,
                        lines: [
                            { label: 'Bởi', value: getTeacherId(approvedBooking.requestedByName || '', approvedBooking.requestedByAccount?.email) },
                            { label: 'Lý do', value: approvedBooking.reason || 'Không có lý do' }
                        ],
                        targetRect: e.currentTarget.getBoundingClientRect()
                    })}
                    onMouseLeave={() => setHoveredTooltip(null)}
                >
                    <div className="slot-content-wrapper">
                        <span className="slot-status-pill pill-booked">ĐÃ ĐẶT</span>
                        <div className="slot-main-text">{(approvedBooking.requestedByName || '').split(' ').pop()}</div>
                    </div>
                </div>
            )
        }

        if (isPast) {
            return <div className="scheduler-cell" style={{ background: 'rgba(0,0,0,0.01)', opacity: 0.2 }}></div>
        }

        return (
            <div
                className={`scheduler-cell slot-available ${alreadyRequested ? 'already-requested' : ''}`}
                onClick={() => handleBookClick(room, hour, alreadyRequested)}
                onMouseEnter={(e) => setHoveredTooltip({
                    title: 'Khả dụng',
                    icon: <Users size={12} />,
                    lines: [
                        { label: 'Chờ duyệt', value: pendingForSlot.length },
                        alreadyRequested ? { label: 'Trạng thái', value: 'Đã gửi yêu cầu' } : { label: 'Hành động', value: 'Nhấn để đặt' }
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
                        {alreadyRequested ? 'ĐÃ YÊU CẦU' : 'KHẢ DỤNG'}
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
        if (selectedType && room.roomTypeId !== selectedType) return false;

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
                            placeholder="Tìm kiếm phòng..."
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
                        <option value="">Tất cả loại phòng</option>
                        {roomTypes.map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                    </select>
                </div>

                <div className="form-group" style={{ width: '120px', marginBottom: 0 }}>
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

                <div style={{ display: 'flex', alignItems: 'center', height: '32px' }}>
                    <label className="custom-checkbox-wrapper" htmlFor="availableOnly">
                        <input
                            type="checkbox"
                            id="availableOnly"
                            checked={availableOnly}
                            onChange={(e) => setAvailableOnly(e.target.checked)}
                            className="custom-checkbox"
                        />
                        <span className="custom-checkbox-label">Chỉ phòng trống</span>
                    </label>
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

                        {filteredRooms.map(room => (
                            <React.Fragment key={room.id}>
                                <div className="scheduler-cell scheduler-room-cell">
                                    <div style={{ fontWeight: 900, fontSize: '0.65rem', color: '#0f172a', marginBottom: '0.05rem', lineHeight: 1.1 }}>{room.roomName}</div>
                                    <div style={{ fontSize: '0.55rem', color: '#64748b', fontWeight: 800 }}>{room.roomCode}</div>
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

            {hoveredTooltip && <PortalTooltip {...hoveredTooltip} />}

            {modalOpen && selectedSlot && selectedRoom && createPortal(
                <div className="modal-overlay">
                    <div className="modal-panel-premium">
                        <div className="modal-header-premium">
                            <h3 style={{ fontSize: '1rem', margin: 0, fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <CalendarIcon size={18} /> {isChangeRequest ? 'Yêu cầu Đổi phòng' : 'Yêu cầu Mượn phòng'}
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
                                        {modalError && (
                                            <div style={{ marginBottom: '1rem' }}>
                                                <Alert type="error" message={modalError} onClose={() => setModalError('')} />
                                            </div>
                                        )}
                                        {modalSuccess && (
                                            <div style={{ marginBottom: '1rem' }}>
                                                <Alert type="success" message={modalSuccess} onClose={() => setModalSuccess('')} />
                                            </div>
                                        )}

                                        <div className="modal-info-row">
                                            <MapPin size={14} style={{ color: '#0f172a' }} />
                                            <span>Phòng hiện tại: <strong>{selectedRoom.roomName} ({selectedRoom.roomCode})</strong></span>
                                        </div>
                                        <div className="modal-info-row">
                                            <Clock size={14} style={{ color: '#0f172a' }} />
                                            <span>Thời gian: <strong>{selectedSlot.hour}:00 - {selectedSlot.hour + duration}:00</strong></span>
                                        </div>
                                        <div className="modal-info-row">
                                            <CalendarIcon size={14} style={{ color: '#0f172a' }} />
                                            <span>Ngày: <strong>{new Date(selectedSlot.date).toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong></span>
                                        </div>
                                    </div>

                                    <div className="modal-body-premium">
                                        <div className="modal-input-group">
                                            {isChangeRequest && (
                                                <>
                                                    <label className="modal-label-premium">
                                                        <MapPin size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                                                        Chọn phòng mới
                                                    </label>
                                                    <select
                                                        className="form-input"
                                                        style={{ width: '100%', marginBottom: '1rem' }}
                                                        value={newRoomId}
                                                        onChange={(e) => setNewRoomId(e.target.value)}
                                                    >
                                                        <option value="">-- Chọn phòng --</option>
                                                        {rooms.filter(r => r.id !== selectedRoom.id).map(r => (
                                                            <option key={r.id} value={r.id}>{r.roomName} ({r.roomCode})</option>
                                                        ))}
                                                    </select>
                                                </>
                                            )}

                                            <label className="modal-label-premium">
                                                <Clock size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                                                Thời lượng (Giờ)
                                            </label>
                                            <select
                                                className="form-input"
                                                style={{ width: '100%', marginBottom: '1rem' }}
                                                value={duration}
                                                onChange={(e) => setDuration(Number(e.target.value))}
                                            >
                                                {durationOptions.map(h => (
                                                    <option key={h} value={h}>{h} {h === 1 ? 'Giờ' : 'Giờ'}</option>
                                                ))}
                                            </select>

                                            <label className="modal-label-premium">
                                                <MessageSquare size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                                                Mục đích mượn phòng
                                            </label>
                                            <textarea
                                                className="modal-textarea-premium"
                                                value={reason}
                                                onChange={(e) => setReason(e.target.value)}
                                                placeholder="Giải thích ngắn gọn lý do bạn cần phòng này... (Không bắt buộc)"
                                                rows={3}
                                            />
                                            <div style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Info size={10} /> Yêu cầu của bạn sẽ được nhân viên quản lý phòng xem xét.
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )
                        })()}

                        <div className="modal-footer-premium">
                            <button className="btn-modal btn-modal-cancel" onClick={() => setModalOpen(false)}>
                                Hủy
                            </button>
                            <button
                                className="btn-modal btn-modal-primary"
                                onClick={handleConfirmBook}
                                disabled={submitting}
                            >
                                {submitting ? 'Đang xử lý...' : (
                                    <>
                                        Xác nhận Yêu cầu <ArrowRight size={16} />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )
            }

            {/* Removed Schedule Change Modal */}
        </div >
    )
}
