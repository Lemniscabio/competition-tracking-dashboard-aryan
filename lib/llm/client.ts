import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export function getProModel() {
  return genAI.getGenerativeModel({
    model: 'gemini-3.1-pro-preview',
    generationConfig: { responseMimeType: 'application/json' },
  });
}

export function getFlashModel() {
  return genAI.getGenerativeModel({
    model: 'gemini-3-flash-preview',
    generationConfig: { responseMimeType: 'application/json' },
  });
}

export function getFlashModelPlainText() {
  return genAI.getGenerativeModel({
    model: 'gemini-3-flash-preview',
  });
}

export function getProModelWithSearch() {
  return genAI.getGenerativeModel({
    model: 'gemini-3.1-pro-preview',
    tools: [{ googleSearch: {} } as any],
    generationConfig: { responseMimeType: 'application/json' },
  });
}

export function getFlashModelWithSearch() {
  return genAI.getGenerativeModel({
    model: 'gemini-3-flash-preview',
    tools: [{ googleSearch: {} } as any],
    generationConfig: { responseMimeType: 'application/json' },
  });
}

export function extractSourceUrls(response: any): string[] {
  const urls: string[] = [];
  const candidates = response?.candidates || response?.response?.candidates;
  const metadata = candidates?.[0]?.groundingMetadata;
  if (metadata?.groundingChunks) {
    for (const chunk of metadata.groundingChunks) {
      if (chunk.web?.uri) {
        const uri = chunk.web.uri;
        // Skip Google grounding redirect URLs — they expire and show "not found"
        if (uri.includes('vertexaisearch.cloud.google.com')) continue;
        urls.push(uri);
      }
    }
  }
  return Array.from(new Set(urls));
}

export function parseJsonResponse(text: string): any {
  // Strip markdown code fences
  const cleaned = text
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();

  // Try direct parse first
  try {
    return JSON.parse(cleaned);
  } catch {
    // LLM sometimes prefixes thinking/reasoning text before JSON.
    // Extract the first JSON array or object from the response.
    const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
    const objectMatch = cleaned.match(/\{[\s\S]*\}/);

    if (arrayMatch) {
      try { return JSON.parse(arrayMatch[0]); } catch { /* fall through */ }
    }
    if (objectMatch) {
      try { return JSON.parse(objectMatch[0]); } catch { /* fall through */ }
    }

    throw new SyntaxError(
      `Failed to extract JSON from LLM response. Start: "${cleaned.slice(0, 80)}..."`
    );
  }
}
