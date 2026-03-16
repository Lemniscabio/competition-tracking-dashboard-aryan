'use client';

import type { DuplicateCheckResult } from '@/lib/types';

export default function DuplicatePrompt({
  duplicate,
  onKeepBoth,
  onCancel,
}: {
  duplicate: DuplicateCheckResult;
  onKeepBoth: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="relative bg-bg-card border border-border rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
        <h3 className="text-lg font-semibold text-text">
          Similar signal exists
        </h3>
        <p className="text-text-muted text-sm mt-2">{duplicate.explanation}</p>
        {duplicate.similarSignal && (
          <div className="mt-3 p-3 bg-bg-elevated rounded-lg border border-border">
            <p className="text-sm text-text">
              {duplicate.similarSignal.headline}
            </p>
            <p className="text-xs text-text-dim mt-1">
              {duplicate.similarSignal.date_observed}
            </p>
          </div>
        )}
        <div className="flex gap-3 mt-6 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-text-muted hover:text-text rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onKeepBoth}
            className="px-4 py-2 text-sm font-medium bg-accent text-white hover:bg-accent-hover rounded-lg transition-colors"
          >
            Keep Both
          </button>
        </div>
      </div>
    </div>
  );
}
