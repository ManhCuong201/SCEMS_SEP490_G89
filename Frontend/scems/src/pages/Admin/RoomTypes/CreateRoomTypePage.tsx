import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { roomTypeService } from '../../../services/roomType.service'
import { Alert } from '../../../components/Common/Alert'
import { ArrowLeft } from 'lucide-react'

export const CreateRoomTypePage: React.FC = () => {
    const navigate = useNavigate()
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        description: ''
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            await roomTypeService.create(formData)
            navigate('/admin/room-types')
        } catch (err: any) {
            setError(err.response?.data?.message || 'Thêm loại phòng thất bại')
            setLoading(false)
        }
    }

    return (
        <div className="page-container" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ marginBottom: '2rem' }}>
                <Link to="/admin/room-types" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                    <ArrowLeft size={20} /> Quay lại danh sách
                </Link>
                <h1>Thêm Loại phòng</h1>
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
                            onChange={(e) => {
                                const newName = e.target.value;
                                setFormData(prev => ({
                                    ...prev,
                                    name: newName,
                                    code: !prev.code ? newName.toUpperCase().replace(/\s+/g, '-').replace(/[^A-Z0-9-]/g, '') : prev.code
                                }))
                            }}
                            required
                            placeholder="Ví dụ: Phòng thí nghiệm, Giảng đường"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Mã (Tùy chọn)</label>
                        <input
                            type="text"
                            className="form-input"
                            value={formData.code}
                            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                            placeholder="Tự động tạo nếu để trống"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Mô tả</label>
                        <textarea
                            className="form-textarea"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Mô tả về loại phòng này..."
                        />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                        <Link to="/admin/room-types" className="btn btn-secondary">Hủy</Link>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Đang thêm...' : 'Thêm Loại phòng'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
