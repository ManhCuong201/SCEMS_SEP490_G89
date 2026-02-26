import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { departmentService } from '../../../services/department.service'
import { Alert } from '../../../components/Common/Alert'
import { Loading } from '../../../components/Common/Loading'

export const EditDepartmentPage: React.FC = () => {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    const [formData, setFormData] = useState({
        departmentCode: '',
        departmentName: '',
        description: ''
    })

    useEffect(() => {
        const loadDepartment = async () => {
            if (!id) return
            try {
                const dept = await departmentService.getById(id)
                setFormData({
                    departmentCode: dept.departmentCode,
                    departmentName: dept.departmentName,
                    description: dept.description || ''
                })
            } catch (err: any) {
                setError('Tải chi tiết tòa nhà thất bại')
            } finally {
                setLoading(false)
            }
        }
        loadDepartment()
    }, [id])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!id) return
        setSaving(true)
        setError('')

        try {
            await departmentService.update(id, formData)
            navigate('/admin/departments')
        } catch (err: any) {
            setError(err.response?.data?.message || 'Cập nhật tòa nhà thất bại')
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <Loading />

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1>Chỉnh sửa Tòa nhà</h1>
                    <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>Cập nhật thông tin tòa nhà</p>
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
                            disabled={saving}
                            style={{ flex: 1 }}
                        >
                            {saving ? 'Đang lưu...' : 'Lưu Thay đổi'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
