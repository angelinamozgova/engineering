// start: разбор голосовой команды «расход / траты» — сумма и описание
import {
  APPOINTMENT_TRIGGERS,
  EXPENSE_PHRASE_TRIGGERS,
  EXPENSE_TRIGGERS,
  GLUED_COMMAND_SUFFIXES,
  PRICE_MARKERS,
} from './dictionary';
import { resolveServicesFromText } from './serviceResolution';
import { stripWordsCyrillic } from './textBoundaries';
import { extractClientName, extractPrice, extractTime } from './voiceExtractors';

// start: есть ли в тексте триггер расхода
export function hasExpenseTrigger(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    EXPENSE_TRIGGERS.some((trigger) => lower.includes(trigger)) ||
    EXPENSE_PHRASE_TRIGGERS.some((trigger) => lower.includes(trigger))
  );
}
// end: триггер расхода

// start: явный маркер расхода — услуга в описании не считается записью
function hasStrongExpenseLead(working: string): boolean {
  const lower = working.toLowerCase();
  if (EXPENSE_PHRASE_TRIGGERS.some((trigger) => lower.includes(trigger))) return true;
  return /(?:^|\s)(?:расход|расходы|трата|траты|трат|потрат|закуп)/i.test(working);
}
// end: маркер расхода

// start: это расход, а не запись клиента — «запиши Марину» важнее
export function shouldParseAsExpense(working: string): boolean {
  if (!hasExpenseTrigger(working)) return false;

  const lower = working.toLowerCase();
  const hasExpenseStem =
    EXPENSE_TRIGGERS.some((trigger) => lower.includes(trigger)) ||
    EXPENSE_PHRASE_TRIGGERS.some((trigger) => lower.includes(trigger));

  if (!hasExpenseStem) return false;

  const strongExpense = hasStrongExpenseLead(working);
  const clientName = extractClientName(working).name;

  if (clientName && !strongExpense) return false;

  if (!strongExpense && resolveServicesFromText(working).length > 0) return false;

  const timeResult = extractTime(working);
  if (!strongExpense && (timeResult.time || /\d{1,2}[:\s]\d{2}/.test(working))) return false;

  return true;
}
// end: приоритет записи vs расход

// start: вытащить сумму и описание расхода
export function parseExpenseFields(working: string): {
  amountRub?: number;
  description?: string;
} {
  let text = working;

  const priceResult = extractPrice(text);
  text = priceResult.text;
  let amountRub = priceResult.priceRub;

  if (!amountRub) {
    const bareNumber = text.match(/(?:^|\s)(\d[\d\s]{2,6})(?:\s|$|[,.])/);
    if (bareNumber?.[1]) {
      const parsed = parseInt(bareNumber[1].replace(/\s/g, ''), 10);
      if (!Number.isNaN(parsed) && parsed > 0) {
        amountRub = parsed;
        text = text.replace(bareNumber[0], ' ');
      }
    }
  }

  const stripWords = [
    ...EXPENSE_PHRASE_TRIGGERS,
    'расход',
    'расхода',
    'расходы',
    'расходов',
    'расходам',
    'расходами',
    'трата',
    'траты',
    'трат',
    'тратам',
    'тратами',
    'потратил',
    'потратила',
    'потратили',
    'потратить',
    'закупка',
    'закупки',
    'закупку',
    'закупок',
    'закупил',
    'закупила',
    'закупили',
    ...APPOINTMENT_TRIGGERS,
    ...GLUED_COMMAND_SUFFIXES,
    ...PRICE_MARKERS,
    'руб',
    'рублей',
    'рубля',
    'рубль',
    '₽',
    'р',
  ];

  text = text.replace(/\u0001+/g, ' ');
  text = stripWordsCyrillic(text, stripWords);
  text = text.replace(/(?:^|\s)(?:р\.?|руб\.?|₽)(?:\s|$)/gi, ' ');

  const description = text.replace(/\s+/g, ' ').trim();

  return {
    amountRub,
    description: description || undefined,
  };
}
// end: сумма и описание
// end: разбор голосовой команды расхода
