'use client';

import { useState, useEffect, useCallback } from 'react';
import type { LandscapeData } from '@/lib/types';
import PositioningMap from '@/components/landscape/PositioningMap';
import CustomAxisInput from '@/components/landscape/CustomAxisInput';

const CACHE_KEY = 'landscape-cache';

function getCachedLandscape(): { data: LandscapeData; competitorFingerprint: string } | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function setCachedLandscape(data: LandscapeData, fingerprint: string) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, competitorFingerprint: fingerprint }));
  } catch { /* quota exceeded — ignore */ }
}

export default function LandscapePage() {
  const [landscape, setLandscape] = useState<LandscapeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [competitorFingerprint, setCompetitorFingerprint] = useState('');

  const fetchCompetitorFingerprint = useCallback(async (): Promise<string> => {
    try {
      const res = await fetch('/api/competitors');
      const competitors = await res.json();
      if (!Array.isArray(competitors)) return '';
      // Fingerprint = sorted IDs + count — changes when competitors are added/removed
      return competitors.map((c: any) => c.id).sort().join(',');
    } catch {
      return '';
    }
  }, []);

  const fetchLandscape = useCallback(async (customAxes?: string, forceRefresh = false) => {
    setLoading(true);
    setError('');
    setIsCustom(!!customAxes);

    try {
      const res = await fetch('/api/landscape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customAxes, forceRefresh }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to generate landscape');
        setLoading(false);
        return;
      }

      const data = await res.json();
      setLandscape(data);

      // Cache default axes result in localStorage
      if (!customAxes && competitorFingerprint) {
        setCachedLandscape(data, competitorFingerprint);
      }
    } catch {
      setError('Failed to generate landscape');
    }
    setLoading(false);
  }, [competitorFingerprint]);

  useEffect(() => {
    async function init() {
      const fingerprint = await fetchCompetitorFingerprint();
      setCompetitorFingerprint(fingerprint);

      if (!fingerprint) {
        setError('No competitors to plot');
        setLoading(false);
        return;
      }

      // Check localStorage cache — if fingerprint matches, use cached data
      const cached = getCachedLandscape();
      if (cached && cached.competitorFingerprint === fingerprint) {
        setLandscape(cached.data);
        setLoading(false);
        return;
      }

      // Fingerprint changed or no cache — fetch from API (which also has server-side cache)
      const res = await fetch('/api/landscape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to generate landscape');
        setLoading(false);
        return;
      }

      const data = await res.json();
      setLandscape(data);
      setCachedLandscape(data, fingerprint);
      setLoading(false);
    }

    init();
  }, [fetchCompetitorFingerprint]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Competitive Landscape</h1>
          <p className="text-text-muted text-sm mt-0.5">
            Strategic positioning maps showing all competitors and Lemnisca.
          </p>
        </div>
        {landscape && !loading && (
          <button
            onClick={() => fetchLandscape(undefined, true)}
            className="px-3 py-2 text-sm font-medium text-text-muted hover:text-text bg-bg-card border border-border rounded-lg hover:border-border-light transition-colors"
          >
            Regenerate
          </button>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-text mb-2">
          Custom Axes
        </label>
        <CustomAxisInput
          onSubmit={(axes) => fetchLandscape(axes)}
          loading={loading}
        />
        <p className="text-xs text-text-dim mt-1">
          Leave blank and click Generate to use default axes (Technology
          Readiness vs Commercial Traction).
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center py-20 gap-3">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-text-muted text-sm">
            Generating landscape positioning...
          </p>
        </div>
      ) : error ? (
        <div className="bg-bg-card border border-border rounded-lg p-6 text-center">
          <p className="text-text-muted">{error}</p>
          <p className="text-text-dim text-sm mt-1">
            Add competitors first to generate a landscape view.
          </p>
        </div>
      ) : landscape ? (
        <div>
          <PositioningMap data={landscape} />
          {isCustom && (
            <p className="text-xs text-text-dim mt-2 text-center">
              Custom axes — not cached. Default axes are cached automatically.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
