# Signal Grounding Fix — Design

**Date:** 2026-07-03
**Author:** Pushkar + Claude
**Status:** Approved for implementation planning

## Problem

Automated signals in the feed are frequently hallucinated. When Pushkar clicks
through to verify a signal, the cited source URL either doesn't work or redirects
to a generic homepage rather than a real article/post that substantiates the
headline. The feed cannot be trusted.

## Root cause analysis

**Updated 2026-07-03 after an empirical spike against the live Gemini API.** The
original theory (grounding blocked by JSON mode) was only partly right. What the
spike actually proved:

- Google Search grounding **is available** for this API key and both models — it
  is not a billing/enablement problem, and the deprecated `@google/generative-ai`
  SDK grounds fine (no SDK migration needed).
- The old forced-retrieval tool (`googleSearchRetrieval` with a dynamic threshold)
  that *guarantees* a search is **rejected** by `gemini-3.1-pro-preview` (HTTP 400,
  "google_search_retrieval is not supported"). Only the newer `googleSearch` tool
  is accepted — and it is **optional**: the model decides for itself whether to
  search.
- **The model skips the search when it thinks it already knows the answer** (true
  for named competitors it has training data on) and answers from parametric
  memory. That memory answer is the hallucination.
- **Requesting structured JSON output suppresses the search** further — when told
  to emit a JSON array, the model commits to formatting and tends not to call the
  search tool at all. Grounding is also nondeterministic: the same prompt grounded
  on one call and returned zero search queries on the next.

The current scan (`scanSingleCompetitor`) does the worst-case combination: it names
a known company **and** demands a JSON array in a single call, so the model almost
never searches. The secondary defects still hold and compound it:

- `extractSourceUrls()` discards every `vertexaisearch.cloud.google.com` grounding
  redirect (the proof-of-source), leaving the URL set empty.
- With no grounding URLs, the merge falls back to `validLlmUrls` — URLs the model
  typed into its own JSON (generic homepages it guesses). This is the direct cause
  of the "redirects to homepage" symptom.
- Signals are stored regardless of whether any real source backs them.

## Chosen approach — two-step grounded extraction

Decouple **searching** from **formatting** so a JSON request can never suppress the
search:

- **Step 1 — grounded research (prose):** ask the Pro model to search the web for
  recent news about the competitor and report findings as plain text (no JSON mode).
  This is the mode that reliably triggers search. Verify `groundingChunks > 0`;
  retry once if zero; if still zero, drop all signals for that competitor (no search
  = nothing trustworthy).
- **Step 2 — structured extraction:** feed Step 1's grounded findings and its real
  (resolved) source URLs into a second call that emits the JSON signal array,
  attaching sources from the provided real-URL pool only.

Scope is limited to the automated scan path. Deep analysis, patterns, landscape,
and duplicate-check are out of scope. No SDK migration.

## Changes

### 1. Two model factories for the scan

- `getResearchModel()` — `gemini-3.1-pro-preview` + `googleSearch` tool, **plain
  text** (no `responseMimeType`), low temperature (0–0.2). Used for Step 1.
- `getExtractionModel()` — `gemini-3-flash-preview`, `responseMimeType:
  'application/json'`, **no search tool** (pure formatting). Used for Step 2.
- Keep an inter-competitor delay; tune for rate limits. Two calls per competitor
  now, so a full refresh is slower/costlier — accepted; scanning is the
  trust-critical path.

### 2. Force and verify the search (Step 1)

- Prompt explicitly requires web search and forbids answering from prior knowledge.
- After the call, verify `extractGroundingChunks(result).length > 0`. If zero,
  retry once with a stronger directive. If still zero, return `[]` for that
  competitor and log it (guaranteed drop floor — no real search, no signals).

### 3. Keep and resolve grounding URLs (fixes homepage/dead links)

- New `lib/llm/grounding.ts` KEEPS the `vertexaisearch...` redirect URIs (they are
  the proof-of-source). The shared `extractSourceUrls()` used by `analysis.ts` is
  left untouched.
- A server-side redirect resolver follows each grounding redirect once (at scan
  time, while it is still valid) and captures the durable final destination URL.
  Dedupe; resolve concurrently with a capped pool. Only resolved URLs are stored.

### 4. Attach real sources, drop ungrounded (Step 2)

- Step 1's resolved grounding URLs form a numbered, all-real source pool for that
  competitor.
- Step 2 emits, per signal, indices into that pool. Indices are validated
  (out-of-range are discarded); valid indices map to resolved deep links. If a
  signal names no valid index, it falls back to the competitor-scoped resolved pool
  (still all-real, best-effort attribution).
- Model-typed URLs are NEVER stored. A signal with no resolvable real source is
  dropped.
- Log per competitor: signals extracted, signals dropped (and why).

## Components touched

- `lib/llm/client.ts` — add `getResearchModel()` (Pro + search, plain text, low
  temp) and `getExtractionModel()` (Flash + JSON, no search). Existing factories and
  the shared `extractSourceUrls()` are left untouched.
- `lib/llm/grounding.ts` (new) — `extractGroundingChunks`, `extractGroundingSupports`,
  `resolveRedirect`, `resolveSources`, `selectSourcesByIndex`. Pure, unit-tested.
- `lib/llm/signals.ts` — rewrite `scanSingleCompetitor` into the two-step flow
  (research → verify/retry/drop → resolve → extract → attach → drop → log).
- No DB schema change. No API contract change. No frontend change.

## Out of scope

- Second-stage LLM verification pass (option B) — revisit only if fabrications
  survive this fix.
- UI trust/verified badges (option C).
- Changes to analysis, patterns, landscape, duplicate-check.

## Success criteria

- Every stored automated signal has at least one real, resolved source URL that
  loads to a specific page (not a homepage/redirect stub).
- Signals with no real source are dropped, not stored.
- Scan logs report how many signals were produced vs dropped per run.
- Manual spot-check: sources open to pages that substantiate their headlines.

## Risks

- **Model still skips search intermittently** — grounding is nondeterministic.
  Mitigated by the verify-chunks + one retry + drop-if-zero floor in Step 1.
- **Index-based attribution imperfect** — mitigated because the whole pool is
  real (from Step 1 grounding); worst case is a real-but-slightly-off source, never
  a fabricated one. Competitor-scoped fallback covers missing indices.
- **Redirect resolution latency/failure** — capped concurrency; unresolvable
  sources are dropped from a signal's set, and a signal left with none is dropped.
- **Two Pro/Flash calls per competitor** — higher cost/latency; accepted.
