import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { accountService } from '../../../services/account.service'
import { Account, AccountStatus } from '../../../types/api'
import { Alert } from '../../../components/Common/Alert'
import { Loading } from '../../../components/Common/Loading'
import { Pagination } from '../../../components/Common/Pagination'
import { SearchBar } from '../../../components/Common/SearchBar'

export const AccountsListPage: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [search, setSearch] = useState('')
  const [total, setTotal] = useState(0)
  const [statusFilter, setStatusFilter] = useState('')

  const loadAccounts = async () => {
    setLoading(true)
    setError('')
    try {
      const result = await accountService.getAccounts(currentPage, 10, search || undefined)
      let filtered = result.items
      if (statusFilter) {
        filtered = result.items.filter(a => a.status === statusFilter)
      }
      setAccounts(filtered)
      setTotal(result.total)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load accounts')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setCurrentPage(1)
  }, [search, statusFilter])

  useEffect(() => {
    loadAccounts()
  }, [currentPage, search, statusFilter])

  const handleDelete = async (id: string) => {
    if (confirm('Delete this account?')) {
      try {
        await accountService.deleteAccount(id)
        setSuccess('Account deleted')
        loadAccounts()
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to delete')
      }
    }
  }

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const statusValue = newStatus === AccountStatus.Active ? 0 : 1
      await accountService.updateStatus(id, statusValue)
      setSuccess('Status updated')
      loadAccounts()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update')
    }
  }

  return (
    <div className="page-container">
      <div className="card-header" style={{ marginBottom: 'var(--spacing-lg)' }}>
        <h1>Accounts</h1>
        <Link to="/admin/accounts/create" className="btn btn-primary">+ New</Link>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

      <div className="card">
        <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
          <SearchBar placeholder="Search..." onSearch={setSearch} />
          <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ width: '150px' }}>
            <option value="">All</option>
            <option value={AccountStatus.Active}>Active</option>
            <option value={AccountStatus.Blocked}>Blocked</option>
          </select>
        </div>

        {loading ? <Loading /> : accounts.length === 0 ? <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)' }}>No accounts</p> : (
          <>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Status</th><th>Created</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {accounts.map((a) => (
                    <tr key={a.id}>
                      <td>{a.fullName}</td>
                      <td>{a.email}</td>
                      <td>{a.phone}</td>
                      <td>{a.role}</td>
                      <td>
                        <select 
                          value={a.status} 
                          onChange={(e) => handleStatusChange(a.id, e.target.value)} 
                          style={{ padding: '4px 8px' }}
                          disabled={a.email === 'admin@scems.com'}
                        >
                          <option value={AccountStatus.Active}>Active</option>
                          <option value={AccountStatus.Blocked}>Blocked</option>
                        </select>
                      </td>
                      <td>{new Date(a.createdAt).toLocaleDateString()}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <Link to={`/admin/accounts/${a.id}`} className="btn btn-sm btn-secondary">View</Link>
                          {a.email !== 'admin@scems.com' && (
                            <>
                              <Link to={`/admin/accounts/${a.id}/edit`} className="btn btn-sm btn-secondary">Edit</Link>
                              <button className="btn btn-sm btn-danger" onClick={() => handleDelete(a.id)}>Del</button>
                            </>
                          )}
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
