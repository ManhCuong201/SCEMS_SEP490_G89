export enum EquipmentStatus {
  Working = 0,
  Maintenance = 1,
  Broken = 2,
  Retired = 3
}

export interface Equipment {
  id: string;
  equipmentTypeId: string;
  equipmentTypeName: string;
  roomId: string;
  roomName: string;
  status: EquipmentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEquipmentDto {
  equipmentTypeId: string;
  roomId: string;
  status?: EquipmentStatus;
}

export interface UpdateEquipmentDto {
  roomId?: string;
  status?: EquipmentStatus;
}

export interface PaginatedEquipment {
  items: Equipment[];
  total: number;
  pageIndex: number;
  pageSize: number;
}
