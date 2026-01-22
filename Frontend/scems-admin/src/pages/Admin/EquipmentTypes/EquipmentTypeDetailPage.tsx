import React, { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { equipmentTypeService } from '../../../services/equipment-type.service'
import { EquipmentType } from '../../../types/api'
import { Alert } from '../../../components/Common/Alert'
import { Loading } from '../../../components/Common/Loading'

export const EquipmentTypeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [type, setType] = useState<EquipmentType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const data = await equipmentTypeService.getEquipmentTypeById(id!)
        setType(data)
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const handleDelete = async () => {
    if (confirm('Delete this type?')) {
      try {
        await equipmentTypeService.deleteEquipmentType(id!)
        navigate('/admin/equipment-types')
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to delete')
      }
    }
  }

  if (loading) return <Loading fullPage />
  if (!type) return <Alert type="error" message="Not found" />

  return (
    <div className="page-container">
      <div className="card-header" style={{ marginBottom: 'var(--spacing-lg)' }}>
        <h1>{type.name}</h1>
        <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
          <Link to={`/admin/equipment-types/${id}/edit`} className="btn btn-primary">Edit</Link>
          <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
          <button className="btn btn-secondary" onClick={() => navigate('/admin/equipment-types')}>Back</button>
        </div>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      <div className="card">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--spacing-lg)' }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>Description</p>
            <p style={{ fontWeight: 600 }}>{type.description || 'N/A'}</p>
          </div>
          <div>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>Equipment Count</p>
            <p style={{ fontWeight: 600 }}>{type.equipmentCount}</p>
          </div>
          <div>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>Status</p>
            <span className={`badge ${type.status === 'Active' ? 'badge-success' : 'badge-danger'}`}>{type.status}</span>
          </div>
          <div>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>Created</p>
            <p style={{ fontWeight: 600 }}>{new Date(type.createdAt).toLocaleString()}</p>
          </div>
          <div>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>Updated</p>
            <p style={{ fontWeight: 600 }}>{new Date(type.updatedAt).toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
