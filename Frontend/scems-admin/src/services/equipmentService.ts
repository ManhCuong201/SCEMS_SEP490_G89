import api from './api';
import { CreateEquipmentDto, UpdateEquipmentDto, PaginatedEquipment, Equipment, EquipmentStatus } from '../types/equipment';

export const equipmentService = {
    getAll: async (pageIndex = 1, pageSize = 10, search?: string, sortBy?: string): Promise<PaginatedEquipment> => {
        const params = new URLSearchParams({
            pageIndex: pageIndex.toString(),
            pageSize: pageSize.toString(),
        });
        if (search) params.append('search', search);
        if (sortBy) params.append('sortBy', sortBy);

        const response = await api.get<PaginatedEquipment>(`/admin/equipment?${params.toString()}`);
        return response.data;
    },

    getById: async (id: string): Promise<Equipment> => {
        const response = await api.get<Equipment>(`/admin/equipment/${id}`);
        return response.data;
    },

    create: async (data: CreateEquipmentDto): Promise<Equipment> => {
        const response = await api.post<Equipment>('/admin/equipment', data);
        return response.data;
    },

    update: async (id: string, data: UpdateEquipmentDto): Promise<Equipment> => {
        const response = await api.put<Equipment>(`/admin/equipment/${id}`, data);
        return response.data;
    },

    delete: async (id: string): Promise<void> => {
        await api.delete(`/admin/equipment/${id}`);
    },

    updateStatus: async (id: string, status: EquipmentStatus): Promise<void> => {
        await api.patch(`/admin/equipment/${id}/status`, { status });
    },

    import: async (file: File): Promise<{ count: number }> => {
        const formData = new FormData();
        formData.append('file', file);
        const { data } = await api.post<{ count: number }>('/admin/equipment/import', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return data;
    }
};
