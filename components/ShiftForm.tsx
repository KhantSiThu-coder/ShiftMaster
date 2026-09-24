
import React, { useState, useMemo } from 'react';
import { Shift } from '../types';
import { getLocalDateString } from '../utils/date';
import {
  getShiftOffsets,
  getTimeOffset,
  getBreakEndOffset,
  offsetToTime,
  clampBreakTimes,
  validateBreakInterval
} from '../utils/calculations';

interface ShiftFormProps {
  onAdd: (shift: Shift) => void;
}

export const ShiftForm: React.FC<ShiftFormProps> = ({ onAdd }) => {
  const initialClamped = clampBreakTimes('09:00', '17:00', '12:00', '13:00');
  const [breakError, setBreakError] = useState<string | null>(null);

  const [formData, setFormData] = useState<Omit<Shift, 'id'>>({
    date: getLocalDateString(),
    startTime: '09:00',
    endTime: '17:00',
    breakMinutes: initialClamped.breakMinutes,
    breakStartTime: initialClamped.breakStartTime,
    breakEndTime: initialClamped.breakEndTime,
    note: '',
    type: 'work'
  });

  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

  const handleTimeChange = (type: 'startTime' | 'endTime', part: 'h' | 'm', value: string) => {
    const current = formData[type].split(':');
    const newTime = part === 'h' ? `${value}:${current[1]}` : `${current[0]}:${value}`;
    const newStartTime = type === 'startTime' ? newTime : formData.startTime;
    const newEndTime = type === 'endTime' ? newTime : formData.endTime;

    const clamped = clampBreakTimes(
      newStartTime,
      newEndTime,
      formData.breakStartTime || '12:00',
      formData.breakEndTime || '13:00'
    );

    setFormData(prev => ({
      ...prev,
      [type]: newTime,
      breakStartTime: clamped.breakStartTime,
      breakEndTime: clamped.breakEndTime,
      breakMinutes: clamped.breakMinutes
    }));
    setBreakError(null);
  };

  const handleBreakTimeChange = (type: 'breakStartTime' | 'breakEndTime', part: 'h' | 'm', value: string) => {
    const sTime = formData.startTime || '09:00';
    const eTime = formData.endTime || '17:00';
    const { wStart, totalDuration } = getShiftOffsets(sTime, eTime);

    let curBStart = formData.breakStartTime || '12:00';
    let curBEnd = formData.breakEndTime || '13:00';

    if (type === 'breakStartTime') {
      const [curH, curM] = curBStart.split(':');
      let nextH = part === 'h' ? value : curH;
      let nextM = part === 'm' ? value : curM;

      let testStr = `${nextH}:${nextM}`;
      let testOff = getTimeOffset(testStr, wStart);

      if (testOff < 0 || testOff >= totalDuration) {
        for (let m = 0; m < 60; m++) {
          const cand = `${nextH}:${String(m).padStart(2, '0')}`;
          const cOff = getTimeOffset(cand, wStart);
          if (cOff >= 0 && cOff < totalDuration) {
            nextM = String(m).padStart(2, '0');
            testStr = cand;
            testOff = cOff;
            break;
          }
        }
      }
      curBStart = testStr;

      let endOff = getBreakEndOffset(curBEnd, wStart, totalDuration);
      if (endOff <= testOff || endOff > totalDuration) {
        const prevDuration = Math.max(0, getBreakEndOffset(curBEnd, wStart, totalDuration) - getTimeOffset(curBStart, wStart));
        const dur = prevDuration > 0 ? prevDuration : 60;
        const newEndOff = Math.min(totalDuration, testOff + dur);
        if (newEndOff > testOff) {
          curBEnd = offsetToTime(wStart, newEndOff);
        } else {
          curBEnd = offsetToTime(wStart, Math.min(totalDuration, testOff + 1));
        }
      }
    } else {
      const [curH, curM] = curBEnd.split(':');
      let nextH = part === 'h' ? value : curH;
      let nextM = part === 'm' ? value : curM;

      let testStr = `${nextH}:${nextM}`;
      const startOff = getTimeOffset(curBStart, wStart);
      let endOff = getBreakEndOffset(testStr, wStart, totalDuration);

      if (endOff <= startOff || endOff > totalDuration) {
        for (let m = 0; m < 60; m++) {
          const cand = `${nextH}:${String(m).padStart(2, '0')}`;
          const cOff = getBreakEndOffset(cand, wStart, totalDuration);
          if (cOff > startOff && cOff <= totalDuration) {
            nextM = String(m).padStart(2, '0');
            testStr = cand;
            endOff = cOff;
            break;
          }
        }
      }
      curBEnd = testStr;
    }

    const startOffFinal = getTimeOffset(curBStart, wStart);
    const endOffFinal = getBreakEndOffset(curBEnd, wStart, totalDuration);
    const calcMin = Math.max(0, endOffFinal - startOffFinal);

    setFormData(prev => ({
      ...prev,
      breakStartTime: curBStart,
      breakEndTime: curBEnd,
      breakMinutes: calcMin
    }));

    const val = validateBreakInterval(sTime, eTime, curBStart, curBEnd);
    setBreakError(val.isValid ? null : (val.errorMessage || 'Invalid break time interval'));
  };

  const breakStartHourOptions = useMemo(() => {
    const { wStart, totalDuration } = getShiftOffsets(formData.startTime, formData.endTime);
    if (totalDuration <= 1) return [];
    const hoursSet = new Set<string>();
    const list: string[] = [];
    for (let off = 0; off < totalDuration; off += 1) {
      const h = String(Math.floor(((wStart + off) % 1440) / 60)).padStart(2, '0');
      if (!hoursSet.has(h)) {
        hoursSet.add(h);
        list.push(h);
      }
    }
    return list;
  }, [formData.startTime, formData.endTime]);

  const breakStartMinuteOptions = useMemo(() => {
    const { wStart, totalDuration } = getShiftOffsets(formData.startTime, formData.endTime);
    const [currentH] = (formData.breakStartTime || '12:00').split(':');
    const hNum = parseInt(currentH);
    if (isNaN(hNum)) return [];

    const list: string[] = [];
    for (let m = 0; m < 60; m++) {
      const timeStr = `${String(hNum).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      const off = getTimeOffset(timeStr, wStart);
      if (off >= 0 && off < totalDuration) {
        list.push(String(m).padStart(2, '0'));
      }
    }
    return list;
  }, [formData.startTime, formData.endTime, formData.breakStartTime]);

  const breakEndHourOptions = useMemo(() => {
    const { wStart, totalDuration } = getShiftOffsets(formData.startTime, formData.endTime);
    const startOff = getTimeOffset(formData.breakStartTime || formData.startTime, wStart);
    if (totalDuration <= 1 || startOff >= totalDuration) return [];

    const hoursSet = new Set<string>();
    const list: string[] = [];
    for (let off = startOff + 1; off <= totalDuration; off += 1) {
      const totalMins = (wStart + off) % 1440;
      const h = String(Math.floor(totalMins / 60)).padStart(2, '0');
      if (!hoursSet.has(h)) {
        hoursSet.add(h);
        list.push(h);
      }
    }
    return list;
  }, [formData.startTime, formData.endTime, formData.breakStartTime]);

  const breakEndMinuteOptions = useMemo(() => {
    const { wStart, totalDuration } = getShiftOffsets(formData.startTime, formData.endTime);
    const startOff = getTimeOffset(formData.breakStartTime || formData.startTime, wStart);
    const [currentH] = (formData.breakEndTime || '13:00').split(':');
    const hNum = parseInt(currentH);
    if (isNaN(hNum)) return [];

    const list: string[] = [];
    for (let m = 0; m < 60; m++) {
      const timeStr = `${String(hNum).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      const endOff = getBreakEndOffset(timeStr, wStart, totalDuration);
      if (endOff > startOff && endOff <= totalDuration) {
        list.push(String(m).padStart(2, '0'));
      }
    }
    return list;
  }, [formData.startTime, formData.endTime, formData.breakStartTime, formData.breakEndTime]);

  const calculatedBreakMinutes = useMemo(() => {
    if (!formData.breakStartTime || !formData.breakEndTime) return 0;
    const { wStart, totalDuration } = getShiftOffsets(formData.startTime, formData.endTime);
    const startOff = getTimeOffset(formData.breakStartTime, wStart);
    const endOff = getBreakEndOffset(formData.breakEndTime, wStart, totalDuration);
    if (endOff > startOff && endOff <= totalDuration && startOff >= 0 && startOff < totalDuration) {
      return endOff - startOff;
    }
    return formData.breakMinutes || 0;
  }, [formData.startTime, formData.endTime, formData.breakStartTime, formData.breakEndTime, formData.breakMinutes]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const val = validateBreakInterval(
      formData.startTime,
      formData.endTime,
      formData.breakStartTime,
      formData.breakEndTime
    );

    if (!val.isValid) {
      setBreakError(val.errorMessage || 'Invalid break time interval');
      return;
    }

    const { wStart, totalDuration } = getShiftOffsets(formData.startTime, formData.endTime);
    const startOff = getTimeOffset(formData.breakStartTime!, wStart);
    const endOff = getBreakEndOffset(formData.breakEndTime!, wStart, totalDuration);
    const finalBreakMinutes = Math.max(0, endOff - startOff);

    onAdd({
      ...formData,
      breakMinutes: finalBreakMinutes
    } as Shift);
    setFormData(prev => ({ ...prev, note: '' }));
  };

  const TimeSelector = ({ label, value, type }: { label: string; value: string; type: 'startTime' | 'endTime' }) => {
    const [h, m] = value.split(':');
    return (
      <div className="flex-1">
        <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
        <div className="flex items-center gap-1">
          <select 
            value={h}
            onChange={(e) => handleTimeChange(type, 'h', e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono"
          >
            {hours.map(hour => <option key={hour} value={hour}>{hour}</option>)}
          </select>
          <span className="font-bold text-slate-400">:</span>
          <select 
            value={m}
            onChange={(e) => handleTimeChange(type, 'm', e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono"
          >
            {minutes.map(min => <option key={min} value={min}>{min}</option>)}
          </select>
        </div>
      </div>
    );
  };

  const BreakTimeSelector = ({ 
    label, 
    value, 
    type,
    hourOptions,
    minuteOptions
  }: { 
    label: string; 
    value?: string; 
    type: 'breakStartTime' | 'breakEndTime';
    hourOptions: string[];
    minuteOptions: string[];
  }) => {
    const fallback = type === 'breakStartTime' ? '12:00' : '13:00';
    const [h, m] = (value || fallback).split(':');

    return (
      <div className="flex-1">
        <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
        <div className="flex items-center gap-1">
          <select 
            value={h}
            aria-label={`${label} Hour`}
            onChange={(e) => handleBreakTimeChange(type, 'h', e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono"
          >
            {hourOptions.map(hour => (
              <option key={hour} value={hour}>{hour}</option>
            ))}
            {!hourOptions.includes(h) && (
              <option value={h} disabled hidden>{h}</option>
            )}
          </select>
          <span className="font-bold text-slate-400">:</span>
          <select 
            value={m}
            aria-label={`${label} Minute`}
            onChange={(e) => handleBreakTimeChange(type, 'm', e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono"
          >
            {minuteOptions.map(min => (
              <option key={min} value={min}>{min}</option>
            ))}
            {!minuteOptions.includes(m) && (
              <option value={m} disabled hidden>{m}</option>
            )}
          </select>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 h-fit">
      <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
        <svg className="w-5 h-5 mr-2 text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd"></path></svg>
        New Shift Entry
      </h2>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Work Date</label>
          <input 
            type="date" 
            required
            value={formData.date}
            onChange={e => setFormData({ ...formData, date: e.target.value })}
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
          />
        </div>
        <div className="flex gap-4">
          <TimeSelector label="Start (24h)" value={formData.startTime} type="startTime" />
          <TimeSelector label="End (24h)" value={formData.endTime} type="endTime" />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-slate-700">Break Time</label>
            {calculatedBreakMinutes > 0 && (
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">
                {calculatedBreakMinutes} mins break
              </span>
            )}
          </div>
          <div className="flex gap-4">
            <BreakTimeSelector 
              label="Break Start (24h)" 
              value={formData.breakStartTime} 
              type="breakStartTime" 
              hourOptions={breakStartHourOptions}
              minuteOptions={breakStartMinuteOptions}
            />
            <BreakTimeSelector 
              label="Break End (24h)" 
              value={formData.breakEndTime} 
              type="breakEndTime" 
              hourOptions={breakEndHourOptions}
              minuteOptions={breakEndMinuteOptions}
            />
          </div>
          {breakError && (
            <p className="text-xs font-semibold text-rose-500 flex items-center gap-1.5 mt-1 bg-rose-50 px-3 py-2 rounded-xl border border-rose-100">
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>{breakError}</span>
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Notes (Optional)</label>
          <textarea 
            rows={3}
            value={formData.note}
            onChange={e => setFormData({ ...formData, note: e.target.value })}
            placeholder="Work details, location, etc."
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
          />
        </div>
        <button 
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl shadow-lg shadow-blue-200 transition-all transform active:scale-[0.98]"
        >
          Add to Schedule
        </button>
      </form>
    </div>
  );
};
