// start: тесты fuzzy match имён после STT
import { describe, expect, it } from 'vitest';
import { bestClientMatch, levenshtein, normalizeForMatch } from './clientNameRank';

describe('normalizeForMatch', () => {
  it('folds case and ё', () => {
    expect(normalizeForMatch('  Соболёва ')).toBe('соболева');
  });
});

describe('levenshtein', () => {
  it('counts single-char typo', () => {
    expect(levenshtein('натася', 'настя')).toBe(1);
  });
});

describe('bestClientMatch', () => {
  const roster = ['Соболёва', 'Ирина', 'Марина'];

  it('matches STT surname with ё drift', () => {
    const hit = bestClientMatch('соболева', roster);
    expect(hit?.name).toBe('Соболёва');
    expect(hit?.distance).toBeLessThanOrEqual(2);
  });

  it('returns null when too far', () => {
    expect(bestClientMatch('ххххх', roster)).toBeNull();
  });
});
// end: тесты fuzzy match имён после STT