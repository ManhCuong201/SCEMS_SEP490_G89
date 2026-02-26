import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { departmentService } from '../../../services/department.service'
import { Alert } from '../../../components/Common/Alert'

export const CreateDepartmentPage: React.FC = () => {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const [formData, setFormData] = useState({
        departmentCode: '',
        departmentName: '',
        description: ''
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            await departmentService.create(formData)
            navigate('/admin/departments')
        } catch (err: any) {
            setError(err.response?.data?.message || 'Thêm tòa nhà thất bại')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1>Thêm Tòa nhà</h1>
                    <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>Thêm tòa nhà mới vào hệ thống</p>
                </div>
            </div>

            {error && <Alert type="error" message={error} onClose={() => setError('')} />}

            <div className="glass-panel" style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem' }}>
                <form onSubmit={handleSubmit} className="form-group">
                    <div className="form-group">
                        <label className="form-label">Mã tòa nhà (Ví dụ: Alpha, Beta)</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Ví dụ: Alpha, Beta"
                            value={formData.departmentCode}
                            onChange={(e) => setFormData({ ...formData, departmentCode: e.target.value })}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Tên tòa nhà (Cách gọi đầy đủ)</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Ví dụ: Tòa nhà Alpha"
                            value={formData.departmentName}
                            onChange={(e) => setFormData({ ...formData, departmentName: e.target.value })}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Mô tả</label>
                        <textarea
                            className="form-input"
                            rows={4}
                            placeholder="Mô tả tòa nhà (tùy chọn)"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => navigate('/admin/departments')}
                            style={{ flex: 1 }}
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading}
                            style={{ flex: 1 }}
                        >
                            {loading ? 'Đang thêm...' : 'Thêm Tòa nhà'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
