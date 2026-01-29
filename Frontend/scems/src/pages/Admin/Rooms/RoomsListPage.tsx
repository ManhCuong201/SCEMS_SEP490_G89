import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { roomService } from '../../../services/room.service'
import { Room } from '../../../types/api'
import { Alert } from '../../../components/Common/Alert'
import { Pagination } from '../../../components/Common/Pagination'
import { SearchBar } from '../../../components/Common/SearchBar'
import { DataTable, Column } from '../../../components/Common/DataTable'
import { Eye, Edit, Trash2, Calendar, FileDown, Upload } from 'lucide-react'
import { ConfirmModal } from '../../../components/Common/ConfirmModal'

export const RoomsListPage: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [search, setSearch] = useState('')
  const [total, setTotal] = useState(0)
  const [statusFilter, setStatusFilter] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const loadRooms = async () => {
    setLoading(true)
    setError('')
    try {
      const result = await roomService.getRooms(currentPage, 10, search || undefined)
      let filtered = result.items
      if (statusFilter) {
        filtered = result.items.filter(r => r.status === statusFilter)
      }
      setRooms(filtered)
      setTotal(result.total)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load rooms')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setCurrentPage(1)
  }, [search, statusFilter])

  useEffect(() => {
    loadRooms()
  }, [currentPage, search, statusFilter])

  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setDeleteId(id)
  }

  const handleConfirmDelete = async () => {
    if (deleteId) {
      try {
        await roomService.deleteRoom(deleteId)
        setSuccess('Room deleted')
        loadRooms()
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to delete')
      } finally {
        setDeleteId(null)
      }
    }
  }

  const handleStatusChange = async (id: string, newStatus: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const statusValue = newStatus === 'Available' ? 0 : newStatus === 'Hidden' ? 1 : 2
      await roomService.updateStatus(id, statusValue)
      setSuccess('Status updated')
      loadRooms()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update')
    }
  }

  const columns: Column<Room>[] = [
    { header: 'Code', accessor: 'roomCode', width: '120px' },
    { header: 'Name', accessor: 'roomName' },
    { header: 'Type', accessor: (item) => <span className="badge badge-secondary">{item.roomTypeName || 'N/A'}</span> },
    { header: 'Capacity', accessor: 'capacity', width: '100px' },
    { header: 'Equipment', accessor: 'equipmentCount', width: '100px' },
    {
      header: 'Status',
      accessor: (room) => (
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <select
            value={room.status}
            onChange={(e) => handleStatusChange(room.id, e.target.value, e as any)}
            onClick={(e) => e.stopPropagation()}
            className="form-input"
            style={{
              padding: '0.25rem 0.5rem',
              fontSize: '0.875rem',
              width: 'auto',
              background: room.status === 'Available' ? 'rgba(16, 185, 129, 0.1)' : room.status === 'Hidden' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              color: room.status === 'Available' ? 'var(--color-success)' : room.status === 'Hidden' ? 'var(--color-warning)' : 'var(--color-danger)',
              borderColor: 'transparent'
            }}
          >
            <option value="Available">Available</option>
            <option value="Hidden">Hidden</option>
            <option value="Disabled">Disabled</option>
          </select>
          {room.pendingRequestsCount > 0 && (
            <span className="badge badge-warning">
              {room.pendingRequestsCount} Waiting
            </span>
          )}
        </span>
      )
    },
    {
      header: 'Created',
      accessor: (room) => new Date(room.createdAt).toLocaleDateString()
    },
    {
      header: 'Actions',
      accessor: (room) => (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link
            to={`/admin/rooms/${room.id}`}
            className="btn btn-secondary"
            style={{ padding: '0.4rem', height: 'auto' }}
            title="View Details"
          >
            <Eye size={16} />
          </Link>
          <Link
            to={`/admin/rooms/${room.id}/edit`}
            className="btn btn-secondary"
            style={{ padding: '0.4rem', height: 'auto' }}
            title="Edit Room"
          >
            <Edit size={16} />
          </Link>
          <button
            className="btn btn-danger"
            onClick={(e) => handleDeleteClick(room.id, e)}
            style={{ padding: '0.4rem', height: 'auto', background: 'rgba(239, 68, 68, 0.2)', color: 'var(--color-danger)', border: 'none' }}
            title="Delete Room"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )
    }
  ]

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Rooms</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>Manage meeting rooms and spaces</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <label className="btn btn-secondary" style={{ cursor: 'pointer', gap: '0.5rem' }}>
            <Upload size={16} />
            Import Excel
            <input type="file" accept=".xlsx" style={{ display: 'none' }} onChange={async (e) => {
              const file = e.target.files?.[0]
              if (!file) return
              try {
                const { count } = await roomService.import(file)
                setSuccess(`Imported ${count} rooms`)
                loadRooms()
              } catch (err: any) {
                setError(err.response?.data?.message || 'Import failed')
              }
              e.target.value = ''
            }} />
          </label>
          <button className="btn btn-secondary" onClick={() => roomService.downloadTemplate()} style={{ gap: '0.5rem' }}>
            <FileDown size={16} />
            Template
          </button>
          <Link to="/admin/rooms/create" className="btn btn-primary">+ New Room</Link>
        </div>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1 }}>
            <SearchBar placeholder="Search rooms..." onSearch={setSearch} />
          </div>
          <select
            className="form-input"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ width: '150px' }}
          >
            <option value="">All Status</option>
            <option value="Available">Available</option>
            <option value="Hidden">Hidden</option>
            <option value="Disabled">Disabled</option>
          </select>
        </div>

        <DataTable
          columns={columns}
          data={rooms}
          isLoading={loading}
          emptyMessage="No rooms found matching your search."
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
        isOpen={!!deleteId}
        title="Delete Room"
        message="Are you sure you want to delete this room? This action cannot be undone."
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteId(null)}
        isDanger
        confirmText="Delete"
      />
    </div>
  )
}
