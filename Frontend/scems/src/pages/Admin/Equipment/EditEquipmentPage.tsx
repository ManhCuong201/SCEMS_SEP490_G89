import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { equipmentService } from '../../../services/equipmentService';
import { roomService } from '../../../services/room.service';
import { equipmentTypeService } from '../../../services/equipment-type.service';
import { EquipmentStatus } from '../../../types/equipment';
import { Alert } from '../../../components/Common/Alert';
import { Loading } from '../../../components/Common/Loading';

export const EditEquipmentPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [form, setForm] = useState({
        name: '',
        roomId: '',
        status: EquipmentStatus.Working
    });
    const [currentType, setCurrentType] = useState('');

    // Equipment Type cannot be changed after creation typically, or API doesn't support it in UpdateDto
    // UpdateDto only has RoomId and Status. So we only show Type as readonly or info.

    const [rooms, setRooms] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                if (!id) return;
                const [equipment, roomsRes] = await Promise.all([
                    equipmentService.getById(id),
                    roomService.getRooms(1, 100)
                ]);

                setForm({
                    name: equipment.name,
                    roomId: equipment.roomId,
                    status: equipment.status
                });
                setCurrentType(equipment.equipmentTypeName);
                setRooms(roomsRes.items);
            } catch (err: any) {
                setError('Failed to load data');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id) return;
        setError('');
        setSubmitting(true);

        try {
            await equipmentService.update(id, form);
            navigate('/admin/equipment');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to update');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <Loading />;

    return (
        <div className="page-container">
            <h1 style={{ marginBottom: 'var(--spacing-lg)' }}>Edit Equipment</h1>
            {error && <Alert type="error" message={error} onClose={() => setError('')} />}

            <div className="card" style={{ maxWidth: '500px' }}>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Name</label>
                        <input type="text" name="name" className="form-input" value={form.name} onChange={handleChange} disabled={submitting} />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Equipment Type</label>
                        <input type="text" className="form-input" value={currentType} disabled />
                        <small style={{ color: 'var(--color-text-secondary)' }}>Type cannot be changed</small>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Room *</label>
                        <select name="roomId" className="form-select" value={form.roomId} onChange={handleChange} required disabled={submitting}>
                            {rooms.map(r => <option key={r.id} value={r.id}>{r.roomName} ({r.roomCode})</option>)}
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Status</label>
                        <select name="status" className="form-select" value={form.status} onChange={handleChange} disabled={submitting}>
                            <option value={EquipmentStatus.Working}>Working</option>
                            <option value={EquipmentStatus.UnderMaintenance}>Maintenance</option>
                            <option value={EquipmentStatus.Faulty}>Broken</option>
                            <option value={EquipmentStatus.Retired}>Retired</option>
                        </select>
                    </div>

                    <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
                        <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Saving...' : 'Save Changes'}</button>
                        <button type="button" className="btn btn-secondary" onClick={() => navigate('/admin/equipment')} disabled={submitting}>Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    );
};
