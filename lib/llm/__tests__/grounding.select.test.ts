import { describe, it, expect } from 'vitest';
import { selectSourcesByIndex } from '../grounding';

const pool = ['https://real.com/a', 'https://real.com/b', 'https://real.com/c'];

describe('selectSourcesByIndex', () => {
  it('maps valid indices to URLs', () => {
    expect(selectSourcesByIndex([0, 2], pool)).toEqual(['https://real.com/a', 'https://real.com/c']);
  });

  it('ignores out-of-range and negative indices', () => {
    expect(selectSourcesByIndex([1, 5, -1], pool)).toEqual(['https://real.com/b']);
  });

  it('dedupes repeated indices', () => {
    expect(selectSourcesByIndex([0, 0, 1], pool)).toEqual(['https://real.com/a', 'https://real.com/b']);
  });

  it('returns [] when no valid indices', () => {
    expect(selectSourcesByIndex([9, 10], pool)).toEqual([]);
  });
});
