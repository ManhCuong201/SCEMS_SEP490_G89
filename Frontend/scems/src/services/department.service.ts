import apiClient from './api';
import { Department } from '../types/api';

export interface CreateDepartmentDto {
    departmentCode: string;
    departmentName: string;
    description?: string;
}

export interface UpdateDepartmentDto extends CreateDepartmentDto { }

export const departmentService = {
    getAll: async (): Promise<Department[]> => {
        const response = await apiClient.get<Department[]>('/departments');
        return response.data;
    },

    getById: async (id: string): Promise<Department> => {
        const response = await apiClient.get<Department>(`/departments/${id}`);
        return response.data;
    },

    create: async (data: CreateDepartmentDto): Promise<Department> => {
        const response = await apiClient.post<Department>('/departments', data);
        return response.data;
    },

    update: async (id: string, data: UpdateDepartmentDto): Promise<void> => {
        await apiClient.put(`/departments/${id}`, data);
    },

    delete: async (id: string): Promise<void> => {
        await apiClient.delete(`/departments/${id}`);
    }
};
