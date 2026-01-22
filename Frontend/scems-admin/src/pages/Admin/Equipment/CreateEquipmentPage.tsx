import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { equipmentService } from '../../../services/equipmentService';
import { roomService } from '../../../services/room.service';
import { equipmentTypeService } from '../../../services/equipment-type.service';
import { EquipmentStatus } from '../../../types/equipment';
import { Alert } from '../../../components/Common/Alert';

export const CreateEquipmentPage: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [form, setForm] = useState({
        equipmentTypeId: '',
        roomId: '',
        status: EquipmentStatus.Working
    });

    const [equipmentTypes, setEquipmentTypes] = useState<any[]>([]);
    const [rooms, setRooms] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [typesRes, roomsRes] = await Promise.all([
                    equipmentTypeService.getEquipmentTypes(1, 100), // Fetch enough for demo
                    roomService.getRooms(1, 100)
                ]);
                setEquipmentTypes(typesRes.items);
                setRooms(roomsRes.items);
                if (typesRes.items.length > 0) setForm(curr => ({ ...curr, equipmentTypeId: typesRes.items[0].id }));
                if (roomsRes.items.length > 0) setForm(curr => ({ ...curr, roomId: roomsRes.items[0].id }));
            } catch (err) {
                setError('Failed to load dependency data');
            }
        };
        fetchData();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: name === 'status' ? parseInt(value) : value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await equipmentService.create(form);
            navigate('/admin/equipment');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to create');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-container">
            <h1 style={{ marginBottom: 'var(--spacing-lg)' }}>Add Equipment</h1>
            {error && <Alert type="error" message={error} onClose={() => setError('')} />}

            <div className="card" style={{ maxWidth: '500px' }}>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Equipment Type *</label>
                        <select name="equipmentTypeId" className="form-select" value={form.equipmentTypeId} onChange={handleChange} required disabled={loading}>
                            <option value="" disabled>Select Type</option>
                            {equipmentTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Room *</label>
                        <select name="roomId" className="form-select" value={form.roomId} onChange={handleChange} required disabled={loading}>
                            <option value="" disabled>Select Room</option>
                            {rooms.map(r => <option key={r.id} value={r.id}>{r.roomName} ({r.roomCode})</option>)}
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Status</label>
                        <select name="status" className="form-select" value={form.status} onChange={handleChange} disabled={loading}>
                            <option value={EquipmentStatus.Working}>Working</option>
                            <option value={EquipmentStatus.Maintenance}>Maintenance</option>
                            <option value={EquipmentStatus.Broken}>Broken</option>
                            <option value={EquipmentStatus.Retired}>Retired</option>
                        </select>
                    </div>

                    <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
                        <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Creating...' : 'Create'}</button>
                        <button type="button" className="btn btn-secondary" onClick={() => navigate('/admin/equipment')} disabled={loading}>Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    );
};
