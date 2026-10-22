// start: тесты разбора голосовых расходов
import { describe, expect, it } from 'vitest';
import { parseExpenseFields, shouldParseAsExpense } from './expenseExtractors';

describe('expenseExtractors', () => {
  it('не считает запись клиента расходом', () => {
    expect(shouldParseAsExpense('запиши марину на маникюр')).toBe(false);
  });

  it('считает расходом фразу с триггером расхода', () => {
    expect(shouldParseAsExpense('запиши расход 500 на материалы')).toBe(true);
  });

  it('вытаскивает сумму и описание', () => {
    const result = parseExpenseFields('расход 1200 рублей на перчатки и пилки');
    expect(result.amountRub).toBe(1200);
    expect(result.description?.toLowerCase()).toMatch(/перчат/);
    expect(result.description?.toLowerCase()).toMatch(/пилк/);
  });
});
// end: тесты разбора голосовых расходов
