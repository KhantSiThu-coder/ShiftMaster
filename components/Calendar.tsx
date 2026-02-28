
import React from 'react';
import { Shift, Job } from '../types';
import { getLocalDateString, isShiftInPaymentMonth } from '../utils/date';

interface CalendarProps {
  currentDate: Date;
  onDateClick: (date: string) => void;
  onShiftClick: (shift: Shift) => void;
  shifts: Shift[];
  jobs: Job[];
}

export const Calendar: React.FC<CalendarProps> = ({ currentDate, onDateClick, onShiftClick, shifts, jobs }) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days = [];
  // Padding for start of month
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const getShiftsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return shifts
      .filter(s => s.date === dateStr)
      .sort((a, b) => a.startTime.localeCompare(b.startTime)); // Sort by time
  };

  const formatTime = (time: string) => {
    if (!time) return '';
    const [h, m] = time.split(':');
    return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`;
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden transition-colors duration-300">
      <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/30 dark:bg-slate-800/30">
        <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
          {currentDate.toLocaleString(undefined, { month: 'long' })} <span className="text-blue-600 dark:text-blue-400">{year}</span>
        </h2>
        <div className="text-[8px] sm:text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
          {shifts.filter(s => {
            const job = jobs.find(j => j.id === s.jobId);
            return isShiftInPaymentMonth(s.date, currentDate, job);
          }).length} Entries this month
        </div>
      </div>

      <div className="grid grid-cols-7 border-b border-slate-100 dark:border-slate-800">
        {dayNames.map((d, idx) => (
          <div 
            key={d} 
            className={`py-2 text-center text-[8px] sm:text-xs font-bold uppercase tracking-wider ${idx === 0 || idx === 6 ? 'text-red-500 dark:text-red-400' : 'text-slate-400 dark:text-slate-500'}`}
          >
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 bg-slate-50/10 dark:bg-slate-950/10">
        {days.map((day, idx) => {
          const isWeekend = idx % 7 === 0 || idx % 7 === 6;
          
          if (day === null) return <div key={`empty-${idx}`} className="h-20 sm:h-32 border-r border-b border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40"></div>;
          
          const dayShifts = getShiftsForDay(day);
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const isToday = getLocalDateString() === dateStr;

          return (
            <div 
              key={day} 
              onClick={() => onDateClick(dateStr)}
              className={`h-20 sm:h-32 border-r border-b border-slate-100 dark:border-slate-800 p-1 sm:p-2 cursor-pointer hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors relative overflow-hidden group`}
            >
              <span className={`text-[10px] sm:text-sm font-bold ${
                isToday 
                  ? 'bg-blue-600 dark:bg-blue-500 text-white w-5 h-5 sm:w-7 sm:h-7 flex items-center justify-center rounded-full shadow-md' 
                  : (isWeekend ? 'text-red-500 dark:text-red-400' : 'text-slate-600 dark:text-slate-400')
              }`}>
                {day}
              </span>
              <div className="mt-0.5 sm:mt-1 space-y-0.5 sm:space-y-1 overflow-y-auto max-h-[calc(100%-1.2rem)] sm:max-h-[calc(100%-1.8rem)] scrollbar-hide">
                {dayShifts.map((s, i) => {
                  const job = jobs.find(j => j.id === s.jobId);
                  const color = s.type === 'general' 
                    ? (s.color || '#64748b') 
                    : (job?.color || '#3b82f6');
                  return (
                    <div 
                      key={i} 
                      onClick={(e) => {
                        e.stopPropagation();
                        onShiftClick(s);
                      }}
                      className="text-[7px] sm:text-[9px] px-0.5 sm:px-1 py-0 rounded border border-white/20 dark:border-black/20 truncate text-white shadow-sm font-bold font-mono hover:scale-105 transition-transform flex items-center gap-0.5"
                      style={{ backgroundColor: color }}
                    >
                      {s.photo && (
                        <svg className="w-2 h-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                        </svg>
                      )}
                      {s.isAllDay ? 'All Day' : formatTime(s.startTime)} {s.type === 'general' ? (s.title || 'Event') : (job?.name || 'Work')}
                    </div>
                  );
                })}
              </div>
              <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"></path></svg>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
