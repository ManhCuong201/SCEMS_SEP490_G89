import api from './api'
import { Room, CreateRoomRequest, UpdateRoomRequest, PaginatedResponse, RoomLiveStatusDto } from '../types/api'

export const roomService = {
  async getRooms(pageIndex: number = 1, pageSize: number = 10, search?: string, sortBy?: string, departmentId?: string, roomTypeId?: string): Promise<PaginatedResponse<Room>> {
    const { data } = await api.get<PaginatedResponse<Room>>('/admin/rooms', {
      params: { pageIndex, pageSize, search, sortBy, departmentId, roomTypeId }
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

  async import(file: File): Promise<{ successCount: number; failureCount: number; errors: string[] }> {
    const formData = new FormData()
    formData.append('file', file)
    const { data } = await api.post<{ successCount: number; failureCount: number; errors: string[] }>('/admin/rooms/import', formData, {
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
  },

  async getAllRoomsBatched(
    onBatch?: (rooms: Room[]) => void,
    pageSize: number = 50,
    search?: string,
    departmentId?: string
  ): Promise<Room[]> {
    let allRooms: Room[] = []
    let pageIndex = 1
    let totalPages = 1

    try {
      // First request to get total pages and the first batch
      const firstPage = await this.getRooms(pageIndex, pageSize, search, undefined, departmentId)
      allRooms = [...firstPage.items]
      totalPages = Math.ceil(firstPage.total / pageSize)

      if (onBatch) {
        onBatch([...allRooms])
      }

      // Fetch remaining pages SEQUENTIALLY to avoid overloading or timeouts
      for (let p = 2; p <= totalPages; p++) {
        const response = await this.getRooms(p, pageSize, search, undefined, departmentId)
        allRooms = [...allRooms, ...response.items]
        if (onBatch) {
          onBatch([...allRooms])
        }
      }

      return allRooms
    } catch (error) {
      console.error('Error fetching rooms in batches:', error)
      throw error
    }
  },

  async getRoomsLiveStatus(): Promise<RoomLiveStatusDto[]> {
    const { data } = await api.get<RoomLiveStatusDto[]>('/admin/rooms/live-status')
    return data
  }
}
