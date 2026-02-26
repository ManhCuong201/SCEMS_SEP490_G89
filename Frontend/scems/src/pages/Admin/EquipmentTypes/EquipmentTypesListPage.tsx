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
      setError(err.response?.data?.message || 'Tải dữ liệu thất bại')
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
        setSuccess('Đã xóa')
        loadTypes()
      } catch (err: any) {
        setError(err.response?.data?.message || 'Xóa thất bại')
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
      setSuccess('Đã cập nhật trạng thái')
      loadTypes()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Cập nhật thất bại')
    }
  }

  const columns: Column<EquipmentType>[] = [
    { header: 'Tên', accessor: 'name' },
    { header: 'Mã', accessor: 'code', width: '120px' },
    { header: 'Mô tả', accessor: 'description' },
    { header: 'Số lượng', accessor: 'equipmentCount', width: '100px' },
    {
      header: 'Trạng thái',
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
          <option value="Active">Hoạt động</option>
          <option value="Hidden">Ẩn</option>
        </select>
      )
    },
    {
      header: 'Ngày tạo',
      accessor: (item) => new Date(item.createdAt).toLocaleDateString()
    },
    {
      header: 'Hành động',
      accessor: (item) => (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link
            to={`/admin/equipment-types/${item.id}`}
            className="btn btn-secondary"
            style={{ padding: '0.4rem', height: 'auto' }}
            title="Xem chi tiết"
          >
            <Eye size={16} />
          </Link>
          <Link
            to={`/admin/equipment-types/${item.id}/edit`}
            className="btn btn-secondary"
            style={{ padding: '0.4rem', height: 'auto' }}
            title="Chỉnh sửa loại"
          >
            <Edit size={16} />
          </Link>
          <button
            className="btn btn-danger"
            onClick={(e) => handleDeleteClick(item.id, e)}
            style={{ padding: '0.4rem', height: 'auto', background: 'rgba(239, 68, 68, 0.2)', color: 'var(--color-danger)', border: 'none' }}
            title="Xóa loại"
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
          <h1>Loại Thiết bị</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>Quản lý danh mục thiết bị</p>
        </div>
        <Link to="/admin/equipment-types/create" className="btn btn-primary">+ Thêm Loại</Link>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1 }}>
            <SearchBar placeholder="Tìm kiếm loại..." onSearch={setSearch} />
          </div>
          <select
            className="form-input"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ width: '150px' }}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="Active">Hoạt động</option>
            <option value="Hidden">Ẩn</option>
          </select>
        </div>

        <DataTable
          columns={columns}
          data={types}
          isLoading={loading}
          emptyMessage="Không tìm thấy loại thiết bị nào."
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
        title="Xóa Loại Thiết bị"
        message="Bạn có chắc chắn muốn xóa loại thiết bị này không?"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteId(null)}
        isDanger
        confirmText="Xóa"
      />
    </div>
  )
}
