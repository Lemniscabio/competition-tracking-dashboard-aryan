'use client';

import { useState, useEffect } from 'react';
import type { SignalCategory } from '@/lib/types';
import CategoryTag from '@/components/shared/CategoryTag';
import SignalFeed from '@/components/signals/SignalFeed';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<SignalCategory[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showFlagged, setShowFlagged] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then(setCategories);
  }, []);

  async function handleAddCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!newCategory.trim()) return;
    setAdding(true);
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newCategory }),
    });
    const cat = await res.json();
    setCategories((prev) => [...prev, cat]);
    setNewCategory('');
    setAdding(false);
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text">Categories</h1>
        <p className="text-text-muted text-sm mt-0.5">
          Filter signals by category across all competitors.
        </p>
      </div>

      {/* Category pills */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => { setSelectedId(null); setShowFlagged(false); }}
          className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
            !selectedId && !showFlagged
              ? 'bg-accent/10 border-accent text-accent'
              : 'border-border text-text-muted hover:border-border-light'
          }`}
        >
          All
        </button>
        <button
          onClick={() => { setShowFlagged(true); setSelectedId(null); }}
          className={`px-3 py-1.5 text-sm rounded-lg border transition-colors flex items-center gap-1.5 ${
            showFlagged
              ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-400'
              : 'border-border text-text-muted hover:border-border-light'
          }`}
        >
          <svg className="w-3.5 h-3.5" fill={showFlagged ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
          </svg>
          Saved
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => { setSelectedId(cat.id); setShowFlagged(false); }}
            className={`transition-opacity ${
              selectedId === cat.id ? 'opacity-100' : 'opacity-70 hover:opacity-100'
            }`}
          >
            <CategoryTag name={cat.name} size="md" />
          </button>
        ))}
      </div>

      {/* Add category */}
      <form
        onSubmit={handleAddCategory}
        className="flex gap-2 mb-6 max-w-sm"
      >
        <input
          type="text"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          placeholder="New category name"
          className="flex-1 px-3 py-1.5 bg-bg-elevated border border-border rounded-lg text-text text-sm placeholder-text-dim focus:outline-none focus:border-accent transition-colors"
        />
        <button
          type="submit"
          disabled={adding || !newCategory.trim()}
          className="px-3 py-1.5 bg-accent/10 text-accent text-sm rounded-lg hover:bg-accent/20 transition-colors disabled:opacity-50"
        >
          Add
        </button>
      </form>

      {/* Filtered signals */}
      <SignalFeed
        categoryId={selectedId || undefined}
        isFlagged={showFlagged || undefined}
      />
    </div>
  );
}
