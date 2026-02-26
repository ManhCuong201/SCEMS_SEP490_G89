import React, { useEffect, useState } from 'react'
import { useNavigate, Link, useParams } from 'react-router-dom'
import { roomTypeService } from '../../../services/roomType.service'
import { Alert } from '../../../components/Common/Alert'
import { ArrowLeft } from 'lucide-react'

export const EditRoomTypePage: React.FC = () => {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        description: ''
    })
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        const loadData = async () => {
            if (!id) return
            try {
                const data = await roomTypeService.getById(id)
                setFormData({
                    name: data.name,
                    code: data.code,
                    description: data.description || ''
                })
            } catch (err: any) {
                setError('Tải chi tiết loại phòng thất bại')
            } finally {
                setLoading(false)
            }
        }
        loadData()
    }, [id])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!id) return

        setSaving(true)
        setError('')

        try {
            await roomTypeService.update(id, formData)
            navigate('/admin/room-types')
        } catch (err: any) {
            setError(err.response?.data?.message || 'Cập nhật loại phòng thất bại')
            setSaving(false)
        }
    }

    if (loading) return <div className="page-container">Đang tải...</div>

    return (
        <div className="page-container" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ marginBottom: '2rem' }}>
                <Link to="/admin/room-types" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                    <ArrowLeft size={20} /> Quay lại danh sách
                </Link>
                <h1>Chỉnh sửa Loại phòng</h1>
            </div>

            {error && <Alert type="error" message={error} onClose={() => setError('')} />}

            <div className="glass-panel" style={{ padding: '2rem' }}>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Tên loại phòng</label>
                        <input
                            type="text"
                            className="form-input"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Mã</label>
                        <input
                            type="text"
                            className="form-input"
                            value={formData.code}
                            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Mô tả</label>
                        <textarea
                            className="form-textarea"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                        <Link to="/admin/room-types" className="btn btn-secondary">Hủy</Link>
                        <button type="submit" className="btn btn-primary" disabled={saving}>
                            {saving ? 'Đang lưu...' : 'Lưu Thay đổi'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
