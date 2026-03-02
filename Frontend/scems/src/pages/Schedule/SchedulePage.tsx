import React, { useState, useEffect } from 'react'
import {
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Search,
    BookOpen,
    MapPin,
    Clock,
    User as UserIcon,
    Tag
} from 'lucide-react'
import { scheduleService } from '../../services/teachingSchedule.service'
import { ScheduleResponse } from '../../types/api'
import { useAuth } from '../../context/AuthContext'
import { format, startOfWeek, addDays, subWeeks, addWeeks, isSameDay, parseISO } from 'date-fns'
import '../../styles/compact-calendar.css'
import { createPortal } from 'react-dom'
import { bookingService } from '../../services/booking.service'
import { roomService } from '../../services/room.service'
import { CreateScheduleChangeRequest, Room } from '../../types/api'
import { X, Info } from 'lucide-react'

export const SchedulePage: React.FC = () => {
    const { user } = useAuth()
    const [currentDate, setCurrentDate] = useState(new Date())
    const [schedules, setSchedules] = useState<ScheduleResponse[]>([])
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
    const [classSearch, setClassSearch] = useState('')

    // Schedule Change Modal State
    const [changeModalOpen, setChangeModalOpen] = useState(false)
    const [selectedSchedule, setSelectedSchedule] = useState<ScheduleResponse | null>(null)
    const [rooms, setRooms] = useState<Room[]>([])
    const [newRoomId, setNewRoomId] = useState('')
    const [newDate, setNewDate] = useState(format(new Date(), 'yyyy-MM-dd'))
    const [slotType, setSlotType] = useState('New')
    const [newSlot, setNewSlot] = useState(1)
    const [changeReason, setChangeReason] = useState('')
    const [submitting, setSubmitting] = useState(false)

    const startDate = startOfWeek(currentDate, { weekStartsOn: 1 })
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startDate, i))

    // Slots 0 to 12
    const slots = Array.from({ length: 13 }, (_, i) => i)

    useEffect(() => {
        fetchSchedule()
        if (user?.role === 'Lecturer' || user?.role === 'Admin') {
            roomService.getRooms(1, 100).then(res => setRooms(res.items)).catch(console.error)
        }
    }, [currentDate, classSearch, user?.role])

    const fetchSchedule = async () => {
        setLoading(true)
        try {
            const end = addDays(startDate, 6)
            const data = await scheduleService.getMySchedule(
                format(startDate, 'yyyy-MM-dd'),
                format(end, 'yyyy-MM-dd'),
                user?.role === 'Student' ? classSearch : undefined
            )
            setSchedules(data)
        } catch (error) {
            console.error('Failed to fetch schedule', error)
        } finally {
            setLoading(false)
        }
    }

    const handlePrevWeek = () => setCurrentDate(subWeeks(currentDate, 1))
    const handleNextWeek = () => setCurrentDate(addWeeks(currentDate, 1))
    const handleToday = () => setCurrentDate(new Date())

    const getSchedulesForSlot = (day: Date, slot: number) => {
        return schedules.filter(s => {
            const sDate = parseISO(s.date)
            return isSameDay(sDate, day) && s.slot === slot
        })
    }

    const getSlotTimes = (type: string, slotNumber: number) => {
        if (type === 'Old') {
            const times = {
                1: '07:30 - 09:00',
                2: '09:10 - 10:40',
                3: '10:50 - 12:20',
                4: '12:50 - 14:20',
                5: '14:30 - 16:00',
                6: '16:10 - 17:40',
                7: '18:00 - 19:30',
                8: '19:45 - 21:15'
            };
            return times[slotNumber as keyof typeof times] || '';
        } else {
            const times = {
                1: '07:30 - 09:50',
                2: '10:00 - 12:20',
                3: '12:50 - 15:10',
                4: '15:20 - 17:40',
                5: '18:00 - 20:20',
                6: '20:00 - 22:20'
            };
            return times[slotNumber as keyof typeof times] || '';
        }
    }

    const handleScheduleClick = (schedule: ScheduleResponse) => {
        if (user?.role !== 'Lecturer') return;
        setSelectedSchedule(schedule);
        setNewRoomId(schedule.roomId);
        setNewDate(schedule.date.split('T')[0]);
        setSlotType('New');
        setNewSlot(1);
        setChangeReason('');
        setChangeModalOpen(true);
    }

    const handleConfirmScheduleChange = async () => {
        if (!selectedSchedule) return;
        setSubmitting(true);
        try {
            const request: CreateScheduleChangeRequest = {
                scheduleId: selectedSchedule.id,
                newRoomId,
                newDate,
                slotType,
                newSlot,
                reason: changeReason
            };
            await bookingService.createScheduleChangeRequest(request);
            setMessage({ type: 'success', text: 'Đã gửi yêu cầu đổi lịch học!' });
            setChangeModalOpen(false);
            fetchSchedule();
            setTimeout(() => setMessage(null), 3000);
        } catch (err: any) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Gửi yêu cầu đổi lịch học thất bại' });
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="page-container">
            <div className="page-header compact-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                    <h1 className="page-title">Lịch học</h1>
                    <p className="text-muted" style={{ fontSize: '0.85rem' }}>Quản lý và xem lịch học của bạn</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    {user?.role === 'Student' && (
                        <div className="search-box" style={{ width: '250px' }}>
                            <div className="input-group input-group-sm">
                                <span className="input-group-text"><Search size={16} /></span>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Mã lớp (VD: SE1701)"
                                    value={classSearch}
                                    onChange={(e) => setClassSearch(e.target.value)}
                                    style={{ padding: '0.4rem 0.75rem' }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {message && (
                <div className={`alert alert-${message.type}`} style={{ marginBottom: '1.5rem' }}>
                    {message.text}
                </div>
            )}

            <div className="glass-panel compact-glass-panel">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>
                            {format(startDate, 'MMMM yyyy')}
                        </h2>
                        <div className="btn-group" style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                            <button className="btn btn-secondary btn-sm" onClick={handlePrevWeek} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '28px', width: '32px', padding: 0 }}><ChevronLeft size={16} /></button>
                            <button className="btn btn-secondary btn-sm" onClick={handleToday} style={{ height: '28px', padding: '0 12px', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center' }}>Hôm nay</button>
                            <button className="btn btn-secondary btn-sm" onClick={handleNextWeek} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '28px', width: '32px', padding: 0 }}><ChevronRight size={16} /></button>
                        </div>
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                        {format(startDate, 'MMM dd')} - {format(addDays(startDate, 6), 'MMM dd, yyyy')}
                    </div>
                </div>

                <div className="schedule-grid-container" style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '2px' }} className="compact-grid">
                        <thead>
                            <tr>
                                <th style={{ width: '60px', padding: '0.4rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Ca học</th>
                                {weekDays.map(day => (
                                    <th key={day.toString()} style={{
                                        padding: '0.5rem',
                                        textAlign: 'center',
                                        minWidth: '130px',
                                        backgroundColor: isSameDay(day, new Date()) ? 'rgba(79, 70, 229, 0.1)' : 'transparent',
                                        borderRadius: 'var(--radius-sm)'
                                    }}>
                                        <div style={{ color: isSameDay(day, new Date()) ? 'var(--color-primary)' : 'var(--text-secondary)', fontSize: '0.65rem', textTransform: 'uppercase' }}>
                                            {format(day, 'EEE')}
                                        </div>
                                        <div style={{ fontSize: '1rem', fontWeight: 700 }}>
                                            {format(day, 'dd/MM')}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {slots.map(slot => (
                                <tr key={slot}>
                                    <td style={{
                                        textAlign: 'center',
                                        verticalAlign: 'middle',
                                        fontWeight: 600,
                                        color: 'var(--color-primary)',
                                        backgroundColor: 'rgba(255, 255, 255, 0.03)',
                                        borderRadius: 'var(--radius-sm)',
                                        height: '60px',
                                        fontSize: '0.85rem'
                                    }}>
                                        Slot {slot}
                                    </td>
                                    {weekDays.map(day => {
                                        const daySchedules = getSchedulesForSlot(day, slot)
                                        return (
                                            <td key={day.toString() + slot} style={{
                                                backgroundColor: 'rgba(255, 255, 255, 0.01)',
                                                borderRadius: 'var(--radius-sm)',
                                                padding: '2px',
                                                verticalAlign: 'top'
                                            }}>
                                                {daySchedules.map((s, idx) => (
                                                    <div
                                                        key={idx}
                                                        className={`compact-schedule-card ${user?.role === 'Lecturer' ? 'clickable-card' : ''}`}
                                                        onClick={() => handleScheduleClick(s)}
                                                        style={{
                                                            padding: '6px',
                                                            borderRadius: '4px',
                                                            marginBottom: '2px',
                                                            cursor: user?.role === 'Lecturer' ? 'pointer' : 'default',
                                                            border: user?.role === 'Lecturer' ? '1px solid transparent' : 'none',
                                                            transition: 'border-color 0.2s',
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            if (user?.role === 'Lecturer') e.currentTarget.style.borderColor = 'var(--color-primary-light)';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            if (user?.role === 'Lecturer') e.currentTarget.style.borderColor = 'transparent';
                                                        }}
                                                        title={user?.role === 'Lecturer' ? "Nhấn để yêu cầu đổi lịch học" : s.subject}
                                                    >
                                                        <div style={{ fontWeight: 700, fontSize: '0.75rem', marginBottom: '2px', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                            {s.subject}
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px', color: 'var(--text-muted)', fontSize: '0.65rem' }}>
                                                            <MapPin size={10} /> {s.roomName || 'Chưa có'}
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px', color: 'var(--text-muted)', fontSize: '0.65rem' }}>
                                                            <Clock size={10} /> {s.startTime} - {s.endTime}
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px', color: 'var(--text-muted)', fontSize: '0.65rem' }}>
                                                            <BookOpen size={10} /> {s.classCode}
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px', color: 'var(--text-muted)', fontSize: '0.65rem', marginTop: '1px' }}>
                                                            <UserIcon size={10} /> {s.lecturerName}
                                                        </div>
                                                    </div>
                                                ))}
                                            </td>
                                        )
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {changeModalOpen && selectedSchedule && createPortal(
                <div className="modal-overlay">
                    <div className="modal-panel-premium">
                        <div className="modal-header-premium">
                            <h3 style={{ fontSize: '1rem', margin: 0, fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <CalendarIcon size={18} /> Yêu cầu Đổi lịch học
                            </h3>
                            <button onClick={() => setChangeModalOpen(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', transition: 'color 0.2s' }}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="modal-room-card">
                            <div className="modal-info-row">
                                <MapPin size={14} style={{ color: '#0f172a' }} />
                                <span>Phòng ban đầu: <strong>{selectedSchedule.roomName}</strong></span>
                            </div>
                            <div className="modal-info-row">
                                <CalendarIcon size={14} style={{ color: '#0f172a' }} />
                                <span>Thời gian ban đầu: <strong>{new Date(selectedSchedule.date).toLocaleDateString()} ({selectedSchedule.startTime}-{selectedSchedule.endTime})</strong></span>
                            </div>
                            <div className="modal-info-row">
                                <Info size={14} style={{ color: '#0f172a' }} />
                                <span>Lớp: <strong>{selectedSchedule.subject} - {selectedSchedule.classCode}</strong></span>
                            </div>
                        </div>

                        <div className="modal-body-premium">
                            <div className="modal-input-group">
                                <label className="modal-label-premium">Phòng mới</label>
                                <select
                                    className="form-input"
                                    style={{ width: '100%', marginBottom: '1rem' }}
                                    value={newRoomId}
                                    onChange={e => setNewRoomId(e.target.value)}
                                >
                                    {rooms.map(r => <option key={r.id} value={r.id}>{r.roomName}</option>)}
                                </select>

                                <label className="modal-label-premium">Ngày mới</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    style={{ width: '100%', marginBottom: '1rem' }}
                                    value={newDate}
                                    onChange={e => setNewDate(e.target.value)}
                                />

                                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                                    <div style={{ flex: 1 }}>
                                        <label className="modal-label-premium">Loại Ca học</label>
                                        <select
                                            className="form-input"
                                            style={{ width: '100%' }}
                                            value={slotType}
                                            onChange={e => {
                                                setSlotType(e.target.value);
                                                setNewSlot(1);
                                            }}
                                        >
                                            <option value="New">Ca mới (10 tuần)</option>
                                            <option value="Old">Ca cũ (3 tuần)</option>
                                        </select>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label className="modal-label-premium">Ca học</label>
                                        <select
                                            className="form-input"
                                            style={{ width: '100%' }}
                                            value={newSlot}
                                            onChange={e => setNewSlot(Number(e.target.value))}
                                        >
                                            {Array.from({ length: slotType === 'New' ? 6 : 8 }, (_, i) => i + 1).map(n => (
                                                <option key={n} value={n}>Ca {n}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(59, 130, 246, 0.2)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Clock size={16} className="text-primary" />
                                    <span style={{ fontSize: '0.9rem' }}>
                                        Thời gian đã chọn: <strong>{getSlotTimes(slotType, newSlot)}</strong>
                                    </span>
                                </div>

                                <label className="modal-label-premium">Lý do Đổi lịch</label>
                                <textarea
                                    className="modal-textarea-premium"
                                    value={changeReason}
                                    onChange={(e) => setChangeReason(e.target.value)}
                                    placeholder="Giải thích ngắn gọn lý do cần đổi lịch học này..."
                                    rows={3}
                                />
                            </div>
                        </div>

                        <div className="modal-footer-premium">
                            <button className="btn-modal btn-modal-cancel" onClick={() => setChangeModalOpen(false)}>
                                Hủy
                            </button>
                            <button
                                className="btn-modal btn-modal-primary"
                                onClick={handleConfirmScheduleChange}
                                disabled={submitting || !changeReason}
                            >
                                {submitting ? 'Đang xử lý...' : 'Gửi Yêu cầu'}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    )
}
