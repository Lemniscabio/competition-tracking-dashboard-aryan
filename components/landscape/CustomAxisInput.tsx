'use client';

import { useState } from 'react';

export default function CustomAxisInput({
  onSubmit,
  loading,
}: {
  onSubmit: (axes: string) => void;
  loading: boolean;
}) {
  const [axes, setAxes] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (axes.trim()) {
      onSubmit(axes.trim());
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={axes}
        onChange={(e) => setAxes(e.target.value)}
        placeholder='e.g. "Technology readiness vs commercial traction"'
        className="flex-1 px-3 py-2 bg-bg-elevated border border-border rounded-lg text-text text-sm placeholder-text-dim focus:outline-none focus:border-accent transition-colors"
      />
      <button
        type="submit"
        disabled={loading || !axes.trim()}
        className="px-4 py-2 bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
      >
        {loading && (
          <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        )}
        {loading ? 'Generating...' : 'Generate'}
      </button>
    </form>
  );
}
