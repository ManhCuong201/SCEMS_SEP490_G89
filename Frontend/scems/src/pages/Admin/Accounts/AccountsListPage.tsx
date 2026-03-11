import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { accountService } from '../../../services/account.service'
import { Account, AccountStatus } from '../../../types/api'
import { useAuth } from '../../../context/AuthContext'
import { Alert } from '../../../components/Common/Alert'
import { DataTable, Column } from '../../../components/Common/DataTable'
import { Pagination } from '../../../components/Common/Pagination'
import { Edit, Trash2, Eye, FileDown, Upload, Search, Filter } from 'lucide-react'
import { ConfirmModal } from '../../../components/Common/ConfirmModal'

export const AccountsListPage: React.FC = () => {
  const { user: currentUser } = useAuth()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | React.ReactNode>('')
  const [success, setSuccess] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [search, setSearch] = useState('')
  const [total, setTotal] = useState(0)
  const [roleFilter, setRoleFilter] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const loadAccounts = async () => {
    setLoading(true)
    setError('')
    try {
      const result = await accountService.getAccounts(currentPage, 10, search, roleFilter)
      setAccounts(result.items)
      setTotal(result.total)
    } catch (err: any) {
      setError('Tải danh sách tài khoản thất bại')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setCurrentPage(1)
  }, [search, roleFilter])

  useEffect(() => {
    loadAccounts()
  }, [currentPage, search, roleFilter])

  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setDeleteId(id)
  }

  const handleConfirmDelete = async () => {
    if (deleteId) {
      try {
        await accountService.deleteAccount(deleteId)
        setSuccess('Đã xóa tài khoản')
        loadAccounts()
      } catch (err: any) {
        setError(err.response?.data?.message || 'Xóa thất bại')
      } finally {
        setDeleteId(null)
      }
    }
  }

  const handleStatusChange = async (id: string, newStatus: string, e: React.ChangeEvent<HTMLSelectElement>) => {
    try {
      const statusValue = newStatus === AccountStatus.Active ? 0 : 1;
      await accountService.updateStatus(id, statusValue)
      setSuccess('Đã cập nhật trạng thái')
      loadAccounts()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Cập nhật trạng thái thất bại')
    }
  }

  const columns: Column<Account>[] = [
    { header: 'Tên', accessor: 'fullName' },
    { header: 'Email', accessor: 'email' },
    { header: 'Điện thoại', accessor: 'phone' },
    { header: 'Vai trò', accessor: 'role' },
    {
      header: 'Trạng thái',
      accessor: (account) => (
        <select
          value={account.status}
          onChange={(e) => handleStatusChange(account.id, e.target.value, e)}
          onClick={(e) => e.stopPropagation()}
          className="form-input"
          style={{
            padding: '0.25rem 0.5rem',
            fontSize: '0.875rem',
            width: 'auto',
            background: account.status === AccountStatus.Active ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            color: account.status === AccountStatus.Active ? 'var(--color-success)' : 'var(--color-danger)',
            borderColor: 'transparent'
          }}
          disabled={account.id === currentUser?.id}
        >
          <option value={AccountStatus.Active}>Hoạt động</option>
          <option value={AccountStatus.Blocked}>Đã khóa</option>
        </select>
      )
    },
    {
      header: 'Hành động',
      accessor: (account) => (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link
            to={`/admin/accounts/${account.id}`}
            className="btn btn-secondary"
            style={{ padding: '0.4rem', height: 'auto' }}
            title="Xem chi tiết"
          >
            <Eye size={16} />
          </Link>
          {account.id !== currentUser?.id && (
            <>
              <Link
                to={`/admin/accounts/${account.id}/edit`}
                className="btn btn-secondary"
                style={{ padding: '0.4rem', height: 'auto' }}
                title="Chỉnh sửa"
              >
                <Edit size={16} />
              </Link>
              <button
                className="btn btn-danger"
                onClick={(e) => handleDeleteClick(account.id, e)}
                style={{ padding: '0.4rem', height: 'auto', background: 'rgba(239, 68, 68, 0.2)', color: 'var(--color-danger)', border: 'none' }}
                title="Xóa"
              >
                <Trash2 size={16} />
              </button>
            </>
          )}
        </div>
      )
    }
  ]

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const result = await accountService.importAccounts(file)
      if (result.failureCount > 0 && result.successCount === 0) {
        setError(
          <div>
            <strong>Import thất bại ({result.failureCount} dòng):</strong>
            <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1.25rem', maxHeight: '160px', overflowY: 'auto' }}>
              {result.errors.map((e, i) => <li key={i} style={{ fontSize: '0.85rem' }}>{e}</li>)}
            </ul>
          </div>
        )
      } else {
        setSuccess(`Đã nhập thành công ${result.successCount} tài khoản.${result.failureCount > 0 ? ` ${result.failureCount} dòng thất bại.` : ''}`)
        if (result.errors.length > 0) {
          setError(
            <div>
              <strong>{result.failureCount} dòng thất bại:</strong>
              <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1.25rem', maxHeight: '160px', overflowY: 'auto' }}>
                {result.errors.map((e, i) => <li key={i} style={{ fontSize: '0.85rem' }}>{e}</li>)}
              </ul>
            </div>
          )
        }
        loadAccounts()
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Nhập tài khoản thất bại')
    } finally {
      setLoading(false)
      // Reset input
      e.target.value = ''
    }
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Tài khoản</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>Quản lý người dùng và quản trị viên hệ thống</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={() => accountService.downloadTemplate()} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileDown size={16} />
            Biểu mẫu
          </button>
          <label className="btn btn-secondary" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Upload size={16} />
            Nhập Excel
            <input type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={handleImport} disabled={loading} />
          </label>
          <Link to="/admin/accounts/create" className="btn btn-primary">+ Tạo Tài khoản</Link>
        </div>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div style={{ paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-glass)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--slate-400)' }} />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, email hoặc mã sinh viên..."
              className="form-input"
              style={{ paddingLeft: '2.5rem', width: '100%' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div style={{ position: 'relative', width: '200px' }}>
            <Filter size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--slate-400)' }} />
            <select
              className="form-select"
              style={{ paddingLeft: '2.5rem', width: '100%', appearance: 'none' }}
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="">Tất cả vai trò</option>
              <option value="Admin">Admin</option>
              <option value="BookingStaff">Nhân viên Đặt phòng</option>
              <option value="AssetStaff">Nhân viên Tài sản</option>
              <option value="Guard">Bảo vệ</option>
              <option value="Lecturer">Giảng viên</option>
              <option value="Student">Sinh viên</option>
            </select>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={accounts}
          isLoading={loading}
          emptyMessage="Không tìm thấy tài khoản nào."
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
        title="Xóa tài khoản"
        message="Bạn có chắc chắn muốn xóa tài khoản này không? Hành động này không thể hoàn tác."
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteId(null)}
        isDanger
        confirmText="Xóa"
      />
    </div>
  )
}
