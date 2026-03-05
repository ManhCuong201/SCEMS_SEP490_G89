import { Booking } from "../types/api";

export interface ChangeRequestDetails {
    isChangeRequest: boolean;
    type: 'RoomChange' | 'ScheduleChange' | 'Normal';
    originalRoomId?: string;
    originalRoomName?: string;
    originalDate?: string;
    originalSlot?: string;
    scheduleId?: string;
    displayReason?: string;
}

export const parseChangeRequest = (booking: Booking): ChangeRequestDetails => {
    const reason = booking.reason || '';

    const roomRegex = /Room:\s*(.*?)[,\]]/i;
    const dateRegex = /Date:\s*(.*?)[,\]]/i;
    const slotRegex = /Slot:\s*(.*?)[,\]]/i;
    const scheduleIdRegex = /ScheduleId:\s*([a-f0-9-]{36})/i;
    const reasonRegex = /Reason:\s*(.*)$/i;

    const isScheduleChange = reason.includes('[Schedule Change Request]');
    const isRoomChange = reason.includes('[Room Change Request]');

    if (isScheduleChange || isRoomChange) {
        const roomMatch = reason.match(roomRegex);
        const dateMatch = reason.match(dateRegex);
        const slotMatch = reason.match(slotRegex);
        const scheduleIdMatch = reason.match(scheduleIdRegex);
        const reasonMatch = reason.match(reasonRegex);

        return {
            isChangeRequest: true,
            type: isScheduleChange ? 'ScheduleChange' : 'RoomChange',
            originalRoomName: roomMatch ? roomMatch[1].trim() : undefined,
            originalDate: dateMatch ? dateMatch[1].trim() : undefined,
            originalSlot: slotMatch ? slotMatch[1].trim() : undefined,
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
