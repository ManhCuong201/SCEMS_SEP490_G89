import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { accountService } from '../../../services/account.service'
import { roomService } from '../../../services/room.service'
import { equipmentTypeService } from '../../../services/equipment-type.service'
import { Loading } from '../../../components/Common/Loading'

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

  const StatCard: React.FC<{ title: string; value: number; href: string }> = ({ title, value, href }) => (
    <Link
      to={href}
      style={{
        backgroundColor: 'var(--color-white)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--spacing-lg)',
        textDecoration: 'none',
        display: 'block',
        transition: 'all var(--transition-base)',
        boxShadow: 'var(--shadow-sm)'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = 'var(--shadow-md)'
        e.currentTarget.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      <p style={{ color: 'var(--color-text-secondary)', margin: '0 0 var(--spacing-sm) 0' }}>{title}</p>
      <h2 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--color-primary)', margin: 0 }}>
        {value}
      </h2>
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
          <StatCard title="Total Accounts" value={stats.totalAccounts} href="/admin/accounts" />
          <StatCard title="Total Rooms" value={stats.totalRooms} href="/admin/rooms" />
          <StatCard title="Equipment Types" value={stats.totalEquipmentTypes} href="/admin/equipment-types" />
        </div>
      )}
    </div>
  )
}
