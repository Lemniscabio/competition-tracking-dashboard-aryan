'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { Competitor } from '@/lib/types';
import CompetitorCard from '@/components/competitors/CompetitorCard';
import LoadingState from '@/components/shared/LoadingState';

export default function CompetitorsPage() {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/competitors')
      .then((r) => r.json())
      .then((data) => {
        setCompetitors(data);
        setLoading(false);
      });
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text">Competitors</h1>
          <p className="text-text-muted text-sm mt-0.5">
            {competitors.length} competitor{competitors.length !== 1 ? 's' : ''} tracked
          </p>
        </div>
        <Link
          href="/dashboard/competitors/add"
          className="px-4 py-2 bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-lg transition-colors"
        >
          Add Competitor
        </Link>
      </div>

      {loading ? (
        <LoadingState variant="card" />
      ) : competitors.length === 0 ? (
        <div className="text-center py-16 bg-bg-card border border-border rounded-lg">
          <p className="text-text-muted text-lg">No competitors yet</p>
          <p className="text-text-dim text-sm mt-1 mb-4">
            Add your first competitor to start tracking.
          </p>
          <Link
            href="/dashboard/competitors/add"
            className="px-4 py-2 bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-lg transition-colors"
          >
            Add Competitor
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {competitors.map((c) => (
            <CompetitorCard key={c.id} competitor={c} />
          ))}
        </div>
      )}
    </div>
  );
}
