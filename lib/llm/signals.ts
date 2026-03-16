import { getFlashModelWithSearch, extractSourceUrls, parseJsonResponse } from './client';
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
  const model = getFlashModelWithSearch();
  const { competitor, trackedSources, recentHeadlines } = input;

  const sourcesText =
    trackedSources.length > 0
      ? `Priority sources to check first:\n${trackedSources.map((s) => `- ${s.source_label}: ${s.url}`).join('\n')}`
      : 'No tracked sources specified.';

  const existingText =
    recentHeadlines.length > 0
      ? `Already known signals (DO NOT duplicate these):\n${recentHeadlines.map((h) => `- ${h}`).join('\n')}`
      : 'No existing signals.';

  const prompt = `You are a competitive intelligence scanner for biotech/synthetic biology. Search for recent news, announcements, and activity about this competitor.

**Competitor:** ${competitor.name}
${competitor.website_url ? `**Website:** ${competitor.website_url}` : ''}
${competitor.one_liner ? `**Context:** ${competitor.one_liner}` : ''}

${sourcesText}

${existingText}

**Valid categories:** Fundraising, Hiring, Leadership, Partnership, Launch, Pilot/Customer, Plant/Infrastructure, Positioning, Regulatory/IP, Media/PR, Litigation

Search the web for recent competitive signals. Find news, announcements, job postings, social media posts, regulatory filings, etc. from the last 30 days.

Return ONLY a valid JSON array (no markdown, no code fences). If no new signals found, return [].
[
  {
    "headline": "one-line description of the event",
    "category_name": "one of the valid categories above",
    "date_observed": "YYYY-MM-DD",
    "source_type": "official_announcement|news_article|linkedin|job_board|conversation|sec_regulatory|conference|other",
    "llm_summary": "2-3 sentence summary of the signal and its strategic significance"
  }
]`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    const signals = parseJsonResponse(text) as any[];
    const sourceUrls = extractSourceUrls(result);

    return signals.map((s) => ({
      competitor_id: competitor.id,
      headline: s.headline,
      category_name: s.category_name,
      date_observed: s.date_observed,
      source_urls: s.source_urls || sourceUrls,
      source_type: s.source_type,
      llm_summary: s.llm_summary,
    }));
  } catch (error) {
    console.error(`Scan failed for ${competitor.name}:`, error);
    return [];
  }
}
