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
    subject?: string;
    classCode?: string;
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
    const subjectRegex = /Môn học:\s*(.*?)\s*(?:-|$|Original:|Reason:)/i;
    const classRegex = /Lớp:\s*(.*?)\s*(?:-|$|Original:|Reason:|\.)/i;

    const isScheduleChange = reason.includes('[Schedule Change Request]');
    const isRoomChange = reason.includes('[Room Change Request]');

    if (isScheduleChange || isRoomChange) {
        const roomMatch = reason.match(roomRegex);
        const dateMatch = reason.match(dateRegex);
        const slotMatch = reason.match(slotRegex);
        const scheduleIdMatch = reason.match(scheduleIdRegex);
        const newSlotMatch = reason.match(newSlotRegex);
        const slotTypeMatch = reason.match(slotTypeRegex);
        const subjectMatch = reason.match(subjectRegex);
        const classMatch = reason.match(classRegex);

        return {
            isChangeRequest: true,
            type: isScheduleChange ? 'ScheduleChange' : 'RoomChange',
            originalRoomName: roomMatch ? roomMatch[1].trim() : undefined,
            originalDate: dateMatch ? dateMatch[1].trim() : undefined,
            originalSlot: slotMatch ? slotMatch[1].trim() : undefined,
            newSlot: newSlotMatch ? newSlotMatch[1].trim() : undefined,
            slotType: slotTypeMatch ? slotTypeMatch[1].trim() : undefined,
            scheduleId: scheduleIdMatch ? scheduleIdMatch[1] : undefined,
            subject: subjectMatch ? subjectMatch[1].trim() : undefined,
            classCode: classMatch ? classMatch[1].trim() : undefined,
            displayReason: cleanDisplayReason(reason)
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

    // Remove the core technical prefixes if they exist
    let cleaned = reason;
    
    // Check if it follows the "Reason: ..." format and take the content after it
    const reasonSplit = cleaned.split(/Reason:\s*/i);
    if (reasonSplit.length > 1) {
        cleaned = reasonSplit.pop()?.trim() || '-';
    }

    // Additional cleaning for nested or legacy prefixes
    cleaned = cleaned.replace(/^\[.*?\]\s*/g, '');
    cleaned = cleaned.replace(/ScheduleId: .*?\.\s*/g, '');
    cleaned = cleaned.replace(/Original: \[.*?\]\.\s*/g, '');
    cleaned = cleaned.replace(/From .*? to .*?\.\s*/g, '');
    cleaned = cleaned.replace(/Môn học: .*? - Lớp: .*?\.\s*/g, '');
    cleaned = cleaned.replace(/Môn học: .*?\s*(?:-|$|Original:)/g, '');
    cleaned = cleaned.replace(/Lớp: .*?\s*(?:-|$|Original:)/g, '');

    return cleaned.trim() || '-';
};
