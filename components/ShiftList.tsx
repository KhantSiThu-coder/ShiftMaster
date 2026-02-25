
import React, { useState } from 'react';
import { Shift, Job } from '../types';
import { calculateShiftHours } from '../utils/calculations';

interface ShiftListProps {
  shifts: Shift[];
  jobs: Job[];
  onDelete: (id: number) => Promise<boolean>;
  onEdit: (shift: Shift) => void;
  selectedJobName?: string;
}

type ListDisplayMode = 'all' | 'summarize';

export const ShiftList: React.FC<ShiftListProps> = ({ shifts, jobs, onDelete, onEdit, selectedJobName }) => {
  const [displayMode, setDisplayMode] = useState<ListDisplayMode>('all');
  const [expandedPhoto, setExpandedPhoto] = useState<string | null>(null);

  // Sort shifts by date ascending, then by time ascending as requested
  const sortedShifts = [...shifts].sort((a, b) => {
    if (a.date !== b.date) {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    }
    return a.startTime.localeCompare(b.startTime);
  });

  const formatTime = (time: string) => {
    if (!time) return '--:--';
    const [h, m] = time.split(':');
    return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`;
  };

  const handleDeleteClick = async (e: React.MouseEvent, id: number | undefined) => {
    e.preventDefault();
    e.stopPropagation();
    if (id !== undefined) {
      await onDelete(id);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden mt-6 transition-colors duration-300">
      <div className="p-6 border-b border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            Shift History
            {selectedJobName && (
              <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg text-[10px] font-black uppercase border border-blue-100 dark:border-blue-900/30">
                {selectedJobName}
              </span>
            )}
          </h2>
          <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            {shifts.length} {shifts.length === 1 ? 'Entry' : 'Entries'}
          </div>
        </div>

        <div className="flex bg-slate-200/50 dark:bg-slate-700/50 p-1 rounded-xl w-fit">
          <button 
            onClick={() => setDisplayMode('all')}
            className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${displayMode === 'all' ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-200 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
          >
            All
          </button>
          <button 
            onClick={() => setDisplayMode('summarize')}
            className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${displayMode === 'summarize' ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-200 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
          >
            Summarize
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-[9px] font-bold uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Hours</th>
              {displayMode === 'all' && (
                <>
                  <th className="px-4 py-3">Break</th>
                  <th className="px-4 py-3">Late Night</th>
                </>
              )}
              <th className="px-4 py-3">Job Name</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {sortedShifts.length === 0 ? (
              <tr>
                <td colSpan={displayMode === 'all' ? 6 : 4} className="px-6 py-10 text-center text-slate-400 dark:text-slate-500 text-sm italic">
                  No entries found for this period.
                </td>
              </tr>
            ) : (
              sortedShifts.map((shift) => {
                const { total, late } = calculateShiftHours(shift);
                const job = jobs.find(j => j.id === shift.jobId);
                
                return (
                  <tr key={shift.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/30 transition-colors group">
                    <td className="px-4 py-3 min-w-[120px]">
                      <div className="font-semibold text-slate-700 dark:text-slate-200 text-xs leading-tight">
                        {new Date(shift.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })},
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono tracking-tight mt-0.5">
                        {formatTime(shift.startTime)}–{formatTime(shift.endTime)}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-black text-slate-800 dark:text-slate-100 text-[10px]">{total.toFixed(1)}h</td>
                    
                    {displayMode === 'all' && (
                      <>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-[10px] font-medium">{shift.breakMinutes}m</td>
                        <td className="px-4 py-3">
                          {late > 0 ? (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-tighter bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30">
                              {late.toFixed(1)}h late
                            </span>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-700 text-[10px]">—</span>
                          )}
                        </td>
                      </>
                    )}

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {shift.type === 'general' ? (
                          <>
                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: shift.color || '#64748b' }}></div>
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate max-w-[100px]">{shift.title || 'General Event'}</span>
                              {shift.photo && (
                                <div 
                                  className="w-8 h-8 rounded-md overflow-hidden border border-slate-200 dark:border-slate-700 cursor-zoom-in hover:scale-110 transition-transform"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setExpandedPhoto(shift.photo || null);
                                  }}
                                >
                                  <img src={shift.photo} alt="Event" className="w-full h-full object-cover" />
                                </div>
                              )}
                            </div>
                          </>
                        ) : job ? (
                          <>
                            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: job.color }}></div>
                            <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-200 truncate max-w-[100px]">{job.name}</span>
                          </>
                        ) : (
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 italic">Unassigned Work</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => onEdit(shift)}
                          className="text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30"
                          title="Edit Entry"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                        </button>
                        <button 
                          onClick={(e) => handleDeleteClick(e, shift.id)}
                          className="text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30"
                          title="Delete Entry"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {expandedPhoto && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-300"
          onClick={() => setExpandedPhoto(null)}
        >
          <button 
            className="absolute top-4 right-4 p-2 text-white/70 hover:text-white transition-colors"
            onClick={() => setExpandedPhoto(null)}
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
          <img 
            src={expandedPhoto} 
            alt="Expanded" 
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-300" 
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};
