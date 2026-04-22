
import React from 'react';
import { Shift, Job } from '../types';
import { isJapanHoliday } from '../utils/holidays';

interface DayHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  dayShifts: Shift[];
  jobs: Job[];
  onAddEntry: (date: string) => void;
  onEditEntry: (shift: Shift) => void;
}

export const DayHistoryModal: React.FC<DayHistoryModalProps> = ({
  isOpen,
  onClose,
  date,
  dayShifts,
  jobs,
  onAddEntry,
  onEditEntry,
}) => {
  if (!isOpen) return null;

  const [y, m, d] = date.split('-').map(Number);
  const dateObj = new Date(y, m - 1, d);
  const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
  const holiday = isJapanHoliday(date);
  const isSpecialDay = isWeekend || !!holiday;

  const formatDate = (dateStr: string) => {
    return dateObj.toLocaleString('ja-JP', { month: 'long', day: 'numeric', weekday: 'long' });
  };

  const formatTime = (time: string) => {
    if (!time) return '';
    return time.padStart(5, '0');
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 transition-all duration-300">
      <div className="absolute inset-0 bg-slate-900/40 dark:bg-slate-950/70 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 border border-slate-100 dark:border-slate-800">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Schedule History</h2>
            <div className="flex items-center gap-2">
              <p className={`text-xs font-bold mt-0.5 uppercase tracking-wider ${isSpecialDay ? 'text-red-500 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'}`}>
                {formatDate(date)}
              </p>
              {holiday && (
                <span className="text-[10px] font-black text-white bg-red-500 dark:bg-red-600 px-1.5 py-0.5 rounded-md uppercase animate-pulse">
                  {holiday.name}
                </span>
              )}
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 p-1">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-3 custom-scrollbar">
          {dayShifts.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-300 dark:text-slate-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
              </div>
              <p className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">No entries for this day</p>
            </div>
          ) : (
            dayShifts.map((shift, idx) => {
              const job = jobs.find(j => j.id === shift.jobId);
              const color = shift.type === 'general' 
                ? (shift.color || '#64748b') 
                : (job?.color || '#3b82f6');
              
              return (
                <div 
                  key={idx}
                  onClick={() => onEditEntry(shift)}
                  className="group relative flex items-center gap-4 p-4 bg-slate-50/50 dark:bg-slate-800/30 hover:bg-white dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-900/30 rounded-2xl transition-all cursor-pointer shadow-sm hover:shadow-md"
                >
                  <div className="w-1.5 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: color }}></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">
                        {shift.type === 'general' ? (shift.title || 'General Event') : (job?.name || 'Work')}
                      </p>
                      <span className="text-[10px] font-mono font-black text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-100 dark:border-slate-800 group-hover:border-blue-100 dark:group-hover:border-blue-900/30 transition-colors">
                        {shift.isAllDay ? 'ALL DAY' : `${formatTime(shift.startTime)} - ${formatTime(shift.endTime)}`}
                      </span>
                    </div>
                    {shift.note && (
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate line-clamp-1 italic">
                        {shift.note}
                      </p>
                    )}
                  </div>
                  <button className="text-slate-300 dark:text-slate-700 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                  </button>
                </div>
              );
            })
          )}
        </div>

        <div className="p-6 bg-slate-50/50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800">
          <button 
            onClick={() => onAddEntry(date)}
            className="w-full bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-xl shadow-blue-100 dark:shadow-none transition-all flex items-center justify-center gap-2 transform active:scale-[0.98]"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"></path></svg>
            Add New Entry
          </button>
        </div>
      </div>
    </div>
  );
};
