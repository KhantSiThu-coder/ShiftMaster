
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Shift, Job } from './types';
import { getAllShifts, addShift, updateShift, deleteShift, getAllJobs, saveJob, deleteJob } from './utils/db';
import { aggregateStats } from './utils/calculations';
import { getLocalDateString, isShiftInPaymentMonth } from './utils/date';
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
  const [selectedDate, setSelectedDate] = useState<string>(getLocalDateString());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [selectedJobIds, setSelectedJobIds] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

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

  // Close filter dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const monthlyShifts = useMemo(() => {
    return shifts.filter(s => {
      const job = jobs.find(j => j.id === s.jobId);
      return isShiftInPaymentMonth(s.date, currentDate, job);
    });
  }, [shifts, currentDate, jobs]);

  const stats = useMemo(() => {
    return aggregateStats(monthlyShifts, jobs, selectedJobIds);
  }, [monthlyShifts, jobs, selectedJobIds]);

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
    if (selectedJobIds.length === 0) return undefined;
    if (selectedJobIds.length === 1) {
      if (selectedJobIds[0] === 'general') return 'General';
      return jobs.find(j => j.id === selectedJobIds[0])?.name;
    }
    return `${selectedJobIds.length} Filters`;
  }, [jobs, selectedJobIds]);

  const filteredHistoryShifts = useMemo(() => {
    if (selectedJobIds.length === 0) return monthlyShifts;
    return monthlyShifts.filter(s => {
      if (s.type === 'general') return selectedJobIds.includes('general');
      return selectedJobIds.includes(s.jobId || '');
    });
  }, [monthlyShifts, selectedJobIds]);

  const filteredCalendarShifts = useMemo(() => {
    if (selectedJobIds.length === 0) return shifts;
    return shifts.filter(s => {
      if (s.type === 'general') return selectedJobIds.includes('general');
      return selectedJobIds.includes(s.jobId || '');
    });
  }, [shifts, selectedJobIds]);

  const toggleJobFilter = (id: string) => {
    setSelectedJobIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/50 pb-12 transition-colors duration-300">
      <nav className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 sticky top-0 z-50 px-4 py-3 shadow-sm transition-colors duration-300">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-lg sm:rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200 dark:shadow-blue-900/20 flex-shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 leading-tight truncate">Shifthu</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Custom Multi-Select Filter */}
            <div className="relative" ref={filterRef}>
              <button 
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="text-[10px] sm:text-xs font-bold px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-700 dark:text-slate-200"
              >
                <span className="max-w-[80px] sm:max-w-none truncate">
                  {activeFilterName || 'All'}
                </span>
                <svg className={`w-3 h-3 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </button>

              {isFilterOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 p-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex flex-col gap-1">
                    <button 
                      onClick={() => { setSelectedJobIds([]); setIsFilterOpen(false); }}
                      className={`text-left px-3 py-2 text-xs font-bold rounded-lg transition-colors ${selectedJobIds.length === 0 ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                    >
                      Show All
                    </button>
                    <div className="h-px bg-slate-100 dark:bg-slate-800 my-1"></div>
                    <button 
                      onClick={() => toggleJobFilter('general')}
                      className={`text-left px-3 py-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-between ${selectedJobIds.includes('general') ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                    >
                      General
                      {selectedJobIds.includes('general') && <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>}
                    </button>
                    {jobs.map(job => (
                      <button 
                        key={job.id}
                        onClick={() => toggleJobFilter(job.id)}
                        className={`text-left px-3 py-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-between ${selectedJobIds.includes(job.id) ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: job.color }}></div>
                          <span className="truncate">{job.name}</span>
                        </div>
                        {selectedJobIds.includes(job.id) && <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tighter bg-slate-100 dark:bg-slate-800 px-2 sm:px-3 py-1.5 rounded-full whitespace-nowrap">
              {currentDate.toLocaleString(undefined, { month: 'short', year: '2-digit' })}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="flex items-center justify-between mb-3 sm:hidden">
          <h2 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Monthly Summary</h2>
          <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-md border border-blue-100 dark:border-blue-900/30">
            {activeFilterName || 'Consolidated'}
          </span>
        </div>

        <StatsCards stats={stats} />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 px-4 py-3 sm:px-6 sm:py-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-colors duration-300">
              <div className="flex gap-1.5 sm:gap-2">
                <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-100 dark:border-slate-800">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                </button>
                <button onClick={() => setCurrentDate(new Date())} className="px-3 sm:px-4 py-2 text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-100 dark:border-slate-800">
                  Today
                </button>
                <button onClick={() => changeMonth(1)} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-100 dark:border-slate-800">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                </button>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                  <button 
                    onClick={() => setViewMode('calendar')}
                    className={`p-2 rounded-lg transition-all ${viewMode === 'calendar' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                    title="Calendar View"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                  </button>
                  <button 
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                    title="List View"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path></svg>
                  </button>
                </div>

                <button 
                  onClick={() => openAddModal(getLocalDateString())}
                  className="bg-blue-600 text-white px-4 py-2 sm:px-6 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-blue-100 dark:shadow-none hover:bg-blue-700 transition-all flex items-center gap-2"
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
            
            <div className="p-6 bg-slate-100 dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-slate-800 transition-colors duration-300">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-2">Instructions</h3>
              <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-2">
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
          className="flex items-center gap-2 text-[#6b7280] dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all group"
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
