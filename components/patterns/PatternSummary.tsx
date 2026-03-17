'use client';

import { useState, useMemo } from 'react';
import LoadingState from '@/components/shared/LoadingState';

function renderMarkdown(md: string): string {
  return md
    // Headings (### > ## > #)
    .replace(/^### (.+)$/gm, '<h4 class="text-sm font-semibold text-text mt-3 mb-1">$1</h4>')
    .replace(/^## (.+)$/gm, '<h3 class="text-sm font-semibold text-text mt-3 mb-1">$1</h3>')
    .replace(/^# (.+)$/gm, '<h3 class="text-base font-semibold text-text mt-3 mb-1">$1</h3>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-text font-medium">$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Bullet lists
    .replace(/^[-•] (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
    // Numbered lists
    .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal">$1</li>')
    // Line breaks (double newline = paragraph break)
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>');
}

function parseText(raw: string | null): string {
  let text = raw || 'No patterns to analyze yet.';
  if (text.startsWith('{')) {
    try {
      const parsed = JSON.parse(text);
      text = parsed.analysis || parsed.summary || parsed.text || text;
    } catch { /* use as-is */ }
  }
  return text;
}

export default function PatternSummary({
  summary,
  loading,
}: {
  summary: string | null;
  loading: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const text = useMemo(() => parseText(summary), [summary]);
  const html = useMemo(() => renderMarkdown(text), [text]);
  const isLong = text.length > 300 || text.split('\n').length > 4;

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
      <div
        className={`max-w-none text-text-muted leading-relaxed text-sm ${
          !expanded ? 'line-clamp-6' : ''
        }`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
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
