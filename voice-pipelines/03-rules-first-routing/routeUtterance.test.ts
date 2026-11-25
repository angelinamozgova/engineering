// start: тесты rules-first маршрутизации
import { describe, expect, it } from 'vitest';
import { fieldCoverage, routeUtterance } from './routeUtterance';

describe('fieldCoverage', () => {
  it('returns ratio', () => {
    expect(fieldCoverage({ hasIntent: true, requiredFieldsFilled: 2, requiredFieldsTotal: 4 })).toBe(
      0.5,
    );
  });
});

describe('routeUtterance', () => {
  it('keeps rules when coverage is enough', () => {
    const decision = routeUtterance({
      hasIntent: true,
      requiredFieldsFilled: 3,
      requiredFieldsTotal: 4,
    });
    expect(decision).toBe('rules');
  });

  it('marks llm_candidate when intent missing', () => {
    const decision = routeUtterance({
      hasIntent: false,
      requiredFieldsFilled: 0,
      requiredFieldsTotal: 4,
    });
    expect(decision).toBe('llm_candidate');
  });
});
// end: тесты rules-first маршрутизации