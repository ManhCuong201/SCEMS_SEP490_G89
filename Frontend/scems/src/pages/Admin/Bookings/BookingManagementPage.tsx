import React, { useEffect, useState } from 'react'
import { bookingService } from '../../../services/booking.service'
import { Booking, BookingStatus } from '../../../types/api'
import { Alert } from '../../../components/Common/Alert'
import { Pagination } from '../../../components/Common/Pagination'
import { DataTable, Column } from '../../../components/Common/DataTable'
import { Check, X } from 'lucide-react'
import { ConfirmModal } from '../../../components/Common/ConfirmModal'

export const BookingManagementPage: React.FC = () => {
    const [bookings, setBookings] = useState<Booking[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [total, setTotal] = useState(0)
    const [rejectId, setRejectId] = useState<string | null>(null)

    const loadBookings = async () => {
        setLoading(true)
        setError('')
        try {
            const result = await bookingService.getBookings(currentPage, 10)
            setBookings(result.items)
            setTotal(result.total)
        } catch (err: any) {
            setError('Tải danh sách yêu cầu thất bại')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadBookings()
    }, [currentPage])

    const handleStatusUpdate = async (id: string, newStatus: BookingStatus) => {
        try {
            await bookingService.updateStatus(id, newStatus)
            setSuccess('Cập nhật trạng thái thành công')
            loadBookings()
        } catch (err: any) {
            setError('Cập nhật trạng thái thất bại')
        }
    }

    const handleRejectClick = (id: string, e: React.MouseEvent) => {
        e.stopPropagation() // Prevent row click if needed
        setRejectId(id)
    }

    const handleConfirmReject = async () => {
        if (rejectId) {
            try {
                await bookingService.updateStatus(rejectId, BookingStatus.Rejected)
                setSuccess('Đã từ chối yêu cầu')
                loadBookings()
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

    const columns: Column<Booking>[] = [
        { header: 'Phòng', accessor: (b) => b.room?.roomName || 'Không xác định' },
        { header: 'Người yêu cầu', accessor: (b) => b.requestedByAccount?.fullName || 'Không xác định' },
        { header: 'Khung giờ', accessor: (b) => new Date(b.timeSlot).toLocaleString() },
        { header: 'Thời lượng', accessor: (b) => `${b.duration}h`, width: '100px' },
        { header: 'Lý do', accessor: (b) => b.reason || '-' },
        {
            header: 'Trạng thái',
            accessor: (b) => {
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
            accessor: (b) => (
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

            <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <DataTable
                    columns={columns}
                    data={bookings}
                    isLoading={loading}
                    emptyMessage="Không có yêu cầu nào."
                />

                {!loading && total > 0 && (
                    <Pagination
                        currentPage={currentPage}
                        totalPages={Math.ceil(total / 10)}
                        onPageChange={setCurrentPage}
                        total={total}
                        pageSize={10}
                    />
                )}
            </div>

            <ConfirmModal
                isOpen={!!rejectId}
                title="Từ chối Yêu cầu"
                message="Bạn có chắc chắn muốn từ chối yêu cầu này không?"
                onConfirm={handleConfirmReject}
                onCancel={() => setRejectId(null)}
                isDanger
                confirmText="Từ chối"
            />
        </div>
    )
}
