
import React, { useState, useEffect } from 'react';
import { Shift, Job, EntryType } from '../types';
import { formatLinks } from '../utils/text';

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
  const [formData, setFormData] = useState<Shift>(() => {
    const lastJobId = localStorage.getItem('shiftmaster_last_jobId');
    const validJobId = (lastJobId && jobs.some(j => j.id === lastJobId)) ? lastJobId : (jobs[0]?.id || '');
    const lastStartTime = localStorage.getItem('shiftmaster_last_startTime') || '09:00';
    const lastEndTime = localStorage.getItem('shiftmaster_last_endTime') || '17:00';
    const lastPaidLeaveHours = localStorage.getItem('shiftmaster_last_paidLeaveHours');
    const defaultPaidLeaveHours = lastPaidLeaveHours !== null ? parseInt(lastPaidLeaveHours) : 8;
    const lastPaidLeaveMinutes = localStorage.getItem('shiftmaster_last_paidLeaveMinutes');
    const defaultPaidLeaveMinutes = lastPaidLeaveMinutes !== null ? parseInt(lastPaidLeaveMinutes) : 0;

    return {
      date: selectedDate,
      startTime: lastStartTime,
      endTime: lastEndTime,
      breakMinutes: 0,
      note: '',
      title: '',
      type: 'work',
      jobId: validJobId,
      color: '#64748b',
      photo: '',
      photos: [],
      isAllDay: false,
      isPaidLeave: false,
      paidLeaveHours: defaultPaidLeaveHours,
      paidLeaveMinutes: defaultPaidLeaveMinutes
    };
  });

  useEffect(() => {
    if (initialShift) {
      const initialPhotos = initialShift.photos || (initialShift.photo ? [initialShift.photo] : []);
      setFormData({ 
        ...initialShift, 
        title: initialShift.title || '', 
        color: initialShift.color || '#64748b', 
        photo: initialShift.photo || '',
        photos: initialPhotos,
        isAllDay: initialShift.isAllDay || false,
        isPaidLeave: initialShift.isPaidLeave || false,
        paidLeaveHours: initialShift.paidLeaveHours !== undefined ? initialShift.paidLeaveHours : 8,
        paidLeaveMinutes: initialShift.paidLeaveMinutes !== undefined ? initialShift.paidLeaveMinutes : 0
      });
    } else {
      const lastJobId = localStorage.getItem('shiftmaster_last_jobId');
      const validJobId = (lastJobId && jobs.some(j => j.id === lastJobId)) ? lastJobId : (jobs[0]?.id || '');
      const lastStartTime = localStorage.getItem('shiftmaster_last_startTime') || '09:00';
      const lastEndTime = localStorage.getItem('shiftmaster_last_endTime') || '17:00';
      const lastPaidLeaveHours = localStorage.getItem('shiftmaster_last_paidLeaveHours');
      const defaultPaidLeaveHours = lastPaidLeaveHours !== null ? parseInt(lastPaidLeaveHours) : 8;
      const lastPaidLeaveMinutes = localStorage.getItem('shiftmaster_last_paidLeaveMinutes');
      const defaultPaidLeaveMinutes = lastPaidLeaveMinutes !== null ? parseInt(lastPaidLeaveMinutes) : 0;

      setFormData({
        date: selectedDate,
        startTime: lastStartTime,
        endTime: lastEndTime,
        breakMinutes: 0,
        note: '',
        title: '',
        type: 'work',
        jobId: validJobId,
        color: '#64748b',
        photo: '',
        photos: [],
        isAllDay: false,
        isPaidLeave: false,
        paidLeaveHours: defaultPaidLeaveHours,
        paidLeaveMinutes: defaultPaidLeaveMinutes
      });
    }
  }, [initialShift, selectedDate, jobs, isOpen]);

  const [expandedPhoto, setExpandedPhoto] = useState<string | null>(null);

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
      photo: type === 'general' ? prev.photo : '',
      photos: type === 'general' ? prev.photos : [],
      // Clear all day if switching to work
      isAllDay: type === 'general' ? prev.isAllDay : false,
      isPaidLeave: type === 'general' ? false : prev.isPaidLeave
    }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newPhotos: string[] = [];
      let loadedCount = 0;
      const fileList = Array.from(files);
      
      fileList.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            newPhotos.push(reader.result);
          }
          loadedCount++;
          if (loadedCount === fileList.length) {
            setFormData(prev => ({
              ...prev,
              photos: [...(prev.photos || []), ...newPhotos]
            }));
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removePhotoAtIndex = (index: number) => {
    setFormData(prev => {
      const currentPhotos = prev.photos || (prev.photo ? [prev.photo] : []);
      const updatedPhotos = currentPhotos.filter((_, idx) => idx !== index);
      return {
        ...prev,
        photo: updatedPhotos[0] || '',
        photos: updatedPhotos
      };
    });
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

    // Save selected values to persist for future additions
    if (formData.jobId) {
      localStorage.setItem('shiftmaster_last_jobId', formData.jobId);
    }
    if (formData.startTime) {
      localStorage.setItem('shiftmaster_last_startTime', formData.startTime);
    }
    if (formData.endTime) {
      localStorage.setItem('shiftmaster_last_endTime', formData.endTime);
    }
    if (formData.paidLeaveHours !== undefined) {
      localStorage.setItem('shiftmaster_last_paidLeaveHours', String(formData.paidLeaveHours));
    }
    if (formData.paidLeaveMinutes !== undefined) {
      localStorage.setItem('shiftmaster_last_paidLeaveMinutes', String(formData.paidLeaveMinutes));
    }

    if (finalData.type === 'general') {
      delete finalData.jobId;
      finalData.breakMinutes = 0;
      if (finalData.isAllDay) {
        finalData.startTime = '00:00';
        finalData.endTime = '00:00';
      }
      finalData.photo = finalData.photos && finalData.photos.length > 0 ? finalData.photos[0] : '';
    } else {
      // For work entries, we want to use the job's color, so we remove the custom color
      delete finalData.color;
      if (finalData.isPaidLeave) {
        finalData.breakMinutes = 0;
      }
    }
    onSave(finalData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 transition-all duration-300">
      <div className="absolute inset-0 bg-slate-900/40 dark:bg-slate-950/70 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 border border-slate-100 dark:border-slate-800 flex flex-col max-h-[calc(100vh-2rem)]">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50 flex-shrink-0">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{isEditing ? 'Edit Entry' : 'Add Entry'}</h2>
          <button type="button" onClick={onClose} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 p-1">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        
        <form className="flex-1 flex flex-col min-h-0" onSubmit={handleSubmit}>
          <div className="flex-1 p-6 space-y-4 overflow-y-auto custom-scrollbar">
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
              <div className="space-y-4">
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

                <div className="flex items-center gap-2 px-1">
                  <input 
                    type="checkbox" 
                    id="isPaidLeave" 
                    checked={formData.isPaidLeave || false} 
                    onChange={e => setFormData({ 
                      ...formData, 
                      isPaidLeave: e.target.checked,
                      breakMinutes: e.target.checked ? 0 : formData.breakMinutes
                    })}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <label htmlFor="isPaidLeave" className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider cursor-pointer">Paid Leave</label>
                </div>
              </div>
            )}

            {formData.type === 'general' && (
              <div className="flex items-center gap-2 px-1">
                <input 
                  type="checkbox" 
                  id="isAllDay" 
                  checked={formData.isAllDay} 
                  onChange={e => setFormData({ ...formData, isAllDay: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="isAllDay" className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider cursor-pointer">All Day Event</label>
              </div>
            )}

            {!formData.isAllDay && !formData.isPaidLeave && (
              <div className="flex gap-4">
                <TimeSelector label="Start (24h)" value={formData.startTime} type="startTime" />
                <TimeSelector label="End (24h)" value={formData.endTime} type="endTime" />
              </div>
            )}

            {formData.type === 'work' && formData.isPaidLeave && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">Paid Leave Hours</label>
                  <select 
                    value={formData.paidLeaveHours !== undefined ? formData.paidLeaveHours : 8}
                    onChange={e => setFormData({ ...formData, paidLeaveHours: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 outline-none text-sm font-mono cursor-pointer text-slate-700 dark:text-slate-200"
                  >
                    {formData.paidLeaveHours !== undefined && formData.paidLeaveHours > 8 && (
                      <option value={formData.paidLeaveHours} disabled hidden>
                        {String(formData.paidLeaveHours).padStart(2, '0')}
                      </option>
                    )}
                    {Array.from({ length: 9 }, (_, i) => i).map(h => (
                      <option key={h} value={h}>
                        {String(h).padStart(2, '0')}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">Paid Leave Minutes</label>
                  <select 
                    value={formData.paidLeaveMinutes !== undefined ? formData.paidLeaveMinutes : 0}
                    onChange={e => setFormData({ ...formData, paidLeaveMinutes: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 outline-none text-sm font-mono cursor-pointer text-slate-700 dark:text-slate-200"
                  >
                    {Array.from({ length: 60 }, (_, i) => i).map(m => (
                      <option key={m} value={m}>
                        {String(m).padStart(2, '0')}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {formData.type === 'work' && !formData.isPaidLeave && (
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
              {formData.note && formData.note.includes('http') && (
                <div className="mt-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Link Preview</p>
                  <div className="text-xs text-slate-600 dark:text-slate-300 break-all leading-relaxed italic">
                    {formatLinks(formData.note, true)}
                  </div>
                </div>
              )}
            </div>

            {formData.type === 'general' && (
              <div>
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Photos</label>
                
                <div className="grid grid-cols-3 gap-2">
                  {(formData.photos || []).map((photoUrl, index) => (
                    <div 
                      key={index} 
                      className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 group/photo"
                    >
                      <img 
                        src={photoUrl} 
                        alt={`Preview ${index + 1}`} 
                        className="w-full h-full object-cover cursor-zoom-in transition-transform hover:scale-105" 
                        onClick={() => setExpandedPhoto(photoUrl)}
                      />
                      <button 
                        type="button" 
                        onClick={() => removePhotoAtIndex(index)}
                        className="absolute top-1.5 right-1.5 p-1 bg-red-500 text-white rounded-full shadow hover:bg-red-600 transition-colors z-10"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                      </button>
                    </div>
                  ))}
                  
                  <div className="relative aspect-square">
                    <input 
                      type="file" 
                      accept="image/*" 
                      multiple
                      onChange={handlePhotoChange}
                      className="hidden" 
                      id="photo-upload"
                    />
                    <label 
                      htmlFor="photo-upload"
                      className="flex flex-col items-center justify-center w-full h-full border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                    >
                      <svg className="w-5 h-5 text-slate-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                      <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-center px-1">Add Photo</span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex-shrink-0 flex gap-3">
            {isEditing && (
              <button 
                type="button" 
                onClick={handleFormDelete}
                className="flex-1 border-2 border-red-50 dark:border-red-900/20 hover:bg-red-50 dark:hover:bg-red-900/10 text-red-500 dark:text-red-400 font-bold py-3 rounded-2xl transition-all text-sm"
              >
                Delete
              </button>
            )}
            <button type="submit" className="flex-[2] bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white font-bold py-3 rounded-2xl shadow-xl shadow-blue-100 dark:shadow-none transition-all transform active:scale-[0.98] text-sm">
              {isEditing ? 'Update Entry' : 'Save Entry'}
            </button>
          </div>
        </form>
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
