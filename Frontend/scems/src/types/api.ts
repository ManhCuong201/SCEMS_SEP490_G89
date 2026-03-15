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
  building: string
  capacity: number
  roomTypeId?: string
  roomTypeName?: string
  equipmentCount: number
  pendingRequestsCount: number
  status: string
  departmentId?: string
  departmentName?: string
  departmentCode?: string
  createdAt: string
  updatedAt: string
}

export interface Department {
  id: string
  departmentCode: string
  departmentName: string
  description?: string
}

export interface CreateRoomRequest {
  roomCode: string
  roomName: string
  capacity: number
  roomTypeId?: string
  departmentId?: string
}

export interface UpdateRoomRequest {
  roomCode: string
  roomName: string
  capacity: number
  roomTypeId?: string
  departmentId?: string
}

export interface EquipmentType {
  id: string
  name: string
  code: string
  description: string
  equipmentCount: number
  status: string
  createdAt: string
  updatedAt: string
}

export interface CreateEquipmentTypeRequest {
  name: string
  code?: string
  description: string
}

export interface UpdateEquipmentTypeRequest {
  name: string
  code?: string
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
  Cancelled = "Cancelled",
  CheckedIn = "CheckedIn"
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
  updatedAt?: string // Added optional updatedAt
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
  scheduleId: string
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

export interface ScheduleResponse {
  id: string;
  subject: string;
  classCode: string;
  lecturerName: string;
  lecturerId?: string;
  date: string;
  slot: number;
  startTime: string;
  endTime: string;
  roomId: string;
  roomName: string;
}

export interface ImportScheduleResponse {
  message: string;
}


export interface RoomType {
  id: string
  name: string
  code: string
  description: string
  roomCount: number
}

export interface CreateRoomTypeRequest {
  name: string
  code?: string
  description: string
}

export interface UpdateRoomTypeRequest {
  name: string
  code?: string
  description: string
}

export enum IssueReportStatus {
  Open = "Open",
  InProgress = "InProgress",
  Resolved = "Resolved",
  Closed = "Closed"
}

export interface IssueReportResponse {
  id: string;
  createdBy: string;
  createdByName: string;
  roomId?: string;
  roomName?: string;
  equipmentId?: string;
  equipmentName?: string;
  description: string;
  status: IssueReportStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateIssueReportRequest {
  roomId?: string;
  equipmentId?: string;
  description: string;
}

export interface UpdateIssueReportStatusRequest {
  status: IssueReportStatus;
}

export interface PendingRoomCheck {
  roomId: string;
  roomName: string;
  roomCode: string;
  lastActivityEndTime: string;
}

export interface CompleteRoomCheckRequest {
  roomId: string;
  note?: string;
}

export interface CreateScheduleChangeRequest {
  scheduleId: string;
  newRoomId: string;
  newDate: string;
  slotType: string;
  newSlot: number;
  reason: string;
}

export interface RoomLiveStatusDto {
  roomId: string;
  roomCode: string;
  roomName: string;
  building: string;
  isOccupied: boolean;
  currentActivity?: string;
  description?: string;
  occupiedBy?: string;
  activityEndTime?: string;
  nextActivityStartTime?: string;
  hasNextActivity: boolean;
}

