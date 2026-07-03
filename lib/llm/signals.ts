import { getResearchModel, getExtractionModel, parseJsonResponse } from './client';
import {
  extractGroundingChunks,
  resolveSources,
  selectSourcesByIndex,
} from './grounding';
import type { Competitor, CompetitorSource } from '@/lib/types';

export interface CompetitorScanInput {
  competitor: Competitor;
  trackedSources: CompetitorSource[];
  recentHeadlines: string[];
}

export interface ScannedSignal {
  competitor_id: string;
  headline: string;
  category_name: string;
  date_observed: string;
  source_urls: string[];
  source_type: string;
  llm_summary: string;
}

export async function scanForSignals(
  inputs: CompetitorScanInput[]
): Promise<ScannedSignal[]> {
  const allSignals: ScannedSignal[] = [];

  for (let i = 0; i < inputs.length; i++) {
    const signals = await scanSingleCompetitor(inputs[i]);
    allSignals.push(...signals);
    // 1-second delay between competitors to avoid rate limits
    if (i < inputs.length - 1) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  return allSignals;
}

async function scanSingleCompetitor(
  input: CompetitorScanInput
): Promise<ScannedSignal[]> {
  const { competitor, trackedSources, recentHeadlines } = input;

  const sourcesByType = {
    linkedin: trackedSources.filter((s) => s.source_label === 'linkedin'),
    twitter: trackedSources.filter((s) => s.source_label === 'twitter'),
    blog: trackedSources.filter((s) => s.source_label === 'blog'),
    careers: trackedSources.filter((s) => s.source_label === 'careers'),
    crunchbase: trackedSources.filter((s) => s.source_label === 'crunchbase'),
    other: trackedSources.filter((s) => s.source_label === 'other'),
  };

  const sourcesText =
    trackedSources.length > 0
      ? `**CRITICAL — You MUST search these tracked sources FIRST before general web search. These are the highest priority:**
${trackedSources.map((s) => `- [${s.source_label.toUpperCase()}] ${s.url}`).join('\n')}

**Source-specific search instructions:**
${sourcesByType.linkedin.length > 0 ? `- LINKEDIN: Search for recent posts, job listings, company updates, and employee announcements from "${competitor.name}" on LinkedIn. Look for: new hires, role changes, company milestones, product announcements, culture posts. URLs: ${sourcesByType.linkedin.map((s) => s.url).join(', ')}` : ''}
${sourcesByType.twitter.length > 0 ? `- TWITTER/X: Search for recent tweets, threads, and announcements from "${competitor.name}" on Twitter/X. Look for: product launches, partnerships, event participation, thought leadership. URLs: ${sourcesByType.twitter.map((s) => s.url).join(', ')}` : ''}
${sourcesByType.blog.length > 0 ? `- BLOG: Search for recent blog posts and articles from "${competitor.name}". Look for: technical updates, case studies, thought leadership, product updates. URLs: ${sourcesByType.blog.map((s) => s.url).join(', ')}` : ''}
${sourcesByType.careers.length > 0 ? `- CAREERS: Search for current job openings at "${competitor.name}". Look for: new roles indicating expansion, team growth, strategic pivots, technology investments. URLs: ${sourcesByType.careers.map((s) => s.url).join(', ')}` : ''}
${sourcesByType.crunchbase.length > 0 ? `- CRUNCHBASE: Search for funding rounds, acquisitions, and financial data for "${competitor.name}". URLs: ${sourcesByType.crunchbase.map((s) => s.url).join(', ')}` : ''}
${sourcesByType.other.length > 0 ? `- OTHER TRACKED: ${sourcesByType.other.map((s) => s.url).join(', ')}` : ''}`
      : 'No tracked sources specified. Use general web search.';

  const existingText =
    recentHeadlines.length > 0
      ? `Already known signals (DO NOT duplicate these):\n${recentHeadlines.map((h) => `- ${h}`).join('\n')}`
      : 'No existing signals.';

  // --- Step 1: grounded research (plain text — JSON output suppresses search) ---
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

  // --- Step 2: structured extraction from the grounded findings (JSON, no search) ---
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
}
