import React, { useEffect, useState } from 'react';
import { scheduleService } from '../../../services/teachingSchedule.service';
import { ScheduleResponse } from '../../../types/api';
import { Loading } from '../../../components/Common/Loading';
import { Alert } from '../../../components/Common/Alert';
import { Calendar as CalendarIcon, ArrowLeft, ArrowRight, Download, Users } from 'lucide-react';
import '../../../styles/scheduler.css';

export const AdminSchedulesPage: React.FC = () => {
    const [schedules, setSchedules] = useState<ScheduleResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentDate, setCurrentDate] = useState(new Date());

    const getWeekRange = (date: Date) => {
        const start = new Date(date);
        const day = start.getDay();
        const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
        start.setDate(diff);
        start.setHours(0, 0, 0, 0);

        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);

        return { start, end };
    };

    const { start: weekStart, end: weekEnd } = getWeekRange(currentDate);

    useEffect(() => {
        loadSchedules();
    }, [currentDate]);

    const getLocalISOString = (date: Date) => {
        const offset = date.getTimezoneOffset() * 60000; // offset in milliseconds
        const localDate = new Date(date.getTime() - offset);
        return localDate.toISOString().split('T')[0];
    };

    const loadSchedules = async () => {
        try {
            setLoading(true);
            const startStr = getLocalISOString(weekStart);
            const endStr = getLocalISOString(weekEnd);
            const data = await scheduleService.getAllSchedules(startStr, endStr);
            setSchedules(data);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load schedules');
        } finally {
            setLoading(false);
        }
    };

    const handlePreviousWeek = () => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() - 7);
        setCurrentDate(newDate);
    };

    const handleNextWeek = () => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + 7);
        setCurrentDate(newDate);
    };

    const handleToday = () => {
        setCurrentDate(new Date());
    }

    const handleDownloadTemplate = async () => {
        try {
            await scheduleService.downloadTemplate();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to download template');
        }
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            try {
                setLoading(true);
                await scheduleService.importSchedule(e.target.files[0]);
                await loadSchedules(); // Reload data
                alert('Schedule imported successfully');
            } catch (err: any) {
                setError(err.response?.data?.message || 'Failed to import schedule');
            } finally {
                setLoading(false);
                e.target.value = ''; // Reset input
            }
        }
    };

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const slots = Array.from({ length: 12 }, (_, i) => i + 1);

    const getScheduleForCell = (dayIndex: number, slot: number) => {
        // Calculate date for this column
        const cellDate = new Date(weekStart);
        cellDate.setDate(weekStart.getDate() + dayIndex);
        const dateStr = getLocalISOString(cellDate);

        return schedules.find(s => {
            const sDate = s.date.split('T')[0];
            return sDate === dateStr && s.slot === slot;
        });
    };

    // ... existing ...

    return (
        <div className="page-container" style={{ maxWidth: '100%', overflowX: 'auto' }}>
            <div className="page-header" style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1>Master Schedule</h1>
                    <p className="subtitle">View all classes and schedules</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-outline btn-sm" onClick={handleDownloadTemplate} title="Download Template">
                            <Download size={18} style={{ marginRight: '0.5rem' }} /> Template
                        </button>
                        <div style={{ position: 'relative', overflow: 'hidden' }}>
                            <button className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <CalendarIcon size={18} /> Import Schema
                            </button>
                            <input
                                type="file"
                                onChange={handleImport}
                                accept=".xlsx,.xls"
                                style={{ position: 'absolute', top: 0, left: 0, opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }}
                            />
                        </div>
                    </div>
                    <div className="week-navigation" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'white', padding: '0.5rem', borderRadius: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                        <button className="btn-icon" onClick={handlePreviousWeek}><ArrowLeft size={18} /></button>
                        <span style={{ fontWeight: 600, minWidth: '200px', textAlign: 'center' }}>
                            {weekStart.toLocaleDateString()} - {weekEnd.toLocaleDateString()}
                        </span>
                        <button className="btn-icon" onClick={handleNextWeek}><ArrowRight size={18} /></button>
                        <button className="btn btn-sm btn-outline" onClick={handleToday} style={{ marginLeft: '0.5rem' }}>Today</button>
                    </div>
                </div>
            </div>

            {error && <Alert type="error" message={error} onClose={() => setError('')} />}

            {loading ? (
                <Loading />
            ) : (
                <div className="schedule-grid-container" style={{ overflowX: 'auto', background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                    <table className="schedule-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr>
                                <th style={{ padding: '1rem', borderBottom: '2px solid #e2e8f0', background: '#f8fafc', color: '#64748b' }}>Slot</th>
                                {days.map((day, index) => {
                                    const date = new Date(weekStart);
                                    date.setDate(weekStart.getDate() + index);
                                    const isToday = new Date().toDateString() === date.toDateString();

                                    return (
                                        <th key={day} style={{
                                            padding: '1rem',
                                            borderBottom: '2px solid #e2e8f0',
                                            background: isToday ? '#eff6ff' : '#f8fafc',
                                            color: isToday ? '#2563eb' : '#64748b',
                                            minWidth: '140px'
                                        }}>
                                            <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{day}</div>
                                            <div style={{ fontSize: '0.8rem', fontWeight: 400 }}>{date.getDate()}/{date.getMonth() + 1}</div>
                                        </th>
                                    );
                                })}
                            </tr>
                        </thead>
                        <tbody>
                            {slots.map(slot => (
                                <tr key={slot}>
                                    <td style={{
                                        padding: '1rem',
                                        borderBottom: '1px solid #e2e8f0',
                                        borderRight: '1px solid #e2e8f0',
                                        background: '#f8fafc',
                                        fontWeight: 600,
                                        textAlign: 'center',
                                        color: '#475569'
                                    }}>
                                        {slot}
                                    </td>
                                    {days.map((_, dayIndex) => {
                                        const schedule = getScheduleForCell(dayIndex, slot);
                                        return (
                                            <td key={dayIndex} style={{
                                                borderBottom: '1px solid #e2e8f0',
                                                borderRight: '1px solid #e2e8f0',
                                                height: '80px', // Min height for consistency
                                                verticalAlign: 'top',
                                                padding: '0.25rem'
                                            }}>
                                                {schedule && (
                                                    <div style={{
                                                        background: '#f0f9ff',
                                                        borderLeft: '3px solid #0ea5e9',
                                                        padding: '0.5rem',
                                                        borderRadius: '4px',
                                                        height: '100%',
                                                        fontSize: '0.85rem'
                                                    }}>
                                                        <div style={{ fontWeight: 700, color: '#0369a1' }}>{schedule.subject}</div>
                                                        <div style={{ fontSize: '0.75rem', color: '#0c4a6e' }}>{schedule.classCode}</div>
                                                        <div style={{ fontSize: '0.75rem', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px', color: '#64748b' }}>
                                                            <Users size={12} /> {schedule.roomName}
                                                        </div>
                                                    </div>
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};
