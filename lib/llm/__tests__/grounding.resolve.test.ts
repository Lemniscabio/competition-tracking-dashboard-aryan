import { describe, it, expect, vi } from 'vitest';
import { resolveRedirect, resolveSources } from '../grounding';

function fakeFetch(map: Record<string, { ok: boolean; url: string }>) {
  return vi.fn(async (input: any) => {
    const key = String(input);
    const entry = map[key];
    if (!entry) throw new Error('network error');
    return { ok: entry.ok, url: entry.url } as Response;
  });
}

describe('resolveRedirect', () => {
  it('returns the final resolved URL', async () => {
    const f = fakeFetch({ 'https://redirect/a': { ok: true, url: 'https://real.com/article' } });
    expect(await resolveRedirect('https://redirect/a', f as any)).toBe('https://real.com/article');
  });

  it('returns null on non-OK response', async () => {
    const f = fakeFetch({ 'https://redirect/b': { ok: false, url: 'https://real.com/x' } });
    expect(await resolveRedirect('https://redirect/b', f as any)).toBeNull();
  });

  it('returns null when fetch throws', async () => {
    const f = fakeFetch({});
    expect(await resolveRedirect('https://redirect/c', f as any)).toBeNull();
  });
});

describe('resolveSources', () => {
  it('dedupes input and omits failures', async () => {
    const f = fakeFetch({
      'https://r/1': { ok: true, url: 'https://real.com/1' },
      'https://r/2': { ok: false, url: 'https://real.com/2' },
    });
    const out = await resolveSources(['https://r/1', 'https://r/1', 'https://r/2', 'https://r/miss'], f as any, 2);
    expect(out.get('https://r/1')).toBe('https://real.com/1');
    expect(out.has('https://r/2')).toBe(false);
    expect(out.has('https://r/miss')).toBe(false);
    expect(out.size).toBe(1);
  });
});
