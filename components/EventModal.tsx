
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
    jobId: jobs[0]?.id || '',
    color: '#64748b',
    photo: ''
  });

  useEffect(() => {
    if (initialShift) {
      setFormData({ ...initialShift, title: initialShift.title || '', color: initialShift.color || '#64748b', photo: initialShift.photo || '' });
    } else {
      setFormData({
        date: selectedDate,
        startTime: '09:00',
        endTime: '17:00',
        breakMinutes: 0,
        note: '',
        title: '',
        type: 'work',
        jobId: jobs[0]?.id || '',
        color: '#64748b',
        photo: ''
      });
    }
  }, [initialShift, selectedDate, jobs, isOpen]);

  const [isPhotoExpanded, setIsPhotoExpanded] = useState(false);

  if (!isOpen) return null;

  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

  const handleTimeChange = (type: 'startTime' | 'endTime', part: 'h' | 'm', value: string) => {
    const current = formData[type].split(':');
    const newTime = part === 'h' ? `${value}:${current[1]}` : `${current[0]}:${value}`;
    setFormData({ ...formData, [type]: newTime });
  };

  const handleTypeSwitch = (type: EntryType) => {
    setFormData(prev => ({
      ...prev,
      type,
      // If switching to general, clear the jobId. If switching to work, set to first job if none exists.
      jobId: type === 'general' ? undefined : (prev.jobId || jobs[0]?.id || ''),
      // Also clear work-specific fields if it's general
      breakMinutes: type === 'general' ? 0 : prev.breakMinutes,
      // Clear photo if switching to work
      photo: type === 'general' ? prev.photo : ''
    }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, photo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setFormData({ ...formData, photo: '' });
  };

  const TimeSelector = ({ label, value, type }: { label: string; value: string; type: 'startTime' | 'endTime' }) => {
    const [h, m] = value.split(':');
    return (
      <div className="flex-1">
        <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">{label}</label>
        <div className="flex items-center gap-1">
          <select 
            value={h}
            onChange={(e) => handleTimeChange(type, 'h', e.target.value)}
            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 outline-none text-sm font-mono cursor-pointer text-slate-700 dark:text-slate-200"
          >
            {hours.map(hour => <option key={hour} value={hour}>{hour}</option>)}
          </select>
          <span className="font-bold text-slate-400 dark:text-slate-600">:</span>
          <select 
            value={m}
            onChange={(e) => handleTimeChange(type, 'm', e.target.value)}
            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 outline-none text-sm font-mono cursor-pointer text-slate-700 dark:text-slate-200"
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Final check to ensure consistency before saving
    const finalData = { ...formData };
    if (finalData.type === 'general') {
      delete finalData.jobId;
      finalData.breakMinutes = 0;
    }
    onSave(finalData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 transition-all duration-300">
      <div className="absolute inset-0 bg-slate-900/40 dark:bg-slate-950/70 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 border border-slate-100 dark:border-slate-800">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{isEditing ? 'Edit Entry' : 'Add Entry'}</h2>
          <button type="button" onClick={onClose} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 p-1">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        
        <form className="p-6 space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">Date</label>
              <input 
                type="date" value={formData.date}
                onChange={e => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-200 outline-none font-medium focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 cursor-pointer"
              />
            </div>
            <div>
               <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">Type</label>
               <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                {(['work', 'general'] as EntryType[]).map(t => (
                  <button
                    key={t} type="button"
                    onClick={() => handleTypeSwitch(t)}
                    className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${formData.type === t ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-200 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {formData.type === 'general' ? (
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">Event Title</label>
                <input 
                  type="text" 
                  value={formData.title} 
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Doctor appointment"
                  className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 outline-none text-sm text-slate-700 dark:text-slate-200"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">Color</label>
                <input 
                  type="color" 
                  value={formData.color} 
                  onChange={e => setFormData({ ...formData, color: e.target.value })}
                  className="w-full h-9 p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer"
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">Select Job</label>
              <select 
                value={formData.jobId || ''}
                onChange={e => setFormData({ ...formData, jobId: e.target.value })}
                className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 outline-none text-sm font-medium cursor-pointer text-slate-700 dark:text-slate-200"
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
              <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">Break (mins)</label>
              <input 
                type="number" min="0" value={formData.breakMinutes} onChange={e => setFormData({ ...formData, breakMinutes: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 outline-none text-sm text-slate-700 dark:text-slate-200"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">Notes</label>
            <textarea 
              value={formData.note} onChange={e => setFormData({ ...formData, note: e.target.value })}
              className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 outline-none text-sm text-slate-700 dark:text-slate-200"
              rows={2} placeholder="Optional details..."
            />
          </div>

          {formData.type === 'general' && (
            <div>
              <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">Photo</label>
              {formData.photo ? (
                <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 group/photo">
                  <img 
                    src={formData.photo} 
                    alt="Preview" 
                    className="w-full h-full object-cover cursor-zoom-in transition-transform hover:scale-105" 
                    onClick={() => setIsPhotoExpanded(true)}
                  />
                  <button 
                    type="button" 
                    onClick={removePhoto}
                    className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors z-10"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                  </button>
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/photo:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"></path></svg>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handlePhotoChange}
                    className="hidden" 
                    id="photo-upload"
                  />
                  <label 
                    htmlFor="photo-upload"
                    className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                  >
                    <svg className="w-6 h-6 text-slate-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Upload Photo</span>
                  </label>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            {isEditing && (
              <button 
                type="button" 
                onClick={handleFormDelete}
                className="flex-1 border-2 border-red-50 dark:border-red-900/20 hover:bg-red-50 dark:hover:bg-red-900/10 text-red-500 dark:text-red-400 font-bold py-3.5 rounded-2xl transition-all"
              >
                Delete
              </button>
            )}
            <button type="submit" className="flex-[2] bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white font-bold py-3.5 rounded-2xl shadow-xl shadow-blue-100 dark:shadow-none transition-all transform active:scale-[0.98]">
              {isEditing ? 'Update Entry' : 'Save Entry'}
            </button>
          </div>
        </form>
      </div>

      {isPhotoExpanded && formData.photo && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-300"
          onClick={() => setIsPhotoExpanded(false)}
        >
          <button 
            className="absolute top-4 right-4 p-2 text-white/70 hover:text-white transition-colors"
            onClick={() => setIsPhotoExpanded(false)}
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
          <img 
            src={formData.photo} 
            alt="Expanded" 
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-300" 
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};
