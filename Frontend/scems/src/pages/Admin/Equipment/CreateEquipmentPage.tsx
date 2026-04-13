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
        name: '',
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
                setError('Tải dữ liệu thất bại');
            }
        };
        fetchData();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const validateForm = () => {
        if (!form.name.trim()) {
            setError('Tên thiết bị (Định danh) là bắt buộc');
            return false;
        }
        if (!form.equipmentTypeId) {
            setError('Loại thiết bị là bắt buộc');
            return false;
        }
        if (!form.roomId) {
            setError('Phòng là bắt buộc');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        if (!validateForm()) return;
        
        setLoading(true);

        try {
            await equipmentService.create(form);
            navigate('/admin/equipment', { state: { successMessage: 'Thêm thiết bị thành công' } });
        } catch (err: any) {
            setError(err.response?.data?.message || 'Thêm thiết bị thất bại');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-container">
            <h1 style={{ marginBottom: 'var(--spacing-lg)' }}>Thêm Thiết bị</h1>
            {error && <Alert type="error" message={error} onClose={() => setError('')} />}

            <div className="card" style={{ maxWidth: '500px' }}>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Tên / Số sê-ri <span style={{ color: 'red' }}>*</span></label>
                        <input 
                            type="text" 
                            name="name" 
                            className="form-input" 
                            value={form.name} 
                            onChange={handleChange} 
                            placeholder="Ví dụ: LCD-001 hoặc Serial Number" 
                            disabled={loading} 
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Loại Thiết bị *</label>
                        <select name="equipmentTypeId" className="form-select" value={form.equipmentTypeId} onChange={handleChange} required disabled={loading}>
                            <option value="" disabled>Chọn Loại</option>
                            {equipmentTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Phòng *</label>
                        <select name="roomId" className="form-select" value={form.roomId} onChange={handleChange} required disabled={loading}>
                            <option value="" disabled>Chọn Phòng</option>
                            {rooms.map(r => <option key={r.id} value={r.id}>{r.roomName} ({r.roomCode})</option>)}
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Trạng thái</label>
                        <select name="status" className="form-select" value={form.status} onChange={handleChange} disabled={loading}>
                            <option value={EquipmentStatus.Working}>Hoạt động</option>
                            <option value={EquipmentStatus.UnderMaintenance}>Bảo trì</option>
                            <option value={EquipmentStatus.Faulty}>Hỏng</option>
                            <option value={EquipmentStatus.Retired}>Đã thanh lý</option>
                        </select>
                    </div>

                    <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
                        <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Đang thêm...' : 'Thêm'}</button>
                        <button type="button" className="btn btn-secondary" onClick={() => navigate('/admin/equipment')} disabled={loading}>Hủy</button>
                    </div>
                </form>
            </div>
        </div>
    );
};
