'use client';

import { useState, useEffect, useCallback } from 'react';
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
  const [showForm, setShowForm] = useState(false);

  const fetchAll = useCallback(() => {
    // Parallel fetches — each section loads independently
    setLoadingSignals(true);
    setLoadingHeatmap(true);
    setLoadingPatterns(true);

    fetch('/api/signals?limit=50')
      .then((r) => r.json())
      .then((data) => {
        setSignals(Array.isArray(data) ? data : []);
        setLoadingSignals(false);
      })
      .catch((err) => {
        console.error('Failed to fetch signals:', err);
        setSignals([]);
        setLoadingSignals(false);
      });

    fetch('/api/signals/heatmap')
      .then((r) => r.json())
      .then((data) => {
        setHeatmapData(Array.isArray(data) ? data : []);
        setLoadingHeatmap(false);
      })
      .catch((err) => {
        console.error('Failed to fetch heatmap:', err);
        setHeatmapData([]);
        setLoadingHeatmap(false);
      });

    fetch('/api/patterns')
      .then((r) => r.json())
      .then((data) => {
        setPatternSummary(data.summary || null);
        setLoadingPatterns(false);
      })
      .catch((err) => {
        console.error('Failed to fetch patterns:', err);
        setPatternSummary(null);
        setLoadingPatterns(false);
      });
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  async function handleRefreshFeed() {
    setScanning(true);
    try {
      const res = await fetch('/api/scan', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        console.error('Scan failed:', data);
      } else {
        console.log('Scan complete:', data);
      }
    } catch (err) {
      console.error('Scan request failed:', err);
    }
    setScanning(false);
    fetchAll();
  }

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
            {scanning ? 'Scanning...' : 'Refresh Feed'}
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
