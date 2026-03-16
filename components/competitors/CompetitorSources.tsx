'use client';

import { useState, useEffect } from 'react';
import type { CompetitorSource } from '@/lib/types';

const SOURCE_LABELS = [
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'twitter', label: 'Twitter/X' },
  { value: 'blog', label: 'Blog' },
  { value: 'careers', label: 'Careers' },
  { value: 'crunchbase', label: 'Crunchbase' },
  { value: 'other', label: 'Other' },
];

export default function CompetitorSources({
  competitorId,
}: {
  competitorId: string;
}) {
  const [sources, setSources] = useState<CompetitorSource[]>([]);
  const [url, setUrl] = useState('');
  const [label, setLabel] = useState('other');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetch(`/api/competitors/${competitorId}/sources`)
      .then((r) => r.json())
      .then(setSources);
  }, [competitorId]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!url) return;
    setAdding(true);
    const res = await fetch(`/api/competitors/${competitorId}/sources`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, source_label: label }),
    });
    const source = await res.json();
    setSources((prev) => [...prev, source]);
    setUrl('');
    setAdding(false);
  }

  async function handleDelete(sourceId: string) {
    setSources((prev) => prev.filter((s) => s.id !== sourceId));
    await fetch(`/api/competitors/${competitorId}/sources/${sourceId}`, {
      method: 'DELETE',
    });
  }

  return (
    <div className="bg-bg-card border border-border rounded-lg p-4">
      <h3 className="text-sm font-medium text-text mb-3">Tracked Sources</h3>
      {sources.length > 0 && (
        <div className="space-y-2 mb-4">
          {sources.map((source) => (
            <div
              key={source.id}
              className="flex items-center justify-between gap-2 text-sm"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs px-2 py-0.5 bg-bg-elevated rounded text-text-dim flex-shrink-0">
                  {source.source_label}
                </span>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline truncate"
                >
                  {source.url}
                </a>
              </div>
              <button
                onClick={() => handleDelete(source.id)}
                className="text-text-dim hover:text-red-400 transition-colors flex-shrink-0"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://..."
          className="flex-1 px-3 py-1.5 bg-bg-elevated border border-border rounded-lg text-text text-sm placeholder-text-dim focus:outline-none focus:border-accent transition-colors"
          required
        />
        <select
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="px-2 py-1.5 bg-bg-elevated border border-border rounded-lg text-text text-sm"
        >
          {SOURCE_LABELS.map((l) => (
            <option key={l.value} value={l.value}>
              {l.label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={adding}
          className="px-3 py-1.5 bg-accent/10 text-accent text-sm rounded-lg hover:bg-accent/20 transition-colors disabled:opacity-50"
        >
          Add
        </button>
      </form>
    </div>
  );
}
