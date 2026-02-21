
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
}

export interface ShiftStats {
  totalHours: number;
  totalDays: number;
  lateNightHours: number;
  estimatedPay: number;
  totalTransportExpenses: number;
  totalEstPay: number;
}
