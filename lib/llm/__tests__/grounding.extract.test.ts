import { describe, it, expect } from 'vitest';
import { extractGroundingChunks, extractGroundingSupports } from '../grounding';

const result = {
  response: {
    candidates: [
      {
        groundingMetadata: {
          groundingChunks: [
            { web: { uri: 'https://vertexaisearch.cloud.google.com/grounding-api-redirect/0', title: 'techcrunch.com' } },
            { web: { uri: 'https://vertexaisearch.cloud.google.com/grounding-api-redirect/1', title: 'fiercebiotech.com' } },
            { notweb: {} },
          ],
          groundingSupports: [
            { segment: { startIndex: 10, endIndex: 40, text: 'raised $50M Series B' }, groundingChunkIndices: [0] },
            { segment: { startIndex: 60, endIndex: 90, text: 'opened a new plant' }, groundingChunkIndices: [1] },
          ],
        },
      },
    ],
  },
};

describe('extractGroundingChunks', () => {
  it('keeps redirect URIs and preserves original index', () => {
    const chunks = extractGroundingChunks(result);
    expect(chunks).toHaveLength(2);
    expect(chunks[0]).toEqual({ index: 0, uri: 'https://vertexaisearch.cloud.google.com/grounding-api-redirect/0', title: 'techcrunch.com' });
    expect(chunks[1].index).toBe(1);
  });

  it('returns [] when no metadata', () => {
    expect(extractGroundingChunks({})).toEqual([]);
  });
});

describe('extractGroundingSupports', () => {
  it('maps segment offsets and chunk indices', () => {
    const supports = extractGroundingSupports(result);
    expect(supports).toHaveLength(2);
    expect(supports[0]).toEqual({ startIndex: 10, endIndex: 40, text: 'raised $50M Series B', chunkIndices: [0] });
  });

  it('returns [] when no metadata', () => {
    expect(extractGroundingSupports({})).toEqual([]);
  });
});
