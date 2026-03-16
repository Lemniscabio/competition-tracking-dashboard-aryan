'use client';

import { useState, useEffect } from 'react';
import type { SignalComment } from '@/lib/types';

export default function SignalComments({
  signalId,
}: {
  signalId: string;
}) {
  const [comments, setComments] = useState<SignalComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/signals/${signalId}/comments`)
      .then((r) => r.json())
      .then(setComments);
  }, [signalId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim()) return;
    setLoading(true);

    const res = await fetch(`/api/signals/${signalId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: newComment }),
    });
    const comment = await res.json();
    setComments((prev) => [...prev, comment]);
    setNewComment('');
    setLoading(false);
  }

  return (
    <div className="space-y-3">
      {comments.length > 0 && (
        <div className="space-y-2">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="bg-bg-elevated rounded-md p-3"
            >
              <p className="text-sm text-text-muted">{comment.content}</p>
              <p className="text-xs text-text-dim mt-1">
                {new Date(comment.created_at).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          className="flex-1 px-3 py-1.5 bg-bg-elevated border border-border rounded-lg text-text text-sm placeholder-text-dim focus:outline-none focus:border-accent transition-colors"
        />
        <button
          type="submit"
          disabled={loading || !newComment.trim()}
          className="px-3 py-1.5 bg-accent/10 text-accent text-sm rounded-lg hover:bg-accent/20 transition-colors disabled:opacity-50"
        >
          Add
        </button>
      </form>
    </div>
  );
}
