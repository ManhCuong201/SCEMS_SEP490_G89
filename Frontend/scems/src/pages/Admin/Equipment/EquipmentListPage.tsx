import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { equipmentService } from '../../../services/equipmentService';
import { Equipment, EquipmentStatus } from '../../../types/equipment';
import { Alert } from '../../../components/Common/Alert';
import { Pagination } from '../../../components/Common/Pagination';
import { SearchBar } from '../../../components/Common/SearchBar';
import { DataTable, Column } from '../../../components/Common/DataTable';
import { Edit, Trash2, Upload, FileDown } from 'lucide-react';
import { ConfirmModal } from '../../../components/Common/ConfirmModal';

export const EquipmentListPage: React.FC = () => {
    const [equipment, setEquipment] = useState<Equipment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [search, setSearch] = useState('');
    const [total, setTotal] = useState(0);
    const [statusFilter, setStatusFilter] = useState('');

    const loadEquipment = async () => {
        setLoading(true);
        setError('');
        try {
            const result = await equipmentService.getAll(currentPage, 10, search || undefined, undefined, statusFilter || undefined);
            setEquipment(result.items);
            setTotal(result.total);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load equipment');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [search, statusFilter]);

    useEffect(() => {
        loadEquipment();
    }, [currentPage, search, statusFilter]);

    const [deleteId, setDeleteId] = useState<string | null>(null);

    const handleDeleteClick = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setDeleteId(id);
    };

    const handleConfirmDelete = async () => {
        if (deleteId) {
            try {
                await equipmentService.delete(deleteId);
                setSuccess('Equipment deleted');
                loadEquipment();
            } catch (err: any) {
                setError(err.response?.data?.message || 'Failed to delete');
            } finally {
                setDeleteId(null);
            }
        }
    };

    const getStatusInfo = (status: EquipmentStatus) => {
        switch (status) {
            case EquipmentStatus.Working:
                return { label: 'Working', color: 'var(--color-success)', bg: 'rgba(16, 185, 129, 0.1)' };
            case EquipmentStatus.UnderMaintenance:
                return { label: 'Maintenance', color: 'var(--color-warning)', bg: 'rgba(245, 158, 11, 0.1)' };
            case EquipmentStatus.Faulty:
                return { label: 'Broken', color: 'var(--color-danger)', bg: 'rgba(239, 68, 68, 0.1)' };
            case EquipmentStatus.Retired:
                return { label: 'Retired', color: 'var(--text-muted)', bg: 'rgba(148, 163, 184, 0.1)' };
            default:
                return { label: status, color: 'var(--text-main)', bg: 'transparent' };
        }
    };

    const columns: Column<Equipment>[] = [
        { header: 'Name', accessor: 'name' },
        { header: 'Type', accessor: 'equipmentTypeName' },
        { header: 'Room', accessor: (item) => `${item.roomName} (${item.roomCode})` },
        {
            header: 'Status',
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
            header: 'Actions',
            accessor: (item) => (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Link
                        to={`/admin/equipment/${item.id}/edit`}
                        className="btn btn-secondary"
                        style={{ padding: '0.4rem', height: 'auto' }}
                        title="Edit Equipment"
                    >
                        <Edit size={16} />
                    </Link>
                    <button
                        className="btn btn-danger"
                        onClick={(e) => handleDeleteClick(item.id, e)}
                        style={{ padding: '0.4rem', height: 'auto', background: 'rgba(239, 68, 68, 0.2)', color: 'var(--color-danger)', border: 'none' }}
                        title="Delete Equipment"
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
                    <h1>Equipment</h1>
                    <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>Manage all physical assets</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <label className="btn btn-secondary" style={{ cursor: 'pointer', gap: '0.5rem' }}>
                        <Upload size={16} />
                        Import Excel
                        <input type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={async (e) => {
                            if (e.target.files && e.target.files[0]) {
                                try {
                                    setLoading(true);
                                    const res = await equipmentService.import(e.target.files[0]);
                                    setSuccess(`Successfully imported ${res.count} items`);
                                    loadEquipment();
                                } catch (err: any) {
                                    setError(err.response?.data?.message || 'Failed to import');
                                } finally {
                                    setLoading(false);
                                    e.target.value = '';
                                }
                            }
                        }} />
                    </label>
                    <button className="btn btn-secondary" onClick={() => equipmentService.downloadTemplate()} style={{ gap: '0.5rem' }}>
                        <FileDown size={16} />
                        Template
                    </button>
                    <Link to="/admin/equipment/create" className="btn btn-primary">+ New Equipment</Link>
                </div>
            </div>

            {error && <Alert type="error" message={error} onClose={() => setError('')} />}
            {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

            <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1 }}>
                        <SearchBar placeholder="Search equipment by name, type or room..." onSearch={setSearch} />
                    </div>
                    <select
                        className="form-select"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        style={{ width: '150px' }}
                    >
                        <option value="">All Status</option>
                        <option value="Working">Working</option>
                        <option value="UnderMaintenance">Maintenance</option>
                        <option value="Faulty">Broken</option>
                        <option value="Retired">Retired</option>
                    </select>
                </div>

                <DataTable
                    columns={columns}
                    data={equipment}
                    isLoading={loading}
                    emptyMessage="No equipment found."
                />

                {!loading && total > 0 && (
                    <Pagination
                        currentPage={currentPage}
                        totalPages={Math.ceil(total / 10)}
                        onPageChange={setCurrentPage}
                        total={total}
                        pageSize={10}
                    />
                )}
            </div>

            <ConfirmModal
                isOpen={!!deleteId}
                title="Delete Equipment"
                message="Are you sure you want to delete this equipment? This action cannot be undone."
                onConfirm={handleConfirmDelete}
                onCancel={() => setDeleteId(null)}
                isDanger
                confirmText="Delete"
            />
        </div>
    );
};
