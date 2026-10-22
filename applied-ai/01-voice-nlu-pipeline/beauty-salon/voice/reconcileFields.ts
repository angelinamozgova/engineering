// start: сверка полей — убрать дубли, мусор STT и перекрёстные ошибки
import { stripLeadingCommandFragment } from './commandFragments';
import { FIELD_ANCHORS, PRICE_MARKERS } from './dictionary';
import type { ParsedIntent } from './parseIntent';
import {
  filterOverflowForNotes,
  stripDurationGlueFromNotes,
  stripClientNameTokens,
  stripForClientOrService,
  stripNoteAnchorStems,
} from './fieldGlueWords';
import { trimTrailingPrepositions } from './normalizeName';
import { normalizeServiceNames } from './serviceFieldNormalize';
import { stripPriceGarbageFromClientName } from './voiceExtractors';

// start: все якорные слова для вырезания из заметок
const ALL_ANCHOR_WORDS = Object.values(FIELD_ANCHORS)
  .flat()
  .sort((a, b) => b.length - a.length);
// end: якорные слова

// start: убрать упоминания цены из заметок, если доход уже заполнен
function stripPriceFromNotes(notes: string, priceRub?: number): string {
  let working = notes.replace(/\u0001+/g, ' ');

  const pricePatterns = [
    /(?:стоимость|цена|ценник|прайс|итого|сумма|оплата|доход)\s*(?:процедуры\s*)?(?:\d[\d\s]{2,6})?\s*(?:р\.?|руб\.?|рубл(?:ей|я|ь)?|₽)?/gi,
    /\d{3,6}\s*(?:р\.?|руб\.?|рубл(?:ей|я|ь)?|₽)/gi,
    /(?:х+|x+){2,}\s*(?:руб|рубл|р\.?|₽)?/gi,
  ];

  for (const re of pricePatterns) {
    working = working.replace(re, ' ');
  }

  if (priceRub) {
    working = working.replace(new RegExp(`\\b${priceRub}\\b`, 'g'), ' ');
  }

  return working.replace(/\s+/g, ' ').trim();
}
// end: цена из заметок

// start: убрать якоря полей и служебные слова из заметок
function stripFieldAnchorsFromNotes(notes: string): string {
  let working = ` ${notes.toLowerCase()} `;

  for (const anchor of ALL_ANCHOR_WORDS) {
    const escaped = anchor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    working = working.replace(new RegExp(`\\s${escaped}\\s`, 'g'), ' ');
  }

  for (const marker of PRICE_MARKERS) {
    const escaped = marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    working = working.replace(new RegExp(`\\s${escaped}\\s`, 'g'), ' ');
  }

  return working.replace(/\s+/g, ' ').trim();
}
// end: якоря из заметок

// start: убрать время из имени клиента («12 соболева» → «Соболева»)
function cleanClientName(clientName?: string, time?: string): string | undefined {
  if (!clientName) return undefined;

  let working = stripLeadingCommandFragment(stripForClientOrService(clientName) ?? '');
  working = working.replace(/^\d{1,2}\s+/, '');
  working = working.replace(/\b(?:в|на|к)\s*\d{1,2}\b/gi, '');

  if (time) {
    const hour = parseInt(time.split(':')[0], 10);
    if (!Number.isNaN(hour)) {
      working = working.replace(new RegExp(`\\b${hour}\\b`, 'g'), ' ');
    }
  }

  working = stripPriceGarbageFromClientName(working) ?? working;
  working = stripClientNameTokens(working) ?? working;
  working = trimTrailingPrepositions(working);

  return working.replace(/\s+/g, ' ').trim() || undefined;
}
// end: имя клиента

// start: объединить заметки из двух источников без дублей
// start: слить якорный и свободный разбор — якорный приоритетнее
export function mergeParsedResults(
  anchored: Partial<ParsedIntent>,
  free: ParsedIntent,
): ParsedIntent {
  const serviceNames =
    anchored.serviceNames && anchored.serviceNames.length > 0
      ? anchored.serviceNames
      : free.serviceNames;

  return {
    ...free,
    clientName: anchored.clientName ?? free.clientName,
    serviceName: anchored.serviceName ?? free.serviceName,
    serviceNames,
    phone: anchored.phone ?? free.phone,
    date: anchored.date ?? free.date,
    time: anchored.time ?? free.time,
    durationMin: anchored.durationMin ?? free.durationMin,
    priceRub: anchored.priceRub ?? free.priceRub,
    clientBirthDate: anchored.clientBirthDate ?? free.clientBirthDate,
    notes: anchored.notes ?? free.notes,
  };
}
// end: слияние

// start: убрать мусорные названия услуг
function cleanServiceNames(result: ParsedIntent): ParsedIntent {
  const isGarbage = (name: string) => {
    const t = name.trim().toLowerCase();
    if (/\u0001/.test(t)) return true;
    if (/^[xх]{2,}/.test(t)) return true;
    if (/^[xхуб]{3,}$/.test(t)) return true;
    if (/длит|будет|полчас|заметк|минут|любит|болта|приходит|процедур|услуг/.test(t)) return true;
    if (t.split(/\s+/).filter(Boolean).length > 3) return true;
    if (/(?:^|\s)(?:клиент|телефон|тел|дата|время|длительность)(?:\s|$)/.test(` ${t} `)) {
      return true;
    }
    if (t.length > 60) return true;
    return false;
  };

  const serviceNames = (result.serviceNames ?? []).filter((s) => !isGarbage(s));
  const serviceName =
    result.serviceName && !isGarbage(result.serviceName)
      ? result.serviceName
      : serviceNames.join(', ') || undefined;

  return { ...result, serviceNames, serviceName };
}
// end: мусор услуг

// start: финальная сверка — убрать мусор и перекрёстные попадания
export function reconcileFields(result: ParsedIntent): ParsedIntent {
  let cleaned = cleanServiceNames(result);

  const rawServices =
    cleaned.serviceNames.length > 0
      ? cleaned.serviceNames
      : cleaned.serviceName
        ? [cleaned.serviceName]
        : [];
  const normalized = normalizeServiceNames(rawServices);
  cleaned = {
    ...cleaned,
    serviceNames: normalized.services,
    serviceName: normalized.serviceName,
    durationMin: cleaned.durationMin ?? normalized.durationMin,
  };

  const clientName = cleanClientName(cleaned.clientName, cleaned.time);

  let notes = cleaned.notes;
  const noteOverflow = filterOverflowForNotes(normalized.overflow);
  if (noteOverflow.length > 0) {
    const tail = noteOverflow.join(' ').trim();
    notes = notes ? `${notes}. ${tail}` : tail;
  }
  if (notes) {
    const withoutGlue = stripDurationGlueFromNotes(notes);
    if (withoutGlue) notes = withoutGlue;
    notes = stripNoteAnchorStems(notes);
    notes = stripPriceFromNotes(notes, result.priceRub);
    notes = stripFieldAnchorsFromNotes(notes);
    notes = notes
      .replace(/^(?:что|о том что)\s+/i, '')
      .replace(/(?:х+|x+){2,}\s*(?:руб|уб)?/gi, '')
      .replace(/(?:^|\s)(?:ублей|уб\.?|руб\.?)(?:\s|$)/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (notes.length < 3 || /^(?:ублей|уб|руб|лей)$/i.test(notes)) notes = undefined;
  }

  return {
    ...cleaned,
    clientName,
    notes,
  };
}
// end: финальная сверка
// end: сверка полей
