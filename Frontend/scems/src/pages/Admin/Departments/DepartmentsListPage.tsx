import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { departmentService } from '../../../services/department.service'
import { Department } from '../../../types/api'
import { Alert } from '../../../components/Common/Alert'
import { DataTable, Column } from '../../../components/Common/DataTable'
import { Edit, Trash2, Plus } from 'lucide-react'
import { ConfirmModal } from '../../../components/Common/ConfirmModal'

export const DepartmentsListPage: React.FC = () => {
    const [departments, setDepartments] = useState<Department[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [deleteId, setDeleteId] = useState<string | null>(null)

    const loadDepartments = async () => {
        setLoading(true)
        setError('')
        try {
            const result = await departmentService.getAll()
            setDepartments(result)
        } catch (err: any) {
            setError('Failed to load departments')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadDepartments()
    }, [])

    const handleConfirmDelete = async () => {
        if (deleteId) {
            try {
                await departmentService.delete(deleteId)
                setSuccess('Department deleted successfully')
                loadDepartments()
            } catch (err: any) {
                setError(err.response?.data?.message || 'Failed to delete department')
            } finally {
                setDeleteId(null)
            }
        }
    }

    const columns: Column<Department>[] = [
        { header: 'Code', accessor: 'departmentCode' },
        { header: 'Name', accessor: 'departmentName' },
        { header: 'Description', accessor: 'description' },
        {
            header: 'Actions',
            accessor: (item) => (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Link
                        to={`/admin/departments/${item.id}/edit`}
                        className="btn btn-secondary"
                        style={{ padding: '0.4rem', height: 'auto' }}
                        title="Edit"
                    >
                        <Edit size={16} />
                    </Link>
                    <button
                        className="btn btn-danger"
                        onClick={() => setDeleteId(item.id)}
                        style={{ padding: '0.4rem', height: 'auto', background: 'rgba(239, 68, 68, 0.2)', color: 'var(--color-danger)', border: 'none' }}
                        title="Delete"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            )
        }
    ]

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1>Departments</h1>
                    <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>Manage academic and administrative departments</p>
                </div>
                <Link to="/admin/departments/create" className="btn btn-primary">
                    <Plus size={18} style={{ marginRight: '0.5rem' }} /> New Department
                </Link>
            </div>

            {error && <Alert type="error" message={error} onClose={() => setError('')} />}
            {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

            <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <DataTable
                    columns={columns}
                    data={departments}
                    isLoading={loading}
                    emptyMessage="No departments found."
                />
            </div>

            <ConfirmModal
                isOpen={!!deleteId}
                title="Delete Department"
                message="Are you sure you want to delete this department? This action cannot be undone."
                onConfirm={handleConfirmDelete}
                onCancel={() => setDeleteId(null)}
                isDanger
            />
        </div>
    )
}
