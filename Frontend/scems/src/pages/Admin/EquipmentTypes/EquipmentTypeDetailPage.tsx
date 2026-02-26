import React, { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { equipmentTypeService } from '../../../services/equipment-type.service'
import { EquipmentType } from '../../../types/api'
import { Alert } from '../../../components/Common/Alert'
import { Loading } from '../../../components/Common/Loading'
import { Edit, Trash2, ArrowLeft } from 'lucide-react'
import { ConfirmModal } from '../../../components/Common/ConfirmModal'

export const EquipmentTypeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [type, setType] = useState<EquipmentType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const data = await equipmentTypeService.getEquipmentTypeById(id!)
        setType(data)
      } catch (err: any) {
        setError(err.response?.data?.message || 'Tải dữ liệu thất bại')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const handleDeleteClick = () => {
    setDeleteId(id!)
  }

  const handleConfirmDelete = async () => {
    if (deleteId) {
      try {
        await equipmentTypeService.deleteEquipmentType(deleteId)
        navigate('/admin/equipment-types')
      } catch (err: any) {
        setError(err.response?.data?.message || 'Xóa thất bại')
      } finally {
        setDeleteId(null)
      }
    }
  }

  if (loading) return <Loading fullPage />
  if (!type) return <Alert type="error" message="Không tìm thấy" />

  const getStatusColor = (status: string) => {
    if (status === 'Active') return 'var(--color-success)'
    return 'var(--color-danger)'
  }

  const getStatusBg = (status: string) => {
    if (status === 'Active') return 'rgba(16, 185, 129, 0.1)'
    return 'rgba(239, 68, 68, 0.1)'
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={() => navigate('/admin/equipment-types')}
            className="btn btn-secondary"
            style={{ padding: '0.5rem', borderRadius: '50%' }}
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1>{type.name}</h1>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>Chi tiết loại thiết bị</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link to={`/admin/equipment-types/${id}/edit`} className="btn btn-secondary" style={{ gap: '0.5rem' }}>
            <Edit size={18} /> Chỉnh sửa
          </Link>
          <button
            className="btn btn-danger"
            onClick={handleDeleteClick}
            style={{ gap: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-danger)', border: '1px solid rgba(239, 68, 68, 0.2)' }}
          >
            <Trash2 size={18} /> Xóa
          </button>
        </div>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      <div className="glass-panel" style={{ padding: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem' }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
              Mô tả
            </label>
            <div style={{ fontSize: '1rem', lineHeight: '1.6' }}>
              {type.description || 'Không có mô tả.'}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
              Mã
            </label>
            <div style={{ fontSize: '1.25rem', fontWeight: 500 }}>
              {type.code}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
              Số lượng thiết bị
            </label>
            <div style={{ fontSize: '1.25rem', fontWeight: 500 }}>
              {type.equipmentCount} Mục
            </div>
          </div>

          <div>
            <label style={{ display: 'block', color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
              Trạng thái
            </label>
            <span
              className="badge"
              style={{
                backgroundColor: getStatusBg(type.status),
                color: getStatusColor(type.status),
                fontSize: '0.9rem',
                padding: '0.35em 0.8em'
              }}
            >
              {type.status === 'Active' ? 'Hoạt động' : 'Bị khóa'}
            </span>
          </div>

          <div>
            <label style={{ display: 'block', color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
              Ngày tạo
            </label>
            <div style={{ fontSize: '1rem', color: 'var(--text-main)' }}>
              {new Date(type.createdAt).toLocaleDateString()}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
              Cập nhật lần cuối
            </label>
            <div style={{ fontSize: '1rem', color: 'var(--text-main)' }}>
              {new Date(type.updatedAt).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={!!deleteId}
        title="Xóa Loại Thiết bị"
        message={`Bạn có chắc chắn muốn xóa "${type.name}"? Hành động này không thể hoàn tác.`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteId(null)}
        isDanger
        confirmText="Xóa Loại"
      />
    </div>
  )
}
