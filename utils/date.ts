
import { Job } from '../types';

export const getLocalDateString = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const parseDateString = (dateStr: string): Date => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const isShiftInPaymentMonth = (shiftDateStr: string, targetMonth: Date, job?: Job): boolean => {
  const shiftDate = parseDateString(shiftDateStr);
  const targetYear = targetMonth.getFullYear();
  const targetMonthIdx = targetMonth.getMonth(); // 0-11

  if (!job || job.paymentPeriodType !== 'custom' || !job.paymentPeriodStartDay || job.paymentPeriodStartDay === 1) {
    return shiftDate.getMonth() === targetMonthIdx && shiftDate.getFullYear() === targetYear;
  }

  const startDay = job.paymentPeriodStartDay;
  
  // Period for targetMonth (e.g. Feb) starts in previous month (Jan) at startDay
  // and ends in targetMonth (Feb) at startDay - 1.
  const periodStartDate = new Date(targetYear, targetMonthIdx - 1, startDay);
  const periodEndDate = new Date(targetYear, targetMonthIdx, startDay - 1);
  
  return shiftDate >= periodStartDate && shiftDate <= periodEndDate;
};
