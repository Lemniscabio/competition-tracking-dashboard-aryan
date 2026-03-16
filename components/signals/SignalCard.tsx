'use client';

import { useState } from 'react';
import type { Signal } from '@/lib/types';
import CategoryTag from '@/components/shared/CategoryTag';
import FeedbackButtons from './FeedbackButtons';

export default function SignalCard({
  signal,
  onUpdate,
}: {
  signal: Signal;
  onUpdate: (signal: Signal) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  async function markAsRead() {
    if (!signal.is_read) {
      onUpdate({ ...signal, is_read: true });
      await fetch(`/api/signals/${signal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_read: true }),
      });
    }
  }

  return (
    <div
      className={`bg-bg-card border rounded-lg p-4 transition-colors cursor-pointer hover:border-border-light ${
        signal.is_read ? 'border-border' : 'border-accent/40 bg-accent/[0.02]'
      }`}
      onClick={() => {
        markAsRead();
        setExpanded(!expanded);
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            {signal.competitor && (
              <span className="text-xs font-medium text-text-muted">
                {(signal.competitor as any).name}
              </span>
            )}
            {signal.category && (
              <CategoryTag name={(signal.category as any).name} />
            )}
            {signal.is_flagged && (
              <span className="text-amber-400 text-xs">flagged</span>
            )}
          </div>
          <h3
            className={`text-sm leading-snug ${
              signal.is_read
                ? 'text-text-muted font-normal'
                : 'text-text font-semibold'
            }`}
          >
            {signal.headline}
          </h3>
          <div className="flex items-center gap-3 mt-2 text-xs text-text-dim">
            <span>{signal.date_observed}</span>
            <span className="capitalize">
              {signal.source_type.replace(/_/g, ' ')}
            </span>
            {signal.source === 'manual' && (
              <span className="text-accent/70">manual</span>
            )}
          </div>
        </div>
        <FeedbackButtons
          signal={signal}
          onUpdate={(updated) => {
            onUpdate(updated);
          }}
        />
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-border space-y-2">
          {signal.llm_summary && (
            <p className="text-sm text-text-muted leading-relaxed">
              {signal.llm_summary}
            </p>
          )}
          {signal.strategic_note && (
            <div className="bg-bg-elevated rounded-md p-3">
              <p className="text-xs font-medium text-text-dim mb-1">
                Strategic Note
              </p>
              <p className="text-sm text-text-muted">{signal.strategic_note}</p>
            </div>
          )}
          {signal.source_urls && signal.source_urls.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {signal.source_urls.map((url, i) => (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-accent hover:underline truncate max-w-xs"
                  onClick={(e) => e.stopPropagation()}
                >
                  {new URL(url).hostname}
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
