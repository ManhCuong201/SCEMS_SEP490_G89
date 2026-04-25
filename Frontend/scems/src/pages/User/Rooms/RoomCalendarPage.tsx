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
    const [slotSystem, setSlotSystem] = useState<'New' | 'Old'>('New')
    const [selectedSlot, setSelectedSlot] = useState<{ date: Date, slot: Slot } | null>(null)
    const [durationOption, setDurationOption] = useState<number>(0) // 0 means full slot
    const [reason, setReason] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [successMsg, setSuccessMsg] = useState('')
    const [bookingSettings, setBookingSettings] = useState<BookingSettings | null>(null)
    const [hoveredTooltip, setHoveredTooltip] = useState<PortalTooltipProps | null>(null);

    const currentUser = authService.getUser()

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
        } catch (err: unknown) {
            const error = err as any; // Temporary cast to access properties while maintaining catch type
            setError(error.response?.data?.message || 'Tải dữ liệu thất bại')
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

    const handleBookClick = (date: Date, slot: Slot) => {
        const [h, m] = slot.startTime.split(':').map(Number)
        const slotDate = new Date(date)
        slotDate.setHours(h, m, 0, 0)

        const [eh, em] = slot.endTime.split(':').map(Number)
        const slotEnd = new Date(date)
        slotEnd.setHours(eh, em, 0, 0)

        if (new Date() > slotEnd) {
            return
        }

        setSelectedSlot({ date: slotDate, slot })
        setModalOpen(true)
        setReason('')
        setDurationOption(0)
    }

    const handleConfirmBook = async () => {
        if (!selectedSlot || !id || !bookingSettings) return
        setSubmitting(true)
        try {
            let slotDate = new Date(selectedSlot.date.getTime());
            const now = new Date()
            if (slotDate < now && slotDate.getDate() === now.getDate() && slotDate.getMonth() === now.getMonth() && slotDate.getFullYear() === now.getFullYear()) {
                slotDate = now;
            }

            let duration = getSlotTotalMinutes(selectedSlot.slot) / 60;
            if (durationOption > 0) duration = durationOption / 60;

            const slotEndTime = new Date(slotDate.getTime() + duration * 3600000)
            if (slotEndTime < now) {
                setError('Không thể đặt phòng vào thời gian đã qua.')
                setSubmitting(false)
                return
            }

            const outY = slotDate.getFullYear()
            const outM = slotDate.getMonth() + 1
            const outD = slotDate.getDate()
            const outH = slotDate.getHours()
            const outMin = slotDate.getMinutes()
            const pad = (n: number) => n.toString().padStart(2, '0')
            const isoLocal = `${outY}-${pad(outM)}-${pad(outD)}T${pad(outH)}:${pad(outMin)}:00`

            await bookingService.createBooking({
                roomId: id,
                timeSlot: isoLocal,
                duration: duration,
                reason: reason
            })

            setSuccessMsg('Đã gửi yêu cầu mượn phòng!')
            setModalOpen(false)
            loadData()
            setTimeout(() => setSuccessMsg(''), 3000)
        } catch (err: unknown) {
            const error = err as any;
            setError(error.response?.data?.message || 'Gửi yêu cầu thất bại')
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

        const currentSlots = slotSystem === 'New' ? NEW_SLOTS : OLD_SLOTS;

        return (
            <div className="table-wrapper">
                <table className="glass-table calendar-table compact-grid">
                    <thead>
                        <tr>
                            <th className="calendar-time-col">Ca / Ngày</th>
                            {days.map(d => (
                                <th key={d.toISOString()} style={{ textAlign: 'center', minWidth: '120px' }}>
                                    <div style={{ fontWeight: 600 }}>{d.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                                    <div style={{ fontSize: '0.8em', color: 'var(--text-muted)' }}>{d.getDate()}/{d.getMonth() + 1}</div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {currentSlots.map(slot => (
                            <tr key={slot.number}>
                                <td className="calendar-time-col" style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                                    Ca {slot.number}<br/>
                                    <span style={{ fontSize: '0.6rem', fontWeight: 400 }}>{slot.startTime} - {slot.endTime}</span>
                                </td>
                                {days.map(d => {
                                    const slotStart = new Date(d);
                                    const [sh, sm] = slot.startTime.split(':').map(Number);
                                    slotStart.setHours(sh, sm, 0, 0);

                                    const slotEnd = new Date(d);
                                    const [eh, em] = slot.endTime.split(':').map(Number);
                                    slotEnd.setHours(eh, em, 0, 0);

                                    const slotStartMs = slotStart.getTime();
                                    const slotEndMs = slotEnd.getTime();
                                    const slotTotalMs = slotEndMs - slotStartMs;

                                    const slotBookings = bookings.filter(b => {
                                        const bStart = new Date(b.timeSlot).getTime();
                                        const bEnd = b.endTime ? new Date(b.endTime).getTime() : bStart + (b.duration * 60 * 60 * 1000);
                                        return bStart < slotEndMs && bEnd > slotStartMs;
                                    });

                                    const approved = slotBookings.filter(b => {
                                        const s = String(b.status || '').toLowerCase();
                                        return s === 'approved' || s === 'active';
                                    });

                                    const teachingSchedule = approved.find(b => b.requestedBy === '00000000-0000-0000-0000-000000000000');
                                    
                                    // Calculate occupied time
                                    let occupiedMs = 0;
                                    approved.forEach(b => {
                                        const bStart = new Date(b.timeSlot).getTime();
                                        const bEnd = b.endTime ? new Date(b.endTime).getTime() : bStart + (b.duration * 60 * 60 * 1000);
                                        const intersectStart = Math.max(slotStartMs, bStart);
                                        const intersectEnd = Math.min(slotEndMs, bEnd);
                                        if (intersectEnd > intersectStart) {
                                            occupiedMs += (intersectEnd - intersectStart);
                                        }
                                    });

                                    const isFullyBooked = occupiedMs >= (slotTotalMs - 5 * 60 * 1000); // 5 min buffer

                                    const pending = slotBookings.filter(b => String(b.status || '').toLowerCase() === 'pending');
                                    const pendingCount = pending.length;
                                    const hasUserRequested = pending.some(b => b.requestedBy === currentUser?.id);

                                    const now = new Date();
                                    const isPast = now > slotEnd;

                                    let cellContent;

                                    if (teachingSchedule) {
                                        const userName = currentUser?.fullName?.trim().toLowerCase();
                                        const requestedName = teachingSchedule.requestedByName?.trim().toLowerCase();
                                        const isMyClass = requestedName === userName && !!userName;

                                        cellContent = (
                                            <div
                                                className={isMyClass ? "slot-my-class" : "slot-booked"}
                                                onMouseEnter={(e) => {
                                                    setHoveredTooltip({
                                                        title: 'Lịch học',
                                                        icon: <CalendarIcon size={12} />,
                                                        lines: [
                                                            { label: 'Môn học', value: teachingSchedule.reason?.split(': ')[1]?.split(' (')[0] || 'N/A' },
                                                            { label: 'Lớp', value: teachingSchedule.reason?.split('(')[1]?.split(')')[0] || 'N/A' },
                                                            { label: 'Giảng viên', value: teachingSchedule.requestedByName || 'N/A' },
                                                            { label: 'Thời gian', value: `${formatLocalTime(teachingSchedule.timeSlot)} - ${formatLocalTime(teachingSchedule.endTime || new Date())}` }
                                                        ],
                                                        targetRect: e.currentTarget.getBoundingClientRect()
                                                    });
                                                }}
                                                onMouseLeave={() => setHoveredTooltip(null)}
                                            >
                                                <div style={{ fontWeight: 700, fontSize: '0.6rem', textTransform: 'uppercase' }}>
                                                    {isMyClass ? "LỚP CỦA TÔI" : "LỊCH HỌC"}
                                                </div>
                                            </div>
                                        );
                                    } else if (isFullyBooked) {
                                        const mainApproved = approved[0];
                                        const isMyBooking = mainApproved?.requestedBy === currentUser?.id;
                                        
                                        cellContent = (
                                            <div
                                                className={isMyBooking ? "slot-my-booking" : "slot-booked"}
                                                onMouseEnter={(e) => {
                                                    if (!mainApproved) return;
                                                    setHoveredTooltip({
                                                        title: 'Đã đặt',
                                                        icon: <Clock size={12} />,
                                                        lines: [
                                                            { label: 'Bởi', value: getTeacherId(mainApproved.requestedByName || '', mainApproved.requestedByAccount?.email) },
                                                            { label: 'Lý do', value: mainApproved.reason || 'Không có lý do' },
                                                            { label: 'Thời gian', value: `${formatLocalTime(mainApproved.timeSlot)} - ${formatLocalTime(mainApproved.endTime || new Date())}` }
                                                        ],
                                                        targetRect: e.currentTarget.getBoundingClientRect()
                                                    });
                                                }}
                                                onMouseLeave={() => setHoveredTooltip(null)}
                                            >
                                                <div style={{ fontWeight: 700, fontSize: '0.6rem', textTransform: 'uppercase' }}>
                                                    {isMyBooking ? "YÊU CẦU CỦA TÔI" : "ĐÃ ĐẶT"}
                                                </div>
                                            </div>
                                        );
                                    } else if (!isPast && !hasUserRequested) {
                                        const isPartiallyBooked = approved.length > 0;
                                        cellContent = (
                                            <div className="slot-available" style={{ position: 'relative', width: '100%', height: '100%' }}>
                                                <button
                                                    className="btn-book-slot"
                                                    onClick={() => handleBookClick(d, slot)}
                                                    onMouseEnter={(e) => {
                                                        const lines: any[] = [];
                                                        if (isPartiallyBooked) {
                                                            approved.forEach(b => {
                                                                const bStart = new Date(b.timeSlot).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'});
                                                                const bEnd = new Date(new Date(b.timeSlot).getTime() + b.duration * 3600000).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'});
                                                                lines.push({ label: 'Đã đặt', value: `${bStart} - ${bEnd} bởi ${getTeacherId(b.requestedByName || '', b.requestedByAccount?.email)}` });
                                                            });
                                                        }
                                                        lines.push({ label: 'Chờ duyệt', value: pendingCount });
                                                        lines.push({ label: 'Hành động', value: 'Nhấn để đặt' });
                                                        
                                                        setHoveredTooltip({
                                                            title: isPartiallyBooked ? 'Khả dụng (Một phần)' : 'Khả dụng',
                                                            icon: <Users size={12} />,
                                                            lines: lines,
                                                            targetRect: e.currentTarget.getBoundingClientRect()
                                                        });
                                                    }}
                                                    onMouseLeave={() => setHoveredTooltip(null)}
                                                >
                                                    Còn trống
                                                    {pendingCount > 0 && (
                                                        <span className="req-badge">
                                                            {pendingCount}
                                                        </span>
                                                    )}
                                                </button>
                                                
                                                {/* Visual Timeline for Partial Bookings */}
                                                {isPartiallyBooked && (
                                                    <div className="slot-timeline" style={{ position: 'absolute', bottom: 2, left: '5%', width: '90%', height: '3px', background: '#e2e8f0', borderRadius: '1.5px', overflow: 'hidden', pointerEvents: 'none' }}>
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
                                            </div>
                                        );
                                    } else if (hasUserRequested) {
                                        cellContent = (
                                            <div className="slot-pending">
                                                <div style={{ fontWeight: 700, fontSize: '0.6rem', color: '#f59e0b' }}>CHỜ DUYỆT</div>
                                                <div style={{ fontSize: '0.55rem', opacity: 0.8 }}>Đã gửi yêu cầu</div>
                                            </div>
                                        );
                                    } else if (pendingCount > 0 && !isPast) {
                                         cellContent = (
                                            <div className="slot-available">
                                                <button
                                                    className="btn-book-slot"
                                                    onClick={() => handleBookClick(d, slot)}
                                                    style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', borderColor: 'rgba(245, 158, 11, 0.2)' }}
                                                >
                                                    {pendingCount} Yêu cầu
                                                </button>
                                            </div>
                                        );
                                    } else if (isPast) {
                                        cellContent = <div className="slot-past" />
                                    }

                                    return <td key={d.toISOString() + slot.number} style={{ padding: '0', height: '40px', verticalAlign: 'middle' }}>{cellContent}</td>
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
                        <h1 style={{ fontSize: '1.25rem', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{room?.roomName || 'Phòng'}</h1>
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

                {/* Middle: Slot System Toggle */}
                <div style={{ display: 'flex', background: 'var(--bg-secondary)', padding: '4px', borderRadius: 'var(--radius-md)', gap: '4px' }}>
                    <button 
                        className={`btn ${slotSystem === 'New' ? 'btn-primary' : 'btn-ghost'}`}
                        onClick={() => setSlotSystem('New')}
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', height: 'auto' }}
                    >
                        Ca Mới
                    </button>
                    <button 
                        className={`btn ${slotSystem === 'Old' ? 'btn-primary' : 'btn-ghost'}`}
                        onClick={() => setSlotSystem('Old')}
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', height: 'auto' }}
                    >
                        Ca Cũ
                    </button>
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
                                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>Xác nhận Đặt phòng</h3>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{room?.roomName} ({room?.roomCode})</p>
                            </div>
                            <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}>
                                <X size={20} />
                            </button>
                        </div>


                        <div style={{ padding: '1.5rem' }}>
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
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Khung giờ</div>
                                        <div style={{ fontSize: '1rem', fontWeight: 600 }}>
                                            {selectedSlot.date.toLocaleDateString('vi-VN', { weekday: 'short', month: 'short', day: 'numeric' })}
                                            <span style={{ margin: '0 0.5rem', opacity: 0.3 }}>|</span>
                                            <span style={{ color: 'var(--color-primary)' }}>
                                                Ca {selectedSlot.slot.number} ({selectedSlot.slot.startTime} - {selectedSlot.slot.endTime})
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ marginTop: '1rem' }}>
                                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Thời lượng mượn phòng</label>
                                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                                        {(() => {
                                            const totalMins = getSlotTotalMinutes(selectedSlot.slot);
                                            const buttons = [];
                                            // Generate 30m increments up to the total slot duration
                                            for (let m = 30; m < totalMins; m += 30) {
                                                const hours = Math.floor(m / 60);
                                                const mins = m % 60;
                                                const label = hours > 0 ? `${hours} Giờ${mins > 0 ? ` ${mins} Phút` : ''}` : `${mins} Phút`;
                                                buttons.push(
                                                    <button 
                                                        key={m}
                                                        onClick={() => setDurationOption(m)}
                                                        className={`btn ${durationOption === m ? 'btn-primary' : 'btn-outline'}`}
                                                        style={{ flex: '1 1 calc(33.333% - 0.5rem)', padding: '0.4rem', fontSize: '0.75rem' }}
                                                    >
                                                        {label}
                                                    </button>
                                                );
                                            }
                                            // Always add "Cả Ca" at the end
                                            buttons.push(
                                                <button 
                                                    key={0}
                                                    onClick={() => setDurationOption(0)}
                                                    className={`btn ${durationOption === 0 ? 'btn-primary' : 'btn-outline'}`}
                                                    style={{ flex: '1 1 calc(33.333% - 0.5rem)', padding: '0.4rem', fontSize: '0.75rem' }}
                                                >
                                                    Cả Ca ({totalMins} Phút)
                                                </button>
                                            );
                                            return buttons;
                                        })()}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '1.25rem' }}>
                                    <div style={{ background: 'rgba(99, 102, 241, 0.2)', padding: '6px', borderRadius: '50%', color: 'var(--color-primary)' }}>
                                        <MapPin size={18} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Địa điểm</div>
                                        <div style={{ fontSize: '0.95rem' }}>{room?.roomName} ({room?.roomCode})</div>
                                    </div>
                                </div>
                            </div>

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
                </div>, document.body
            )}
        </div>
    )
}
