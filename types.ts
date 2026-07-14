
export type EntryType = 'work' | 'general';

export interface Job {
  id: string;
  name: string;
  color: string;
  hourlyRate?: number;
  transportFee?: number;
  lateNightBonusPercent?: number; // Added: percentage bonus for late night hours
  paymentPeriodType?: 'month' | 'custom';
  paymentPeriodStartDay?: number; // e.g., 26 for 26th to 25th
}

export interface Shift {
  id?: number;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  breakMinutes: number;
  note: string;
  title?: string; // Added: title for general entries
  type: EntryType;
  jobId?: string; // Reference to Job
  color?: string; // Added: custom color for general entries
  photo?: string; // Added: base64 photo for general entries
  photos?: string[]; // Added: multiple base64 photos for general entries
  isAllDay?: boolean; // Added: all day event flag
  isPaidLeave?: boolean; // Added: Paid Leave flag
  paidLeaveHours?: number; // Added: Paid Leave hours duration
  paidLeaveMinutes?: number; // Added: Paid Leave minutes duration
}

export interface ShiftStats {
  totalHours: number;
  totalDays: number;
  lateNightHours: number;
  estimatedPay: number;
  totalTransportExpenses: number;
  totalEstPay: number;
  totalPaidLeaveHours?: number; // Added: Paid Leave hours summary
  totalPaidLeaveDays?: number; // Added: Paid Leave days summary
  totalPaidLeavePay?: number; // Added: Paid Leave pay summary
}
