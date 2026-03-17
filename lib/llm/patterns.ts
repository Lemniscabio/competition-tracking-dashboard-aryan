import { getFlashModelPlainText } from './client';
import type { Signal } from '@/lib/types';

export async function generatePatternSummary(
  recentSignals: (Signal & { competitor_name: string; category_name: string })[]
): Promise<string> {
  if (recentSignals.length === 0) {
    return 'No signals to analyze yet. Add competitors and run a scan to see patterns.';
  }

  const model = getFlashModelPlainText();

  const signalsText = recentSignals
    .map(
      (s) =>
        `[${s.date_observed}] ${s.competitor_name} — ${s.category_name}: ${s.headline}`
    )
    .join('\n');

  const prompt = `You are a competitive intelligence analyst for a biotech/synthetic biology company. Analyze the following competitive signals and identify cross-competitor patterns, trends, and notable clusters.

**Recent signals:**
${signalsText}

Write a concise markdown summary (3-5 paragraphs) highlighting:
1. Key cross-competitor trends (e.g., multiple companies doing the same thing)
2. Notable clusters of activity
3. Strategic implications

Return ONLY the markdown text, no JSON wrapping.`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}
