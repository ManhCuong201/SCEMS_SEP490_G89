export interface Slot {
    number: number;
    startTime: string; // HH:mm
    endTime: string;   // HH:mm
}

export const NEW_SLOTS: Slot[] = [
    { number: 1, startTime: '07:30', endTime: '09:50' },
    { number: 2, startTime: '10:00', endTime: '12:20' },
    { number: 3, startTime: '12:50', endTime: '15:10' },
    { number: 4, startTime: '15:20', endTime: '17:40' },
    { number: 5, startTime: '18:00', endTime: '20:20' },
    { number: 6, startTime: '20:30', endTime: '22:50' }, // Adjusted from backend switch to be 6-slot consistent
];

export const OLD_SLOTS: Slot[] = [
    { number: 1, startTime: '07:30', endTime: '09:00' },
    { number: 2, startTime: '09:10', endTime: '10:40' },
    { number: 3, startTime: '10:50', endTime: '12:20' },
    { number: 4, startTime: '12:50', endTime: '14:20' },
    { number: 5, startTime: '14:30', endTime: '16:00' },
    { number: 6, startTime: '16:10', endTime: '17:40' },
    { number: 7, startTime: '18:00', endTime: '19:30' },
    { number: 8, startTime: '19:45', endTime: '21:15' },
];

export const getSlotTimes = (type: 'New' | 'Old', num: number): { start: string, end: string } => {
    const slots = type === 'New' ? NEW_SLOTS : OLD_SLOTS;
    const slot = slots.find(s => s.number === num);
    return slot ? { start: slot.startTime, end: slot.endTime } : { start: '00:00', end: '00:00' };
};

export const getTimeInMinutes = (timeStr: string): number => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
};

export const getSlotTotalMinutes = (slot: Slot): number => {
    return getTimeInMinutes(slot.endTime) - getTimeInMinutes(slot.startTime);
};
