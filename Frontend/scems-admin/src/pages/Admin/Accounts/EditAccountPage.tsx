import React, { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { accountService } from '../../../services/account.service'
import { Account } from '../../../types/api'
import { Alert } from '../../../components/Common/Alert'
import { Loading } from '../../../components/Common/Loading'

export const AccountDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [account, setAccount] = useState<Account | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const data = await accountService.getAccountById(id!)
        setAccount(data)
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const handleDelete = async () => {
    if (confirm('Delete this account?')) {
      try {
        await accountService.deleteAccount(id!)
        navigate('/admin/accounts')
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to delete')
      }
    }
  }

  if (loading) return <Loading fullPage />
  if (!account) return <Alert type="error" message="Not found" />

  return (
    <div className="page-container">
      <div className="card-header" style={{ marginBottom: 'var(--spacing-lg)' }}>
        <h1>{account.fullName}</h1>
        <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
          <Link to={`/admin/accounts/${id}/edit`} className="btn btn-primary">Edit</Link>
          <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
          <button className="btn btn-secondary" onClick={() => navigate('/admin/accounts')}>Back</button>
        </div>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      <div className="card">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--spacing-lg)' }}>
          <div>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>Email</p>
            <p style={{ fontWeight: 600 }}>{account.email}</p>
          </div>
          <div>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>Phone</p>
            <p style={{ fontWeight: 600 }}>{account.phone}</p>
          </div>
          <div>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>Role</p>
            <p style={{ fontWeight: 600 }}>{account.role}</p>
          </div>
          <div>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>Status</p>
            <span className={`badge ${account.status === 'Active' ? 'badge-success' : 'badge-danger'}`}>{account.status}</span>
          </div>
          <div>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>Created</p>
            <p style={{ fontWeight: 600 }}>{new Date(account.createdAt).toLocaleString()}</p>
          </div>
          <div>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>Updated</p>
            <p style={{ fontWeight: 600 }}>{new Date(account.updatedAt).toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
