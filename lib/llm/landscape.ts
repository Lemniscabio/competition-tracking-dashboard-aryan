import { getProModel, parseJsonResponse } from './client';
import type {
  Competitor,
  CompetitorAnalysis,
  LemniscaProfile,
  LandscapeData,
} from '@/lib/types';

export async function generateLandscapeData(
  competitors: Competitor[],
  analyses: CompetitorAnalysis[],
  lemniscaProfile: LemniscaProfile,
  customAxes?: string
): Promise<LandscapeData> {
  const model = getProModel();

  const competitorsText = competitors
    .map((c) => {
      const analysis = analyses.find((a) => a.competitor_id === c.id);
      const facts = analysis?.analysis_json?.key_facts;
      const factsText = facts
        ? `Founded: ${facts.founded_year || 'Unknown'} | HQ: ${facts.headquarters || 'Unknown'} | Employees: ${facts.employee_count || 'Unknown'} | Funding: ${facts.total_funding || 'Unknown'} | Latest round: ${facts.latest_round || 'Unknown'}`
        : '';
      return `**${c.name}** (${c.type}): ${c.one_liner || 'No description'}
${factsText ? `Key Facts: ${factsText}` : ''}
${analysis ? `Overview: ${analysis.analysis_json.company_overview?.substring(0, 300)}` : 'No analysis available'}
${analysis ? `Funding detail: ${analysis.analysis_json.funding_investors?.substring(0, 200)}` : ''}
${analysis ? `Customers/Partnerships: ${analysis.analysis_json.customers_pilots_partnerships?.substring(0, 200)}` : ''}`;
    })
    .join('\n\n');

  const axesInstruction = customAxes
    ? `Use these axes: ${customAxes}`
    : 'Use the default axes: "Technology Readiness" (x-axis) and "Commercial Traction" (y-axis).';

  const prompt = `You are a strategic analyst positioning biotech/synthetic biology companies on a competitive landscape map.

**Companies to position:**

${competitorsText}

**Lemnisca (reference company):**
- Description: ${lemniscaProfile.description || 'Not provided'}
- Stage: ${lemniscaProfile.current_stage || 'Not provided'}
- Technology: ${lemniscaProfile.technology_focus || 'Not provided'}
- Positioning: ${lemniscaProfile.market_positioning || 'Not provided'}
- Funding: ${lemniscaProfile.funding_status || 'Not provided'}

${axesInstruction}

Position each company and Lemnisca on a 0-100 scale for each axis.
Base your positioning on concrete data: funding raised, employee count, founding year, known customers/partnerships, and technology maturity — not just narrative descriptions. Companies with more funding, more employees, and paying customers should generally score higher on Commercial Traction. Companies with validated technology, patents, and infrastructure should score higher on Technology Readiness.

Return ONLY valid JSON (no markdown, no code fences):
{
  "axes": { "x": "X axis label", "y": "Y axis label" },
  "entities": [
    { "name": "Company Name", "x": 50, "y": 75, "isLemnisca": false },
    { "name": "Lemnisca", "x": 60, "y": 80, "isLemnisca": true }
  ]
}`;

  const result = await model.generateContent(prompt);
  return parseJsonResponse(result.response.text()) as LandscapeData;
}
