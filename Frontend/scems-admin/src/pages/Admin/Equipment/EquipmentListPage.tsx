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
            const result = await equipmentService.getAll(currentPage, 10, search || undefined);
            let filtered = result.items;
            if (statusFilter) {
                // Handle Enum check properly, or assume backend filters. Backend sorts but maybe not filters strictly by status in getAll? 
                // Backend search handles string match. Status filtering might need to be added to backend or client side.
                // For consistent behavior with RoomList, client side filter on current page items:
                filtered = result.items.filter(e => EquipmentStatus[e.status] === statusFilter);
            }
            setEquipment(filtered);
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
            case EquipmentStatus.Maintenance: return 'badge badge-warning';
            case EquipmentStatus.Broken: return 'badge badge-danger';
            case EquipmentStatus.Retired: return 'badge badge-secondary';
            default: return 'badge';
        }
    };

    const getStatusLabel = (status: EquipmentStatus) => {
        return EquipmentStatus[status];
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
                        <option value="Maintenance">Maintenance</option>
                        <option value="Broken">Broken</option>
                        <option value="Retired">Retired</option>
                    </select>
                </div>

                {loading ? <Loading /> : equipment.length === 0 ? <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)' }}>No equipment found</p> : (
                    <>
                        <div className="table-wrapper">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Type</th>
                                        <th>Room</th>
                                        <th>Status</th>
                                        <th>Created</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {equipment.map((e) => (
                                        <tr key={e.id}>
                                            <td>{e.equipmentTypeName}</td>
                                            <td>{e.roomName}</td>
                                            <td>
                                                <select
                                                    value={EquipmentStatus[e.status]}
                                                    onChange={(ev) => handleStatusChange(e.id, ev.target.value)}
                                                    style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--color-border)' }}
                                                >
                                                    <option value="Working">Working</option>
                                                    <option value="Maintenance">Maintenance</option>
                                                    <option value="Broken">Broken</option>
                                                    <option value="Retired">Retired</option>
                                                </select>
                                            </td>
                                            <td>{new Date(e.createdAt).toLocaleDateString()}</td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '4px' }}>
                                                    <Link to={`/admin/equipment/${e.id}/edit`} className="btn btn-sm btn-secondary">Edit</Link>
                                                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(e.id)}>Del</button>
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
        </div>
    );
};
