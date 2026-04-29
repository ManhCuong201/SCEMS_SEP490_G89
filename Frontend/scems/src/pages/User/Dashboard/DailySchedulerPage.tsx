import React, { useEffect, useState, useRef } from 'react'
import { useDebounce } from '../../../hooks/useDebounce'
import { createPortal } from 'react-dom'
import { roomService } from '../../../services/room.service'
import { roomTypeService } from '../../../services/roomType.service'
import { scheduleService } from '../../../services/teachingSchedule.service'
import { bookingService } from '../../../services/booking.service'
import { configService } from '../../../services/config.service'
import { Room, RoomType, ScheduleResponse, Booking, BookingStatus, CreateScheduleChangeRequest } from '../../../types/api'
import { Alert } from '../../../components/Common/Alert'
import { Loading } from '../../../components/Common/Loading'
import { Button } from '../../../components/Common/Button'
import { X, Calendar as CalendarIcon, Clock, Filter, MapPin, Search, Users, Info, ArrowRight, MessageSquare } from 'lucide-react'
import '../../../styles/scheduler.css'
import { useAuth } from '../../../context/AuthContext'
import { departmentService } from '../../../services/department.service'
import { Department } from '../../../types/api'
import { formatDate } from '../../../helpers/booking.helper'
import { NEW_SLOTS, OLD_SLOTS, getTimeInMinutes, getSlotTotalMinutes, Slot } from '../../../helpers/slot.helper'

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

    const [departments, setDepartments] = useState<Department[]>([])
    const [selectedDepartment, setSelectedDepartment] = useState('')

    const [modalOpen, setModalOpen] = useState(false)
    const [slotSystem, setSlotSystem] = useState<'New' | 'Old'>('New')
    const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
    const [selectedSlot, setSelectedSlot] = useState<{ date: string, slot: Slot } | null>(null)
    const [durationOption, setDurationOption] = useState<number>(0) // 0 means full slot
    const [approvedInSlot, setApprovedInSlot] = useState<Booking[]>([]) // approved bookings in this slot
    const [reason, setReason] = useState('')
    const [duration, setDuration] = useState(1)
    const [submitting, setSubmitting] = useState(false)
    const [modalError, setModalError] = useState<string | React.ReactNode>('')
    const [modalSuccess, setModalSuccess] = useState('')

    const [hoveredTooltip, setHoveredTooltip] = useState<PortalTooltipProps | null>(null);

    useEffect(() => {


        departmentService.getAll()
            .then(setDepartments)
            .catch(err => console.error("Failed to load departments", err))
    }, [])

    const loadRooms = async () => {
        try {
            const allRooms = await roomService.getAllRoomsBatched(undefined, 50, debouncedSearch || undefined, selectedDepartment || undefined)
            // Sort rooms alphabetically by roomName
            const sortedRooms = allRooms.sort((a, b) => a.roomName.localeCompare(b.roomName))
            setRooms(sortedRooms)
        } catch (err: any) {
            console.error("Failed to load rooms", err)
        }
    }

    const loadSchedulesAndBookings = async () => {
        if (!selectedDate) return
        setLoading(true)
        try {
            const [typesData, schedulesData, bookingsData] = await Promise.all([
                roomTypeService.getAll(),
                scheduleService.getSchedulesByDay(selectedDate),
                bookingService.getBookingsByDay(selectedDate)
            ])

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
        loadRooms()
    }, [debouncedSearch, selectedDepartment])

    useEffect(() => {
        if (selectedDate) {
            loadSchedulesAndBookings()
        }
    }, [selectedDate])

    // Compute contiguous free blocks within [slotStartMs, slotEndMs] given approved bookings
    const computeFreeBlocks = (slotStartMs: number, slotEndMs: number, approved: Booking[]): { start: number; end: number }[] => {
        const bookedRanges = approved.map(b => {
            const s = new Date(b.timeSlot).getTime();
            const e = s + b.duration * 3600000;
            return { start: Math.max(slotStartMs, s), end: Math.min(slotEndMs, e) };
        }).filter(r => r.end > r.start).sort((a, b) => a.start - b.start);

        const freeBlocks: { start: number; end: number }[] = [];
        let cursor = slotStartMs;
        for (const r of bookedRanges) {
            if (r.start > cursor) freeBlocks.push({ start: cursor, end: r.start });
            cursor = Math.max(cursor, r.end);
        }
        if (cursor < slotEndMs) freeBlocks.push({ start: cursor, end: slotEndMs });
        return freeBlocks;
    }

    const handleBookClick = (room: Room, slot: Slot, alreadyRequested: boolean, slotApproved: Booking[] = [], classInSlot?: ScheduleResponse) => {
        if (alreadyRequested) return

        setModalError('')
        setModalSuccess('')

        setSelectedRoom(room)
        setSelectedSlot({ date: selectedDate, slot })
        setDuration(1)
        setDurationOption(0)
        
        // Combine bookings and class into a single occupied list for the modal
        const occupied = [...slotApproved];
        if (classInSlot) {
            // Convert class schedule to a Booking-like object for computeFreeBlocks
            const [y, m, d] = selectedDate.split('-').map(Number);
            const [sh, sm] = classInSlot.startTime.split(':').map(Number);
            const [eh, em] = classInSlot.endTime.split(':').map(Number);
            const start = new Date(y, m - 1, d, sh, sm, 0);
            const end = new Date(y, m - 1, d, eh, em, 0);
            
            occupied.push({
                id: classInSlot.id,
                timeSlot: start.toISOString(),
                duration: (end.getTime() - start.getTime()) / 3600000,
                status: 'Approved',
                roomId: room.id,
                reason: `Class: ${classInSlot.subject}`
            } as any);
        }
        
        setApprovedInSlot(occupied)

        setModalOpen(true)
        setReason('')
    }

    const handleConfirmBook = async () => {
        if (!selectedSlot || !selectedRoom) return
        setSubmitting(true)
        setModalError('')
        setModalSuccess('')

        try {
            const [y, m, d] = selectedSlot.date.split('-').map(Number)
            const [sh, sm] = selectedSlot.slot.startTime.split(':').map(Number)
            const [eh, em] = selectedSlot.slot.endTime.split(':').map(Number)
            const slotStartMs = new Date(y, m - 1, d, sh, sm, 0).getTime()
            const slotEndMs = new Date(y, m - 1, d, eh, em, 0).getTime()

            const now = new Date()
            
            // Re-calculate free blocks starting from NOW (or slot start if in future)
            const effectiveStartMs = Math.max(slotStartMs, now.getTime());
            const freeBlocks = computeFreeBlocks(effectiveStartMs, slotEndMs, approvedInSlot);
            const maxFreeMs = freeBlocks.reduce((acc, b) => Math.max(acc, b.end - b.start), 0);
            
            // If durationOption is 0 (Full Slot), use the total max free time available
            const finalDurationMs = (durationOption > 0 ? durationOption : (maxFreeMs / 60000)) * 60000;

            // Find earliest free block that fits the requested duration
            const fittingBlock = freeBlocks.find(b => (b.end - b.start) >= finalDurationMs);

            if (!fittingBlock || finalDurationMs < 30 * 60000) {
                setModalError('Không còn khoảng thời gian trống đủ để đặt với thời lượng này.');
                setSubmitting(false);
                return;
            }

            // The booking starts at the beginning of the first fitting free block
            const bookingStart = fittingBlock.start;

            const bookingEnd = bookingStart + finalDurationMs;

            if (bookingEnd < now.getTime()) {
                setModalError('Không thể đặt phòng vào thời gian đã qua.')
                setSubmitting(false)
                return
            }

            const startDate = new Date(bookingStart)
            const pad = (n: number) => n.toString().padStart(2, '0')
            const isoLocal = `${startDate.getFullYear()}-${pad(startDate.getMonth()+1)}-${pad(startDate.getDate())}T${pad(startDate.getHours())}:${pad(startDate.getMinutes())}:00`

            await bookingService.createBooking({
                roomId: selectedRoom.id,
                timeSlot: isoLocal,
                duration: finalDurationMs / 3600000,
                reason: reason
            })
            setModalSuccess('Đã gửi yêu cầu mượn phòng!')

            loadSchedulesAndBookings()
            setTimeout(() => {
                setModalOpen(false)
                setModalSuccess('')
            }, 2000)
        } catch (err: unknown) {
            const error = err as any;
            const msg = error.response?.data?.message || 'Gửi yêu cầu thất bại';
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

    const getSlotContent = (room: Room, slot: Slot) => {
        const roomId = room.id
        const [sh, sm] = slot.startTime.split(':').map(Number)
        const [eh, em] = slot.endTime.split(':').map(Number)

        const [y, m, d] = selectedDate.split('-').map(Number)
        const slotStart = new Date(y, m - 1, d, sh, sm, 0)
        const slotEnd = new Date(y, m - 1, d, eh, em, 0)

        const slotStartMs = slotStart.getTime()
        const slotEndMs = slotEnd.getTime()
        const slotTotalMs = slotEndMs - slotStartMs

        const overlapsForSlot = bookings.filter(b => {
            if (b.roomId !== roomId) return false
            const bStart = new Date(b.timeSlot).getTime()
            const bEnd = b.endTime ? new Date(b.endTime).getTime() : bStart + (b.duration * 3600000)

            return bStart < slotEndMs && bEnd > slotStartMs
        })

        const approved = overlapsForSlot.filter(b => b.status === 'Approved' || b.status === 'Active')
        const pendingForSlot = overlapsForSlot.filter(b => b.status === "Pending")
        const alreadyRequested = pendingForSlot.some(b => b.requestedBy?.toLowerCase() === user?.id?.toLowerCase())

        // Calculate occupied time
        let occupiedMs = 0
        approved.forEach(b => {
            const bStart = new Date(b.timeSlot).getTime()
            const bEnd = b.endTime ? new Date(b.endTime).getTime() : bStart + (b.duration * 3600000)
            const intersectStart = Math.max(slotStartMs, bStart)
            const intersectEnd = Math.min(slotEndMs, bEnd)
            if (intersectEnd > intersectStart) {
                occupiedMs += (intersectEnd - intersectStart)
            }
        })

        const isFullyBooked = occupiedMs >= (slotTotalMs - 5 * 60 * 1000)

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

        const isPast = new Date() > slotEnd

        // Compute actual bookable free time (clamp to now for current-day slots)
        const effectiveSlotStartMs = Math.max(slotStartMs, Date.now())
        const freeBlocksNow = computeFreeBlocks(effectiveSlotStartMs, slotEndMs, approved)
        const maxFreeBlockMs = freeBlocksNow.reduce((acc, b) => Math.max(acc, b.end - b.start), 0)
        const noBookableTime = !isPast && maxFreeBlockMs < 30 * 60000

        // Check if there are ANY approved/active bookings
        const isPartiallyBooked = approved.length > 0;

        if (classInSlot) {
            const lecturerEmail = (classInSlot as any).lecturerEmail as string | undefined;
            const isMyClass = classInSlot.lecturerId?.toLowerCase() === user?.id?.toLowerCase() || lecturerEmail?.toLowerCase() === user?.email?.toLowerCase()

            return (
                <div
                    className={`scheduler-cell slot-class ${isMyClass ? 'my-class' : ''} ${isPast ? 'slot-past' : ''}`}
                    onMouseEnter={(e) => setHoveredTooltip({
                        title: 'Lịch học',
                        icon: <CalendarIcon size={12} />,
                        lines: [
                            { label: 'Môn học', value: classInSlot.subject },
                            { label: 'Lớp', value: classInSlot.classCode },
                            { label: 'Giảng viên', value: getTeacherId(classInSlot.lecturerName, (classInSlot as any).lecturerEmail) },
                            { label: 'Thời gian', value: `${classInSlot.startTime} - ${classInSlot.endTime}` }
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

        if (isFullyBooked || noBookableTime) {
            const mainApproved = approved[0]
            return (
                <div
                    className="scheduler-cell slot-booked"
                    onMouseEnter={(e) => setHoveredTooltip({
                        title: noBookableTime && !isFullyBooked ? 'Không khả dụng' : 'Yêu cầu mượn phòng',
                        icon: <Clock size={12} />,
                        lines: noBookableTime && !isFullyBooked
                            ? [{ label: 'Lý do', value: 'Thời gian còn lại < 30 phút' }]
                            : [
                                { label: 'Bởi', value: getTeacherId(mainApproved?.requestedByName || '', mainApproved?.requestedByAccount?.email) },
                                { label: 'Lý do', value: mainApproved?.reason || 'Không có lý do' }
                            ],
                        targetRect: e.currentTarget.getBoundingClientRect()
                    })}
                    onMouseLeave={() => setHoveredTooltip(null)}
                >
                    <div className="slot-content-wrapper">
                        <span className="slot-status-pill pill-booked">{noBookableTime && !isFullyBooked ? 'HẼT GIờ' : 'ĐÃ ĐẶT'}</span>
                        <div className="slot-main-text">{isFullyBooked ? (mainApproved?.requestedByName || '').split(' ').pop() : ''}</div>
                    </div>
                </div>
            )
        }

        if (isPast) {
            return (
                <div className="scheduler-cell slot-past">
                    <span className="slot-past-text">Hết giờ</span>
                </div>
            )
        }

        return (
            <div
                className={`scheduler-cell slot-available ${alreadyRequested ? 'already-requested' : ''}`}
                onClick={() => handleBookClick(room, slot, alreadyRequested, approved, classInSlot)}
                onMouseEnter={(e) => {
                    const lines: any[] = [];
                    if (isPartiallyBooked) {
                        const ranges = approved.map(b => {
                            const bStart = new Date(b.timeSlot).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'});
                            const bEnd = new Date(new Date(b.timeSlot).getTime() + b.duration * 3600000).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'});
                            return `${bStart} - ${bEnd}`;
                        }).join(', ');
                        lines.push({ label: 'Đã đặt', value: ranges });
                    }
                    lines.push({ label: 'Chờ duyệt', value: pendingForSlot.length });
                    lines.push(alreadyRequested ? { label: 'Trạng thái', value: 'Đã gửi yêu cầu' } : { label: 'Hành động', value: 'Nhấn để đặt' });
                    
                    setHoveredTooltip({
                        title: isPartiallyBooked ? 'Khả dụng (Một phần)' : 'Khả dụng',
                        icon: <Users size={12} />,
                        lines: lines,
                        targetRect: e.currentTarget.getBoundingClientRect()
                    });
                }}
                onMouseLeave={() => setHoveredTooltip(null)}
                style={{ position: 'relative' }}
            >
                {pendingForSlot.length > 0 && !alreadyRequested && (
                    <span className="slot-requests-badge">+{pendingForSlot.length}</span>
                )}
                
                {/* Visual Timeline for Partial Bookings */}
                {isPartiallyBooked && (
                    <div className="slot-timeline" style={{ position: 'absolute', bottom: 4, left: '5%', width: '90%', height: '4px', background: '#e2e8f0', borderRadius: '2px', overflow: 'hidden' }}>
                        {approved.map((b, idx) => {
                            const bStart = new Date(b.timeSlot).getTime();
                            const bEnd = bStart + (b.duration * 3600000);
                            const intersectStart = Math.max(slotStartMs, bStart);
                            const intersectEnd = Math.min(slotEndMs, bEnd);
                            
                            if (intersectEnd > intersectStart) {
                                const leftPercent = ((intersectStart - slotStartMs) / slotTotalMs) * 100;
                                const widthPercent = ((intersectEnd - intersectStart) / slotTotalMs) * 100;
                                return (
                                    <div key={idx} style={{
                                        position: 'absolute',
                                        left: `${leftPercent}%`,
                                        width: `${widthPercent}%`,
                                        height: '100%',
                                        background: '#ef4444' // red for booked
                                    }} />
                                );
                            }
                            return null;
                        })}
                    </div>
                )}
                
                <div className="slot-content-wrapper" style={{ marginBottom: isPartiallyBooked ? '8px' : '0' }}>
                    <span className={`slot-status-pill ${alreadyRequested ? 'pill-requested' : 'pill-available'}`}>
                        {alreadyRequested ? 'ĐÃ YÊU CẦU' : 'KHẢ DỤNG'}
                    </span>
                    {!alreadyRequested && pendingForSlot.length > 0 && (
                        <div className="slot-main-text text-pending">+{pendingForSlot.length} Yêu cầu</div>
                    )}
                </div>
            </div>
        )
    }

    const currentSlots = slotSystem === 'New' ? NEW_SLOTS : OLD_SLOTS;

    // Filter rooms logic: A room is "available" if at least one slot is NOT a class and NOT a booked session.
    const filteredRooms = rooms.filter(room => {
        if (selectedType && room.roomTypeId !== selectedType) return false;

        if (!availableOnly) return true;

        const [y, m, d] = selectedDate.split('-').map(Number)

        return currentSlots.some(slot => {
            const [sh, sm] = slot.startTime.split(':').map(Number)
            const [eh, em] = slot.endTime.split(':').map(Number)
            const slotStartMs = new Date(y, m - 1, d, sh, sm, 0).getTime()
            const slotEndMs = new Date(y, m - 1, d, eh, em, 0).getTime()

            const hasClass = schedules.some(s => {
                if (s.roomId !== room.id) return false;
                const [ssh, ssm] = s.startTime.split(':').map(Number);
                const [seh, sem] = s.endTime.split(':').map(Number);
                const sStartMs = new Date(y, m - 1, d, ssh, ssm, 0).getTime()
                const sEndMs = new Date(y, m - 1, d, seh, sem, 0).getTime()
                return sStartMs < slotEndMs && sEndMs > slotStartMs
            });

            const hasApprovedBooking = bookings.some(b => {
                if (b.roomId !== room.id || (b.status !== 'Approved' && b.status !== 'Active')) return false;
                const bStart = new Date(b.timeSlot).getTime();
                const bEnd = b.endTime ? new Date(b.endTime).getTime() : bStart + (b.duration * 3600000);
                return bStart < slotEndMs && bEnd > slotStartMs;
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
                        <span className="custom-checkbox-label" style={{ fontSize: '0.7rem' }}>Chỉ phòng trống</span>
                    </label>
                </div>
            </div>

            {error && <Alert type="error" message={error} onClose={() => setError('')} />}
            {successMsg && <Alert type="success" message={successMsg} onClose={() => setSuccessMsg('')} />}

            <div className="scheduler-grid-wrapper">
                {loading ? <Loading fullPage={false} /> : (
                    <div className="scheduler-grid" style={{ gridTemplateColumns: `140px repeat(${currentSlots.length}, 1fr)` }}>
                        <div className="scheduler-cell scheduler-header-cell scheduler-room-cell">Phòng</div>
                        {currentSlots.map(slot => (
                            <div key={slot.number} className="scheduler-cell scheduler-header-cell" style={{ fontSize: '0.6rem' }}>
                                Ca {slot.number}<br/>
                                <span style={{ fontWeight: 400, opacity: 0.8 }}>{slot.startTime}-{slot.endTime}</span>
                            </div>
                        ))}

                        {filteredRooms.map(room => (
                            <React.Fragment key={room.id}>
                                <div className="scheduler-cell scheduler-room-cell">
                                    <div style={{ fontWeight: 900, fontSize: '0.65rem', color: '#0f172a', marginBottom: '0.05rem', lineHeight: 1.1 }}>{room.roomName}</div>
                                    <div style={{ fontSize: '0.55rem', color: '#64748b', fontWeight: 800 }}>{room.roomCode}</div>
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

            {hoveredTooltip && <PortalTooltip {...hoveredTooltip} />}

            {modalOpen && selectedSlot && selectedRoom && createPortal(
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '500px', width: '90%', padding: 0, overflow: 'hidden', background: '#ffffff', borderRadius: '12px' }}>
                        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>Xác nhận Đặt phòng</h3>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{selectedRoom?.roomName} ({selectedRoom?.roomCode})</p>
                            </div>
                            <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}>
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{ padding: '1.5rem' }}>
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

                            {/* Dynamic modal info card using free block logic */}
                            {(() => {
                                const [y2, m2, d2] = selectedSlot.date.split('-').map(Number);
                                const [sh2, sm2] = selectedSlot.slot.startTime.split(':').map(Number);
                                const [eh2, em2] = selectedSlot.slot.endTime.split(':').map(Number);
                                const slotStartMs2 = new Date(y2, m2-1, d2, sh2, sm2, 0).getTime();
                                const slotEndMs2 = new Date(y2, m2-1, d2, eh2, em2, 0).getTime();
                                const slotTotalMs2 = slotEndMs2 - slotStartMs2;
                                const effectiveStartMs = Math.max(slotStartMs2, Date.now());
                                const freeBlocks2 = computeFreeBlocks(effectiveStartMs, slotEndMs2, approvedInSlot);
                                const maxFreeMs = freeBlocks2.reduce((acc, b) => Math.max(acc, b.end - b.start), 0);
                                const maxFreeMin = Math.floor(maxFreeMs / 60000);
                                const pad2 = (n: number) => n.toString().padStart(2, '0');
                                const fmtMs = (ms: number) => { const d = new Date(ms); return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`; };

                                // Compute selected booking exact start/end
                                const selectedMs = durationOption > 0 ? durationOption * 60000 : maxFreeMs;
                                const now2 = Date.now();
                                const fitting2 = freeBlocks2.find(b => (b.end - b.start) >= selectedMs);
                                const bookStart2 = fitting2 ? Math.max(fitting2.start, now2 <= fitting2.start ? fitting2.start : now2) : null;
                                const bookEnd2 = bookStart2 !== null ? bookStart2 + selectedMs : null;

                                return (
                                    <div style={{
                                        background: 'linear-gradient(to right, rgba(99, 102, 241, 0.1), rgba(99, 102, 241, 0.05))',
                                        border: '1px solid rgba(99, 102, 241, 0.2)',
                                        borderRadius: 'var(--radius-md)',
                                        padding: '1rem',
                                        marginBottom: '1.5rem'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                                            <div style={{ background: 'rgba(99, 102, 241, 0.2)', padding: '6px', borderRadius: '50%', color: 'var(--color-primary)' }}>
                                                <Clock size={18} />
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Khung giờ</div>
                                                <div style={{ fontSize: '1rem', fontWeight: 600 }}>
                                                    {new Date(selectedSlot.date).toLocaleDateString('vi-VN', { weekday: 'short', month: 'short', day: 'numeric' })}
                                                    <span style={{ margin: '0 0.5rem', opacity: 0.3 }}>|</span>
                                                    <span style={{ color: 'var(--color-primary)' }}>Ca {selectedSlot.slot.number}</span>
                                                </div>
                                                {bookStart2 !== null && bookEnd2 !== null && (
                                                    <div style={{ fontSize: '0.85rem', color: 'var(--color-primary)', fontWeight: 700, marginTop: '0.15rem' }}>
                                                        {fmtMs(bookStart2)} → {fmtMs(bookEnd2)}
                                                    </div>
                                                )}
                                                {bookStart2 === null && (
                                                    <div style={{ fontSize: '0.8rem', color: '#ef4444', marginTop: '0.15rem' }}>Không còn khoảng trống phù hợp</div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Slot timeline */}
                                        <div style={{ marginBottom: '0.75rem' }}>
                                            <div style={{ position: 'relative', height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                                                {/* Booked segments */}
                                                {approvedInSlot.map((b, idx) => {
                                                    const bs = new Date(b.timeSlot).getTime();
                                                    const be = bs + b.duration * 3600000;
                                                    const is = Math.max(slotStartMs2, bs);
                                                    const ie = Math.min(slotEndMs2, be);
                                                    if (ie <= is) return null;
                                                    return <div key={idx} style={{ position: 'absolute', left: `${((is - slotStartMs2)/slotTotalMs2)*100}%`, width: `${((ie-is)/slotTotalMs2)*100}%`, height: '100%', background: '#ef4444', borderRadius: '2px' }} />;
                                                })}
                                                {/* Selected booking highlight */}
                                                {bookStart2 !== null && bookEnd2 !== null && (
                                                    <div style={{ position: 'absolute', left: `${((bookStart2 - slotStartMs2)/slotTotalMs2)*100}%`, width: `${((bookEnd2-bookStart2)/slotTotalMs2)*100}%`, height: '100%', background: 'rgba(99,102,241,0.7)', borderRadius: '2px', border: '1px solid #6366f1' }} />
                                                )}
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                                <span>{selectedSlot.slot.startTime}</span>
                                                <span>{selectedSlot.slot.endTime}</span>
                                            </div>
                                        </div>

                                        <div style={{ marginTop: '0.5rem' }}>
                                            <label className="form-label" style={{ fontSize: '0.75rem' }}>Thời lượng mượn phòng</label>
                                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                                                {(() => {
                                                    const buttons = [];
                                                    for (let mn = 30; mn < maxFreeMin; mn += 30) {
                                                        const hours = Math.floor(mn / 60);
                                                        const mins = mn % 60;
                                                        const label = hours > 0 ? `${hours} Giờ${mins > 0 ? ` ${mins} Phút` : ''}` : `${mins} Phút`;
                                                        buttons.push(
                                                            <button key={mn} onClick={() => setDurationOption(mn)}
                                                                className={`btn ${durationOption === mn ? 'btn-primary' : 'btn-outline'}`}
                                                                style={{ flex: '1 1 calc(33.333% - 0.5rem)', padding: '0.4rem', fontSize: '0.75rem' }}>
                                                                {label}
                                                            </button>
                                                        );
                                                    }
                                                    // Always add a final button for the exact maxFreeMin
                                                    const isFullSlot = maxFreeMin === getSlotTotalMinutes(selectedSlot.slot);
                                                    const finalOptVal = isFullSlot ? 0 : maxFreeMin;
                                                    const finalHours = Math.floor(maxFreeMin / 60);
                                                    const finalMins = maxFreeMin % 60;
                                                    const finalBaseLabel = finalHours > 0 ? `${finalHours} Giờ${finalMins > 0 ? ` ${finalMins} Phút` : ''}` : `${finalMins} Phút`;
                                                    const finalLabel = (maxFreeMs < (slotTotalMs2 - 60000))
                                                        ? `Còn lại (${finalBaseLabel})`
                                                        : `Cả Ca (${maxFreeMin} Phút)`;
                                                    buttons.push(
                                                        <button key={maxFreeMin} onClick={() => setDurationOption(finalOptVal)}
                                                            className={`btn ${durationOption === finalOptVal ? 'btn-primary' : 'btn-outline'}`}
                                                            style={{ flex: '1 1 calc(33.333% - 0.5rem)', padding: '0.4rem', fontSize: '0.75rem' }}>
                                                            {finalLabel}
                                                        </button>
                                                    );
                                                    return buttons;
                                                })()}
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '1rem' }}>
                                            <div style={{ background: 'rgba(99, 102, 241, 0.2)', padding: '6px', borderRadius: '50%', color: 'var(--color-primary)' }}>
                                                <MapPin size={18} />
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Địa điểm</div>
                                                <div style={{ fontSize: '0.95rem' }}>{selectedRoom?.roomName} ({selectedRoom?.roomCode})</div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}

                            <label className="modal-label-premium" style={{ display: 'block', marginBottom: '0.5rem' }}>Lý do mượn phòng</label>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <textarea
                                    className="form-textarea"
                                    value={reason}
                                    onChange={e => setReason(e.target.value)}
                                    rows={3}
                                    placeholder="Nhập yêu cầu cụ thể hoặc lý do..."
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
                                Hủy
                            </Button>
                            <Button variant="primary" onClick={handleConfirmBook} disabled={submitting}>
                                {submitting ? <><Loading /> Đang xử lý</> : 'Xác nhận Đặt phòng'}
                            </Button>
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
