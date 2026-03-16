'use client';

import { useState, useEffect } from 'react';
import type { LemniscaProfile } from '@/lib/types';

const FIELDS = [
  { key: 'description', label: 'Company Description', rows: 3 },
  { key: 'current_stage', label: 'Current Stage', rows: 1 },
  { key: 'differentiators', label: 'Key Differentiators', rows: 3 },
  { key: 'technology_focus', label: 'Technology Focus', rows: 2 },
  { key: 'market_positioning', label: 'Market Positioning', rows: 2 },
  { key: 'funding_status', label: 'Funding Status', rows: 1 },
  { key: 'team_strengths', label: 'Team Strengths', rows: 2 },
  { key: 'strategic_priorities', label: 'Strategic Priorities', rows: 3 },
] as const;

export default function LemniscaProfileForm() {
  const [profile, setProfile] = useState<LemniscaProfile | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/lemnisca')
      .then((r) => r.json())
      .then(setProfile);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);

    const { id: _id, updated_at: _updated_at, ...fields } = profile;
    await fetch('/api/lemnisca', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fields),
    });

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function updateField(key: string, value: string) {
    setProfile((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  if (!profile) return null;

  const inputClass =
    'w-full px-3 py-2 bg-bg-elevated border border-border rounded-lg text-text text-sm placeholder-text-dim focus:outline-none focus:border-accent transition-colors';

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
      {FIELDS.map((field) => (
        <div key={field.key}>
          <label className="block text-sm font-medium text-text mb-1.5">
            {field.label}
          </label>
          <textarea
            value={(profile as any)[field.key] || ''}
            onChange={(e) => updateField(field.key, e.target.value)}
            rows={field.rows}
            className={inputClass}
            placeholder={`Enter ${field.label.toLowerCase()}...`}
          />
        </div>
      ))}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 bg-accent hover:bg-accent-hover text-white font-medium text-sm rounded-lg transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
        {saved && (
          <span className="text-sm text-emerald-400">Saved successfully</span>
        )}
      </div>
    </form>
  );
}
