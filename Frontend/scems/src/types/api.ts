export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  expiresIn: number
  id: string
  role: string
  email: string
  fullName: string
}

export enum AccountStatus {
  Active = "Active",
  Blocked = "Blocked"
}

export interface Account {
  id: string
  fullName: string
  email: string
  phone: string
  role: string
  status: AccountStatus
  studentCode?: string
  createdAt: string
  updatedAt: string
}

export interface CreateAccountRequest {
  fullName: string
  email: string
  phone: string
  password: string
  role: string
  studentCode?: string
}

export interface UpdateAccountRequest {
  fullName: string
  email: string
  phone: string
  role: string
  studentCode?: string
}

export interface Room {
  id: string
  roomCode: string
  roomName: string
  capacity: number
  equipmentCount: number
  pendingRequestsCount: number
  status: string
  createdAt: string
  updatedAt: string
}

export interface CreateRoomRequest {
  roomCode: string
  roomName: string
  capacity: number
}

export interface UpdateRoomRequest {
  roomCode: string
  roomName: string
  capacity: number
}

export interface EquipmentType {
  id: string
  name: string
  description: string
  equipmentCount: number
  status: string
  createdAt: string
  updatedAt: string
}

export interface CreateEquipmentTypeRequest {
  name: string
  description: string
}

export interface UpdateEquipmentTypeRequest {
  name: string
  description: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  pageIndex: number
  pageSize: number
}

export enum BookingStatus {
  Pending = "Pending",
  Approved = "Approved",
  Rejected = "Rejected",
  Cancelled = "Cancelled"
}

export interface Booking {
  id: string
  roomId: string
  requestedBy: string
  timeSlot: string
  endTime: string
  duration: number
  reason?: string
  status: string // Changed from BookingStatus enum to string to support "Approved" etc.
  createdAt: string
  room?: Room
  requestedByAccount?: Account
  roomName?: string
  requestedByName?: string
}

export interface CreateBookingRequest {
  roomId: string
  timeSlot: string
  duration: number
  reason?: string
}

export interface CreateRoomChangeRequest {
  originalRoomId: string
  newRoomId: string
  timeSlot: string
  duration: number
  reason?: string
}

export interface UpdateBookingStatusRequest {
  status: BookingStatus
}

export interface ApiError {
  message: string
  errors?: Record<string, string[]>
}
