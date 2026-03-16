'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Competitor, CompetitorAnalysis } from '@/lib/types';
import CompetitorProfile from '@/components/competitors/CompetitorProfile';
import CompetitorSources from '@/components/competitors/CompetitorSources';
import CompetitorTimeline from '@/components/competitors/CompetitorTimeline';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import LoadingState from '@/components/shared/LoadingState';

export default function CompetitorProfilePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [competitor, setCompetitor] = useState<
    (Competitor & { analysis: CompetitorAnalysis | null }) | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => {
    fetch(`/api/competitors/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setCompetitor(data);
        setLoading(false);
      });
  }, [id]);

  async function handleRefresh() {
    setRefreshing(true);
    const res = await fetch(`/api/analyze/${id}`, { method: 'POST' });
    const analysis = await res.json();
    setCompetitor((prev) =>
      prev ? { ...prev, analysis } : prev
    );
    setRefreshing(false);
  }

  async function handleDelete() {
    await fetch(`/api/competitors/${id}`, { method: 'DELETE' });
    router.push('/dashboard/competitors');
  }

  if (loading) return <LoadingState variant="full" />;
  if (!competitor) return <p className="text-text-muted">Not found.</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/dashboard/competitors"
            className="text-sm text-text-muted hover:text-text transition-colors"
          >
            &larr; Back
          </Link>
          <h1 className="text-2xl font-bold text-text mt-1">
            {competitor.name}
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                competitor.type === 'direct'
                  ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                  : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
              }`}
            >
              {competitor.type}
            </span>
            {competitor.one_liner && (
              <span className="text-sm text-text-muted">
                {competitor.one_liner}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => setShowDelete(true)}
          className="px-3 py-1.5 text-sm text-red-400 hover:bg-red-500/10 border border-red-500/20 rounded-lg transition-colors"
        >
          Delete
        </button>
      </div>

      <CompetitorProfile
        analysis={competitor.analysis?.analysis_json || null}
        competitorName={competitor.name}
        onRefresh={handleRefresh}
        refreshing={refreshing}
      />

      <CompetitorSources competitorId={id} />

      <CompetitorTimeline competitorId={id} />

      <ConfirmDialog
        open={showDelete}
        title="Delete Competitor"
        message={`This will permanently delete ${competitor.name} and all associated signals, analyses, and sources.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
      />
    </div>
  );
}
