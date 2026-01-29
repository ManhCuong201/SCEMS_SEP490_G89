import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { equipmentTypeService } from '../../../services/equipment-type.service'
import { EquipmentType } from '../../../types/api'
import { Alert } from '../../../components/Common/Alert'
import { Pagination } from '../../../components/Common/Pagination'
import { SearchBar } from '../../../components/Common/SearchBar'
import { DataTable, Column } from '../../../components/Common/DataTable'
import { Edit, Trash2, Eye } from 'lucide-react'
import { ConfirmModal } from '../../../components/Common/ConfirmModal'

export const EquipmentTypesListPage: React.FC = () => {
  const [types, setTypes] = useState<EquipmentType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [search, setSearch] = useState('')
  const [total, setTotal] = useState(0)
  const [statusFilter, setStatusFilter] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)

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

  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setDeleteId(id)
  }

  const handleConfirmDelete = async () => {
    if (deleteId) {
      try {
        await equipmentTypeService.deleteEquipmentType(deleteId)
        setSuccess('Deleted')
        loadTypes()
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
      const statusValue = newStatus === 'Active' ? 0 : 1
      await equipmentTypeService.updateStatus(id, statusValue)
      setSuccess('Status updated')
      loadTypes()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update')
    }
  }

  const columns: Column<EquipmentType>[] = [
    { header: 'Name', accessor: 'name' },
    { header: 'Description', accessor: 'description' },
    { header: 'Count', accessor: 'equipmentCount', width: '100px' },
    {
      header: 'Status',
      accessor: (item) => (
        <select
          value={item.status}
          onChange={(e) => handleStatusChange(item.id, e.target.value, e as any)}
          onClick={(e) => e.stopPropagation()}
          className="form-input"
          style={{
            padding: '0.25rem 0.5rem',
            fontSize: '0.875rem',
            width: 'auto',
            background: item.status === 'Active' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            color: item.status === 'Active' ? 'var(--color-success)' : 'var(--color-danger)',
            borderColor: 'transparent'
          }}
        >
          <option value="Active">Active</option>
          <option value="Hidden">Hidden</option>
        </select>
      )
    },
    {
      header: 'Created',
      accessor: (item) => new Date(item.createdAt).toLocaleDateString()
    },
    {
      header: 'Actions',
      accessor: (item) => (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link
            to={`/admin/equipment-types/${item.id}`}
            className="btn btn-secondary"
            style={{ padding: '0.4rem', height: 'auto' }}
            title="View Details"
          >
            <Eye size={16} />
          </Link>
          <Link
            to={`/admin/equipment-types/${item.id}/edit`}
            className="btn btn-secondary"
            style={{ padding: '0.4rem', height: 'auto' }}
            title="Edit Type"
          >
            <Edit size={16} />
          </Link>
          <button
            className="btn btn-danger"
            onClick={(e) => handleDeleteClick(item.id, e)}
            style={{ padding: '0.4rem', height: 'auto', background: 'rgba(239, 68, 68, 0.2)', color: 'var(--color-danger)', border: 'none' }}
            title="Delete Type"
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
          <h1>Equipment Types</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>Manage categories of equipment</p>
        </div>
        <Link to="/admin/equipment-types/create" className="btn btn-primary">+ New Type</Link>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1 }}>
            <SearchBar placeholder="Search types..." onSearch={setSearch} />
          </div>
          <select
            className="form-input"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ width: '150px' }}
          >
            <option value="">All Status</option>
            <option value="Active">Active</option>
            <option value="Hidden">Hidden</option>
          </select>
        </div>

        <DataTable
          columns={columns}
          data={types}
          isLoading={loading}
          emptyMessage="No equipment types found."
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
        title="Delete Equipment Type"
        message="Are you sure you want to delete this equipment type?"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteId(null)}
        isDanger
        confirmText="Delete"
      />
    </div>
  )
}
