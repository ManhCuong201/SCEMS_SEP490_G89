import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { roomService } from '../../../services/room.service'
import { Room } from '../../../types/api'
import { Alert } from '../../../components/Common/Alert'
import { Loading } from '../../../components/Common/Loading'
import { Pagination } from '../../../components/Common/Pagination'
import { SearchBar } from '../../../components/Common/SearchBar'

export const RoomsListPage: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [search, setSearch] = useState('')
  const [total, setTotal] = useState(0)
  const [statusFilter, setStatusFilter] = useState('')

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

  const handleDelete = async (id: string) => {
    if (confirm('Delete this room?')) {
      try {
        await roomService.deleteRoom(id)
        setSuccess('Room deleted')
        loadRooms()
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to delete')
      }
    }
  }

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const statusValue = newStatus === 'Available' ? 0 : newStatus === 'Hidden' ? 1 : 2
      await roomService.updateStatus(id, statusValue)
      setSuccess('Status updated')
      loadRooms()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update')
    }
  }

  return (
    <div className="page-container">
      <div className="card-header" style={{ marginBottom: 'var(--spacing-lg)' }}>
        <h1>Rooms</h1>
        <Link to="/admin/rooms/create" className="btn btn-primary">+ New</Link>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

      <div className="card">
        <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
          <SearchBar placeholder="Search..." onSearch={setSearch} />
          <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ width: '150px' }}>
            <option value="">All</option>
            <option value="Available">Available</option>
            <option value="Hidden">Hidden</option>
            <option value="Disabled">Disabled</option>
          </select>
        </div>

        {loading ? <Loading /> : rooms.length === 0 ? <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)' }}>No rooms</p> : (
          <>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr><th>Code</th><th>Name</th><th>Capacity</th><th>Equipment</th><th>Status</th><th>Created</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {rooms.map((r) => (
                    <tr key={r.id}>
                      <td>{r.roomCode}</td>
                      <td>{r.roomName}</td>
                      <td>{r.capacity}</td>
                      <td>{r.equipmentCount}</td>
                      <td>
                        <select value={r.status} onChange={(e) => handleStatusChange(r.id, e.target.value)} style={{ padding: '4px 8px' }}>
                          <option value="Available">Available</option>
                          <option value="Hidden">Hidden</option>
                          <option value="Disabled">Disabled</option>
                        </select>
                      </td>
                      <td>{new Date(r.createdAt).toLocaleDateString()}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <Link to={`/admin/rooms/${r.id}`} className="btn btn-sm btn-secondary">View</Link>
                          <Link to={`/admin/rooms/${r.id}/edit`} className="btn btn-sm btn-secondary">Edit</Link>
                          <button className="btn btn-sm btn-danger" onClick={() => handleDelete(r.id)}>Del</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination currentPage={currentPage} totalPages={Math.ceil(total / 10)} onPageChange={setCurrentPage} total={total} pageSize={10} />
          </>
        )}
      </div>
    </div>
  )
}
