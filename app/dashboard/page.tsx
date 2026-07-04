'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Signal, HeatmapEntry } from '@/lib/types';
import ActivityHeatmap from '@/components/heatmap/ActivityHeatmap';
import PatternSummary from '@/components/patterns/PatternSummary';
import SignalFeed from '@/components/signals/SignalFeed';
import SignalForm from '@/components/signals/SignalForm';

export default function DashboardPage() {
  const [signals, setSignals] = useState<Signal[] | null>(null);
  const [heatmapData, setHeatmapData] = useState<HeatmapEntry[] | null>(null);
  const [patternSummary, setPatternSummary] = useState<string | null>(null);
  const [_loadingSignals, setLoadingSignals] = useState(true);
  const [loadingHeatmap, setLoadingHeatmap] = useState(true);
  const [loadingPatterns, setLoadingPatterns] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState({ completed: 0, total: 0 });
  const [showForm, setShowForm] = useState(false);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wasRunningRef = useRef(false);

  // Lightweight refresh — signals + heatmap only (cheap DB reads). Used while a
  // scan is in progress so new signals appear incrementally.
  const refreshFeed = useCallback(() => {
    fetch('/api/signals?limit=50')
      .then((r) => r.json())
      .then((data) => {
        setSignals(Array.isArray(data) ? data : []);
        setLoadingSignals(false);
      })
      .catch(() => setLoadingSignals(false));

    fetch('/api/signals/heatmap')
      .then((r) => r.json())
      .then((data) => {
        setHeatmapData(Array.isArray(data) ? data : []);
        setLoadingHeatmap(false);
      })
      .catch(() => setLoadingHeatmap(false));
  }, []);

  // Full refresh — includes the pattern summary (an LLM call), so only run on
  // load and once when a scan finishes, never on every poll tick.
  const fetchAll = useCallback(() => {
    setLoadingPatterns(true);
    refreshFeed();
    fetch('/api/patterns')
      .then((r) => r.json())
      .then((data) => {
        setPatternSummary(data.summary || null);
        setLoadingPatterns(false);
      })
      .catch(() => setLoadingPatterns(false));
  }, [refreshFeed]);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const startPolling = useCallback(() => {
    if (pollRef.current) return;
    pollRef.current = setInterval(async () => {
      try {
        const s = await (await fetch('/api/scan/status')).json();
        if (s.status === 'running') {
          wasRunningRef.current = true;
          setScanning(true);
          setScanProgress({ completed: s.completed, total: s.total });
          refreshFeed(); // show signals as each competitor completes
        } else {
          setScanning(false);
          setScanProgress({ completed: 0, total: 0 });
          stopPolling();
          if (wasRunningRef.current) {
            wasRunningRef.current = false;
            fetchAll(); // scan just finished — full refresh incl. patterns
          }
        }
      } catch {
        /* transient — keep polling */
      }
    }, 3000);
  }, [refreshFeed, fetchAll, stopPolling]);

  useEffect(() => {
    fetchAll();
    // If a scan is already running (triggered elsewhere / before navigation),
    // reflect it and resume polling.
    fetch('/api/scan/status')
      .then((r) => r.json())
      .then((s) => {
        if (s.status === 'running') {
          wasRunningRef.current = true;
          setScanning(true);
          setScanProgress({ completed: s.completed, total: s.total });
          startPolling();
        }
      })
      .catch(() => {});

    return () => stopPolling();
  }, [fetchAll, startPolling, stopPolling]);

  function handleRefreshFeed() {
    setScanning(true);
    wasRunningRef.current = true;
    startPolling();
    // Fire the scan; polling drives the UI state, so we don't block on it.
    fetch('/api/scan', { method: 'POST' }).catch((err) =>
      console.error('Scan request failed:', err)
    );
  }

  const scanLabel = scanning
    ? scanProgress.total > 0
      ? `Scanning ${scanProgress.completed}/${scanProgress.total}...`
      : 'Scanning...'
    : 'Refresh Feed';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Dashboard</h1>
          <p className="text-text-muted text-sm mt-0.5">
            Competitive intelligence at a glance
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-3 py-2 text-sm font-medium text-text-muted hover:text-text bg-bg-card border border-border rounded-lg hover:border-border-light transition-colors"
          >
            {showForm ? 'Hide Form' : 'Log Signal'}
          </button>
          <button
            onClick={handleRefreshFeed}
            disabled={scanning}
            className="px-3 py-2 text-sm font-medium bg-accent hover:bg-accent-hover text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {scanning && (
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            {scanLabel}
          </button>
        </div>
      </div>

      {/* Manual signal form */}
      {showForm && (
        <div className="bg-bg-card border border-border rounded-lg p-4">
          <h3 className="text-sm font-medium text-text mb-3">Log a Signal</h3>
          <SignalForm
            onSignalAdded={() => {
              setShowForm(false);
              fetchAll();
            }}
          />
        </div>
      )}

      {/* Heatmap + Patterns side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ActivityHeatmap data={heatmapData} loading={loadingHeatmap} />
        <PatternSummary summary={patternSummary} loading={loadingPatterns} />
      </div>

      {/* Signal feed */}
      <div>
        <h2 className="text-lg font-semibold text-text mb-3">Recent Signals</h2>
        <SignalFeed signals={signals || undefined} />
      </div>
    </div>
  );
}
