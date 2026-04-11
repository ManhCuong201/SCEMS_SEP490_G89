import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { equipmentService } from '../../../services/equipmentService';
import { Equipment, EquipmentStatus } from '../../../types/equipment';
import { Alert } from '../../../components/Common/Alert';
import { Pagination } from '../../../components/Common/Pagination';
import { SearchBar } from '../../../components/Common/SearchBar';
import { DataTable, Column } from '../../../components/Common/DataTable';
import { Edit, Trash2, Upload, FileDown, History } from 'lucide-react';
import { ConfirmModal } from '../../../components/Common/ConfirmModal';
import { EquipmentHistory } from '../../../types/equipment';

export const EquipmentListPage: React.FC = () => {
    const [equipment, setEquipment] = useState<Equipment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | React.ReactNode>('');
    const [success, setSuccess] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [search, setSearch] = useState('');
    const [total, setTotal] = useState(0);
    const [statusFilter, setStatusFilter] = useState('');

    // History states
    const [historyItemId, setHistoryItemId] = useState<string | null>(null);
    const [historyData, setHistoryData] = useState<EquipmentHistory[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    const loadEquipment = async (p: number, s: string, f: string) => {
        setLoading(true);
        setError('');
        try {
            const result = await equipmentService.getAll(p, 10, s || undefined, undefined, f || undefined);
            setEquipment(result.items);
            setTotal(result.total);
            setCurrentPage(p);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Tải danh sách thiết bị thất bại');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadEquipment(1, search, statusFilter);
    }, [search, statusFilter]);

    useEffect(() => {
        if (currentPage !== 1) {
            loadEquipment(currentPage, search, statusFilter);
        }
    }, [currentPage]);

    const [deleteId, setDeleteId] = useState<string | null>(null);

    const handleDeleteClick = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setDeleteId(id);
    };

    const handleConfirmDelete = async () => {
        if (deleteId) {
            try {
                await equipmentService.delete(deleteId);
                setSuccess('Đã xóa thiết bị');
                loadEquipment(currentPage, search, statusFilter);
            } catch (err: any) {
                setError(err.response?.data?.message || 'Xóa thất bại');
            } finally {
                setDeleteId(null);
            }
        }
    };

    const getStatusInfo = (status: EquipmentStatus) => {
        switch (status) {
            case EquipmentStatus.Working:
                return { label: 'Hoạt động', color: 'var(--color-success)', bg: 'rgba(16, 185, 129, 0.1)' };
            case EquipmentStatus.UnderMaintenance:
                return { label: 'Bảo trì', color: 'var(--color-warning)', bg: 'rgba(245, 158, 11, 0.1)' };
            case EquipmentStatus.Faulty:
                return { label: 'Hỏng', color: 'var(--color-danger)', bg: 'rgba(239, 68, 68, 0.1)' };
            case EquipmentStatus.Retired:
                return { label: 'Đã thanh lý', color: 'var(--text-muted)', bg: 'rgba(148, 163, 184, 0.1)' };
            default:
                return { label: status, color: 'var(--text-main)', bg: 'transparent' };
        }
    };

    const columns: Column<Equipment>[] = [
        { header: 'Tên', accessor: 'name' },
        { header: 'Loại', accessor: 'equipmentTypeName' },
        { header: 'Phòng', accessor: (item) => `${item.roomName} (${item.roomCode})` },
        {
            header: 'Trạng thái',
            accessor: (item) => {
                const info = getStatusInfo(item.status);
                return (
                    <span className="badge" style={{ backgroundColor: info.bg, color: info.color }}>
                        {info.label}
                    </span>
                );
            }
        },
        {
            header: 'Hành động',
            accessor: (item) => (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Link
                        to={`/admin/equipment/${item.id}/edit`}
                        className="btn btn-secondary"
                        style={{ padding: '0.4rem', height: 'auto' }}
                        title="Chỉnh sửa thiết bị"
                    >
                        <Edit size={16} />
                    </Link>
                    <button
                        className="btn btn-secondary"
                        onClick={async (e) => {
                            e.stopPropagation();
                            setHistoryItemId(item.id);
                            setHistoryLoading(true);
                            try {
                                const data = await equipmentService.getHistory(item.id);
                                setHistoryData(data);
                            } catch (err: any) {
                                setError('Tải lịch sử thất bại');
                            } finally {
                                setHistoryLoading(false);
                            }
                        }}
                        style={{ padding: '0.4rem', height: 'auto' }}
                        title="Xem lịch sử"
                    >
                        <History size={16} />
                    </button>
                    <button
                        className="btn btn-danger"
                        onClick={(e) => handleDeleteClick(item.id, e)}
                        style={{ padding: '0.4rem', height: 'auto', background: 'rgba(239, 68, 68, 0.2)', color: 'var(--color-danger)', border: 'none' }}
                        title="Xóa thiết bị"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            )
        }
    ];

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1>Thiết bị</h1>
                    <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>Quản lý tất cả tài sản vật chất</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <label className="btn btn-secondary" style={{ cursor: 'pointer', gap: '0.5rem' }}>
                        <Upload size={16} />
                        Nhập Excel
                        <input type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={async (e) => {
                            if (e.target.files && e.target.files[0]) {
                                try {
                                    setLoading(true);
                                    const res = await equipmentService.import(e.target.files[0]);
                                    if (res.failureCount > 0 && res.successCount === 0) {
                                        setError(
                                            <div>
                                                <strong>Import thất bại ({res.failureCount} dòng):</strong>
                                                <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1.25rem', maxHeight: '160px', overflowY: 'auto' }}>
                                                    {res.errors.map((err, i) => <li key={i} style={{ fontSize: '0.85rem' }}>{err}</li>)}
                                                </ul>
                                            </div>
                                        );
                                    } else {
                                        setSuccess(`Đã nhập thành công ${res.successCount} thiết bị.${res.failureCount > 0 ? ` ${res.failureCount} dòng thất bại.` : ''}`);
                                        if (res.errors.length > 0) {
                                            setError(
                                                <div>
                                                    <strong>{res.failureCount} dòng thất bại:</strong>
                                                    <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1.25rem', maxHeight: '160px', overflowY: 'auto' }}>
                                                        {res.errors.map((err, i) => <li key={i} style={{ fontSize: '0.85rem' }}>{err}</li>)}
                                                    </ul>
                                                </div>
                                            );
                                        }
                                        loadEquipment(currentPage, search, statusFilter);
                                    }
                                } catch (err: any) {
                                    setError(err.response?.data?.message || 'Nhập thiết bị thất bại');
                                } finally {
                                    setLoading(false);
                                    e.target.value = '';
                                }
                            }
                        }} />
                    </label>
                    <button className="btn btn-secondary" onClick={() => equipmentService.downloadTemplate()} style={{ gap: '0.5rem' }}>
                        <FileDown size={16} />
                        Biểu mẫu
                    </button>
                    <Link to="/admin/equipment/create" className="btn btn-primary">+ Thêm Thiết bị</Link>
                </div>
            </div>

            {error && <Alert type="error" message={error} onClose={() => setError('')} />}
            {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

            <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1 }}>
                        <SearchBar placeholder="Tìm kiếm thiết bị theo tên, loại hoặc phòng..." onSearch={setSearch} />
                    </div>
                    <select
                        className="form-select"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        style={{ width: '150px' }}
                    >
                        <option value="">Tất cả trạng thái</option>
                        <option value="Working">Hoạt động</option>
                        <option value="UnderMaintenance">Bảo trì</option>
                        <option value="Faulty">Hỏng</option>
                        <option value="Retired">Đã thanh lý</option>
                    </select>
                </div>

                <DataTable
                    columns={columns}
                    data={equipment}
                    isLoading={loading}
                    emptyMessage="Không tìm thấy thiết bị nào."
                />

                {!loading && total > 0 && (
                    <Pagination
                        currentPage={currentPage}
                        totalPages={Math.ceil(total / 10)}
                        onPageChange={(p) => loadEquipment(p, search, statusFilter)}
                        total={total}
                        pageSize={10}
                    />
                )}
            </div>

            <ConfirmModal
                isOpen={!!deleteId}
                title="Xóa thiết bị"
                message="Bạn có chắc chắn muốn xóa thiết bị này không? Hành động này không thể hoàn tác."
                onConfirm={handleConfirmDelete}
                onCancel={() => setDeleteId(null)}
                isDanger
                confirmText="Xóa"
            />

            {/* History Modal */}
            {historyItemId && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: '2rem'
                }} onClick={() => setHistoryItemId(null)}>
                    <div className="glass-panel" style={{
                        width: '100%',
                        maxWidth: '800px',
                        padding: '2rem',
                        maxHeight: '90vh',
                        overflowY: 'auto'
                    }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2>Lịch sử di chuyển</h2>
                            <button className="btn btn-secondary" onClick={() => setHistoryItemId(null)}>Đóng</button>
                        </div>

                        {historyLoading ? (
                            <div style={{ textAlign: 'center', padding: '2rem' }}>Đang tải lịch sử...</div>
                        ) : (
                            <DataTable
                                columns={[
                                    { header: 'Phòng', accessor: (h) => `${h.roomName} (${h.roomCode})` },
                                    { header: 'Đã giao', accessor: (h) => new Date(h.assignedAt).toLocaleString() },
                                    { header: 'Đã thu hồi', accessor: (h) => h.unassignedAt ? new Date(h.unassignedAt).toLocaleString() : 'Hiện tại' },
                                    { header: 'Ghi chú', accessor: 'notes' }
                                ]}
                                data={historyData}
                                emptyMessage="Không tìm thấy lịch sử nào."
                            />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
