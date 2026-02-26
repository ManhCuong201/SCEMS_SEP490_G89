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
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [sortBy, setSortBy] = useState('recent')
  const [departments, setDepartments] = useState<any[]>([])
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const loadRooms = async () => {
    setLoading(true)
    setError('')
    try {
      const result = await roomService.getRooms(
        currentPage,
        10,
        search || undefined,
        sortBy || undefined,
        departmentFilter || undefined
      )
      let filtered = result.items
      if (statusFilter) {
        filtered = result.items.filter(r => r.status === statusFilter)
      }
      setRooms(filtered)
      setTotal(result.total)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Tải danh sách phòng thất bại')
    } finally {
      setLoading(false)
    }
  }

  const loadDepartments = async () => {
    try {
      const { departmentService } = await import('../../../services/department.service');
      const data = await departmentService.getAll();
      setDepartments(data);
    } catch (err) {
      console.error("Failed to load departments for filter");
    }
  }

  useEffect(() => {
    loadDepartments();
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, statusFilter, departmentFilter, sortBy])

  useEffect(() => {
    loadRooms()
  }, [currentPage, search, statusFilter, departmentFilter, sortBy])

  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setDeleteId(id)
  }

  const handleConfirmDelete = async () => {
    if (deleteId) {
      try {
        await roomService.deleteRoom(deleteId)
        setSuccess('Đã xóa phòng')
        loadRooms()
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
      const statusValue = newStatus === 'Available' ? 0 : newStatus === 'Hidden' ? 1 : 2
      await roomService.updateStatus(id, statusValue)
      setSuccess('Đã cập nhật trạng thái')
      loadRooms()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Cập nhật thất bại')
    }
  }

  const columns: Column<Room>[] = [
    { header: 'Mã phòng', accessor: 'roomCode', width: '100px' },
    { header: 'Tên phòng', accessor: 'roomName' },
    { header: 'Tòa nhà', accessor: (item) => <span className="badge badge-secondary" style={{ background: 'var(--slate-100)', color: 'var(--slate-700)' }}>{item.departmentCode || 'N/A'}</span> },
    { header: 'Sức chứa', accessor: 'capacity', width: '90px' },
    { header: 'Thiết bị', accessor: 'equipmentCount', width: '100px' },
    {
      header: 'Trạng thái',
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
            <option value="Available">Khả dụng</option>
            <option value="Hidden">Ẩn</option>
            <option value="Disabled">Đã khóa</option>
          </select>
          {room.pendingRequestsCount > 0 && (
            <span className="badge badge-warning">
              {room.pendingRequestsCount} Đang chờ
            </span>
          )}
        </span>
      )
    },
    {
      header: 'Ngày tạo',
      accessor: (room) => new Date(room.createdAt).toLocaleDateString()
    },
    {
      header: 'Hành động',
      accessor: (room) => (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link
            to={`/admin/rooms/${room.id}`}
            className="btn btn-secondary"
            style={{ padding: '0.4rem', height: 'auto' }}
            title="Xem chi tiết"
          >
            <Eye size={16} />
          </Link>
          <Link
            to={`/admin/rooms/${room.id}/edit`}
            className="btn btn-secondary"
            style={{ padding: '0.4rem', height: 'auto' }}
            title="Chỉnh sửa"
          >
            <Edit size={16} />
          </Link>
          <button
            className="btn btn-danger"
            onClick={(e) => handleDeleteClick(room.id, e)}
            style={{ padding: '0.4rem', height: 'auto', background: 'rgba(239, 68, 68, 0.2)', color: 'var(--color-danger)', border: 'none' }}
            title="Xóa"
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
          <h1>Phòng</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>Quản lý phòng họp và không gian</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <label className="btn btn-secondary" style={{ cursor: 'pointer', gap: '0.5rem' }}>
            <Upload size={16} />
            Nhập Excel
            <input type="file" accept=".xlsx" style={{ display: 'none' }} onChange={async (e) => {
              const file = e.target.files?.[0]
              if (!file) return
              try {
                const { count } = await roomService.import(file)
                setSuccess(`Đã nhập ${count} phòng`)
                loadRooms()
              } catch (err: any) {
                setError(err.response?.data?.message || 'Import thất bại')
              }
              e.target.value = ''
            }} />
          </label>
          <button className="btn btn-secondary" onClick={() => roomService.downloadTemplate()} style={{ gap: '0.5rem' }}>
            <FileDown size={16} />
            Biểu mẫu
          </button>
          <Link to="/admin/rooms/create" className="btn btn-primary">+ Thêm Phòng</Link>
        </div>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1 }}>
            <SearchBar placeholder="Tìm kiếm phòng..." onSearch={setSearch} />
          </div>
          <select
            className="form-input"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ width: '150px' }}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="Available">Khả dụng</option>
            <option value="Hidden">Ẩn</option>
            <option value="Disabled">Đã khóa</option>
          </select>
          <select
            className="form-input"
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            style={{ width: '200px' }}
          >
            <option value="">Tất cả tòa nhà</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.departmentName}</option>
            ))}
          </select>
          <select
            className="form-input"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{ width: '150px' }}
          >
            <option value="recent">Sắp xếp: Mới nhất</option>
            <option value="code">Sắp xếp: Mã phòng</option>
            <option value="name">Sắp xếp: Tên phòng</option>
            <option value="capacity">Sắp xếp: Sức chứa</option>
            <option value="department">Sắp xếp: Tòa nhà</option>
          </select>
        </div>

        <DataTable
          columns={columns}
          data={rooms}
          isLoading={loading}
          emptyMessage="Không tìm thấy phòng nào phù hợp với tìm kiếm."
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
        title="Xóa phòng"
        message="Bạn có chắc chắn muốn xóa phòng này không? Hành động này không thể hoàn tác."
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteId(null)}
        isDanger
        confirmText="Xóa"
      />
    </div>
  )
}
