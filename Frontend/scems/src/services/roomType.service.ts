import api from './api'
import { RoomType, CreateRoomTypeRequest, UpdateRoomTypeRequest } from '../types/api'

export const roomTypeService = {
    getAll: async (): Promise<RoomType[]> => {
        const response = await api.get<RoomType[]>('/room-types')
        return response.data
    },

    getById: async (id: string): Promise<RoomType> => {
        const response = await api.get<RoomType>(`/room-types/${id}`)
        return response.data
    },

    create: async (data: CreateRoomTypeRequest): Promise<RoomType> => {
        const response = await api.post<RoomType>('/room-types', data)
        return response.data
    },

    update: async (id: string, data: UpdateRoomTypeRequest): Promise<RoomType> => {
        const response = await api.put<RoomType>(`/room-types/${id}`, data)
        return response.data
    },

    delete: async (id: string): Promise<void> => {
        await api.delete(`/room-types/${id}`)
    }
}
