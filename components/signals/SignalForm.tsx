'use client';

import { useState, useEffect } from 'react';
import type { Competitor, SignalCategory } from '@/lib/types';
import DuplicatePrompt from './DuplicatePrompt';

const SOURCE_TYPES = [
  { value: 'official_announcement', label: 'Official Announcement' },
  { value: 'news_article', label: 'News Article' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'job_board', label: 'Job Board' },
  { value: 'conversation', label: 'Conversation' },
  { value: 'sec_regulatory', label: 'SEC / Regulatory' },
  { value: 'conference', label: 'Conference' },
  { value: 'other', label: 'Other' },
];

export default function SignalForm({
  onSignalAdded,
}: {
  onSignalAdded?: () => void;
}) {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [categories, setCategories] = useState<SignalCategory[]>([]);
  const [competitorId, setCompetitorId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [headline, setHeadline] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [sourceType, setSourceType] = useState('news_article');
  const [strategicNote, setStrategicNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [duplicate, setDuplicate] = useState<any>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/competitors').then((r) => r.json()),
      fetch('/api/categories').then((r) => r.json()),
    ]).then(([c, cat]) => {
      setCompetitors(c);
      setCategories(cat);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!competitorId || !headline) return;
    setLoading(true);

    // Check for duplicates first
    const dupRes = await fetch('/api/signals/check-duplicate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ headline, competitor_id: competitorId }),
    });
    const dupResult = await dupRes.json();

    if (dupResult.isDuplicate) {
      setDuplicate(dupResult);
      setLoading(false);
      return;
    }

    await submitSignal();
  }

  async function submitSignal() {
    setLoading(true);
    await fetch('/api/signals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        competitor_id: competitorId,
        category_id: categoryId || null,
        headline,
        source_urls: sourceUrl ? [sourceUrl] : [],
        source_type: sourceType,
        strategic_note: strategicNote || null,
      }),
    });

    // Reset form
    setHeadline('');
    setSourceUrl('');
    setStrategicNote('');
    setDuplicate(null);
    setLoading(false);
    onSignalAdded?.();
  }

  const inputClass =
    'w-full px-3 py-2 bg-bg-elevated border border-border rounded-lg text-text text-sm placeholder-text-dim focus:outline-none focus:border-accent transition-colors';

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <select
            value={competitorId}
            onChange={(e) => setCompetitorId(e.target.value)}
            className={inputClass}
            required
          >
            <option value="">Select competitor</option>
            {competitors.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className={inputClass}
          >
            <option value="">Category (optional)</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <input
          type="text"
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          placeholder="Signal headline"
          className={inputClass}
          required
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input
            type="url"
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            placeholder="Source URL (optional)"
            className={inputClass}
          />
          <select
            value={sourceType}
            onChange={(e) => setSourceType(e.target.value)}
            className={inputClass}
          >
            {SOURCE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <textarea
          value={strategicNote}
          onChange={(e) => setStrategicNote(e.target.value)}
          placeholder="Strategic note (optional)"
          rows={2}
          className={inputClass}
        />
        <button
          type="submit"
          disabled={loading || !competitorId || !headline}
          className="px-4 py-2 bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? 'Adding...' : 'Add Signal'}
        </button>
      </form>

      {duplicate && (
        <DuplicatePrompt
          duplicate={duplicate}
          onKeepBoth={() => {
            submitSignal();
          }}
          onCancel={() => {
            setDuplicate(null);
            setLoading(false);
          }}
        />
      )}
    </>
  );
}
