import { Booking } from "../types/api";

export interface ChangeRequestDetails {
    isChangeRequest: boolean;
    type: 'RoomChange' | 'ScheduleChange' | 'Normal';
    originalRoomId?: string;
    originalRoomName?: string;
    originalDate?: string;
    originalSlot?: string;
    newSlot?: string;
    slotType?: string;
    scheduleId?: string;
    displayReason?: string;
}

export const formatDate = (date: Date | string | number): string => {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '-';
    // Force vi-VN for dd/MM/yyyy
    return d.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
};

export const parseChangeRequest = (booking: Booking): ChangeRequestDetails => {
    const reason = booking.reason || '';

    const roomRegex = /\bRoom:\s*(.*?)[,\]]/i;
    const dateRegex = /\bDate:\s*(.*?)[,\]]/i;
    const slotRegex = /\bSlot:\s*(.*?)[,\]]/i;
    const scheduleIdRegex = /\bScheduleId:\s*([a-f0-9-]{36})/i;
    const newSlotRegex = /\bNewSlot:\s*(\d+)/i;
    const slotTypeRegex = /\bSlotType:\s*(New|Old)/i;
    const reasonRegex = /\bReason:\s*(.*)$/i;

    const isScheduleChange = reason.includes('[Schedule Change Request]');
    const isRoomChange = reason.includes('[Room Change Request]');

    if (isScheduleChange || isRoomChange) {
        const roomMatch = reason.match(roomRegex);
        const dateMatch = reason.match(dateRegex);
        const slotMatch = reason.match(slotRegex);
        const scheduleIdMatch = reason.match(scheduleIdRegex);
        const newSlotMatch = reason.match(newSlotRegex);
        const slotTypeMatch = reason.match(slotTypeRegex);
        const reasonMatch = reason.match(reasonRegex);

        return {
            isChangeRequest: true,
            type: isScheduleChange ? 'ScheduleChange' : 'RoomChange',
            originalRoomName: roomMatch ? roomMatch[1].trim() : undefined,
            originalDate: dateMatch ? dateMatch[1].trim() : undefined,
            originalSlot: slotMatch ? slotMatch[1].trim() : undefined,
            newSlot: newSlotMatch ? newSlotMatch[1].trim() : undefined,
            slotType: slotTypeMatch ? slotTypeMatch[1].trim() : undefined,
            scheduleId: scheduleIdMatch ? scheduleIdMatch[1] : undefined,
            displayReason: reasonMatch ? reasonMatch[1].trim() : reason.split(/Reason:\s*/i).pop()?.trim()
        };
    }

    return {
        isChangeRequest: false,
        type: 'Normal',
        displayReason: reason
    };
};

/**
 * Strips technical metadata from the reason string to show only user-provided text.
 */
export const cleanDisplayReason = (reason?: string): string => {
    if (!reason) return '-';

    // Split by the delimiter and take THE LAST part to handle nested/redundant prefixes
    const parts = reason.split(/Reason:\s*/i);
    if (parts.length > 1) {
        return parts[parts.length - 1].trim() || '-';
    }

    // Fallback cleaning for legacy or malformed strings
    let cleaned = reason.replace(/\[.*?\]\s*/g, '');
    cleaned = cleaned.replace(/ScheduleId: .*?\.\s*/g, '');
    cleaned = cleaned.replace(/Original: \[.*?\]\.\s*/g, '');
    cleaned = cleaned.replace(/From .*? to .*?\.\s*/g, '');
    cleaned = cleaned.replace(/Môn học: .*? - .*?\.\s*/g, '');

    return cleaned.trim() || '-';
};
