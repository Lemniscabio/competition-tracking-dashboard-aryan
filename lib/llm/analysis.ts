import { getProModelWithSearch, extractSourceUrls, parseJsonResponse } from './client';
import type { AnalysisJSON, LemniscaProfile } from '@/lib/types';

export async function generateCompetitorAnalysis(
  name: string,
  websiteUrl: string | null,
  additionalContext: string | null,
  lemniscaProfile: LemniscaProfile
): Promise<{ analysis: AnalysisJSON; sourceUrls: string[] }> {
  const model = getProModelWithSearch();

  const prompt = `You are a competitive intelligence analyst for a biotech/synthetic biology company called Lemnisca. Research and analyze the following competitor thoroughly using web search.

**Competitor:** ${name}
${websiteUrl ? `**Website:** ${websiteUrl}` : ''}
${additionalContext ? `**Additional context:** ${additionalContext}` : ''}

**About Lemnisca (for relative analysis):**
- Description: ${lemniscaProfile.description || 'Not provided'}
- Stage: ${lemniscaProfile.current_stage || 'Not provided'}
- Differentiators: ${lemniscaProfile.differentiators || 'Not provided'}
- Technology: ${lemniscaProfile.technology_focus || 'Not provided'}
- Market positioning: ${lemniscaProfile.market_positioning || 'Not provided'}
- Funding: ${lemniscaProfile.funding_status || 'Not provided'}
- Team strengths: ${lemniscaProfile.team_strengths || 'Not provided'}
- Strategic priorities: ${lemniscaProfile.strategic_priorities || 'Not provided'}

Generate a comprehensive competitive analysis. SWOT should be relative to Lemnisca. Threat assessment should evaluate how this competitor threatens Lemnisca specifically.

For landscape_position, always use these fixed default axes: "Technology Readiness" (x-axis) and "Commercial Traction" (y-axis). Score on a 0-100 scale. These axes must be consistent across all competitor analyses.

Return ONLY valid JSON with this exact structure (no markdown, no code fences):
{
  "company_overview": "comprehensive overview paragraph",
  "product_technology": "detailed product and technology analysis",
  "swot": {
    "strengths": ["strength 1", "strength 2"],
    "weaknesses": ["weakness 1", "weakness 2"],
    "opportunities": ["opportunity 1"],
    "threats": ["threat 1"]
  },
  "market_positioning": "market positioning and narrative analysis",
  "funding_investors": "funding history, amounts, investors",
  "go_to_market": "go-to-market strategy analysis",
  "customers_pilots_partnerships": "known customers, pilots, partnerships",
  "infrastructure_manufacturing": "infrastructure and manufacturing capabilities",
  "leadership_team": "key leadership and team analysis",
  "threat_assessment": "specific threat assessment relative to Lemnisca",
  "landscape_position": {
    "axes": ["Technology Readiness", "Commercial Traction"],
    "position": { "x": 50, "y": 50 }
  }
}`;

  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.text();
  const analysis = parseJsonResponse(text) as AnalysisJSON;
  const sourceUrls = extractSourceUrls(result);

  return { analysis, sourceUrls };
}
