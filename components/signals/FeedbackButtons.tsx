'use client';

import type { Signal } from '@/lib/types';

export default function FeedbackButtons({
  signal,
  onUpdate,
}: {
  signal: Signal;
  onUpdate: (signal: Signal) => void;
}) {
  async function handleFeedback(feedback: 'up' | 'down' | null) {
    const newFeedback = signal.feedback === feedback ? null : feedback;
    // Optimistic update
    onUpdate({ ...signal, feedback: newFeedback });

    await fetch(`/api/signals/${signal.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feedback: newFeedback }),
    });
  }

  async function handleFlag() {
    const newFlagged = !signal.is_flagged;
    onUpdate({ ...signal, is_flagged: newFlagged });

    await fetch(`/api/signals/${signal.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_flagged: newFlagged }),
    });
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => handleFeedback('up')}
        className={`p-1.5 rounded transition-colors ${
          signal.feedback === 'up'
            ? 'text-emerald-400 bg-emerald-500/10'
            : 'text-text-dim hover:text-text-muted'
        }`}
        title="Good signal"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.5c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75A2.25 2.25 0 0116.5 4.5c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23H5.904M14.25 9h2.25M5.904 18.75c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 01-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 10.203 4.167 9.75 5 9.75h1.053c.472 0 .745.556.5.96a8.958 8.958 0 00-1.302 4.665c0 1.194.232 2.333.654 3.375z" />
        </svg>
      </button>
      <button
        onClick={() => handleFeedback('down')}
        className={`p-1.5 rounded transition-colors ${
          signal.feedback === 'down'
            ? 'text-red-400 bg-red-500/10'
            : 'text-text-dim hover:text-text-muted'
        }`}
        title="Bad signal"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 15h2.25m8.024-9.75c.011.05.028.1.044.15.054.18.115.35.186.51.237.53.342 1.131.342 1.791 0 .635-.117 1.233-.34 1.757a4.499 4.499 0 01-1.654 1.715 9.04 9.04 0 01-2.86 2.4c-.498.634-1.226 1.08-2.032 1.08H5.904c-.618 0-1.217-.247-1.605-.729A11.95 11.95 0 011.65 4.929c0-.435.023-.863.068-1.285C1.827 2.694 2.746 2 3.772 2h3.126c.618 0 .991.724.725 1.282A7.471 7.471 0 006.9 6.5c0 1.152.26 2.243.723 3.218.266.558-.107 1.282-.725 1.282H3.772M14.25 15h2.25m-1.5 0v3.75m0-3.75h-1.5" />
        </svg>
      </button>
      <button
        onClick={handleFlag}
        className={`p-1.5 rounded transition-colors ${
          signal.is_flagged
            ? 'text-amber-400 bg-amber-500/10'
            : 'text-text-dim hover:text-text-muted'
        }`}
        title={signal.is_flagged ? 'Unflag' : 'Flag as important'}
      >
        <svg className="w-4 h-4" fill={signal.is_flagged ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5" />
        </svg>
      </button>
    </div>
  );
}
