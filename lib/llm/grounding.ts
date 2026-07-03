export interface GroundingChunk {
  index: number;
  uri: string;
  title: string;
}

export interface GroundingSupport {
  startIndex: number;
  endIndex: number;
  text: string;
  chunkIndices: number[];
}

function groundingMetadata(result: any): any {
  const candidates = result?.response?.candidates || result?.candidates;
  return candidates?.[0]?.groundingMetadata;
}

export function extractGroundingChunks(result: any): GroundingChunk[] {
  const chunks = groundingMetadata(result)?.groundingChunks || [];
  return chunks
    .map((c: any, i: number) => ({
      index: i,
      uri: c?.web?.uri || '',
      title: c?.web?.title || '',
    }))
    .filter((c: GroundingChunk) => c.uri);
}

export function extractGroundingSupports(result: any): GroundingSupport[] {
  const supports = groundingMetadata(result)?.groundingSupports || [];
  return supports.map((s: any) => ({
    startIndex: s?.segment?.startIndex ?? 0,
    endIndex: s?.segment?.endIndex ?? 0,
    text: s?.segment?.text ?? '',
    chunkIndices: Array.isArray(s?.groundingChunkIndices) ? s.groundingChunkIndices : [],
  }));
}

// Follow a grounding redirect once to capture its durable final destination URL.
// Resolved at scan time, while the redirect is still valid.
export async function resolveRedirect(
  url: string,
  fetchImpl: typeof fetch = fetch
): Promise<string | null> {
  try {
    const res = await fetchImpl(url, { redirect: 'follow' });
    if (!res.ok) return null;
    return res.url || null;
  } catch {
    return null;
  }
}

export async function resolveSources(
  uris: string[],
  fetchImpl: typeof fetch = fetch,
  concurrency = 5
): Promise<Map<string, string>> {
  const unique = Array.from(new Set(uris));
  const out = new Map<string, string>();
  let cursor = 0;
  async function worker() {
    while (cursor < unique.length) {
      const src = unique[cursor++];
      const resolved = await resolveRedirect(src, fetchImpl);
      if (resolved) out.set(src, resolved);
    }
  }
  const workers = Array.from(
    { length: Math.min(concurrency, unique.length || 1) },
    worker
  );
  await Promise.all(workers);
  return out;
}

// Map model-provided source indices to resolved URLs from the real-URL pool.
// Out-of-range / non-integer indices are ignored so a fabricated index cannot
// inject a bad URL.
export function selectSourcesByIndex(indices: number[], pool: string[]): string[] {
  const out: string[] = [];
  for (const i of indices) {
    if (Number.isInteger(i) && i >= 0 && i < pool.length) {
      const url = pool[i];
      if (!out.includes(url)) out.push(url);
    }
  }
  return out;
}
