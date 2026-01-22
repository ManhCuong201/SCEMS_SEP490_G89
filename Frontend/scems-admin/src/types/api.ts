export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  user: Account
}

export interface Account {
  id: string
  fullName: string
  email: string
  phone: string
  role: string
  status: string
  createdAt: string
  updatedAt: string
}

export interface CreateAccountRequest {
  fullName: string
  email: string
  phone: string
  password: string
  role: string
}

export interface UpdateAccountRequest {
  fullName: string
  email: string
  phone: string
  role: string
}

export interface Room {
  id: string
  roomCode: string
  roomName: string
  capacity: number
  equipmentCount: number
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

export interface ApiError {
  message: string
  errors?: Record<string, string[]>
}
