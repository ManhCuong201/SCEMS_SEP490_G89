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
            setError(err.response?.data?.message || 'Failed to create department')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1>Create Department</h1>
                    <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>Add a new academic or administrative department</p>
                </div>
            </div>

            {error && <Alert type="error" message={error} onClose={() => setError('')} />}

            <div className="glass-panel" style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem' }}>
                <form onSubmit={handleSubmit} className="form-group">
                    <div className="form-group">
                        <label className="form-label">Department Code (Short Name)</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="e.g. IT, BUS, GS"
                            value={formData.departmentCode}
                            onChange={(e) => setFormData({ ...formData, departmentCode: e.target.value })}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Department Name (Full Name)</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="e.g. Information Technology"
                            value={formData.departmentName}
                            onChange={(e) => setFormData({ ...formData, departmentName: e.target.value })}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Description</label>
                        <textarea
                            className="form-input"
                            rows={4}
                            placeholder="Optional description of the department"
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
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading}
                            style={{ flex: 1 }}
                        >
                            {loading ? 'Creating...' : 'Create Department'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
