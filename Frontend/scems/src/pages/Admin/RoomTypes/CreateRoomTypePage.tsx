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
            setError(err.response?.data?.message || 'Failed to create room type')
            setLoading(false)
        }
    }

    return (
        <div className="page-container" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ marginBottom: '2rem' }}>
                <Link to="/admin/room-types" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                    <ArrowLeft size={20} /> Back to List
                </Link>
                <h1>Create Room Type</h1>
            </div>

            {error && <Alert type="error" message={error} onClose={() => setError('')} />}

            <div className="glass-panel" style={{ padding: '2rem' }}>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Name</label>
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
                            placeholder="e.g. Laboratory, Lecture Hall"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Code (Optional)</label>
                        <input
                            type="text"
                            className="form-input"
                            value={formData.code}
                            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                            placeholder="Auto-generated if left empty"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Description</label>
                        <textarea
                            className="form-textarea"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Description of this room category..."
                        />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                        <Link to="/admin/room-types" className="btn btn-secondary">Cancel</Link>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Creating...' : 'Create Room Type'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
