// start: разбор текста, разрезанного по якорям полей
import type { FieldSegment } from './fieldAnchors';
import { segmentByFieldAnchors } from './fieldAnchors';
import type { ParsedIntent } from './parseIntent';
import { resolveServicesFromText } from './serviceResolution';
import { isDurationProcedurePhrase } from './serviceRules';
import { cleanNoteContent } from './fieldGlueWords';
import {
  buildNotes,
  extractAppointmentDate,
  extractClientName,
  extractDuration,
  extractExplicitNotes,
  extractPhone,
  extractPrice,
  extractServices,
  extractTime,
  isValidServiceSegmentText,
} from './voiceExtractors';

// start: мусор STT — не считаем названием услуги
function isGarbageServiceText(text: string): boolean {
  const t = text.trim().toLowerCase();
  if (!t) return true;
  if (/^[xх]{2,}/.test(t)) return true;
  if (/^[xх]+[a-zа-я]*$/.test(t) && !/[aeiouаеёиоуыэюя]{2,}/.test(t)) return true;
  return false;
}
// end: мусор услуги

// start: очистить секцию заметок от служебных слов — местоимения в смысле сохраняем
function cleanNotesSection(text: string): string {
  return cleanNoteContent(text)
    .replace(/(?:стоимость|цена)\s*(?:процедуры\s*)?(?:\d[\d\s]*)?\s*(?:руб(?:л(?:ей|я|ь)?)?)?/gi, '')
    .replace(/(?:х+|x+){2,}\s*(?:руб|уб)?/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}
// end: очистка заметок

// start: разобрать одну секцию по типу поля
function parseFieldSegment(segment: FieldSegment): Partial<ParsedIntent> {
  const partial: Partial<ParsedIntent> = { serviceNames: [] };
  const { field, text } = segment;

  switch (field) {
    case 'price': {
      const priceR = extractPrice(text);
      if (priceR.priceRub) partial.priceRub = priceR.priceRub;
      break;
    }
    case 'service': {
      // start: «процедура длится 30 минут» — длительность, не услуга
      if (isDurationProcedurePhrase(text)) {
        const durR = extractDuration(text);
        if (durR.durationMin) partial.durationMin = durR.durationMin;
        break;
      }
      // end: длительность вместо услуги

      const resolved = resolveServicesFromText(text);
      if (resolved.length > 0) {
        partial.serviceNames = resolved;
        partial.serviceName = resolved.join(', ');
      } else if (text.trim() && !isGarbageServiceText(text) && isValidServiceSegmentText(text)) {
        partial.serviceName = text.trim();
        partial.serviceNames = [text.trim()];
      }
      break;
    }
    case 'client': {
      // start: «клиент 12 соболева» — 12 это время, не часть имени
      let clientText = text;
      const leadingHour = text.match(/^\s*(\d{1,2})\s+/);
      if (leadingHour) {
        const hour = parseInt(leadingHour[1], 10);
        if (hour >= 0 && hour <= 23) {
          partial.time = `${String(hour).padStart(2, '0')}:00`;
          clientText = text.slice(leadingHour[0].length);
        }
      }
      // end: время в секции клиента

      // start: «клиент марина стоимость 1000» — цена не часть имени
      const priceR = extractPrice(clientText);
      if (priceR.priceRub) partial.priceRub = priceR.priceRub;
      clientText = priceR.text;
      // end: цена в секции клиента

      const nameParts = extractClientName(clientText, ['на', 'сделай', 'сделать']);
      partial.clientName = nameParts.name;
      if (nameParts.overflow.length > 0) {
        partial.notes = nameParts.overflow.join(' ');
      }
      break;
    }
    case 'phone': {
      const phoneR = extractPhone(text);
      if (phoneR.phone) partial.phone = phoneR.phone;
      break;
    }
    case 'date': {
      const dateR = extractAppointmentDate(text);
      if (dateR.date) partial.date = dateR.date;
      break;
    }
    case 'time': {
      const timeR = extractTime(text, { allowBareHour: true });
      if (timeR.time) partial.time = timeR.time;
      break;
    }
    case 'duration': {
      const durR = extractDuration(text);
      if (durR.durationMin) partial.durationMin = durR.durationMin;
      break;
    }
    case 'notes': {
      const cleaned = cleanNotesSection(text);
      const noteR = extractExplicitNotes(cleaned);
      const noteText = noteR.notes.length > 0 ? noteR.notes.join('. ') : cleaned;
      if (noteText) partial.notes = noteText;
      break;
    }
    default:
      break;
  }

  return partial;
}
// end: одна секция

// start: объединить частичные результаты секций
function mergeSegmentPartials(partials: Partial<ParsedIntent>[]): Partial<ParsedIntent> {
  const merged: Partial<ParsedIntent> = { serviceNames: [] };
  const noteParts: string[] = [];

  for (const part of partials) {
    if (part.clientName) merged.clientName = part.clientName;
    if (part.serviceName) merged.serviceName = part.serviceName;
    if (part.serviceNames?.length) merged.serviceNames = part.serviceNames;
    if (part.phone) merged.phone = part.phone;
    if (part.date) merged.date = part.date;
    if (part.time) merged.time = part.time;
    if (part.durationMin) merged.durationMin = part.durationMin;
    if (part.priceRub) merged.priceRub = part.priceRub;
    if (part.clientBirthDate) merged.clientBirthDate = part.clientBirthDate;
    if (part.notes) noteParts.push(part.notes);
  }

  if (noteParts.length > 0) {
    merged.notes = [...new Set(noteParts)].join('. ');
  }

  return merged;
}
// end: объединение секций

// start: разобрать хвост до первого якоря — свободный текст
function parseRemainder(remainder: string): Partial<ParsedIntent> {
  if (!remainder.trim()) return { serviceNames: [] };

  const partial: Partial<ParsedIntent> = { serviceNames: [] };
  const priceR = extractPrice(remainder);
  if (priceR.priceRub) partial.priceRub = priceR.priceRub;

  const svcR = extractServices(priceR.text);
  if (svcR.services.length > 0) {
    partial.serviceNames = svcR.services;
    partial.serviceName = svcR.services.join(', ');
  }

  return partial;
}
// end: хвост

// start: главная функция — якорный разбор
export function parseFromFieldAnchors(text: string): {
  hasAnchors: boolean;
  result: Partial<ParsedIntent>;
} {
  const segmented = segmentByFieldAnchors(text);

  if (!segmented.hasAnchors) {
    return { hasAnchors: false, result: { serviceNames: [] } };
  }

  const partials = segmented.segments.map(parseFieldSegment);
  if (segmented.remainder) {
    partials.unshift(parseRemainder(segmented.remainder));
  }

  const merged = mergeSegmentPartials(partials);

  if (!merged.notes) {
    const overflowNotes: string[] = [];
    for (const segment of segmented.segments) {
      if (segment.field === 'client') {
        const nameParts = extractClientName(segment.text, ['на']);
        if (nameParts.overflow.length > 0) {
          overflowNotes.push(nameParts.overflow.join(' '));
        }
      }
    }
    if (overflowNotes.length > 0) {
      merged.notes = buildNotes([], overflowNotes, merged);
    }
  }

  return { hasAnchors: true, result: merged };
}
// end: главная функция
// end: разбор по якорям полей
