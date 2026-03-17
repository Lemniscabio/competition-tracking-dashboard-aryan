import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export function getProModel() {
  return genAI.getGenerativeModel({
    model: 'gemini-3.1-pro-preview',
  });
}

export function getFlashModel() {
  return genAI.getGenerativeModel({
    model: 'gemini-3-flash-preview',
  });
}

export function getProModelWithSearch() {
  return genAI.getGenerativeModel({
    model: 'gemini-3.1-pro-preview',
    tools: [{ googleSearch: {} } as any],
  });
}

export function getFlashModelWithSearch() {
  return genAI.getGenerativeModel({
    model: 'gemini-3-flash-preview',
    tools: [{ googleSearch: {} } as any],
  });
}

export function extractSourceUrls(response: any): string[] {
  const urls: string[] = [];
  const candidates = response?.candidates || response?.response?.candidates;
  const metadata = candidates?.[0]?.groundingMetadata;
  if (metadata?.groundingChunks) {
    for (const chunk of metadata.groundingChunks) {
      if (chunk.web?.uri) {
        urls.push(chunk.web.uri);
      }
    }
  }
  return Array.from(new Set(urls));
}

export function parseJsonResponse(text: string): any {
  const cleaned = text
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();
  return JSON.parse(cleaned);
}
