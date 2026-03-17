'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Signal } from '@/lib/types';
import SignalCard from './SignalCard';
import LoadingState from '@/components/shared/LoadingState';

export default function SignalFeed({
  competitorId,
  categoryId,
  isFlagged,
  limit,
  signals: externalSignals,
}: {
  competitorId?: string;
  categoryId?: string;
  isFlagged?: boolean;
  limit?: number;
  signals?: Signal[];
}) {
  const [signals, setSignals] = useState<Signal[]>(externalSignals || []);
  const [loading, setLoading] = useState(!externalSignals);

  const fetchSignals = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (competitorId) params.set('competitor_id', competitorId);
    if (categoryId) params.set('category_id', categoryId);
    if (isFlagged) params.set('is_flagged', 'true');
    if (limit) params.set('limit', String(limit));

    const res = await fetch(`/api/signals?${params}`);
    const data = await res.json();
    setSignals(data);
    setLoading(false);
  }, [competitorId, categoryId, isFlagged, limit]);

  useEffect(() => {
    if (!externalSignals) {
      fetchSignals();
    }
  }, [externalSignals, fetchSignals]);

  useEffect(() => {
    if (externalSignals) {
      setSignals(externalSignals);
      setLoading(false);
    }
  }, [externalSignals]);

  function handleUpdate(updated: Signal) {
    setSignals((prev) =>
      prev.map((s) => (s.id === updated.id ? updated : s))
    );
  }

  if (loading) return <LoadingState variant="card" />;

  if (signals.length === 0) {
    return (
      <div className="text-center py-12 bg-bg-card border border-border rounded-lg">
        <p className="text-text-muted">No signals yet.</p>
        <p className="text-text-dim text-sm mt-1">
          Add competitors or run a scan to see signals.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {signals.map((signal) => (
        <SignalCard
          key={signal.id}
          signal={signal}
          onUpdate={handleUpdate}
        />
      ))}
    </div>
  );
}
