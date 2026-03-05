import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { bookingService } from '../../../services/booking.service'
import { Booking, BookingStatus } from '../../../types/api'
import { Alert } from '../../../components/Common/Alert'
import { Loading } from '../../../components/Common/Loading'
import { Pagination } from '../../../components/Common/Pagination'
import { SearchBar } from '../../../components/Common/SearchBar'
import { CalendarDays, Clock, MapPin, AlertCircle, ArrowRight } from 'lucide-react'
import { parseChangeRequest, cleanDisplayReason } from '../../../helpers/booking.helper'

export const UserBookingsPage: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')

  const fetchBookings = async (pageIndex: number) => {
    setLoading(true)
    try {
      const data = await bookingService.getBookings(pageIndex, 10, search || undefined)
      setBookings(data.items)
      setTotalPages(Math.ceil(data.total / data.pageSize))
      setTotal(data.total)
      setPage(data.pageIndex)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Tải danh sách yêu cầu thất bại')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setPage(1)
  }, [search])

  useEffect(() => {
    fetchBookings(page)
  }, [page, search])

  const getStatusBadge = (status: string) => {
    let className = 'badge-secondary'
    let label = status
    if (status === BookingStatus.Approved) { className = 'badge-success'; label = 'Đã duyệt' }
    if (status === BookingStatus.Pending) { className = 'badge-warning'; label = 'Chờ duyệt' }
    if (status === BookingStatus.Rejected) { className = 'badge-danger'; label = 'Đã từ chối' }

    return <span className={`badge ${className}`}>{label}</span>
  }

  const getRequestType = (reason?: string) => {
    if (!reason) return { label: 'Đặt phòng', color: 'var(--text-muted)', bg: 'rgba(148, 163, 184, 0.1)' };
    if (reason.includes('[Room Change Request]')) return { label: 'Đổi phòng', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)' };
    if (reason.includes('[Schedule Change Request]')) return { label: 'Đổi lịch', color: '#ec4899', bg: 'rgba(236, 72, 153, 0.1)' };
    return { label: 'Đặt phòng', color: 'var(--text-muted)', bg: 'rgba(148, 163, 184, 0.1)' };
  }

  return (
    <div className="page-container">
      <div className="card-header" style={{ marginBottom: '2rem' }}>
        <h1>Yêu cầu Đặt phòng</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Theo dõi và quản lý các yêu cầu mượn phòng của bạn.</p>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div style={{ marginBottom: '1.5rem', maxWidth: '400px' }}>
          <SearchBar onSearch={setSearch} placeholder="Tìm kiếm yêu cầu..." />
        </div>

        {loading ? (
          <Loading />
        ) : (
          <>
            <div className="table-wrapper">
              <table className="glass-table">
                <thead>
                  <tr>
                    <th>Phòng</th>
                    <th>Ngày & Giờ</th>
                    <th>Thời lượng</th>
                    <th>Lý do</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: '4rem', textAlign: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', color: 'var(--text-muted)' }}>
                          <CalendarDays size={48} style={{ opacity: 0.5 }} />
                          <div>
                            <h3 style={{ color: 'var(--text-main)', marginBottom: '0.25rem' }}>Không có yêu cầu nào</h3>
                            <p>Bạn chưa thực hiện bất kỳ yêu cầu mượn phòng nào.</p>
                          </div>
                          <Link to="/rooms" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
                            Xem danh sách phòng
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    bookings.map((booking) => (
                      <tr key={booking.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                              <MapPin size={18} className="text-primary" />
                            </div>
                            <div>
                              {(() => {
                                const change = parseChangeRequest(booking);
                                if (!change.isChangeRequest) {
                                  return (
                                    <>
                                      {booking.room ? (
                                        <Link to={`/rooms/${booking.room.id}/calendar`} style={{ fontWeight: 600, display: 'block' }}>
                                          {booking.room.roomName}
                                        </Link>
                                      ) : <span style={{ fontStyle: 'italic' }}>Phòng không xác định</span>}
                                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{booking.room?.roomCode}</span>
                                    </>
                                  );
                                }

                                const isRoomChanged = change.isChangeRequest && change.originalRoomName &&
                                  change.originalRoomName !== (booking.room?.roomCode || booking.room?.roomName);

                                return (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <span style={{
                                        fontSize: '0.6rem',
                                        fontWeight: 800,
                                        padding: '1px 5px',
                                        borderRadius: '4px',
                                        backgroundColor: change.type === 'ScheduleChange' ? 'rgba(236, 72, 153, 0.1)' : 'rgba(139, 92, 246, 0.1)',
                                        color: change.type === 'ScheduleChange' ? '#ec4899' : '#8b5cf6',
                                        textTransform: 'uppercase'
                                      }}>
                                        {change.type === 'ScheduleChange' ? 'Đổi lịch' : 'Đổi phòng'}
                                      </span>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.8rem' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        {isRoomChanged ? (
                                          <>
                                            <div style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '2px', opacity: 0.7 }}>
                                              <MapPin size={10} /> {change.originalRoomName}
                                            </div>
                                            <ArrowRight size={10} style={{ color: 'var(--text-muted)' }} />
                                            <div style={{ fontWeight: 700, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '2px' }}>
                                              <MapPin size={10} /> {booking.room?.roomName}
                                            </div>
                                          </>
                                        ) : (
                                          <div style={{ fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <MapPin size={12} className="text-primary" /> {booking.room?.roomName}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          </div>
                        </td>
                        <td>
                          {(() => {
                            const change = parseChangeRequest(booking);
                            const newDate = new Date(booking.timeSlot).toLocaleDateString();

                            const isDateChanged = change.isChangeRequest && change.originalDate && change.originalDate !== newDate;

                            if (!isDateChanged) {
                              return (
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                  <span style={{ fontWeight: 500 }}>{newDate}</span>
                                  {!change.isChangeRequest && (
                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                      {new Date(booking.timeSlot).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  )}
                                </div>
                              );
                            }

                            return (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', opacity: 0.7 }}>
                                  <CalendarDays size={10} /> {change.originalDate}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-primary)', fontWeight: 600 }}>
                                  <ArrowRight size={10} /> {newDate}
                                </div>
                              </div>
                            );
                          })()}
                        </td>
                        <td>
                          {(() => {
                            const getSlotFromHour = (hour: number, type: string) => {
                              // If it's a schedule change, use academic slot mapping (1-6)
                              if (type === 'ScheduleChange') {
                                if (hour === 7) return "1";
                                if (hour === 10) return "2";
                                if (hour === 12) return "3";
                                if (hour === 15) return "4";
                                if (hour === 18) return "5";
                                if (hour === 20) return "6";
                              }

                              // Fallback or generic booking: use scheduler mapping (Hour - 6)
                              const slot = hour - 6;
                              return slot > 0 ? slot.toString() : "1";
                            };

                            const changeDetails = parseChangeRequest(booking);
                            const newSlot = getSlotFromHour(new Date(booking.timeSlot).getHours(), changeDetails.type);
                            const isSlotChanged = changeDetails.isChangeRequest && changeDetails.originalSlot && changeDetails.originalSlot !== newSlot;

                            if (!isSlotChanged) {
                              return (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <Clock size={16} className="text-muted" />
                                  {booking.duration} giờ {changeDetails.isChangeRequest && `(Ca ${newSlot})`}
                                </div>
                              );
                            }

                            return (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', opacity: 0.7 }}>
                                  <Clock size={10} /> Ca {changeDetails.originalSlot}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-primary)', fontWeight: 600 }}>
                                  <ArrowRight size={10} /> Ca {newSlot}
                                  <span style={{ fontSize: '0.7rem', fontWeight: 400 }}>({booking.duration}h)</span>
                                </div>
                              </div>
                            );
                          })()}
                        </td>
                        <td style={{ maxWidth: '300px' }}>
                          <div style={{
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            color: booking.reason ? 'var(--text-main)' : 'var(--text-muted)',
                            fontStyle: 'italic',
                            fontSize: '0.85rem'
                          }} title={cleanDisplayReason(booking.reason)}>
                            {cleanDisplayReason(booking.reason)}
                          </div>
                        </td>
                        <td>{getStatusBadge(booking.status)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {total > 0 && (
              <div style={{ marginTop: '1.5rem' }}>
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={fetchBookings}
                  total={total}
                  pageSize={10}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
