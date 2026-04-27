import React, { useEffect, useState } from 'react'
import { bookingService } from '../../../services/booking.service'
import { Booking, BookingStatus } from '../../../types/api'
import { Alert } from '../../../components/Common/Alert'
import { Pagination } from '../../../components/Common/Pagination'
import { DataTable, Column } from '../../../components/Common/DataTable'
import { Check, X, ArrowRight, MapPin, Calendar, Clock, BookOpen } from 'lucide-react'
import { ConfirmModal } from '../../../components/Common/ConfirmModal'
import { parseChangeRequest, cleanDisplayReason, formatDate, formatDuration } from '../../../helpers/booking.helper'

export const BookingManagementPage: React.FC = () => {
    const [bookings, setBookings] = useState<Booking[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [total, setTotal] = useState(0)
    const [rejectId, setRejectId] = useState<string | null>(null)

    const loadBookings = async (page: number) => {
        setLoading(true)
        setError('')
        try {
            const result = await bookingService.getBookings(page, 10)
            setBookings(result.items)
            setTotal(result.total)
            setCurrentPage(page)
        } catch (err: any) {
            setError('Tải danh sách yêu cầu thất bại')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadBookings(currentPage)
    }, [currentPage])

    const handleStatusUpdate = async (id: string, newStatus: BookingStatus) => {
        try {
            await bookingService.updateStatus(id, newStatus)
            setSuccess('Cập nhật trạng thái thành công')
            loadBookings(currentPage)
        } catch (err: any) {
            setError('Cập nhật trạng thái thất bại')
        }
    }

    const handleRejectClick = (id: string, e: React.MouseEvent) => {
        e.stopPropagation()
        setRejectId(id)
    }

    const handleConfirmReject = async (reason: string) => {
        if (rejectId) {
            try {
                await bookingService.updateStatus(rejectId, BookingStatus.Rejected, reason)
                setSuccess('Đã từ chối yêu cầu')
                loadBookings(currentPage)
            } catch (err: any) {
                setError('Từ chối yêu cầu thất bại')
            } finally {
                setRejectId(null)
            }
        }
    }

    const getStatusInfo = (status: string) => {
        switch (status) {
            case BookingStatus.Pending: return { label: 'Chờ duyệt', color: 'var(--color-warning)', bg: 'rgba(245, 158, 11, 0.1)' }
            case BookingStatus.Approved: return { label: 'Đã duyệt', color: 'var(--color-success)', bg: 'rgba(16, 185, 129, 0.1)' }
            case BookingStatus.Rejected: return { label: 'Đã từ chối', color: 'var(--color-danger)', bg: 'rgba(239, 68, 68, 0.1)' }
            default: return { label: status, color: 'var(--text-muted)', bg: 'rgba(148, 163, 184, 0.1)' }
        }
    }

    const getSlotFromHour = (hour: number, type: string) => {
        if (type === 'ScheduleChange' || type === 'RoomChange') {
            if (hour === 7) return "1";
            if (hour === 10) return "2";
            if (hour === 12) return "3";
            if (hour === 15) return "4";
            if (hour === 18) return "5";
            if (hour === 20) return "6";
        }
        const slot = hour - 6;
        return slot > 0 ? slot.toString() : "1";
    };

    const columns: Column<Booking>[] = [
        {
            header: 'Phòng & Mục tiêu (TO)',
            accessor: (b: Booking) => {
                const change = parseChangeRequest(b);
                const isRoomChanged = change.isChangeRequest && change.originalRoomName &&
                    change.originalRoomName !== (b.room?.roomCode || b.room?.roomName);

                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {isRoomChanged ? (
                                <>
                                    <div style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '2px', opacity: 0.7, fontSize: '0.85rem' }}>
                                        <MapPin size={12} /> {change.originalRoomName}
                                    </div>
                                    <ArrowRight size={12} style={{ color: 'var(--text-muted)' }} />
                                    <div style={{ fontWeight: 700, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '2px' }}>
                                        <MapPin size={14} /> {b.room?.roomName || 'Không xác định'}
                                    </div>
                                </>
                            ) : (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <MapPin size={14} style={{ color: 'var(--color-primary)' }} />
                                    <span style={{ fontWeight: 700 }}>{b.room?.roomName || 'Không xác định'}</span>
                                </div>
                            )}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{b.room?.roomCode}</div>
                    </div>
                );
            }
        },
        { header: 'Người yêu cầu', accessor: (b: Booking) => b.requestedByAccount?.fullName || 'Không xác định' },
        {
            header: 'Thời gian Đổi (FROM -> TO)',
            accessor: (b: Booking) => {
                const change = parseChangeRequest(b);
                const newDate = formatDate(b.timeSlot);
                const isDateChanged = change.isChangeRequest && change.originalDate && change.originalDate !== newDate;

                const newSlot = change.newSlot || (change.type === 'RoomChange' ? change.originalSlot : null) || getSlotFromHour(new Date(b.timeSlot).getHours(), change.type);
                const isSlotChanged = change.isChangeRequest && change.originalSlot && change.originalSlot !== newSlot;

                const color = change.type === 'ScheduleChange' ? '#ec4899' : (change.type === 'RoomChange' ? '#8b5cf6' : 'var(--text-muted)');
                const bg = change.type === 'ScheduleChange' ? 'rgba(236, 72, 153, 0.1)' : (change.type === 'RoomChange' ? 'rgba(139, 92, 246, 0.1)' : 'rgba(148, 163, 184, 0.1)');

                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <span style={{
                            fontSize: '0.65rem',
                            fontWeight: 800,
                            color: color,
                            backgroundColor: bg,
                            padding: '1px 6px',
                            borderRadius: '4px',
                            width: 'fit-content',
                            textTransform: 'uppercase'
                        }}>
                            {change.type === 'ScheduleChange' ? 'Đổi lịch' : (change.type === 'RoomChange' ? 'Đổi phòng' : 'Mượn phòng')}
                        </span>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '0.85rem' }}>
                            {/* Date Comparison */}
                            {isDateChanged ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={{ color: 'var(--text-muted)', opacity: 0.7 }}>{change.originalDate}</span>
                                    <ArrowRight size={12} />
                                    <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{newDate}</span>
                                </div>
                            ) : (
                                <div style={{ color: 'var(--text-main)', fontWeight: 500 }}>{newDate}</div>
                            )}

                            {/* Slot/Time Comparison */}
                            {isSlotChanged ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem' }}>
                                        <span style={{ color: 'var(--text-muted)', opacity: 0.7 }}>Ca {change.originalSlot}</span>
                                        <ArrowRight size={12} />
                                        <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>Ca {newSlot}</span>
                                    </div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                                        ({formatDuration(b.duration)})
                                    </div>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                        {new Date(b.timeSlot).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                        {change.isChangeRequest && ` (Ca ${newSlot})`}
                                    </div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                        {formatDuration(b.duration)}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                );
            }
        },
        {
            header: 'Lý do & Lớp',
            accessor: (b: Booking) => {
                const change = parseChangeRequest(b);
                const isClass = change.isChangeRequest && (change.subject || b.reason?.includes('ScheduleId: '));

                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {isClass && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-primary)', fontWeight: 600, fontSize: '0.85rem' }}>
                                <BookOpen size={12} /> {change.subject && change.classCode ? `${change.subject} (${change.classCode})` : 'Lịch giảng dạy'}
                            </div>
                        )}
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={cleanDisplayReason(b.reason)}>
                            {cleanDisplayReason(b.reason)}
                        </div>
                        
                        {b.status === BookingStatus.Rejected && b.rejectReason && (
                            <div style={{ 
                                marginTop: '0.5rem',
                                padding: '0.5rem', 
                                background: '#fef2f2', 
                                borderLeft: '3px solid #ef4444',
                                borderRadius: '4px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '2px'
                            }}>
                                <div style={{ color: '#991b1b', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase' }}>
                                    Lý do từ chối:
                                </div>
                                <div style={{ color: '#b91c1c', fontSize: '0.8rem', fontWeight: 500, whiteSpace: 'normal', lineHeight: '1.4' }}>
                                    {b.rejectReason}
                                </div>
                            </div>
                        )}
                    </div>
                );
            }
        },
        {
            header: 'Trạng thái',
            accessor: (b: Booking) => {
                const info = getStatusInfo(b.status)
                return (
                    <span className="badge" style={{ backgroundColor: info.bg, color: info.color }}>
                        {info.label}
                    </span>
                )
            }
        },
        {
            header: 'Hành động',
            accessor: (b: Booking) => (
                <div style={{ display: 'flex', gap: '8px' }}>
                    {b.status === BookingStatus.Pending && (
                        <>
                            <button
                                className="btn btn-sm"
                                onClick={() => handleStatusUpdate(b.id, BookingStatus.Approved)}
                                style={{
                                    background: 'rgba(16, 185, 129, 0.1)',
                                    color: 'var(--color-success)',
                                    border: '1px solid rgba(16, 185, 129, 0.2)',
                                    padding: '0.4rem 0.8rem',
                                    gap: '0.25rem'
                                }}
                            >
                                <Check size={14} /> Duyệt
                            </button>
                            <button
                                className="btn btn-sm"
                                onClick={(e) => handleRejectClick(b.id, e)}
                                style={{
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    color: 'var(--color-danger)',
                                    border: '1px solid rgba(239, 68, 68, 0.2)',
                                    padding: '0.4rem 0.8rem',
                                    gap: '0.25rem'
                                }}
                            >
                                <X size={14} /> Từ chối
                            </button>
                        </>
                    )}
                </div>
            )
        }
    ]

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1>Quản lý Cấp phép sử dụng phòng</h1>
                    <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>Xem xét và quản lý các yêu cầu mượn/đổi/trả phòng</p>
                </div>
            </div>

            {error && <Alert type="error" message={error} onClose={() => setError('')} />}
            {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

            <div className="glass-panel" style={{ padding: '1.5rem', backgroundColor: 'var(--bg-main)', position: 'relative', zIndex: 1 }}>
                <DataTable
                    columns={columns}
                    data={bookings}
                    isLoading={loading}
                    emptyMessage="Không có yêu cầu nào."
                />

                {!loading && total > 0 && (
                    <div style={{ marginTop: '1.5rem' }}>
                        <Pagination
                            currentPage={currentPage}
                            totalPages={Math.ceil(total / 10)}
                            onPageChange={(p) => loadBookings(p)}
                            total={total}
                            pageSize={10}
                        />
                    </div>
                )}
            </div>

            <ConfirmModal
                isOpen={!!rejectId}
                title="Từ chối Yêu cầu"
                message="Bạn có chắc chắn muốn từ chối yêu cầu này không?"
                onConfirm={() => {}}
                onCancel={() => setRejectId(null)}
                isDanger
                confirmText="Từ chối"
                showInput
                onConfirmWithReason={handleConfirmReject}
            />
        </div>
    )
}
