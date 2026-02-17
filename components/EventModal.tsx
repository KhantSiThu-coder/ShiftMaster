
import React, { useState, useEffect } from 'react';
import { Shift, Job, EntryType } from '../types';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (shift: Shift) => void;
  onDelete?: (id: number) => Promise<boolean>;
  selectedDate: string;
  jobs: Job[];
  initialShift?: Shift | null;
}

export const EventModal: React.FC<EventModalProps> = ({ isOpen, onClose, onSave, onDelete, selectedDate, jobs, initialShift }) => {
  const [formData, setFormData] = useState<Shift>({
    date: selectedDate,
    startTime: '09:00',
    endTime: '17:00',
    breakMinutes: 0,
    note: '',
    title: '',
    type: 'work',
    jobId: jobs[0]?.id || ''
  });

  useEffect(() => {
    if (initialShift) {
      setFormData({ ...initialShift, title: initialShift.title || '' });
    } else {
      setFormData({
        date: selectedDate,
        startTime: '09:00',
        endTime: '17:00',
        breakMinutes: 0,
        note: '',
        title: '',
        type: 'work',
        jobId: jobs[0]?.id || ''
      });
    }
  }, [initialShift, selectedDate, jobs, isOpen]);

  if (!isOpen) return null;

  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

  const handleTimeChange = (type: 'startTime' | 'endTime', part: 'h' | 'm', value: string) => {
    const current = formData[type].split(':');
    const newTime = part === 'h' ? `${value}:${current[1]}` : `${current[0]}:${value}`;
    setFormData({ ...formData, [type]: newTime });
  };

  const TimeSelector = ({ label, value, type }: { label: string; value: string; type: 'startTime' | 'endTime' }) => {
    const [h, m] = value.split(':');
    return (
      <div className="flex-1">
        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">{label}</label>
        <div className="flex items-center gap-1">
          <select 
            value={h}
            onChange={(e) => handleTimeChange(type, 'h', e.target.value)}
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono cursor-pointer"
          >
            {hours.map(hour => <option key={hour} value={hour}>{hour}</option>)}
          </select>
          <span className="font-bold text-slate-400">:</span>
          <select 
            value={m}
            onChange={(e) => handleTimeChange(type, 'm', e.target.value)}
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono cursor-pointer"
          >
            {minutes.map(min => <option key={min} value={min}>{min}</option>)}
          </select>
        </div>
      </div>
    );
  };

  const isEditing = initialShift !== null && initialShift !== undefined;

  const handleFormDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDelete && formData.id !== undefined) {
      const success = await onDelete(formData.id);
      if (success) {
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-xl font-bold text-slate-800">{isEditing ? 'Edit Entry' : 'Add Entry'}</h2>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        
        <form className="p-6 space-y-4" onSubmit={(e) => {
          e.preventDefault();
          onSave(formData);
          onClose();
        }}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Date</label>
              <input 
                type="date" value={formData.date}
                onChange={e => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 outline-none font-medium focus:ring-2 focus:ring-blue-500 cursor-pointer"
              />
            </div>
            <div>
               <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Type</label>
               <div className="flex p-1 bg-slate-100 rounded-xl">
                {(['work', 'general'] as EntryType[]).map(t => (
                  <button
                    key={t} type="button"
                    onClick={() => setFormData({ ...formData, type: t })}
                    className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${formData.type === t ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {formData.type === 'general' ? (
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Event Title</label>
              <input 
                type="text" 
                value={formData.title} 
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Doctor appointment"
                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              />
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Select Job</label>
              <select 
                value={formData.jobId}
                onChange={e => setFormData({ ...formData, jobId: e.target.value })}
                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium cursor-pointer"
              >
                {jobs.map(j => <option key={j.id} value={j.id}>{j.name}</option>)}
                {jobs.length === 0 && <option value="">No jobs defined</option>}
              </select>
            </div>
          )}

          <div className="flex gap-4">
            <TimeSelector label="Start (24h)" value={formData.startTime} type="startTime" />
            <TimeSelector label="End (24h)" value={formData.endTime} type="endTime" />
          </div>

          {formData.type === 'work' && (
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Break (mins)</label>
              <input 
                type="number" min="0" value={formData.breakMinutes} onChange={e => setFormData({ ...formData, breakMinutes: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Notes</label>
            <textarea 
              value={formData.note} onChange={e => setFormData({ ...formData, note: e.target.value })}
              className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              rows={2} placeholder="Optional details..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            {isEditing && (
              <button 
                type="button" 
                onClick={handleFormDelete}
                className="flex-1 border-2 border-red-50 hover:bg-red-50 text-red-500 font-bold py-3.5 rounded-2xl transition-all"
              >
                Delete
              </button>
            )}
            <button type="submit" className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-2xl shadow-xl shadow-blue-100 transition-all transform active:scale-[0.98]">
              {isEditing ? 'Update Entry' : 'Save Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
