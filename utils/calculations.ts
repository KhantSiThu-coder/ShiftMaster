
import { Shift, ShiftStats, Job } from '../types';

export const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
};

export const offsetToTimeStr = (offset: number, startMin: number): string => {
  let m = (startMin + offset) % 1440;
  if (m < 0) m += 1440;
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
};

export const formatHoursAndMinutes = (decimalHours: number): string => {
  const totalMinutes = Math.round(Math.max(0, decimalHours) * 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours} hrs ${minutes} mins`;
};

export const formatBreakDuration = (minutes: number): string => {
  const totalM = Math.max(0, Math.round(minutes));
  const h = Math.floor(totalM / 60);
  const m = totalM % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

export const formatWorkDuration = (minutes: number): string => {
  const totalM = Math.max(0, Math.round(minutes));
  const h = Math.floor(totalM / 60);
  const m = totalM % 60;
  if (h === 0 && m === 0) return '0h';
  if (m === 0) return `${h}h`;
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
};

export const formatLateDuration = (minutes: number): string => {
  const totalM = Math.max(0, Math.round(minutes));
  if (totalM <= 0) return '';
  const h = Math.floor(totalM / 60);
  const m = totalM % 60;
  if (m === 0) return `${lhLateText(h)}`;
  if (h === 0) return `${m}m late`;
  return `${h}h ${m}m late`;
};

const lhLateText = (h: number): string => `${h}h late`;

export const formatTotalWorkHoursText = (
  workMinutes: number, 
  lateMinutes: number = 0
): string => {
  const workText = formatWorkDuration(workMinutes);

  if (lateMinutes > 0) {
    const lateText = formatLateDuration(lateMinutes);
    if (lateText) {
      return `Total Work Hours: ${workText} (${lateText})`;
    }
  }

  return `Total Work Hours: ${workText}`;
};

export const calculateShiftHours = (shift: Shift, job?: Job): { 
  total: number; 
  late: number;
  workMinutes: number;
  lateMinutes: number;
  breakMinutes: number;
  shiftDurationMinutes: number;
} => {
  if (shift.isPaidLeave) {
    const totalHours = (shift.paidLeaveHours || 0) + (shift.paidLeaveMinutes || 0) / 60;
    const workMin = Math.round(totalHours * 60);
    return {
      total: totalHours,
      late: 0,
      workMinutes: workMin,
      lateMinutes: 0,
      breakMinutes: 0,
      shiftDurationMinutes: workMin
    };
  }

  const startMin = timeToMinutes(shift.startTime);
  let endMin = timeToMinutes(shift.endTime);
  const isOvernight = endMin < startMin;
  
  if (isOvernight) {
    endMin += 24 * 60;
  }

  const shiftDurationMin = Math.max(0, endMin - startMin);

  let breakMin = 0;
  let bStartMin = 0;
  let bEndMin = 0;
  let hasValidBreakInterval = false;

  if (shift.hasBreak && shift.breakStartTime && shift.breakEndTime) {
    bStartMin = timeToMinutes(shift.breakStartTime);
    bEndMin = timeToMinutes(shift.breakEndTime);
    if (isOvernight) {
      if (bStartMin < startMin) bStartMin += 24 * 60;
      if (bEndMin < startMin) bEndMin += 24 * 60;
    } else {
      if (bEndMin < bStartMin) bEndMin += 24 * 60;
    }
    breakMin = Math.max(0, bEndMin - bStartMin);
    hasValidBreakInterval = true;
  } else {
    breakMin = Math.max(0, shift.breakMinutes || 0);
  }

  const durationMin = Math.max(0, shiftDurationMin - breakMin);
  const totalHours = durationMin / 60;

  const lateStartMin = 22 * 60;
  let lateDurationMin = 0;

  if (endMin > lateStartMin) {
    const actualLateStart = Math.max(startMin, lateStartMin);
    const rawLateWindow = Math.max(0, endMin - actualLateStart);

    if (hasValidBreakInterval) {
      const overlap = Math.max(0, Math.min(bEndMin, endMin) - Math.max(bStartMin, actualLateStart));
      lateDurationMin = Math.max(0, rawLateWindow - overlap);
    } else {
      lateDurationMin = rawLateWindow;
    }
  }

  const isLateEligible = job !== undefined ? (job.lateNightBonusPercent || 0) > 0 : true;
  const eligibleLateMinutes = isLateEligible ? lateDurationMin : 0;
  const eligibleLateHours = isLateEligible ? (lateDurationMin / 60) : 0;

  return {
    total: totalHours,
    late: eligibleLateHours,
    workMinutes: durationMin,
    lateMinutes: eligibleLateMinutes,
    breakMinutes: breakMin,
    shiftDurationMinutes: shiftDurationMin
  };
};

export const aggregateStats = (shifts: Shift[], jobs: Job[], selectedJobIds?: string[]): ShiftStats => {
  const filteredShifts = shifts.filter(s => {
    if (s.type !== 'work') return false;
    if (selectedJobIds && selectedJobIds.length > 0) {
      return selectedJobIds.includes(s.jobId || '');
    }
    return true;
  });

  // Calculate transport fees: once per job per day
  const dailyWorkMap = new Map<string, Set<string>>(); // date -> Set<jobId>
  filteredShifts.forEach(s => {
    if (s.jobId && !s.isPaidLeave) {
      if (!dailyWorkMap.has(s.date)) {
        dailyWorkMap.set(s.date, new Set());
      }
      dailyWorkMap.get(s.date)!.add(s.jobId);
    }
  });

  let totalTransport = 0;
  dailyWorkMap.forEach((jobIds) => {
    jobIds.forEach(jId => {
      const job = jobs.find(j => j.id === jId);
      if (job?.transportFee) {
        totalTransport += job.transportFee;
      }
    });
  });

  const baseStats = filteredShifts.reduce(
    (acc, shift) => {
      const job = jobs.find(j => j.id === shift.jobId);
      const { total, late } = calculateShiftHours(shift, job);
      const rate = job?.hourlyRate || 0;
      const lateBonusPercent = job?.lateNightBonusPercent || 0;
      const bonusPct = lateBonusPercent / 100;
      
      const basePay = total * rate;
      const lateBonusPay = late * rate * bonusPct;
      
      if (shift.isPaidLeave) {
        return {
          ...acc,
          totalPaidLeaveHours: acc.totalPaidLeaveHours + total,
          totalPaidLeaveDays: acc.totalPaidLeaveDays + 1,
          totalPaidLeavePay: acc.totalPaidLeavePay + basePay,
          estimatedPay: acc.estimatedPay + basePay,
        };
      } else {
        const eligibleLateHours = lateBonusPercent > 0 ? late : 0;
        return {
          ...acc,
          totalHours: acc.totalHours + total,
          totalDays: acc.totalDays + 1,
          lateNightHours: acc.lateNightHours + eligibleLateHours,
          estimatedPay: acc.estimatedPay + basePay + lateBonusPay,
        };
      }
    },
    { 
      totalHours: 0, 
      totalDays: 0, 
      lateNightHours: 0, 
      estimatedPay: 0,
      totalPaidLeaveHours: 0,
      totalPaidLeaveDays: 0,
      totalPaidLeavePay: 0,
    }
  );

  return {
    ...baseStats,
    totalTransportExpenses: totalTransport,
    totalEstPay: baseStats.estimatedPay + totalTransport
  };
};

export const getOffsetFromStart = (timeStr: string, startMin: number, isOvernight: boolean): number => {
  const m = timeToMinutes(timeStr);
  if (isOvernight) {
    return m >= startMin ? (m - startMin) : (m + 1440 - startMin);
  }
  return m - startMin;
};

export const getChronologicalHours = (startMin: number, endMin: number, isOvernight: boolean): string[] => {
  const shiftDuration = isOvernight ? (endMin + 1440 - startMin) : (endMin - startMin);
  const startH = Math.floor(startMin / 60);
  const hoursCount = Math.ceil(shiftDuration / 60);
  const hoursList: string[] = [];
  for (let i = 0; i <= hoursCount; i++) {
    const h = (startH + i) % 24;
    const hStr = String(h).padStart(2, '0');
    if (!hoursList.includes(hStr)) {
      hoursList.push(hStr);
    }
  }
  return hoursList;
};

export const getBreakStartHourOptions = (startTime: string, endTime: string): string[] => {
  const startMin = timeToMinutes(startTime);
  let endMin = timeToMinutes(endTime);
  const isOvernight = endMin < startMin;
  if (isOvernight) endMin += 1440;
  const shiftDuration = endMin - startMin;

  if (shiftDuration <= 0) return [];

  const chronoHours = getChronologicalHours(startMin, endMin, isOvernight);
  return chronoHours.filter(hStr => {
    for (let m = 0; m < 60; m++) {
      const timeStr = `${hStr}:${String(m).padStart(2, '0')}`;
      const off = getOffsetFromStart(timeStr, startMin, isOvernight);
      if (off >= 0 && off < shiftDuration) {
        return true;
      }
    }
    return false;
  });
};

export const getBreakStartMinuteOptions = (
  startTime: string,
  endTime: string,
  selectedHour: string
): string[] => {
  const startMin = timeToMinutes(startTime);
  let endMin = timeToMinutes(endTime);
  const isOvernight = endMin < startMin;
  if (isOvernight) endMin += 1440;
  const shiftDuration = endMin - startMin;

  if (shiftDuration <= 0) return [];

  const validMinutes: string[] = [];
  for (let m = 0; m < 60; m++) {
    const mStr = String(m).padStart(2, '0');
    const timeStr = `${selectedHour}:${mStr}`;
    const off = getOffsetFromStart(timeStr, startMin, isOvernight);
    if (off >= 0 && off < shiftDuration) {
      validMinutes.push(mStr);
    }
  }
  return validMinutes;
};

export const getBreakEndHourOptions = (
  startTime: string,
  endTime: string,
  breakStartTime: string
): string[] => {
  const startMin = timeToMinutes(startTime);
  let endMin = timeToMinutes(endTime);
  const isOvernight = endMin < startMin;
  if (isOvernight) endMin += 1440;
  const shiftDuration = endMin - startMin;

  if (shiftDuration <= 0) return [];
  const bsOffset = getOffsetFromStart(breakStartTime, startMin, isOvernight);

  const chronoHours = getChronologicalHours(startMin, endMin, isOvernight);
  return chronoHours.filter(hStr => {
    for (let m = 0; m < 60; m++) {
      const timeStr = `${hStr}:${String(m).padStart(2, '0')}`;
      const off = getOffsetFromStart(timeStr, startMin, isOvernight);
      if (off > bsOffset && off <= shiftDuration) {
        return true;
      }
    }
    return false;
  });
};

export const getBreakEndMinuteOptions = (
  startTime: string,
  endTime: string,
  breakStartTime: string,
  selectedEndHour: string
): string[] => {
  const startMin = timeToMinutes(startTime);
  let endMin = timeToMinutes(endTime);
  const isOvernight = endMin < startMin;
  if (isOvernight) endMin += 1440;
  const shiftDuration = endMin - startMin;

  if (shiftDuration <= 0) return [];
  const bsOffset = getOffsetFromStart(breakStartTime, startMin, isOvernight);

  const validMinutes: string[] = [];
  for (let m = 0; m < 60; m++) {
    const mStr = String(m).padStart(2, '0');
    const timeStr = `${selectedEndHour}:${mStr}`;
    const off = getOffsetFromStart(timeStr, startMin, isOvernight);
    if (off > bsOffset && off <= shiftDuration) {
      validMinutes.push(mStr);
    }
  }
  return validMinutes;
};

export const sanitizeBreakTimes = (
  startTime: string,
  endTime: string,
  breakStartTime?: string,
  breakEndTime?: string
): { breakStartTime: string; breakEndTime: string; breakMinutes: number } => {
  const startMin = timeToMinutes(startTime);
  let endMin = timeToMinutes(endTime);
  const isOvernight = endMin < startMin;
  if (isOvernight) endMin += 1440;
  const shiftDuration = endMin - startMin;

  if (shiftDuration <= 0) {
    return { breakStartTime: startTime, breakEndTime: endTime, breakMinutes: 0 };
  }

  let bsValid = false;
  let bsOffset = 0;
  if (breakStartTime) {
    bsOffset = getOffsetFromStart(breakStartTime, startMin, isOvernight);
    if (bsOffset >= 0 && bsOffset < shiftDuration) {
      bsValid = true;
    }
  }

  let beValid = false;
  let beOffset = 0;
  if (breakEndTime && bsValid) {
    beOffset = getOffsetFromStart(breakEndTime, startMin, isOvernight);
    if (beOffset > bsOffset && beOffset <= shiftDuration) {
      beValid = true;
    }
  }

  if (bsValid && beValid) {
    return {
      breakStartTime: breakStartTime!,
      breakEndTime: breakEndTime!,
      breakMinutes: beOffset - bsOffset
    };
  }

  if (bsValid) {
    let newBeOffset = Math.min(shiftDuration, bsOffset + 60);
    if (newBeOffset <= bsOffset) newBeOffset = shiftDuration;
    return {
      breakStartTime: breakStartTime!,
      breakEndTime: offsetToTimeStr(newBeOffset, startMin),
      breakMinutes: newBeOffset - bsOffset
    };
  }

  const defaultDuration = Math.min(60, Math.max(10, Math.floor(shiftDuration / 2)));
  let newBsOffset = Math.max(0, Math.floor(shiftDuration / 2) - Math.floor(defaultDuration / 2));
  newBsOffset = Math.round(newBsOffset / 10) * 10;
  if (newBsOffset + defaultDuration > shiftDuration) {
    newBsOffset = Math.max(0, shiftDuration - defaultDuration);
  }
  const newBeOffset = Math.min(shiftDuration, newBsOffset + defaultDuration);

  return {
    breakStartTime: offsetToTimeStr(newBsOffset, startMin),
    breakEndTime: offsetToTimeStr(newBeOffset, startMin),
    breakMinutes: newBeOffset - newBsOffset
  };
};
