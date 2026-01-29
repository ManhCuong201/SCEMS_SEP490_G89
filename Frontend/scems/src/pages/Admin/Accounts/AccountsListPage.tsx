import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { accountService } from '../../../services/account.service'
import { Account, AccountStatus } from '../../../types/api'
import { Alert } from '../../../components/Common/Alert'
import { DataTable, Column } from '../../../components/Common/DataTable'
import { Edit, Trash2, Eye } from 'lucide-react'
import { ConfirmModal } from '../../../components/Common/ConfirmModal'

export const AccountsListPage: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
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
      setError('Failed to load accounts')
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
        setSuccess('Account deleted')
        loadAccounts()
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to delete')
      } finally {
        setDeleteId(null)
      }
    }
  }

  const handleStatusChange = async (id: string, newStatus: string, e: React.ChangeEvent<HTMLSelectElement>) => {
    try {
      const statusValue = parseInt(newStatus)
      await accountService.updateStatus(id, statusValue)
      setSuccess('Status updated')
      loadAccounts()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update status')
    }
  }

  const columns: Column<Account>[] = [
    { header: 'Name', accessor: 'fullName' },
    { header: 'Email', accessor: 'email' },
    { header: 'Phone', accessor: 'phone' },
    { header: 'Role', accessor: 'role' },
    {
      header: 'Status',
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
          disabled={account.email === 'admin@scems.com'}
        >
          <option value={AccountStatus.Active}>Active</option>
          <option value={AccountStatus.Blocked}>Blocked</option>
        </select>
      )
    },
    {
      header: 'Actions',
      accessor: (account) => (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link
            to={`/admin/accounts/${account.id}`}
            className="btn btn-secondary"
            style={{ padding: '0.4rem', height: 'auto' }}
            title="View Details"
          >
            <Eye size={16} />
          </Link>
          <Link
            to={`/admin/accounts/${account.id}/edit`}
            className="btn btn-secondary"
            style={{ padding: '0.4rem', height: 'auto' }}
            title="Edit Account"
          >
            <Edit size={16} />
          </Link>
          <button
            className="btn btn-danger"
            onClick={(e) => handleDeleteClick(account.id, e)}
            style={{ padding: '0.4rem', height: 'auto', background: 'rgba(239, 68, 68, 0.2)', color: 'var(--color-danger)', border: 'none' }}
            title="Delete Account"
            disabled={account.email === 'admin@scems.com'}
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
          <h1>Accounts</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>Manage system users and administrators</p>
        </div>
        <Link to="/admin/accounts/create" className="btn btn-primary">+ New Account</Link>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div style={{ paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-glass)' }}>
          {/* Search and Filters can go here if needed, SearchBar is part of SearchBar component which wasn't used in previous iteration but can be added */}
        </div>

        <DataTable
          columns={columns}
          data={accounts}
          isLoading={loading}
          emptyMessage="No accounts found."
        />
      </div>

      <ConfirmModal
        isOpen={!!deleteId}
        title="Delete Account"
        message="Are you sure you want to delete this account? This action cannot be undone."
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteId(null)}
        isDanger
        confirmText="Delete"
      />
    </div>
  )
}
