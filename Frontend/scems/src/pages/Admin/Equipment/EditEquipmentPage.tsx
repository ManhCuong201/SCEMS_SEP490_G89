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
        status: EquipmentStatus.Working,
        note: ''
    });
    const [originalRoomId, setOriginalRoomId] = useState('');
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
                    status: equipment.status,
                    note: '',
                });
                setOriginalRoomId(equipment.roomId);
                setCurrentType(equipment.equipmentTypeName);
                setRooms(roomsRes.items);
            } catch (err: any) {
                setError('Tải dữ liệu thất bại');
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

    const validateForm = () => {
        if (!form.name || !form.name.trim()) {
            setError('Tên thiết bị là bắt buộc');
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
        if (!id) return;
        setError('');

        if (!validateForm()) return;

        setSubmitting(true);

        try {
            await equipmentService.update(id, form);
            navigate('/admin/equipment');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Cập nhật thất bại');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <Loading />;

    return (
        <div className="page-container">
            <h1 style={{ marginBottom: 'var(--spacing-lg)' }}>Chỉnh sửa Thiết bị</h1>
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
                            disabled={submitting} 
                            required 
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Loại Thiết bị</label>
                        <input type="text" className="form-input" value={currentType} disabled />
                        <small style={{ color: 'var(--color-text-secondary)' }}>Loại không thể thay đổi</small>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Phòng *</label>
                        <select name="roomId" className="form-select" value={form.roomId} onChange={handleChange} required disabled={submitting}>
                            {rooms.map(r => <option key={r.id} value={r.id}>{r.roomName} ({r.roomCode})</option>)}
                        </select>
                    </div>

                    {form.roomId !== originalRoomId && (
                        <div className="form-group">
                            <label className="form-label">Ghi chú di chuyển (Tùy chọn)</label>
                            <input type="text" name="note" className="form-input" placeholder="Lý do di chuyển..." value={form.note} onChange={handleChange} disabled={submitting} />
                            <small style={{ color: 'var(--color-text-secondary)' }}>Ví dụ: Hỏng ở phòng cũ, giáo viên yêu cầu, v.v.</small>
                        </div>
                    )}

                    <div className="form-group">
                        <label className="form-label">Trạng thái</label>
                        <select name="status" className="form-select" value={form.status} onChange={handleChange} disabled={submitting}>
                            <option value={EquipmentStatus.Working}>Hoạt động</option>
                            <option value={EquipmentStatus.UnderMaintenance}>Bảo trì</option>
                            <option value={EquipmentStatus.Faulty}>Hỏng</option>
                            <option value={EquipmentStatus.Retired}>Đã thanh lý</option>
                        </select>
                    </div>

                    <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
                        <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Đang lưu...' : 'Lưu Thay đổi'}</button>
                        <button type="button" className="btn btn-secondary" onClick={() => navigate('/admin/equipment')} disabled={submitting}>Hủy</button>
                    </div>
                </form>
            </div>
        </div>
    );
};
