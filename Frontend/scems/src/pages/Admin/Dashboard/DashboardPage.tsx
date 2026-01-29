import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { accountService } from '../../../services/account.service'
import { roomService } from '../../../services/room.service'
import { equipmentTypeService } from '../../../services/equipment-type.service'
import { Loading } from '../../../components/Common/Loading'

import { ArrowRight, Box, Home, Users, Layers } from 'lucide-react'

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState({
    totalAccounts: 0,
    totalRooms: 0,
    totalEquipmentTypes: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [accounts, rooms, types] = await Promise.all([
          accountService.getAccounts(1, 1),
          roomService.getRooms(1, 1),
          equipmentTypeService.getEquipmentTypes(1, 1)
        ])

        setStats({
          totalAccounts: accounts.total,
          totalRooms: rooms.total,
          totalEquipmentTypes: types.total
        })
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [])

  const StatCard: React.FC<{ title: string; value: number; href: string; icon: React.ReactNode; color: string }> = ({ title, value, href, icon, color }) => (
    <Link
      to={href}
      className="glass-card"
      style={{
        padding: '1.5rem',
        textDecoration: 'none',
        display: 'block',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <div style={{
        position: 'absolute',
        top: '1rem',
        right: '1rem',
        opacity: 0.2,
        color: color,
        transform: 'scale(2.5)',
        transformOrigin: 'top right'
      }}>
        {icon}
      </div>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 500, margin: '0 0 0.5rem 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {title}
      </p>
      <h2 style={{ fontSize: '2.5rem', fontWeight: 700, margin: 0 }} className="text-gradient">
        {value}
      </h2>
      <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: color, fontWeight: 500 }}>
        View Details <ArrowRight size={16} />
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--spacing-lg)' }}>
          <StatCard
            title="Total Accounts"
            value={stats.totalAccounts}
            href="/admin/accounts"
            icon={<Users size={48} />}
            color="var(--primary-400)"
          />
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
        </div>
      )}
    </div>
  )
}
