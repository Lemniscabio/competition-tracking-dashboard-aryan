'use client';

import { useState, useEffect } from 'react';
import type { LandscapeData } from '@/lib/types';
import PositioningMap from '@/components/landscape/PositioningMap';
import CustomAxisInput from '@/components/landscape/CustomAxisInput';

export default function LandscapePage() {
  const [landscape, setLandscape] = useState<LandscapeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function fetchLandscape(customAxes?: string) {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/landscape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customAxes }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to generate landscape');
        setLoading(false);
        return;
      }

      const data = await res.json();
      setLandscape(data);
    } catch {
      setError('Failed to generate landscape');
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchLandscape();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">Competitive Landscape</h1>
        <p className="text-text-muted text-sm mt-0.5">
          Strategic positioning maps showing all competitors and Lemnisca.
        </p>
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
        <PositioningMap data={landscape} />
      ) : null}
    </div>
  );
}
