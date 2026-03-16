import { getFlashModel, parseJsonResponse } from './client';
import type { Signal, DuplicateCheckResult } from '@/lib/types';

export async function checkDuplicateSignal(
  newHeadline: string,
  existingSignals: Signal[]
): Promise<DuplicateCheckResult> {
  if (existingSignals.length === 0) {
    return {
      isDuplicate: false,
      similarSignal: null,
      explanation: 'No existing signals to compare against.',
    };
  }

  const model = getFlashModel();

  const existingText = existingSignals
    .map((s, i) => `${i}: [${s.date_observed}] ${s.headline}`)
    .join('\n');

  const prompt = `You are checking if a new competitive signal is a duplicate of an existing one.

**New signal:** ${newHeadline}

**Existing signals:**
${existingText}

Determine if the new signal describes the same real-world event as any existing signal (even if worded differently).

Return ONLY valid JSON (no markdown, no code fences):
{
  "isDuplicate": true,
  "similarIndex": 0,
  "explanation": "brief explanation"
}

Or if not a duplicate:
{
  "isDuplicate": false,
  "similarIndex": null,
  "explanation": "brief explanation"
}`;

  const result = await model.generateContent(prompt);
  const parsed = parseJsonResponse(result.response.text());

  return {
    isDuplicate: parsed.isDuplicate,
    similarSignal:
      parsed.similarIndex !== null && parsed.similarIndex !== undefined
        ? existingSignals[parsed.similarIndex]
        : null,
    explanation: parsed.explanation,
  };
}
