import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { equipmentTypeService } from '../../../services/equipment-type.service'
import { EquipmentType } from '../../../types/api'
import { Alert } from '../../../components/Common/Alert'
import { Loading } from '../../../components/Common/Loading'
import { Pagination } from '../../../components/Common/Pagination'
import { SearchBar } from '../../../components/Common/SearchBar'

export const EquipmentTypesListPage: React.FC = () => {
  const [types, setTypes] = useState<EquipmentType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [search, setSearch] = useState('')
  const [total, setTotal] = useState(0)
  const [statusFilter, setStatusFilter] = useState('')

  const loadTypes = async () => {
    setLoading(true)
    setError('')
    try {
      const result = await equipmentTypeService.getEquipmentTypes(currentPage, 10, search || undefined)
      let filtered = result.items
      if (statusFilter) {
        filtered = result.items.filter(t => t.status === statusFilter)
      }
      setTypes(filtered)
      setTotal(result.total)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setCurrentPage(1)
  }, [search, statusFilter])

  useEffect(() => {
    loadTypes()
  }, [currentPage, search, statusFilter])

  const handleDelete = async (id: string) => {
    if (confirm('Delete this type?')) {
      try {
        await equipmentTypeService.deleteEquipmentType(id)
        setSuccess('Deleted')
        loadTypes()
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to delete')
      }
    }
  }

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const statusValue = newStatus === 'Active' ? 0 : 1
      await equipmentTypeService.updateStatus(id, statusValue)
      setSuccess('Status updated')
      loadTypes()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update')
    }
  }

  return (
    <div className="page-container">
      <div className="card-header" style={{ marginBottom: 'var(--spacing-lg)' }}>
        <h1>Equipment Types</h1>
        <Link to="/admin/equipment-types/create" className="btn btn-primary">+ New</Link>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

      <div className="card">
        <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
          <SearchBar placeholder="Search..." onSearch={setSearch} />
          <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ width: '150px' }}>
            <option value="">All</option>
            <option value="Active">Active</option>
            <option value="Hidden">Hidden</option>
          </select>
        </div>

        {loading ? <Loading /> : types.length === 0 ? <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)' }}>No types</p> : (
          <>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr><th>Name</th><th>Description</th><th>Count</th><th>Status</th><th>Created</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {types.map((t) => (
                    <tr key={t.id}>
                      <td>{t.name}</td>
                      <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.description}</td>
                      <td>{t.equipmentCount}</td>
                      <td>
                        <select value={t.status} onChange={(e) => handleStatusChange(t.id, e.target.value)} style={{ padding: '4px 8px' }}>
                          <option value="Active">Active</option>
                          <option value="Hidden">Hidden</option>
                        </select>
                      </td>
                      <td>{new Date(t.createdAt).toLocaleDateString()}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <Link to={`/admin/equipment-types/${t.id}`} className="btn btn-sm btn-secondary">View</Link>
                          <Link to={`/admin/equipment-types/${t.id}/edit`} className="btn btn-sm btn-secondary">Edit</Link>
                          <button className="btn btn-sm btn-danger" onClick={() => handleDelete(t.id)}>Del</button>
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
