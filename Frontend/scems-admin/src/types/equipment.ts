export enum EquipmentStatus {
  Working = "Working",
  Faulty = "Faulty",
  UnderMaintenance = "UnderMaintenance",
  Retired = "Retired"
}

export interface Equipment {
  id: string;
  name: string;
  equipmentTypeId: string;
  equipmentTypeName: string;
  roomId: string;
  roomName: string;
  roomCode: string;
  status: EquipmentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEquipmentDto {
  name: string;
  equipmentTypeId: string;
  roomId: string;
  status?: EquipmentStatus;
}

export interface UpdateEquipmentDto {
  name?: string;
  roomId?: string;
  status?: EquipmentStatus;
}

export interface PaginatedEquipment {
  items: Equipment[];
  total: number;
  pageIndex: number;
  pageSize: number;
}
