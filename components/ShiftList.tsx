
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
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mt-6">
      <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            Shift History
            {selectedJobName && (
              <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase border border-blue-100">
                {selectedJobName}
              </span>
            )}
          </h2>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {shifts.length} {shifts.length === 1 ? 'Entry' : 'Entries'}
          </div>
        </div>

        <div className="flex bg-slate-200/50 p-1 rounded-xl w-fit">
          <button 
            onClick={() => setDisplayMode('all')}
            className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${displayMode === 'all' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            All
          </button>
          <button 
            onClick={() => setDisplayMode('summarize')}
            className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${displayMode === 'summarize' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Summarize
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Hours</th>
              {displayMode === 'all' && (
                <>
                  <th className="px-6 py-4">Break</th>
                  <th className="px-6 py-4">Late Night</th>
                </>
              )}
              <th className="px-6 py-4">Job Name</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedShifts.length === 0 ? (
              <tr>
                <td colSpan={displayMode === 'all' ? 6 : 4} className="px-6 py-10 text-center text-slate-400 text-sm italic">
                  No entries found for this period.
                </td>
              </tr>
            ) : (
              sortedShifts.map((shift) => {
                const { total, late } = calculateShiftHours(shift);
                const job = jobs.find(j => j.id === shift.jobId);
                
                return (
                  <tr key={shift.id} className="hover:bg-slate-50/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-700 text-sm">
                        {new Date(shift.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono tracking-tighter">
                        {formatTime(shift.startTime)} — {formatTime(shift.endTime)}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-black text-slate-800 text-sm">{total.toFixed(1)}h</td>
                    
                    {displayMode === 'all' && (
                      <>
                        <td className="px-6 py-4 text-slate-500 text-xs font-medium">{shift.breakMinutes}m</td>
                        <td className="px-6 py-4">
                          {late > 0 ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tighter bg-indigo-50 text-indigo-600 border border-indigo-100">
                              {late.toFixed(1)}h late
                            </span>
                          ) : (
                            <span className="text-slate-300 text-xs">—</span>
                          )}
                        </td>
                      </>
                    )}

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {shift.type === 'general' ? (
                          <>
                            <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                            <span className="text-xs font-medium text-slate-500 truncate max-w-[120px]">{shift.title || 'General Event'}</span>
                          </>
                        ) : job ? (
                          <>
                            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: job.color }}></div>
                            <span className="text-xs font-semibold text-slate-700 truncate max-w-[120px]">{job.name}</span>
                          </>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Unassigned Work</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => onEdit(shift)}
                          className="text-slate-400 hover:text-blue-600 transition-colors p-1.5 rounded-lg hover:bg-blue-50"
                          title="Edit Entry"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                        </button>
                        <button 
                          onClick={(e) => handleDeleteClick(e, shift.id)}
                          className="text-slate-400 hover:text-red-600 transition-colors p-1.5 rounded-lg hover:bg-red-50"
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
    </div>
  );
};
