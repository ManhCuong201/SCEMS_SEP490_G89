import api from './api'
import { EquipmentType, CreateEquipmentTypeRequest, UpdateEquipmentTypeRequest, PaginatedResponse } from '../types/api'

export const equipmentTypeService = {
  async getEquipmentTypes(pageIndex: number = 1, pageSize: number = 10, search?: string): Promise<PaginatedResponse<EquipmentType>> {
    const { data } = await api.get<PaginatedResponse<EquipmentType>>('/admin/equipment-types', {
      params: { pageIndex, pageSize, search }
    })
    return data
  },

  async getEquipmentTypeById(id: string): Promise<EquipmentType> {
    const { data } = await api.get<EquipmentType>(`/admin/equipment-types/${id}`)
    return data
  },

  async createEquipmentType(type: CreateEquipmentTypeRequest): Promise<EquipmentType> {
    const { data } = await api.post<EquipmentType>('/admin/equipment-types', type)
    return data
  },

  async updateEquipmentType(id: string, type: UpdateEquipmentTypeRequest): Promise<EquipmentType> {
    const { data } = await api.put<EquipmentType>(`/admin/equipment-types/${id}`, type)
    return data
  },

  async deleteEquipmentType(id: string): Promise<void> {
    await api.delete(`/admin/equipment-types/${id}`)
  },

  async updateStatus(id: string, status: number): Promise<void> {
    await api.patch(`/admin/equipment-types/${id}/status`, { status })
  }
}
