import React, { useState } from 'react';
import { initDB } from '../utils/db';

type BackupData = {
  format: 'Shifthu-Current-App-IndexedDB-Backup';
  formatVersion: 1;
  exportedAt: string;
  origin: string;
  database: {
    name: string;
    version: number;
    stores: {
      jobs: { recordCount: number; records: unknown[] };
      shifts: { recordCount: number; records: unknown[] };
    };
  };
};

export const RecoveryTools: React.FC = () => {
  const [busy, setBusy] = useState(false);
  const [backup, setBackup] = useState<BackupData | null>(null);
  const [message, setMessage] = useState('');

  const inspectCurrentAppStorage = async () => {
    setBusy(true);
    setMessage('');
    setBackup(null);

    let db: IDBDatabase | null = null;

    try {
      // This runs inside the currently opened Shifthu app, so it inspects
      // the IndexedDB storage available to this exact app context.
      db = await initDB();

      if (!db.objectStoreNames.contains('jobs') || !db.objectStoreNames.contains('shifts')) {
        throw new Error('The expected jobs or shifts store was not found in this app storage.');
      }

      const transaction = db.transaction(['jobs', 'shifts'], 'readonly');
      const jobsRequest = transaction.objectStore('jobs').getAll();
      const shiftsRequest = transaction.objectStore('shifts').getAll();

      const records = await new Promise<{ jobs: unknown[]; shifts: unknown[] }>((resolve, reject) => {
        transaction.oncomplete = () => {
          resolve({
            jobs: jobsRequest.result as unknown[],
            shifts: shiftsRequest.result as unknown[],
          });
        };
        transaction.onerror = () => reject(transaction.error || new Error('Could not read the database.'));
        transaction.onabort = () => reject(transaction.error || new Error('The read-only database transaction was aborted.'));
      });

      const result: BackupData = {
        format: 'Shifthu-Current-App-IndexedDB-Backup',
        formatVersion: 1,
        exportedAt: new Date().toISOString(),
        origin: window.location.origin,
        database: {
          name: db.name,
          version: db.version,
          stores: {
            jobs: { recordCount: records.jobs.length, records: records.jobs },
            shifts: { recordCount: records.shifts.length, records: records.shifts },
          },
        },
      };

      setBackup(result);
      setMessage('Inspection completed. No records were changed.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      db?.close();
      setBusy(false);
    }
  };

  const exportBackup = async () => {
    if (!backup) return;

    const date = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `shifthu-current-app-backup-${date}.json`;
    const json = JSON.stringify(backup, null, 2);
    const file = new File([json], filename, { type: 'application/json' });

    try {
      // On supported iPhones, the share sheet lets the user save the JSON
      // to Files. Other browsers use a normal file download.
      if (typeof navigator.share === 'function' && typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Shifthu data backup' });
        setMessage('Backup shared. Choose Save to Files if you want to keep a copy.');
        return;
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        setMessage('The share sheet was closed. Your Shifthu data was not changed.');
        return;
      }
      // Fall back to a browser download if sharing is unavailable or fails.
    }

    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMessage('Backup export started. Check your browser downloads.');
  };

  return (
    <section className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm dark:border-amber-900/60 dark:bg-amber-950/30">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-bold text-amber-950 dark:text-amber-100">Data Recovery</h2>
          <p className="mt-1 text-xs text-amber-900/80 dark:text-amber-200/80">
            Read the IndexedDB available to this Shifthu app and export a backup. This tool does not edit or delete records.
          </p>
        </div>
        <button
          type="button"
          onClick={inspectCurrentAppStorage}
          disabled={busy}
          className="rounded-xl bg-amber-700 px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-amber-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-amber-600 dark:hover:bg-amber-500"
        >
          {busy ? 'Inspecting…' : 'Inspect Current App Storage'}
        </button>
      </div>

      {backup && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-white p-3 dark:border-amber-900/50 dark:bg-slate-900">
          <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">Database: {backup.database.name} (version {backup.database.version})</p>
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Jobs</span>
              <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">{backup.database.stores.jobs.recordCount}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Shifts</span>
              <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">{backup.database.stores.shifts.recordCount}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={exportBackup}
            className="mt-3 w-full rounded-xl bg-blue-600 px-4 py-3 text-xs font-bold text-white transition-colors hover:bg-blue-700"
          >
            Export JSON Backup
          </button>
        </div>
      )}

      {message && (
        <p role="status" className="mt-3 break-words text-xs text-amber-950 dark:text-amber-100">
          {message}
        </p>
      )}
    </section>
  );
};
