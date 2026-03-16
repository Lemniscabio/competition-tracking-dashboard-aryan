'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const SOURCE_LABELS = [
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'twitter', label: 'Twitter/X' },
  { value: 'blog', label: 'Blog' },
  { value: 'careers', label: 'Careers' },
  { value: 'crunchbase', label: 'Crunchbase' },
  { value: 'other', label: 'Other' },
];

export default function AddCompetitorForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [type, setType] = useState<'direct' | 'indirect'>('direct');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [oneLiner, setOneLiner] = useState('');
  const [strategicContext, setStrategicContext] = useState('');
  const [additionalContext, setAdditionalContext] = useState('');
  const [sources, setSources] = useState<
    { url: string; source_label: string }[]
  >([]);
  const [loading, setLoading] = useState(false);

  function addSource() {
    setSources((prev) => [...prev, { url: '', source_label: 'other' }]);
  }

  function updateSource(i: number, field: string, value: string) {
    setSources((prev) =>
      prev.map((s, idx) => (idx === i ? { ...s, [field]: value } : s))
    );
  }

  function removeSource(i: number) {
    setSources((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name) return;
    setLoading(true);

    const res = await fetch('/api/competitors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        type,
        website_url: websiteUrl || null,
        one_liner: oneLiner || null,
        strategic_context: strategicContext || null,
        additional_context: additionalContext || null,
        sources: sources.filter((s) => s.url),
      }),
    });

    const competitor = await res.json();
    router.push(`/dashboard/competitors/${competitor.id}`);
  }

  const inputClass =
    'w-full px-3 py-2 bg-bg-elevated border border-border rounded-lg text-text text-sm placeholder-text-dim focus:outline-none focus:border-accent transition-colors';

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
      <div>
        <label className="block text-sm font-medium text-text mb-1.5">
          Company Name *
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Ginkgo Bioworks"
          className={inputClass}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-text mb-1.5">
          Type
        </label>
        <div className="flex gap-2">
          {(['direct', 'indirect'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
                type === t
                  ? 'bg-accent/10 border-accent text-accent'
                  : 'border-border text-text-muted hover:border-border-light'
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-text mb-1.5">
          Website URL
        </label>
        <input
          type="url"
          value={websiteUrl}
          onChange={(e) => setWebsiteUrl(e.target.value)}
          placeholder="https://..."
          className={inputClass}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-text mb-1.5">
          One-liner
        </label>
        <input
          type="text"
          value={oneLiner}
          onChange={(e) => setOneLiner(e.target.value)}
          placeholder="Why does this competitor matter?"
          className={inputClass}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-text mb-1.5">
          Strategic Context
        </label>
        <textarea
          value={strategicContext}
          onChange={(e) => setStrategicContext(e.target.value)}
          placeholder="Your reasoning for tracking this competitor"
          rows={3}
          className={inputClass}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-text mb-1.5">
          Additional Context
        </label>
        <textarea
          value={additionalContext}
          onChange={(e) => setAdditionalContext(e.target.value)}
          placeholder="Any extra context to improve analysis quality"
          rows={2}
          className={inputClass}
        />
      </div>

      {/* Tracked Sources */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-text">
            Tracked Sources
          </label>
          <button
            type="button"
            onClick={addSource}
            className="text-xs text-accent hover:text-accent-hover transition-colors"
          >
            + Add source
          </button>
        </div>
        {sources.length > 0 && (
          <div className="space-y-2">
            {sources.map((source, i) => (
              <div key={i} className="flex gap-2">
                <input
                  type="url"
                  value={source.url}
                  onChange={(e) => updateSource(i, 'url', e.target.value)}
                  placeholder="https://..."
                  className={`flex-1 ${inputClass}`}
                />
                <select
                  value={source.source_label}
                  onChange={(e) =>
                    updateSource(i, 'source_label', e.target.value)
                  }
                  className="px-2 py-2 bg-bg-elevated border border-border rounded-lg text-text text-sm"
                >
                  {SOURCE_LABELS.map((l) => (
                    <option key={l.value} value={l.value}>
                      {l.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => removeSource(i)}
                  className="text-text-dim hover:text-red-400 transition-colors px-1"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={loading || !name}
        className="w-full sm:w-auto px-6 py-2.5 bg-accent hover:bg-accent-hover text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading && (
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        )}
        {loading
          ? 'Generating analysis and scanning for signals...'
          : 'Add Competitor'}
      </button>
    </form>
  );
}
