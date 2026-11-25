// start: нормализация поля «процедура» — без якорей внутри, макс. 3 слова, хвост в заметки
import { STRIP_FROM_CLIENT_SERVICE, stripForClientOrService } from './fieldGlueWords';
import { resolveServicesFromText } from './serviceResolution';
import { CYR_TAIL } from './textBoundaries';

// start: слова-триггеры полей — не должны попадать в само значение
export const SERVICE_FIELD_STRIP_WORDS = STRIP_FROM_CLIENT_SERVICE;
// end: слова-триггеры

export const MAX_SERVICE_WORDS = 3;

// start: хвост про длительность — «она будет длиться полчаса»
const SERVICE_DURATION_TAIL = new RegExp(
  `\\s+(?:(?:она|он|они|у\\s+неё|у\\s+нее)\\s+)?(?:будет\\s+)?(?:длит${CYR_TAIL}|длительност${CYR_TAIL}|займ${CYR_TAIL}|заним${CYR_TAIL}|идет|идёт)\\s+.+$`,
  'i',
);

// start: вытащить минуты из фразы про время
export function parseDurationMinutesFromPhrase(phrase: string): number | undefined {
  const t = phrase.toLowerCase();
  if (/полчаса|пол\s*часа/.test(t)) return 30;
  if (/полтора\s+часа/.test(t)) return 90;

  const min = t.match(/(\d{1,3})\s*(?:мин|минут|минуты)/);
  if (min) return parseInt(min[1], 10);

  const hours = t.match(/(\d{1,3})\s*(?:час|часа|часов)/);
  if (hours) {
    const h = parseInt(hours[1], 10);
    if (h >= 1 && h <= 8) return h * 60;
  }

  return undefined;
}
// end: минуты из фразы

// start: отделить название услуги и хвост про длительность
export function splitServiceDurationTail(text: string): {
  servicePart: string;
  durationTail?: string;
  durationMin?: number;
} {
  const trimmed = text.trim();
  if (!trimmed) return { servicePart: '' };

  const tailMatch = trimmed.match(SERVICE_DURATION_TAIL);
  if (!tailMatch) return { servicePart: trimmed };

  const servicePart = trimmed.slice(0, tailMatch.index).trim();
  const durationTail = tailMatch[0].trim();
  const durationMin = parseDurationMinutesFromPhrase(durationTail);

  return { servicePart, durationTail, durationMin };
}
// end: отделить хвост

// start: убрать якоря и мостики из client/service (регистр сохраняем)
export function stripServiceFieldTriggers(text: string): string {
  return stripForClientOrService(text) ?? '';
}
// end: убрать якоря

// start: обрезать услугу до 3 слов, остальное — в заметки
export function truncateServiceWords(
  text: string,
  maxWords = MAX_SERVICE_WORDS,
): { service: string; overflow: string[] } {
  const cleaned = stripServiceFieldTriggers(text);
  if (!cleaned) return { service: '', overflow: [] };

  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) {
    return { service: words.join(' '), overflow: [] };
  }

  return {
    service: words.slice(0, maxWords).join(' '),
    overflow: words.slice(maxWords),
  };
}
// end: обрезка до 3 слов

// start: одна услуга — словарь, без якорей, без хвоста длительности, макс. 3 слова
export function normalizeSingleServiceName(raw?: string): {
  service?: string;
  overflow: string[];
  durationMin?: number;
} {
  if (!raw?.trim()) return { overflow: [] };

  const { servicePart, durationMin } = splitServiceDurationTail(raw);
  const fromDictionary = resolveServicesFromText(servicePart);
  const base = fromDictionary[0] ?? stripServiceFieldTriggers(servicePart);

  if (!base) {
    return { overflow: [], durationMin };
  }

  const { service, overflow } = truncateServiceWords(base);

  return {
    service: service || undefined,
    overflow,
    durationMin,
  };
}
// end: одна услуга

// start: нормализовать список услуг и собрать хвосты
export function normalizeServiceNames(rawNames: string[]): {
  services: string[];
  serviceName?: string;
  overflow: string[];
  durationMin?: number;
} {
  const services: string[] = [];
  const overflow: string[] = [];
  let durationMin: number | undefined;

  for (const raw of rawNames) {
    const normalized = normalizeSingleServiceName(raw);
    if (normalized.service) services.push(normalized.service);
    if (normalized.durationMin && !durationMin) durationMin = normalized.durationMin;
    overflow.push(...normalized.overflow);
  }

  const unique = [...new Set(services)];

  return {
    services: unique,
    serviceName: unique.join(', ') || undefined,
    overflow,
    durationMin,
  };
}
// end: список услуг
// end: нормализация поля процедура
