import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { bookingService } from '../../../services/booking.service'
import { roomService } from '../../../services/room.service'
import { configService, BookingSettings } from '../../../services/config.service'
import { authService } from '../../../services/auth.service'
import { Booking, Room, BookingStatus } from '../../../types/api'
import { Alert } from '../../../components/Common/Alert'
import { Loading } from '../../../components/Common/Loading'
import { Button } from '../../../components/Common/Button'
import '../../../styles/calendar.css'

export const RoomCalendarPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [room, setRoom] = useState<Room | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<{ date: Date, hour: number } | null>(null)
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [bookingSettings, setBookingSettings] = useState<BookingSettings | null>(null)

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
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load data')
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

  const handleBookClick = (date: Date, hour: number) => {
    const slotDate = new Date(date)
    slotDate.setHours(hour, 0, 0, 0)
    
    if (new Date() > slotDate) {
        return
    }

    setSelectedSlot({ date: slotDate, hour })
    setModalOpen(true)
    setReason('')
  }

  const handleConfirmBook = async () => {
    if (!selectedSlot || !id || !bookingSettings) return
    setSubmitting(true)
    try {
        const offset = selectedSlot.date.getTimezoneOffset()
        const localDate = new Date(selectedSlot.date.getTime() - (offset * 60 * 1000))
        const isoLocal = localDate.toISOString().slice(0, 19)
        
        await bookingService.createBooking({
            roomId: id,
            timeSlot: isoLocal,
            duration: bookingSettings.slotDurationMinutes / 60,
            reason: reason
        })
        
        setSuccessMsg('Booking request sent successfully!')
        setModalOpen(false)
        loadData()
    } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to book slot')
    } finally {
        setSubmitting(false)
    }
  }

  const renderCalendar = () => {
      if (!room || !bookingSettings) return null
      const { start } = getWeekRange(currentDate)
      const days: Date[] = []
      for (let i = 0; i < 7; i++) {
          const d = new Date(start)
          d.setDate(d.getDate() + i)
          days.push(d)
      }

      const startHour = bookingSettings.startHour
      const endHour = bookingSettings.endHour
      // Ensure we don't loop infinitely if config is weird
      const hoursCount = Math.max(0, endHour - startHour)
      const hours = Array.from({ length: hoursCount }, (_, i) => i + startHour)

      return (
          <div className="calendar-grid">
              <table className="calendar-table">
                  <thead>
                      <tr>
                          <th className="calendar-time-col">Time</th>
                          {days.map(d => (
                              <th key={d.toISOString()}>
                                  {d.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' })}
                              </th>
                          ))}
                      </tr>
                  </thead>
                  <tbody>
                      {hours.map(h => (
                          <tr key={h}>
                              <td className="calendar-time-col">{h}:00 - {h+1}:00</td>
                              {days.map(d => {
                                  const slotBookings = bookings.filter(b => {
                                      const bDate = new Date(b.timeSlot)
                                      return bDate.getDate() === d.getDate() &&
                                             bDate.getMonth() === d.getMonth() &&
                                             bDate.getFullYear() === d.getFullYear() &&
                                             bDate.getHours() === h
                                  })

                                  const isApproved = slotBookings.some(b => b.status === BookingStatus.Approved)
                                  const pendingCount = slotBookings.filter(b => b.status === BookingStatus.Pending).length
                                  
                                  const currentUser = authService.getUser()
                                  const hasUserRequested = slotBookings.some(b => b.requestedBy === currentUser?.id && b.status === BookingStatus.Pending)

                                  const cellDate = new Date(d);
                                  cellDate.setHours(h, 0, 0, 0);
                                  const isPast = new Date() > cellDate;

                                  let cellContent

                                  if (isApproved) {
                                      cellContent = <div className="slot-booked">Booked</div>
                                  } else {
                                      if (pendingCount > 0) {
                                           cellContent = (
                                               <div className="slot-pending">
                                                   <span className="slot-pending-text">{pendingCount} Request{pendingCount > 1 ? 's' : ''}</span>
                                                   {!isPast && (
                                                       hasUserRequested ? (
                                                           <button className="btn btn-sm btn-secondary" disabled style={{padding: '2px 8px', fontSize: '12px', opacity: 0.7, cursor: 'not-allowed'}}>Requested</button>
                                                       ) : (
                                                           <button className="btn btn-sm btn-primary" style={{padding: '2px 8px', fontSize: '12px'}} onClick={() => handleBookClick(d, h)}>Book</button>
                                                       )
                                                   )}
                                               </div>
                                           )
                                      } else {
                                          if (!isPast) {
                                               cellContent = <div className="slot-available"><button className="btn btn-sm btn-success" style={{ width: '80%', padding: '4px' }} onClick={() => handleBookClick(d, h)}>Book</button></div>
                                          } else {
                                               cellContent = <div className="slot-past">-</div>
                                          }
                                      }
                                  }

                                  return <td key={d.toISOString() + h}>{cellContent}</td>
                              })}
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      )
  }
// ...


  return (
    <div className="page-container">
      <div className="card-header" style={{ marginBottom: 'var(--spacing-lg)' }}>
        <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
             <Button variant="secondary" onClick={() => navigate('/rooms')}>&larr; Back</Button>
             <h1>{room?.roomName || 'Room Calendar'} <span style={{fontSize: '0.6em', color: 'var(--color-text-secondary)'}}>({room?.roomCode})</span></h1>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <Button variant="secondary" onClick={handlePrevWeek}>&lt; Prev Week</Button>
            <span style={{fontWeight: 600, color: 'var(--color-text)'}}>
                {getWeekRange(currentDate).start.toLocaleDateString()} - {getWeekRange(currentDate).end.toLocaleDateString()}
            </span>
            <Button variant="secondary" onClick={handleNextWeek}>Next Week &gt;</Button>
        </div>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}
      {successMsg && <Alert type="success" message={successMsg} onClose={() => setSuccessMsg('')} />}

      <div className="card">
         {loading ? <Loading /> : renderCalendar()}
      </div>

      {modalOpen && selectedSlot && (
          <div className="modal-overlay" style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
          }}>
              <div className="modal-content" style={{
                  backgroundColor: 'var(--bg-surface)', color: 'var(--color-text)', padding: '20px', borderRadius: '8px', width: '400px', maxWidth: '90%', border: '1px solid var(--color-border)'
              }}>
                  <h3>Confirm Booking</h3>
                  <p>
                      <strong>Room:</strong> {room?.roomName}<br/>
                      <strong>Time:</strong> {selectedSlot.date.toLocaleDateString()} {selectedSlot.hour}:00 - {selectedSlot.hour + (bookingSettings ? bookingSettings.slotDurationMinutes / 60 : 1)}:00
                  </p>
                  <div className="form-group" style={{ marginBottom: '15px' }}>
                      <label style={{display: 'block', marginBottom: '5px'}}>Reason (Optional)</label>
                      <textarea 
                          className="form-control" 
                          value={reason} 
                          onChange={e => setReason(e.target.value)}
                          rows={3}
                          style={{width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--color-border)', backgroundColor: 'var(--bg-input)', color: 'var(--color-text)'}}
                      />
                  </div>
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                      <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
                      <Button variant="primary" onClick={handleConfirmBook} disabled={submitting}>
                          {submitting ? 'Booking...' : 'Confirm Booking'}
                      </Button>
                  </div>
              </div>
          </div>
      )}
    </div>
  )
}
