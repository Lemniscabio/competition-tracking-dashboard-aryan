'use client';

import LoadingState from '@/components/shared/LoadingState';

export default function PatternSummary({
  summary,
  loading,
}: {
  summary: string | null;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="bg-bg-card border border-border rounded-lg p-4">
        <h3 className="text-sm font-medium text-text mb-3">Pattern Summary</h3>
        <div className="flex items-center gap-2 text-text-muted text-sm">
          <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          Analyzing patterns...
        </div>
        <div className="mt-3">
          <LoadingState variant="text" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-bg-card border border-border rounded-lg p-4">
      <h3 className="text-sm font-medium text-text mb-3">Pattern Summary</h3>
      <div className="prose prose-sm prose-invert max-w-none text-text-muted leading-relaxed text-sm whitespace-pre-wrap">
        {summary || 'No patterns to analyze yet.'}
      </div>
    </div>
  );
}
