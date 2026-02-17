import React, { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { accountService } from '../../../services/account.service'
import { Account, AccountStatus } from '../../../types/api'
import { useAuth } from '../../../context/AuthContext'
import { Alert } from '../../../components/Common/Alert'
import { Loading } from '../../../components/Common/Loading'
import { ConfirmModal } from '../../../components/Common/ConfirmModal'
import { ArrowLeft, Edit, Trash2 } from 'lucide-react'

export const AccountDetailPage: React.FC = () => {
  const { user: currentUser } = useAuth()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [account, setAccount] = useState<Account | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)

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
    try {
      await accountService.deleteAccount(id!)
      navigate('/admin/accounts')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete')
      setShowDeleteModal(false)
    }
  }

  if (loading) return <Loading fullPage />
  if (!account) return <Alert type="error" message="Not found" />

  const getStatusColor = (status: AccountStatus) => {
    return status === AccountStatus.Active ? 'var(--color-success)' : 'var(--color-danger)'
  }

  const getStatusBg = (status: AccountStatus) => {
    return status === AccountStatus.Active ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>{account.fullName}</h1>
          <p className="text-muted">Account Details</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
          {account.id !== currentUser?.id && (
            <>
              <Link to={`/admin/accounts/${id}/edit`} className="btn btn-primary" style={{ gap: '0.5rem' }}>
                <Edit size={16} /> Edit
              </Link>
              <button className="btn btn-danger" onClick={() => setShowDeleteModal(true)} style={{ gap: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-danger)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                <Trash2 size={16} /> Delete
              </button>
            </>
          )}
          <button className="btn btn-secondary" onClick={() => navigate('/admin/accounts')} style={{ gap: '0.5rem' }}>
            <ArrowLeft size={16} /> Back
          </button>
        </div>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      <div className="glass-panel" style={{ padding: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem' }}>
          <div>
            <p className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>Email</p>
            <p style={{ fontWeight: 500, fontSize: '1.1rem' }}>{account.email}</p>
          </div>
          <div>
            <p className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>Phone</p>
            <p style={{ fontWeight: 500, fontSize: '1.1rem' }}>{account.phone || '-'}</p>
          </div>
          <div>
            <p className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>Role</p>
            <p style={{ fontWeight: 500, fontSize: '1.1rem' }}>{account.role}</p>
          </div>
          {account.studentCode && (
            <div>
              <p className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>Student Code</p>
              <p style={{ fontWeight: 500, fontSize: '1.1rem' }}>{account.studentCode}</p>
            </div>
          )}
          <div>
            <p className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>Status</p>
            <span
              className="badge"
              style={{
                backgroundColor: getStatusBg(account.status),
                color: getStatusColor(account.status),
                fontSize: '0.9rem',
                padding: '0.35em 0.8em'
              }}
            >
              {account.status === AccountStatus.Active ? 'Active' : 'Blocked'}
            </span>
          </div>
          <div>
            <p className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>Created</p>
            <p style={{ fontWeight: 500 }}>{new Date(account.createdAt).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>Updated</p>
            <p style={{ fontWeight: 500 }}>{account.updatedAt ? new Date(account.updatedAt).toLocaleString() : 'Never'}</p>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete Account"
        message={`Are you sure you want to delete account "${account.fullName}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
        isDanger
        confirmText="Delete"
      />
    </div>
  )
}
