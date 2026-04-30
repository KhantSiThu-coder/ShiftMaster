
import React from 'react';
import { ShiftStats } from '../types';

const StatCard: React.FC<{ title: string; value: string | number; sub: string; icon: React.ReactNode; color: string; fullWidthMobile?: boolean }> = ({ title, value, sub, icon, color, fullWidthMobile }) => (
  <div className={`bg-white dark:bg-slate-900 p-2 sm:p-3 rounded-xl sm:rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center space-x-1.5 sm:space-x-2.5 transition-colors duration-300 ${fullWidthMobile ? 'col-span-2 sm:col-span-1' : ''}`}>
    <div className={`p-1 sm:p-2 rounded-lg sm:rounded-xl ${color} text-white shadow-md flex-shrink-0`}>
      {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<{ className?: string }>, { 
        className: 'w-3 h-3 sm:w-4 sm:h-4' 
      }) : icon}
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[7px] sm:text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-0.5 truncate">{title}</p>
      <h3 className="text-[10px] sm:text-sm font-black text-slate-800 dark:text-slate-100 leading-none truncate">{value}</h3>
      <p className="text-[7px] sm:text-[8px] text-slate-400 dark:text-slate-500 mt-0.5 font-medium truncate">{sub}</p>
    </div>
  </div>
);

export const StatsCards: React.FC<{ stats: ShiftStats }> = ({ stats }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4 mb-6 sm:mb-8">
      <StatCard 
        title="Work Hours" 
        value={`${stats.totalHours.toFixed(1)}h (${(stats.totalHours / 4).toFixed(1)}h avg)`} 
        sub="Total"
        color="bg-blue-600 dark:bg-blue-500"
        icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>}
      />
      <StatCard 
        title="Late Work" 
        value={`${stats.lateNightHours.toFixed(1)}h`} 
        sub="Post-22:00"
        color="bg-indigo-600 dark:bg-indigo-500"
        icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>}
      />
      <StatCard 
        title="Est. Pay" 
        value={stats.estimatedPay.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} 
        sub="Gross"
        color="bg-emerald-600 dark:bg-emerald-500"
        icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>}
      />
      <StatCard 
        title="Transport" 
        value={stats.totalTransportExpenses.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} 
        sub="Fees"
        color="bg-orange-500 dark:bg-orange-600"
        icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>}
      />
      <StatCard 
        title="Total Est. Pay" 
        value={stats.totalEstPay.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} 
        sub="Net Sum"
        color="bg-rose-600 dark:bg-rose-500"
        icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>}
      />
      <StatCard 
        title="Active Days" 
        value={stats.totalDays} 
        sub="Monthly"
        color="bg-violet-600 dark:bg-violet-500"
        icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>}
      />
    </div>
  );
};
