# Signal Grounding Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make automated signals trustworthy by forcing the scan to actually search the web, then storing only signals backed by a real, resolved source URL.

**Architecture:** Two-step scan. Step 1 asks the Pro model to *research* the competitor in plain text with the `googleSearch` tool — the mode that reliably triggers a real search — and we verify grounding actually happened (retry once, else drop). Step 2 feeds that grounded text plus its resolved source URLs into a Flash JSON call that extracts the signal array and attaches sources from the real-URL pool only. All grounding logic lives in a new, unit-tested `lib/llm/grounding.ts`.

**Tech Stack:** Next.js 14, TypeScript, `@google/generative-ai` (Gemini, existing SDK — no migration). New dev dependency: `vitest`.

## Spike Result (2026-07-03)

Empirically confirmed against the live API:
- Grounding **works** for this key and both models; the deprecated SDK grounds fine.
- `googleSearchRetrieval` (forced retrieval) → HTTP 400 "not supported". Only the optional `googleSearch` tool is accepted.
- The model **only searches when it decides it needs to**; naming a known company and/or requesting JSON output makes it answer from memory (0 search queries). Plain-text "research this / what's new" prompts reliably trigger search.
- Grounding chunk URIs are `https://vertexaisearch.cloud.google.com/grounding-api-redirect/...` — the exact links the current code discards.

**Consequence:** decouple search (Step 1, prose) from formatting (Step 2, JSON).

## Global Constraints

- Step 1 (research) model MUST be `gemini-3.1-pro-preview` with the `googleSearch` tool, **no** `responseMimeType`, temperature 0.
- Step 2 (extraction) model MUST be `gemini-3-flash-preview` with `responseMimeType: 'application/json'`, **no** search tool.
- Scope is the **automated scan path only**. Do NOT modify `analysis.ts`, `patterns.ts`, `landscape.ts`, `duplicate.ts`, or the shared `extractSourceUrls()`.
- No DB schema change, no API contract change, no frontend change. `ScannedSignal` shape is unchanged.
- Manual signals (`POST /api/signals`) are untouched.
- A stored automated signal MUST have ≥1 real resolved grounding source. Model-typed URLs are NEVER stored.
- If Step 1 produces zero grounding chunks after one retry, ALL signals for that competitor are dropped.
- Drop-only behavior: ungrounded signals are discarded, not flagged in the UI.
- **Commits:** Do NOT run `git commit` unless Pushkar explicitly asks. Each task ends with changes **staged** (`git add`) and paused for review. "Stage" steps below mean stage-and-pause, not commit.

---

### Task 1: Add the vitest test runner

The repo has no test framework. Add a minimal one so later tasks can be TDD.

**Files:**
- Modify: `package.json` (add `test` script + `vitest` devDependency)
- Create: `vitest.config.ts`
- Create: `lib/llm/__tests__/smoke.test.ts`

**Interfaces:**
- Produces: `npm test` runs vitest once (non-watch) over `lib/**/*.test.ts`.

- [ ] **Step 1: Install vitest**

Run: `npm install -D vitest@^2`
Expected: `vitest` added under devDependencies.

- [ ] **Step 2: Create the vitest config**

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['lib/**/*.test.ts'],
  },
});
```

- [ ] **Step 3: Add the test script**

In `package.json`, under `"scripts"`, add:

```json
"test": "vitest run"
```

- [ ] **Step 4: Write a smoke test**

```ts
// lib/llm/__tests__/smoke.test.ts
import { describe, it, expect } from 'vitest';

describe('test runner', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 5: Run it**

Run: `npm test`
Expected: PASS — 1 test passed.

- [ ] **Step 6: Stage**

```bash
git add package.json package-lock.json vitest.config.ts lib/llm/__tests__/smoke.test.ts
# Do NOT commit — pause for review.
```

---

### Task 2: Extract grounding chunks and supports

Parse Gemini's grounding metadata into clean shapes. KEEP the `vertexaisearch` redirect URIs (they are the proof-of-source; Task 3 resolves them).

**Files:**
- Create: `lib/llm/grounding.ts`
- Test: `lib/llm/__tests__/grounding.extract.test.ts`

**Interfaces:**
- Consumes: raw Gemini `result` (`result.response.candidates[0].groundingMetadata`).
- Produces:
  - `interface GroundingChunk { index: number; uri: string; title: string }`
  - `interface GroundingSupport { startIndex: number; endIndex: number; text: string; chunkIndices: number[] }`
  - `extractGroundingChunks(result: any): GroundingChunk[]` — one entry per chunk with a non-empty URI; `index` is its position in the original array.
  - `extractGroundingSupports(result: any): GroundingSupport[]`

- [ ] **Step 1: Write the failing test**

```ts
// lib/llm/__tests__/grounding.extract.test.ts
import { describe, it, expect } from 'vitest';
import { extractGroundingChunks, extractGroundingSupports } from '../grounding';

const result = {
  response: {
    candidates: [
      {
        groundingMetadata: {
          groundingChunks: [
            { web: { uri: 'https://vertexaisearch.cloud.google.com/grounding-api-redirect/0', title: 'techcrunch.com' } },
            { web: { uri: 'https://vertexaisearch.cloud.google.com/grounding-api-redirect/1', title: 'fiercebiotech.com' } },
            { notweb: {} },
          ],
          groundingSupports: [
            { segment: { startIndex: 10, endIndex: 40, text: 'raised $50M Series B' }, groundingChunkIndices: [0] },
            { segment: { startIndex: 60, endIndex: 90, text: 'opened a new plant' }, groundingChunkIndices: [1] },
          ],
        },
      },
    ],
  },
};

describe('extractGroundingChunks', () => {
  it('keeps redirect URIs and preserves original index', () => {
    const chunks = extractGroundingChunks(result);
    expect(chunks).toHaveLength(2);
    expect(chunks[0]).toEqual({ index: 0, uri: 'https://vertexaisearch.cloud.google.com/grounding-api-redirect/0', title: 'techcrunch.com' });
    expect(chunks[1].index).toBe(1);
  });

  it('returns [] when no metadata', () => {
    expect(extractGroundingChunks({})).toEqual([]);
  });
});

describe('extractGroundingSupports', () => {
  it('maps segment offsets and chunk indices', () => {
    const supports = extractGroundingSupports(result);
    expect(supports).toHaveLength(2);
    expect(supports[0]).toEqual({ startIndex: 10, endIndex: 40, text: 'raised $50M Series B', chunkIndices: [0] });
  });

  it('returns [] when no metadata', () => {
    expect(extractGroundingSupports({})).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- grounding.extract`
Expected: FAIL — cannot find module `../grounding`.

- [ ] **Step 3: Write minimal implementation**

```ts
// lib/llm/grounding.ts

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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- grounding.extract`
Expected: PASS — 4 tests pass.

- [ ] **Step 5: Stage**

```bash
git add lib/llm/grounding.ts lib/llm/__tests__/grounding.extract.test.ts
# Do NOT commit — pause for review.
```

---

### Task 3: Redirect resolver

Follow each grounding redirect once to capture its durable final URL. Network call, so `fetch` is injected for testing.

**Files:**
- Modify: `lib/llm/grounding.ts`
- Test: `lib/llm/__tests__/grounding.resolve.test.ts`

**Interfaces:**
- Produces:
  - `resolveRedirect(url: string, fetchImpl?: typeof fetch): Promise<string | null>` — final URL after following redirects, or `null` on failure/non-OK.
  - `resolveSources(uris: string[], fetchImpl?: typeof fetch, concurrency?: number): Promise<Map<string, string>>` — maps each input URI to its resolved final URL; failed entries omitted; input deduped.

- [ ] **Step 1: Write the failing test**

```ts
// lib/llm/__tests__/grounding.resolve.test.ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- grounding.resolve`
Expected: FAIL — `resolveRedirect` is not exported.

- [ ] **Step 3: Write minimal implementation**

Add to `lib/llm/grounding.ts`:

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- grounding.resolve`
Expected: PASS — 5 tests pass.

- [ ] **Step 5: Stage**

```bash
git add lib/llm/grounding.ts lib/llm/__tests__/grounding.resolve.test.ts
# Do NOT commit — pause for review.
```

---

### Task 4: Select sources by index

Step 2 emits, per signal, indices into the numbered real-URL pool. This validates those indices and maps them to resolved URLs. Out-of-range indices are discarded (a fabricated index cannot inject a bad URL).

**Files:**
- Modify: `lib/llm/grounding.ts`
- Test: `lib/llm/__tests__/grounding.select.test.ts`

**Interfaces:**
- Produces:
  - `selectSourcesByIndex(indices: number[], pool: string[]): string[]` — resolved URLs for each in-range index, deduped, order-preserving. Non-integer / out-of-range indices are ignored. Returns `[]` if no valid index.

- [ ] **Step 1: Write the failing test**

```ts
// lib/llm/__tests__/grounding.select.test.ts
import { describe, it, expect } from 'vitest';
import { selectSourcesByIndex } from '../grounding';

const pool = ['https://real.com/a', 'https://real.com/b', 'https://real.com/c'];

describe('selectSourcesByIndex', () => {
  it('maps valid indices to URLs', () => {
    expect(selectSourcesByIndex([0, 2], pool)).toEqual(['https://real.com/a', 'https://real.com/c']);
  });

  it('ignores out-of-range and negative indices', () => {
    expect(selectSourcesByIndex([1, 5, -1], pool)).toEqual(['https://real.com/b']);
  });

  it('dedupes repeated indices', () => {
    expect(selectSourcesByIndex([0, 0, 1], pool)).toEqual(['https://real.com/a', 'https://real.com/b']);
  });

  it('returns [] when no valid indices', () => {
    expect(selectSourcesByIndex([9, 10], pool)).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- grounding.select`
Expected: FAIL — `selectSourcesByIndex` is not exported.

- [ ] **Step 3: Write minimal implementation**

Add to `lib/llm/grounding.ts`:

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- grounding.select`
Expected: PASS — 4 tests pass.

- [ ] **Step 5: Stage**

```bash
git add lib/llm/grounding.ts lib/llm/__tests__/grounding.select.test.ts
# Do NOT commit — pause for review.
```

---

### Task 5: Two scan model factories

Add the research model (Pro + search, plain text) and the extraction model (Flash + JSON, no search) to `client.ts`. Leave existing factories untouched.

**Files:**
- Modify: `lib/llm/client.ts`

**Interfaces:**
- Produces:
  - `getResearchModel()` — `gemini-3.1-pro-preview`, `tools: [{ googleSearch: {} }]`, no `responseMimeType`, `temperature: 0`.
  - `getExtractionModel()` — `gemini-3-flash-preview`, `responseMimeType: 'application/json'`, no tools, `temperature: 0`.

- [ ] **Step 1: Add the factories**

Add to `lib/llm/client.ts` (after the existing factory functions):

```ts
// Two-step scan: Step 1 researches with search grounding in PLAIN TEXT (JSON mode
// suppresses the search tool). See docs/superpowers/specs/2026-07-03-signal-grounding-fix-design.md.
export function getResearchModel() {
  return genAI.getGenerativeModel({
    model: 'gemini-3.1-pro-preview',
    tools: [{ googleSearch: {} } as any],
    generationConfig: { temperature: 0 },
  });
}

// Step 2 formats the grounded findings into JSON. No search — pure extraction.
export function getExtractionModel() {
  return genAI.getGenerativeModel({
    model: 'gemini-3-flash-preview',
    generationConfig: { responseMimeType: 'application/json', temperature: 0 },
  });
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 3: Stage**

```bash
git add lib/llm/client.ts
# Do NOT commit — pause for review.
```

---

### Task 6: Rewrite the scan into the two-step flow

Replace `scanSingleCompetitor` with: Step 1 grounded research (verify chunks, one retry, drop-if-zero), resolve the redirect URLs, Step 2 JSON extraction with the numbered real-URL pool, attach sources by index (fallback to full pool), drop any signal with no resolved source, and log.

**Files:**
- Modify: `lib/llm/signals.ts` (imports; `scanSingleCompetitor` body; keep `scanForSignals` and the `sourcesText`/`existingText` prompt-building intact)

**Interfaces:**
- Consumes: `getResearchModel`, `getExtractionModel` (Task 5); `extractGroundingChunks`, `resolveSources`, `selectSourcesByIndex` (Tasks 2–4).
- Produces: `scanSingleCompetitor(input)` still returns `Promise<ScannedSignal[]>`; every returned signal has a non-empty `source_urls` of resolved deep links; ungrounded signals are not returned.

- [ ] **Step 1: Update imports**

Replace the top two imports of `lib/llm/signals.ts` with:

```ts
import { getResearchModel, getExtractionModel, parseJsonResponse } from './client';
import {
  extractGroundingChunks,
  resolveSources,
  selectSourcesByIndex,
} from './grounding';
import type { Competitor, CompetitorSource } from '@/lib/types';
```

(`getFlashModelWithSearch`, `extractSourceUrls`, and `parseJsonResponse`-via-old-import are replaced; `extractSourceUrls` stays used only by `analysis.ts`.)

- [ ] **Step 2: Replace the model call and post-processing**

In `scanSingleCompetitor`, keep everything up to and including the construction of `sourcesText` and `existingText`. Replace the current `const prompt = \`...\`;` block **and** the entire `try { ... } catch { ... }` block that follows it with the code below. (The research and extraction prompts reuse the already-built `sourcesText` and `existingText`.)

```ts
  const researchPrompt = `You are a competitive intelligence researcher for biotech/synthetic biology. Research RECENT news (last 30 days) about this competitor.

**Competitor:** ${competitor.name}
${competitor.website_url ? `**Website:** ${competitor.website_url}` : ''}
${competitor.one_liner ? `**Context:** ${competitor.one_liner}` : ''}

${sourcesText}

${existingText}

You MUST use Google Search to find current information. Do NOT answer from prior knowledge — search the web now. Search for "${competitor.name}" news, funding, hiring, partnerships, launches, and regulatory activity from the last 30 days.

Write your findings as a plain-text list of distinct recent developments. For each, give a one-line description and the date. Do not output JSON.`;

  let research;
  try {
    research = await getResearchModel().generateContent(researchPrompt);
  } catch (error) {
    console.error(`Scan (research) failed for ${competitor.name}:`, error);
    return [];
  }

  let chunks = extractGroundingChunks(research);
  // The model sometimes answers from memory without searching. Retry once, harder.
  if (chunks.length === 0) {
    try {
      const retry = await getResearchModel().generateContent(
        `${researchPrompt}\n\nIMPORTANT: You did not search. You MUST call Google Search before answering. If you cannot find recent news, say "No recent developments found."`
      );
      research = retry;
      chunks = extractGroundingChunks(retry);
    } catch (error) {
      console.error(`Scan (research retry) failed for ${competitor.name}:`, error);
      return [];
    }
  }
  if (chunks.length === 0) {
    console.log(`[Scan] ${competitor.name}: no web search performed — dropping all signals`);
    return [];
  }

  const researchText = research.response.text();

  // Resolve every grounding redirect once → durable deep links. This is the pool.
  const resolvedMap = await resolveSources(chunks.map((c) => c.uri));
  const pool = chunks
    .map((c) => resolvedMap.get(c.uri))
    .filter((u): u is string => Boolean(u));

  if (pool.length === 0) {
    console.log(`[Scan] ${competitor.name}: no grounding URLs resolved — dropping all signals`);
    return [];
  }

  const sourceListText = pool.map((u, i) => `[${i}] ${u}`).join('\n');

  const extractionPrompt = `Extract distinct competitive signals from the researched findings below. Only include signals that are supported by the findings — do not invent anything.

**Researched findings:**
${researchText}

**Available sources (cite by index):**
${sourceListText}

**Valid categories:** Fundraising, Hiring, Leadership, Partnership, Launch, Pilot/Customer, Plant/Infrastructure, Positioning, Regulatory/IP, Media/PR, Litigation

Return ONLY a valid JSON array (no markdown, no code fences). If no signals, return [].
[
  {
    "headline": "one-line description of the event",
    "category_name": "one of the valid categories above",
    "date_observed": "YYYY-MM-DD",
    "source_type": "official_announcement|news_article|linkedin|job_board|conversation|sec_regulatory|conference|other",
    "llm_summary": "2-3 sentence summary and strategic significance",
    "source_indices": [0, 2]
  }
]`;

  let parsed: any[];
  try {
    const extraction = await getExtractionModel().generateContent(extractionPrompt);
    parsed = parseJsonResponse(extraction.response.text()) as any[];
  } catch (error) {
    console.error(`Scan (extraction) failed for ${competitor.name}:`, error);
    return [];
  }

  const kept: ScannedSignal[] = [];
  let dropped = 0;
  for (const s of parsed) {
    const indices: number[] = Array.isArray(s.source_indices) ? s.source_indices : [];
    let urls = selectSourcesByIndex(indices, pool);
    // Best-effort: a grounded signal with no valid index still came from the
    // searched findings — attach the competitor-scoped real pool rather than drop.
    if (urls.length === 0) urls = pool;

    if (urls.length === 0) {
      dropped++;
      continue;
    }

    kept.push({
      competitor_id: competitor.id,
      headline: s.headline,
      category_name: s.category_name,
      date_observed: s.date_observed,
      source_urls: urls,
      source_type: s.source_type,
      llm_summary: s.llm_summary,
    });
  }

  console.log(`[Scan] ${competitor.name}: ${kept.length} grounded signals, ${dropped} dropped (of ${parsed.length})`);
  return kept;
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors. Confirm `getFlashModelWithSearch` and `extractSourceUrls` are no longer referenced in `signals.ts`.

- [ ] **Step 4: Run unit tests**

Run: `npm test`
Expected: PASS — all grounding + smoke tests pass (no regression).

- [ ] **Step 5: Build**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 6: Live verification — run a real scan**

Start `npm run dev`, log in, click **Refresh Feed** (or `POST /api/scan`) with at least one competitor present. Watch the server console.
Expected:
- Log lines: `[Scan] <name>: N grounded signals, M dropped (of N+M)`, or `no web search performed — dropping all signals`.
- New feed signals' `source_urls` open to **specific pages** (articles/posts), not homepages or `vertexaisearch...` stubs.
- Spot-check 2–3 signals: the linked page substantiates the headline.

- [ ] **Step 7: Stage**

```bash
git add lib/llm/signals.ts
# Do NOT commit — pause for review.
```

---

## Self-Review

**Spec coverage:**
- Two-step decouples search from formatting → Tasks 5 (factories) + 6 (flow). ✅
- Force + verify search, retry once, drop-if-zero → Task 6 Step 2. ✅
- Keep + resolve redirect URLs → Task 2 (keep) + Task 3 (resolve). ✅
- Attach real sources by index, fallback to pool, never store model URLs → Task 4 + Task 6. ✅
- Drop ungrounded → Task 6 (zero-chunk drop, zero-pool drop). ✅
- Logging produced-vs-dropped → Task 6 Step 2. ✅
- Scope limited to scan; `analysis.ts`/`extractSourceUrls` untouched → Task 6 Step 1 note. ✅
- Manual signals untouched (only `scanSingleCompetitor` changed). ✅

**Placeholder scan:** No TBD/TODO; every code step shows complete code. ✅

**Type consistency:** `GroundingChunk`/`GroundingSupport` (Task 2) used consistently; `resolveSources` returns `Map<string,string>` consumed in Task 6; `selectSourcesByIndex(number[], string[]) → string[]` (Task 4) consumed in Task 6; `getResearchModel`/`getExtractionModel` (Task 5) consumed in Task 6; `ScannedSignal` shape unchanged from the existing file. ✅
