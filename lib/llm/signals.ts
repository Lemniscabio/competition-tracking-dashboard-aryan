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

  const prompt = `You are a competitive intelligence scanner for biotech/synthetic biology. Your job is to find NEW competitive signals about this competitor.

**Competitor:** ${competitor.name}
${competitor.website_url ? `**Website:** ${competitor.website_url}` : ''}
${competitor.one_liner ? `**Context:** ${competitor.one_liner}` : ''}

${sourcesText}

${existingText}

**Valid categories:** Fundraising, Hiring, Leadership, Partnership, Launch, Pilot/Customer, Plant/Infrastructure, Positioning, Regulatory/IP, Media/PR, Litigation

**Search strategy (follow in order):**
1. FIRST: Search each tracked source URL above for recent activity (LinkedIn posts, tweets, blog posts, job listings, etc.)
2. THEN: Search for "${competitor.name}" in news articles, press releases, and industry publications
3. THEN: Search for regulatory filings, patent applications, conference presentations
4. Focus on the last 30 days. Include the source URL where you found each signal.

Return ONLY a valid JSON array (no markdown, no code fences). If no new signals found, return [].
[
  {
    "headline": "one-line description of the event",
    "category_name": "one of the valid categories above",
    "date_observed": "YYYY-MM-DD",
    "source_type": "official_announcement|news_article|linkedin|job_board|conversation|sec_regulatory|conference|other",
    "llm_summary": "2-3 sentence summary of the signal and its strategic significance",
    "source_urls": ["https://actual-url-where-found"]
  }
]`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    const signals = parseJsonResponse(text) as any[];
    const groundingUrls = extractSourceUrls(result);

    return signals.map((s) => {
      // Merge LLM-provided URLs with grounding URLs, preferring grounding (verified by Google)
      const llmUrls: string[] = Array.isArray(s.source_urls) ? s.source_urls : [];
      const validLlmUrls = llmUrls.filter((u: string) => {
        try {
          const parsed = new URL(u);
          return parsed.protocol === 'https:' || parsed.protocol === 'http:';
        } catch {
          return false;
        }
      });
      // Use grounding URLs first (Google verified), then LLM URLs as supplement
      const merged = Array.from(new Set([...groundingUrls, ...validLlmUrls]));

      return {
        competitor_id: competitor.id,
        headline: s.headline,
        category_name: s.category_name,
        date_observed: s.date_observed,
        source_urls: merged.length > 0 ? merged : [],
        source_type: s.source_type,
        llm_summary: s.llm_summary,
      };
    });
  } catch (error) {
    console.error(`Scan failed for ${competitor.name}:`, error);
    return [];
  }
}
