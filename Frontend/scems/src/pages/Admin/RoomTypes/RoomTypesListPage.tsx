import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { roomTypeService } from '../../../services/roomType.service'
import { RoomType } from '../../../types/api'
import { Alert } from '../../../components/Common/Alert'
import { DataTable, Column } from '../../../components/Common/DataTable'
import { Edit, Trash2 } from 'lucide-react'
import { ConfirmModal } from '../../../components/Common/ConfirmModal'

export const RoomTypesListPage: React.FC = () => {
    const [types, setTypes] = useState<RoomType[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [deleteId, setDeleteId] = useState<string | null>(null)

    const [deleteMessage, setDeleteMessage] = useState("Bạn có chắc chắn muốn xóa loại phòng này không?")

    const loadTypes = async () => {
        setLoading(true)
        setError('')
        try {
            const result = await roomTypeService.getAll()
            setTypes(result)
        } catch (err: any) {
            setError('Tải danh sách loại phòng thất bại')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadTypes()
    }, [])

    const handleDeleteClick = (type: RoomType, e: React.MouseEvent) => {
        e.stopPropagation()
        setDeleteId(type.id)
        if (type.roomCount > 0) {
            setDeleteMessage(`CẢNH BÁO: Loại phòng này chứa ${type.roomCount} phòng. Xóa loại phòng này sẽ XÓA VĨNH VIỄN tất cả các phòng liên quan. Bạn có chắc chắn không?`)
        } else {
            setDeleteMessage("Bạn có chắc chắn muốn xóa loại phòng này không? Hành động này không thể hoàn tác.")
        }
    }

    const handleConfirmDelete = async () => {
        if (deleteId) {
            try {
                await roomTypeService.delete(deleteId)
                setSuccess('Đã xóa loại phòng')
                loadTypes()
            } catch (err: any) {
                setError(err.response?.data?.message || 'Xóa loại phòng thất bại')
            } finally {
                setDeleteId(null)
            }
        }
    }

    const columns: Column<RoomType>[] = [
        { header: 'Tên', accessor: 'name' },
        { header: 'Mã', accessor: 'code' },
        { header: 'Mô tả', accessor: 'description' },
        {
            header: 'Số phòng',
            accessor: (item) => (
                <span className={`badge ${item.roomCount > 0 ? 'badge-primary' : 'badge-secondary'}`} style={{
                    background: item.roomCount > 0 ? 'var(--primary-100)' : 'var(--slate-100)',
                    color: item.roomCount > 0 ? 'var(--primary-700)' : 'var(--slate-500)'
                }}>
                    {item.roomCount} Phòng
                </span>
            )
        },
        {
            header: 'Hành động',
            accessor: (item) => (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Link
                        to={`/admin/room-types/${item.id}/edit`}
                        className="btn btn-secondary"
                        style={{ padding: '0.4rem', height: 'auto' }}
                        title="Edit"
                    >
                        <Edit size={16} />
                    </Link>
                    <button
                        className="btn btn-danger"
                        onClick={(e) => handleDeleteClick(item, e)}
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
                    <h1>Loại phòng</h1>
                    <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>Quản lý danh mục và phân loại phòng</p>
                </div>
                <Link to="/admin/room-types/create" className="btn btn-primary">+ Thêm Loại phòng</Link>
            </div>

            {error && <Alert type="error" message={error} onClose={() => setError('')} />}
            {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

            <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <DataTable
                    columns={columns}
                    data={types}
                    isLoading={loading}
                    emptyMessage="Không tìm thấy loại phòng nào."
                />
            </div>

            <ConfirmModal
                isOpen={!!deleteId}
                title="Xóa Loại phòng"
                message={deleteMessage}
                onConfirm={handleConfirmDelete}
                onCancel={() => setDeleteId(null)}
                isDanger
                confirmText="Xóa"
            />
        </div>
    )
}
