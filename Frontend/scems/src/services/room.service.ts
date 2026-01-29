import api from './api'
import { Room, CreateRoomRequest, UpdateRoomRequest, PaginatedResponse } from '../types/api'

export const roomService = {
  async getRooms(pageIndex: number = 1, pageSize: number = 10, search?: string): Promise<PaginatedResponse<Room>> {
    const { data } = await api.get<PaginatedResponse<Room>>('/admin/rooms', {
      params: { pageIndex, pageSize, search }
    })
    return data
  },

  async getRoomById(id: string): Promise<Room> {
    const { data } = await api.get<Room>(`/admin/rooms/${id}`)
    return data
  },

  async createRoom(room: CreateRoomRequest): Promise<Room> {
    const { data } = await api.post<Room>('/admin/rooms', room)
    return data
  },

  async updateRoom(id: string, room: UpdateRoomRequest): Promise<Room> {
    const { data } = await api.put<Room>(`/admin/rooms/${id}`, room)
    return data
  },

  async deleteRoom(id: string): Promise<void> {
    await api.delete(`/admin/rooms/${id}`)
  },

  async updateStatus(id: string, status: number): Promise<void> {
    await api.patch(`/admin/rooms/${id}/status`, { status })
  },

  async import(file: File): Promise<{ count: number }> {
    const formData = new FormData()
    formData.append('file', file)
    const { data } = await api.post<{ count: number }>('/admin/rooms/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return data
  },

  async downloadTemplate(): Promise<void> {
    const response = await api.get('/admin/rooms/template', { responseType: 'blob' })
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'RoomTemplate.xlsx')
    document.body.appendChild(link)
    link.click()
    link.remove()
  }
}
