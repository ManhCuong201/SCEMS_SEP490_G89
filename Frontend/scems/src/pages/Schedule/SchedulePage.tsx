import React, { useState, useEffect } from 'react'
import {
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Upload,
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

export const SchedulePage: React.FC = () => {
    const { user } = useAuth()
    const [currentDate, setCurrentDate] = useState(new Date())
    const [schedules, setSchedules] = useState<ScheduleResponse[]>([])
    const [loading, setLoading] = useState(false)
    const [importing, setImporting] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
    const [classSearch, setClassSearch] = useState('')

    const startDate = startOfWeek(currentDate, { weekStartsOn: 1 })
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startDate, i))

    // Slots 0 to 12
    const slots = Array.from({ length: 13 }, (_, i) => i)

    useEffect(() => {
        if (user?.role !== 'Student' || classSearch) {
            fetchSchedule()
        }
    }, [currentDate, classSearch])

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

    return (
        <div className="page-container">
            <div className="page-header compact-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                    <h1 className="page-title">Class schedule</h1>
                    <p className="text-muted" style={{ fontSize: '0.85rem' }}>Manage and view your academic schedule</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    {user?.role === 'Student' && (
                        <div className="search-box" style={{ width: '250px' }}>
                            <div className="input-group input-group-sm">
                                <span className="input-group-text"><Search size={16} /></span>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Class Code (e.g. SE1701)"
                                    value={classSearch}
                                    onChange={(e) => setClassSearch(e.target.value)}
                                    style={{ padding: '0.4rem 0.75rem' }}
                                />
                            </div>
                        </div>
                    )}
                    {(user?.role === 'Lecturer' || user?.role === 'Admin') && (
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button
                                className="btn btn-secondary"
                                onClick={() => scheduleService.downloadTemplate()}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                            >
                                <Upload size={18} style={{ transform: 'rotate(180deg)' }} />
                                Download Template
                            </button>
                            <label className={`btn btn-primary ${importing ? 'disabled' : ''}`} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Upload size={18} />
                                {importing ? 'Importing...' : 'Import Schedule'}
                                <input
                                    type="file"
                                    accept=".xlsx, .xls"
                                    style={{ display: 'none' }}
                                    disabled={importing}
                                    onChange={async (e) => {
                                        const file = e.target.files?.[0]
                                        if (!file) return

                                        setImporting(true)
                                        setMessage(null)
                                        try {
                                            const resp = await scheduleService.importSchedule(file)
                                            setMessage({ type: 'success', text: resp.message })
                                            fetchSchedule()
                                        } catch (error: any) {
                                            setMessage({ type: 'error', text: error.response?.data?.message || 'Import failed' })
                                        } finally {
                                            setImporting(false)
                                            e.target.value = ''
                                        }
                                    }}
                                />
                            </label>
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
                        <div className="btn-group">
                            <button className="btn btn-secondary btn-sm" onClick={handlePrevWeek} style={{ padding: '2px 8px' }}><ChevronLeft size={14} /></button>
                            <button className="btn btn-secondary btn-sm" onClick={handleToday} style={{ padding: '2px 8px', fontSize: '0.75rem' }}>Today</button>
                            <button className="btn btn-secondary btn-sm" onClick={handleNextWeek} style={{ padding: '2px 8px' }}><ChevronRight size={14} /></button>
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
                                <th style={{ width: '60px', padding: '0.4rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Slot</th>
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
                                                    <div key={idx} className="compact-schedule-card" style={{
                                                        padding: '6px',
                                                        borderRadius: '4px',
                                                        marginBottom: '2px'
                                                    }}>
                                                        <div style={{ fontWeight: 700, fontSize: '0.75rem', marginBottom: '2px', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={s.subject}>
                                                            {s.subject}
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px', color: 'var(--text-muted)', fontSize: '0.65rem' }}>
                                                            <MapPin size={10} /> {s.roomName || 'TBA'}
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px', color: 'var(--text-muted)', fontSize: '0.65rem' }}>
                                                            <Clock size={10} /> {s.startTime} - {s.endTime}
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px', color: 'var(--text-muted)', fontSize: '0.65rem' }}>
                                                            <BookOpen size={10} /> {s.classCode}
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
        </div>
    )
}
