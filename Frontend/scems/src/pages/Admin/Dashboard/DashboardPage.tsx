import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { accountService } from '../../../services/account.service'
import { roomService } from '../../../services/room.service'
import { equipmentTypeService } from '../../../services/equipment-type.service'
import { bookingService } from '../../../services/booking.service'
import { Loading } from '../../../components/Common/Loading'
import { useAuth } from '../../../context/AuthContext'

import { ArrowRight, Box, Home, Users, Layers, Calendar, Clock, CheckCircle, BookOpen } from 'lucide-react'

export const DashboardPage: React.FC = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    totalAccounts: 0,
    totalRooms: 0,
    totalEquipmentTypes: 0,
    pendingBookings: 0,
    approvedToday: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true)
        const [accounts, rooms, types, bookingsResponse] = await Promise.all([
          accountService.getAccounts(1, 1),
          roomService.getRooms(1, 1),
          equipmentTypeService.getEquipmentTypes(1, 1),
          bookingService.getBookings(1, 1000) // Fetch enough to count for MVP
        ])

        const pending = bookingsResponse.items.filter(b => b.status === 'Pending').length
        const todayStr = new Date().toISOString().split('T')[0]
        const approvedToday = bookingsResponse.items.filter(b =>
          b.status === 'Approved' && b.updatedAt && b.updatedAt.startsWith(todayStr)
        ).length // Simplistic check, ideally backend provides this

        setStats({
          totalAccounts: accounts.total,
          totalRooms: rooms.total,
          totalEquipmentTypes: types.total,
          pendingBookings: pending,
          approvedToday: approvedToday
        })
      } catch (err) {
        console.error("Failed to load dashboard stats", err)
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [])

  const StatCard: React.FC<{ title: string; value: number; href: string; icon: React.ReactNode; color: string; bgColor?: string }> = ({ title, value, href, icon, color, bgColor }) => (
    <Link
      to={href}
      style={{
        padding: '1.75rem',
        textDecoration: 'none',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 'var(--radius-lg)', // Restoring rounded corners
        // Restore distinctive left accent "shadow" (border)
        borderLeft: `5px solid ${color}`,
        borderTop: `1px solid ${color}30`,
        borderRight: `1px solid ${color}30`,
        borderBottom: `1px solid ${color}30`,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        // Make background distinct solid darker gray
        background: 'var(--slate-100)',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)' // Refined shadow
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-5px)';
        e.currentTarget.style.boxShadow = 'var(--shadow-xl)'; // Deeper hover shadow
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, margin: '0 0 0.25rem 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {title}
          </p>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 800, margin: 0, color: 'var(--text-main)', letterSpacing: '-0.03em', lineHeight: 1 }}>
            {value}
          </h2>
        </div>
        <div style={{
          background: `${color}15`, // 10-15% opacity of the color
          color: color,
          padding: '0.75rem',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `0 4px 6px -2px ${color}20`
        }}>
          {React.cloneElement(icon as React.ReactElement, { size: 28 })}
        </div>
      </div>

      <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: color, fontWeight: 600 }}>
        View Details
        <div style={{
          background: `${color}20`,
          borderRadius: '50%',
          width: '20px',
          height: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <ArrowRight size={12} />
        </div>
      </div>
    </Link>
  )

  return (
    <div className="page-container">
      <div style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h1>Dashboard</h1>
        <p style={{ color: 'var(--color-text-secondary)', margin: '8px 0 0 0' }}>
          Welcome to SCEMS Admin Panel
        </p>
      </div>

      {loading ? (
        <Loading />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
          {(user?.role === 'Admin') && (
            <StatCard
              title="Total Accounts"
              value={stats.totalAccounts}
              href="/admin/accounts"
              icon={<Users size={48} />}
              color="var(--primary-400)"
            />
          )}
          {(user?.role === 'Admin' || user?.role === 'AssetStaff') && (
            <>
              <StatCard
                title="Total Rooms"
                value={stats.totalRooms}
                href="/admin/rooms"
                icon={<Home size={48} />}
                color="var(--color-success)"
              />
              <StatCard
                title="Equipment Types"
                value={stats.totalEquipmentTypes}
                href="/admin/equipment-types"
                icon={<Layers size={48} />}
                color="var(--color-warning)"
              />
            </>
          )}
          {(user?.role === 'BookingStaff') && (
            <>
              <StatCard
                title="Pending Requests"
                value={stats.pendingBookings}
                href="/admin/booking-board"
                icon={<Clock size={48} />}
                color="var(--color-warning)"
              />
              <StatCard
                title="Approved Today"
                value={stats.approvedToday}
                href="/admin/bookings"
                icon={<CheckCircle size={48} />}
                color="var(--color-success)"
              />
              <StatCard
                title="Manage Classes"
                value={0} // Just a link
                href="/teacher/classes"
                icon={<Users size={48} />}
                color="var(--primary-400)"
              />
              <StatCard
                title="Manage Schedules"
                value={0}
                href="/schedule"
                icon={<BookOpen size={48} />}
                color="var(--color-info)"
              />
            </>
          )}
        </div>
      )}
    </div>
  )
}
