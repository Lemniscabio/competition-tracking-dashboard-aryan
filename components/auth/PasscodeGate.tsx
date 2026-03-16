'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PasscodeGate() {
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await fetch('/api/auth/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passcode }),
    });

    if (res.ok) {
      router.push('/dashboard');
    } else {
      setError('Invalid passcode');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-6 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-text">Competitor Tracker</h1>
          <p className="text-text-muted mt-2 text-sm">Enter passcode to continue</p>
        </div>
        <input
          type="password"
          value={passcode}
          onChange={(e) => setPasscode(e.target.value)}
          placeholder="Passcode"
          className="w-full px-4 py-3 bg-bg-card border border-border rounded-lg text-text placeholder-text-dim focus:outline-none focus:border-accent transition-colors"
          autoFocus
        />
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-accent hover:bg-accent-hover text-white rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          {loading ? 'Verifying...' : 'Enter'}
        </button>
      </form>
    </div>
  );
}
