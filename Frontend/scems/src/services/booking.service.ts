import api from './api'
import { Booking, CreateBookingRequest, CreateRoomChangeRequest, PaginatedResponse, BookingStatus } from '../types/api'

export const bookingService = {
    async getBookings(pageIndex: number = 1, pageSize: number = 10, search?: string): Promise<PaginatedResponse<Booking>> {
        const { data } = await api.get<PaginatedResponse<Booking>>('/booking', {
            params: { pageIndex, pageSize, search }
        })
        return data
    },

    async getBookingById(id: string): Promise<Booking> {
        const { data } = await api.get<Booking>(`/booking/${id}`)
        return data
    },

    async createBooking(booking: CreateBookingRequest): Promise<Booking> {
        const { data } = await api.post<Booking>('/booking', booking)
        return data
    },

    async updateStatus(id: string, status: BookingStatus): Promise<Booking> {
        const { data } = await api.patch<Booking>(`/booking/${id}/status`, { status })
        return data
    },

    async getRoomSchedule(roomId: string, startDate: string, endDate: string): Promise<Booking[]> {
        const { data } = await api.get<Booking[]>(`/booking/room/${roomId}/schedule`, {
            params: { startDate, endDate }
        })
        return data
    },

    async createRoomChangeRequest(request: CreateRoomChangeRequest): Promise<Booking> {
        const { data } = await api.post<Booking>('/booking/change-room', request)
        return data
    }
}
