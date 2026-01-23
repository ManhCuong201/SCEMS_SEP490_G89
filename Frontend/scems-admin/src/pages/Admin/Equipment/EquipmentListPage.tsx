import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { equipmentService } from '../../../services/equipmentService';
import { Equipment, EquipmentStatus } from '../../../types/equipment';
import { Alert } from '../../../components/Common/Alert';
import { Loading } from '../../../components/Common/Loading';
import { Pagination } from '../../../components/Common/Pagination';
import { SearchBar } from '../../../components/Common/SearchBar';

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

    const handleDelete = async (id: string) => {
        if (confirm('Delete this equipment?')) {
            try {
                await equipmentService.delete(id);
                setSuccess('Equipment deleted');
                loadEquipment();
            } catch (err: any) {
                setError(err.response?.data?.message || 'Failed to delete');
            }
        }
    };

    const handleStatusChange = async (id: string, newStatus: string) => {
        try {
            const statusValue = EquipmentStatus[newStatus as keyof typeof EquipmentStatus];
            await equipmentService.updateStatus(id, statusValue);
            setSuccess('Status updated');
            loadEquipment();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to update');
        }
    };

    const getStatusBadgeClass = (status: EquipmentStatus) => {
        switch (status) {
            case EquipmentStatus.Working: return 'badge badge-success';
            case EquipmentStatus.UnderMaintenance: return 'badge badge-warning';
            case EquipmentStatus.Faulty: return 'badge badge-danger';
            case EquipmentStatus.Retired: return 'badge badge-secondary';
            default: return 'badge';
        }
    };

    const getStatusLabel = (status: EquipmentStatus) => {
        switch (status) {
            case EquipmentStatus.UnderMaintenance: return 'Maintenance';
            case EquipmentStatus.Faulty: return 'Broken';
            default: return status;
        }
    }

    return (
        <div className="page-container">
            <div className="card-header" style={{ marginBottom: 'var(--spacing-lg)' }}>
                <h1>Equipment</h1>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
                        Import Excel
                        <input type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={async (e) => {
                            if (e.target.files && e.target.files[0]) {
                                try {
                                    setLoading(true);
                                    const res = await equipmentService.import(e.target.files[0]);
                                    setSuccess(`Successfully imported ${res.count} equipment items`);
                                    loadEquipment();
                                } catch (err: any) {
                                    setError(err.response?.data?.message || 'Failed to import');
                                } finally {
                                    setLoading(false);
                                    e.target.value = ''; // Reset
                                }
                            }
                        }} />
                    </label>
                    <button className="btn btn-secondary" onClick={() => equipmentService.downloadTemplate()}>
                        Download Template
                    </button>
                    <Link to="/admin/equipment/create" className="btn btn-primary">+ New</Link>
                </div>
            </div>

            {error && <Alert type="error" message={error} onClose={() => setError('')} />}
            {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

            <div className="card">
                <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
                    <SearchBar placeholder="Search Type or Room..." onSearch={setSearch} />
                    <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ width: '150px' }}>
                        <option value="">All</option>
                        <option value="Working">Working</option>
                        <option value="UnderMaintenance">Maintenance</option>
                        <option value="Faulty">Broken</option>
                        <option value="Retired">Retired</option>
                    </select>
                </div>
            </div>

            {loading ? <Loading /> : (
                <>
                    <div className="table-responsive card">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Type</th>
                                    <th>Room</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {equipment.map(item => (
                                    <tr key={item.id}>
                                        <td>{item.name}</td>
                                        <td>{item.equipmentTypeName}</td>
                                        <td>{item.roomName} ({item.roomCode})</td>
                                        <td>
                                            <span className={`status-badge status-${item.status.toLowerCase()}`}>
                                                {getStatusLabel(item.status)}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="action-buttons" style={{ display: 'flex', gap: '8px' }}>
                                                <Link to={`/admin/equipment/${item.id}/edit`} className="btn btn-sm btn-secondary" title="Edit">
                                                    Edit
                                                </Link>
                                                <button onClick={() => handleDelete(item.id)} className="btn btn-sm btn-danger" title="Delete">
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                        <Pagination currentPage={currentPage} totalPages={Math.ceil(total / 10)} onPageChange={setCurrentPage} total={total} pageSize={10} />
                    </>
                )}
        </div>
    );
};
