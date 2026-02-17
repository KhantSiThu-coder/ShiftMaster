
import React, { useState, useEffect } from 'react';
import { Job } from '../types';

interface JobManagerProps {
  jobs: Job[];
  onAdd: (job: Job) => void;
  onDelete: (id: string) => void;
}

export const JobManager: React.FC<JobManagerProps> = ({ jobs, onAdd, onDelete }) => {
  const [name, setName] = useState('');
  const [rate, setRate] = useState<number>(0);
  const [transportFee, setTransportFee] = useState<number>(0);
  const [lateBonus, setLateBonus] = useState<number>(0);
  const [color, setColor] = useState('#3b82f6');
  const [isAdding, setIsAdding] = useState(false);
  const [editingJobId, setEditingJobId] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    
    // Final check for negative values
    const safeRate = Math.max(0, rate);
    const safeTransport = Math.max(0, transportFee);
    const safeLateBonus = Math.min(100, Math.max(0, lateBonus));

    onAdd({
      id: editingJobId || Date.now().toString(),
      name,
      hourlyRate: safeRate,
      transportFee: safeTransport,
      lateNightBonusPercent: safeLateBonus,
      color
    });

    resetForm();
  };

  const resetForm = () => {
    setName('');
    setRate(0);
    setTransportFee(0);
    setLateBonus(0);
    setColor('#3b82f6');
    setEditingJobId(null);
    setIsAdding(false);
  };

  const handleEdit = (job: Job) => {
    setName(job.name);
    setRate(job.hourlyRate || 0);
    setTransportFee(job.transportFee || 0);
    setLateBonus(job.lateNightBonusPercent || 0);
    setColor(job.color);
    setEditingJobId(job.id);
    setIsAdding(true);
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm h-fit">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-slate-800">Part-time Jobs</h3>
        <button 
          onClick={() => {
            if (isAdding) resetForm();
            else setIsAdding(true);
          }}
          className="text-xs font-semibold text-blue-600 hover:text-blue-700 uppercase tracking-wider"
        >
          {isAdding ? 'Cancel' : '+ New Job'}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-slate-50 rounded-xl space-y-4">
          <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
            {editingJobId ? 'Edit Job' : 'Create New Job'}
          </h4>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Job Name</label>
            <input 
              type="text" placeholder="e.g. Cafe" required value={name} onChange={e => setName(e.target.value)}
              className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Hourly wage</label>
              <input 
                type="number" 
                min="0" 
                placeholder="0" 
                value={rate} 
                onChange={e => setRate(Math.max(0, Number(e.target.value)))}
                className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Trans Fee</label>
              <input 
                type="number" 
                min="0" 
                placeholder="0" 
                value={transportFee} 
                onChange={e => setTransportFee(Math.max(0, Number(e.target.value)))}
                className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Late Bonus (%)</label>
              <input 
                type="number" 
                min="0" 
                max="100"
                placeholder="0" 
                value={lateBonus} 
                onChange={e => setLateBonus(Math.min(100, Math.max(0, Number(e.target.value))))}
                className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Label Color</label>
              <input 
                type="color" value={color} onChange={e => setColor(e.target.value)}
                className="w-full h-9 p-0.5 border border-slate-200 rounded-lg cursor-pointer"
              />
            </div>
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white text-sm font-semibold py-2 rounded-lg mt-2 transition-colors hover:bg-blue-700">
            {editingJobId ? 'Update Job' : 'Add Job'}
          </button>
        </form>
      )}

      <div className="space-y-2">
        {jobs.length === 0 && !isAdding && <p className="text-xs text-slate-400 italic">No jobs added yet.</p>}
        {jobs.map(job => (
          <div key={job.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors group">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: job.color }}></div>
              <div>
                <p className="text-sm font-semibold text-slate-700">{job.name}</p>
                <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                  <p className="text-[10px] text-slate-400">{job.hourlyRate}/hr</p>
                  <p className="text-[10px] text-emerald-600 font-medium">Trans: {job.transportFee}/day</p>
                  {job.lateNightBonusPercent ? (
                    <p className="text-[10px] text-indigo-500 font-medium">Late: +{job.lateNightBonusPercent}%</p>
                  ) : null}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
              <button 
                onClick={() => handleEdit(job)}
                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Edit Job"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
              </button>
              <button 
                onClick={() => onDelete(job.id)}
                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete Job"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
