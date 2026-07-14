
import { Shift, ShiftStats, Job } from '../types';

const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

export const calculateShiftHours = (shift: Shift): { total: number; late: number } => {
  if (shift.isPaidLeave) {
    const totalHours = (shift.paidLeaveHours || 0) + (shift.paidLeaveMinutes || 0) / 60;
    return {
      total: totalHours,
      late: 0
    };
  }

  let startMin = timeToMinutes(shift.startTime);
  let endMin = timeToMinutes(shift.endTime);
  
  if (endMin < startMin) {
    endMin += 24 * 60;
  }

  const durationMin = endMin - startMin - shift.breakMinutes;
  const totalHours = Math.max(0, durationMin / 60);

  const lateStartMin = 22 * 60;
  let lateDurationMin = 0;

  if (endMin > lateStartMin) {
    const actualLateStart = Math.max(startMin, lateStartMin);
    lateDurationMin = endMin - actualLateStart;
  }

  return {
    total: totalHours,
    late: Math.max(0, lateDurationMin / 60)
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
      const { total, late } = calculateShiftHours(shift);
      const job = jobs.find(j => j.id === shift.jobId);
      const rate = job?.hourlyRate || 0;
      const bonusPct = (job?.lateNightBonusPercent || 0) / 100;
      
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
        return {
          ...acc,
          totalHours: acc.totalHours + total,
          totalDays: acc.totalDays + 1,
          lateNightHours: acc.lateNightHours + late,
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
