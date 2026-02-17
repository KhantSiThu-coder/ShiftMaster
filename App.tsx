
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Shift, ShiftStats, Job } from './types';
import { getAllShifts, addShift, updateShift, deleteShift, getAllJobs, saveJob, deleteJob } from './utils/db';
import { aggregateStats } from './utils/calculations';
import { StatsCards } from './components/StatsCards';
import { Calendar } from './components/Calendar';
import { JobManager } from './components/JobManager';
import { EventModal } from './components/EventModal';
import { ShiftList } from './components/ShiftList';

type ViewMode = 'calendar' | 'list';

const App: React.FC = () => {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | undefined>();
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');

  const loadData = useCallback(async () => {
    try {
      const [shiftData, jobData] = await Promise.all([getAllShifts(), getAllJobs()]);
      setShifts(shiftData);
      setJobs(jobData);
    } catch (err) {
      console.error("Failed to load data:", err);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const monthlyShifts = useMemo(() => {
    return shifts.filter(s => {
      const d = new Date(s.date);
      return d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
    });
  }, [shifts, currentDate]);

  const stats = useMemo(() => {
    return aggregateStats(monthlyShifts, jobs, selectedJobId);
  }, [monthlyShifts, jobs, selectedJobId]);

  const handleSaveShift = async (shiftData: Shift) => {
    try {
      if (shiftData.id !== undefined) {
        await updateShift(shiftData);
      } else {
        await addShift(shiftData);
      }
      await loadData();
    } catch (err) {
      alert("Error saving entry: " + err);
    }
  };

  const handleDeleteShift = async (id: number): Promise<boolean> => {
    if (confirm("Delete this entry? This action cannot be undone.")) {
      try {
        await deleteShift(id);
        await loadData();
        return true;
      } catch (err) {
        console.error("Delete error:", err);
        alert("Error deleting entry: " + err);
        return false;
      }
    }
    return false;
  };

  const handleAddJob = async (job: Job) => {
    await saveJob(job);
    await loadData();
  };

  const handleDeleteJob = async (id: string) => {
    if (confirm("Delete this job? Shifts linked to it will lose their color/rate.")) {
      await deleteJob(id);
      await loadData();
    }
  };

  const changeMonth = (offset: number) => {
    const next = new Date(currentDate);
    next.setMonth(currentDate.getMonth() + offset);
    setCurrentDate(next);
  };

  const openAddModal = (date: string) => {
    setSelectedDate(date);
    setEditingShift(null);
    setIsModalOpen(true);
  };

  const openEditModal = (shift: Shift) => {
    setEditingShift(shift);
    setIsModalOpen(true);
  };

  const activeFilterName = useMemo(() => {
    if (selectedJobId === 'general') return 'General';
    return jobs.find(j => j.id === selectedJobId)?.name;
  }, [jobs, selectedJobId]);

  const filteredHistoryShifts = useMemo(() => {
    if (!selectedJobId) return monthlyShifts;
    if (selectedJobId === 'general') return monthlyShifts.filter(s => s.type === 'general');
    return monthlyShifts.filter(s => s.jobId === selectedJobId);
  }, [monthlyShifts, selectedJobId]);

  const filteredCalendarShifts = useMemo(() => {
    if (!selectedJobId) return shifts;
    if (selectedJobId === 'general') return shifts.filter(s => s.type === 'general');
    return shifts.filter(s => s.jobId === selectedJobId);
  }, [shifts, selectedJobId]);

  return (
    <div className="min-h-screen bg-slate-50/50 pb-12">
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-50 px-4 py-3 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-lg sm:rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200 flex-shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold text-slate-800 leading-tight truncate">ShiftMaster</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            <select 
              className="text-[10px] sm:text-xs font-bold px-2 sm:px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg outline-none cursor-pointer max-w-[90px] sm:max-w-none truncate"
              value={selectedJobId || ''}
              onChange={e => setSelectedJobId(e.target.value || undefined)}
            >
              <option value="">All</option>
              <option value="general">General</option>
              {jobs.map(j => <option key={j.id} value={j.id}>{j.name}</option>)}
            </select>
            <div className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-tighter bg-slate-100 px-2 sm:px-3 py-1.5 rounded-full whitespace-nowrap">
              {currentDate.toLocaleString(undefined, { month: 'short', year: '2-digit' })}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="flex items-center justify-between mb-3 sm:hidden">
          <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Monthly Summary</h2>
          <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
            {selectedJobId === 'general' ? 'General' : selectedJobId ? jobs.find(j => j.id === selectedJobId)?.name : 'Consolidated'}
          </span>
        </div>

        <StatsCards stats={stats} />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white px-4 py-3 sm:px-6 sm:py-4 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex gap-1.5 sm:gap-2">
                <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-slate-50 rounded-lg transition-colors border border-slate-100">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                </button>
                <button onClick={() => setCurrentDate(new Date())} className="px-3 sm:px-4 py-2 text-[10px] sm:text-xs font-bold text-slate-500 uppercase hover:bg-slate-50 rounded-lg transition-colors border border-slate-100">
                  Today
                </button>
                <button onClick={() => changeMonth(1)} className="p-2 hover:bg-slate-50 rounded-lg transition-colors border border-slate-100">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                </button>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  <button 
                    onClick={() => setViewMode('calendar')}
                    className={`p-2 rounded-lg transition-all ${viewMode === 'calendar' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    title="Calendar View"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                  </button>
                  <button 
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    title="List View"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path></svg>
                  </button>
                </div>

                <button 
                  onClick={() => openAddModal(new Date().toISOString().split('T')[0])}
                  className="bg-blue-600 text-white px-4 py-2 sm:px-6 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"></path></svg>
                  <span className="hidden sm:inline">Add Entry</span>
                  <span className="sm:hidden">Add</span>
                </button>
              </div>
            </div>

            {viewMode === 'calendar' ? (
              <>
                <Calendar 
                  currentDate={currentDate} 
                  shifts={filteredCalendarShifts} 
                  jobs={jobs}
                  onDateClick={openAddModal}
                  onShiftClick={openEditModal}
                />
                <ShiftList 
                  shifts={filteredHistoryShifts} 
                  jobs={jobs}
                  onDelete={handleDeleteShift}
                  onEdit={openEditModal}
                  selectedJobName={activeFilterName}
                />
              </>
            ) : (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <ShiftList 
                  shifts={filteredHistoryShifts} 
                  jobs={jobs}
                  onDelete={handleDeleteShift}
                  onEdit={openEditModal}
                  selectedJobName={activeFilterName}
                />
              </div>
            )}
          </div>

          <div className="space-y-6">
            <JobManager jobs={jobs} onAdd={handleAddJob} onDelete={handleDeleteJob} />
            
            <div className="p-6 bg-slate-100 rounded-3xl border border-slate-200">
              <h3 className="text-sm font-bold text-slate-800 mb-2">Instructions</h3>
              <ul className="text-xs text-slate-500 space-y-2">
                <li>• Add jobs with hourly rates to track earnings.</li>
                <li>• Click any date to add a shift or event.</li>
                <li>• Click an existing entry to edit or delete it.</li>
                <li>• Entries on the same day are sorted by time.</li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      <EventModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSaveShift} 
        onDelete={handleDeleteShift}
        selectedDate={selectedDate}
        jobs={jobs}
        initialShift={editingShift}
      />

      <footer className="mt-12 mb-8 flex justify-center px-4">
        <a 
          href="https://click.ecc.ac.jp/ecc/khant_si_thu/portfolio/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-[#6b7280] hover:text-blue-600 transition-all group"
        >
          <div className="flex-shrink-0">
            <svg className="w-7 h-7 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="7" r="4.5" />
              <path d="M12 13c-4.418 0-8 3.582-8 8v1h16v-1c0-4.418-3.582-8-8-8zm1 6.5h-2v2h2v-2z" opacity="0.9" />
              <path d="M10.5 13.5l1.5 3 1.5-3z" opacity="0.6" />
            </svg>
          </div>
          <span className="text-xl font-semibold tracking-tight">Portfolio</span>
        </a>
      </footer>
    </div>
  );
};

export default App;
