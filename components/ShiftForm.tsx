
import React, { useState } from 'react';
import { Shift } from '../types';

interface ShiftFormProps {
  onAdd: (shift: Shift) => void;
}

export const ShiftForm: React.FC<ShiftFormProps> = ({ onAdd }) => {
  const [formData, setFormData] = useState<Omit<Shift, 'id'>>({
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '17:00',
    breakMinutes: 0,
    note: '',
    type: 'work'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(formData as Shift);
    setFormData(prev => ({ ...prev, note: '' }));
  };

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
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Break Duration (mins)</label>
          <input 
            type="number" 
            min="0"
            value={formData.breakMinutes}
            onChange={e => setFormData({ ...formData, breakMinutes: parseInt(e.target.value) || 0 })}
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
          />
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
