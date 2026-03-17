'use client';

import { useState } from 'react';
import LoadingState from '@/components/shared/LoadingState';

export default function PatternSummary({
  summary,
  loading,
}: {
  summary: string | null;
  loading: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

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

  let text = summary || 'No patterns to analyze yet.';

  // Handle case where LLM returns JSON-wrapped text instead of plain markdown
  if (text.startsWith('{')) {
    try {
      const parsed = JSON.parse(text);
      text = parsed.analysis || parsed.summary || parsed.text || text;
    } catch { /* use as-is */ }
  }

  const isLong = text.length > 300 || text.split('\n').length > 4;

  return (
    <div className="bg-bg-card border border-border rounded-lg p-4">
      <h3 className="text-sm font-medium text-text mb-3">Pattern Summary</h3>
      <div
        className={`prose prose-sm prose-invert max-w-none text-text-muted leading-relaxed text-sm whitespace-pre-wrap ${
          !expanded ? 'line-clamp-6' : ''
        }`}
      >
        {text}
      </div>
      {isLong && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-2 text-xs text-accent hover:text-accent-hover transition-colors"
        >
          {expanded ? 'Show less' : 'Show more'}
        </button>
      )}
    </div>
  );
}
