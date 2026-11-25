// start: проверка логичности полей — «сам себя проверяет», без LLM и без задержек
import { SERVICE_KEYWORDS } from './dictionary';
import type { ParsedIntent } from './parseIntent';
import { cleanNoteContent, stripForClientOrService } from './fieldGlueWords';
import { resolveServicesFromText } from './serviceResolution';
import { isDurationProcedurePhrase } from './serviceRules';
import { stripWordsCyrillic } from './textBoundaries';
import {
  extractDuration,
  extractExplicitNotes,
} from './voiceExtractors';

const SERVICE_WORDS = new Set(Object.keys(SERVICE_KEYWORDS));

// start: процедура не может быть длинным текстом про минуты и заметки
const INVALID_SERVICE_MARKERS =
  /(?:^|\s)(?:длится|длительность|занимает|идет|идёт|будет|минут|минуты|часов|полчаса|заметк|запиши|любит|болта|приходит|иногда|раньше|что\s+она|что\s+он|она|они)(?:\s|$)/i;

// start: мусор в заметках — хвосты от длительности
const NOTE_GARBAGE =
  /(?:^|\s)(?:длится|длительность|минут|минуты|часов|заметке|запиши)(?:\s|$)/gi;
// end: паттерны

// start: услуга выглядит правдоподобно?
export function isPlausibleService(name?: string): boolean {
  if (!name?.trim()) return false;
  const t = name.trim();
  if (/\u0001/.test(t)) return false;
  if (t.length > 60) return false;
  if (INVALID_SERVICE_MARKERS.test(` ${t.toLowerCase()} `)) return false;
  if (/[.!?].*[.!?]/.test(t)) return false;
  if (/(?:^|\s)(?:клиент|телефон|тел|дата|время|длительность|заметк|процедур|услуг|работ)(?:\s|$)/i.test(` ${t} `)) {
    return false;
  }
  if (t.split(/\s+/).filter(Boolean).length > 3) return false;
  return true;
}
// end: услуга

// start: заметки выглядят правдоподобно?
const INVALID_NOTE_MARKERS =
  /(?:^|\s)(?:длится|длительность|занимает|будет|минут|минуты|часов|полчаса|заметк|запиши|процедур|услуг)(?:\s|$)/i;

export function isPlausibleNotes(notes?: string): boolean {
  if (!notes?.trim()) return false;
  const t = notes.trim().toLowerCase();
  if (t.length < 4) return false;
  if (/^(?:длится|минут|ресниц|заметке|заметки)$/i.test(t)) return false;
  if (INVALID_NOTE_MARKERS.test(` ${t} `) && t.length < 20) return false;
  return true;
}
// end: заметки

// start: вытащить заметку после «в заметке запиши что…»
function extractNotesFromRaw(rawText: string): string | undefined {
  const lower = rawText.toLowerCase();
  const triggers = ['в заметке запиши', 'в заметке', 'заметке запиши', 'заметка что', 'заметки что'];

  for (const trigger of triggers.sort((a, b) => b.length - a.length)) {
    const idx = lower.indexOf(trigger);
    if (idx === -1) continue;
    let tail = rawText.slice(idx + trigger.length).replace(/^[\s,:-]+/, '').trim();
    tail = cleanNoteContent(tail).replace(/[.!?]+\s*$/, '').trim();
    if (tail.length > 3) return tail;
  }

  return undefined;
}
// end: заметка из сырого текста

// start: убрать слова услуг из имени клиента
function cleanServiceFromClientName(clientName?: string): string | undefined {
  if (!clientName) return undefined;
  let working = clientName;
  working = working.replace(/(?:^|\s)(?:ублей|убла|рублей|руб|рубля)(?:\s|$)/gi, ' ');
  working = stripWordsCyrillic(working, [...SERVICE_WORDS, 'ресниц', 'ресницы']);
  return stripForClientOrService(working);
}
// end: имя без услуги

// start: почистить заметки от мусорных хвостов
function sanitizeNotes(notes?: string): string | undefined {
  if (!notes) return undefined;
  let working = notes.replace(NOTE_GARBAGE, ' ').replace(/\s+/g, ' ').trim();
  working = working.replace(/[.\s]+$/, '').trim();
  if (working.length < 3) return undefined;
  return working;
}
// end: чистка заметок

// start: длительность и услуга из текста, если якоря ошиблись
function enrichFromText(text: string, result: ParsedIntent): ParsedIntent {
  const updated = { ...result };

  if (!updated.durationMin) {
    const dur = extractDuration(text);
    if (dur.durationMin) updated.durationMin = dur.durationMin;
  }

  if (!isPlausibleService(updated.serviceName)) {
    const services = resolveServicesFromText(text);
    if (services.length > 0) {
      updated.serviceNames = services;
      updated.serviceName = services.join(', ');
    }
  }

  return updated;
}
// end: enrich

// start: главная проверка — поправить поля, если якорный разбор «нелогичен»
export function validateAndFixFields(
  result: ParsedIntent,
  cleanedText: string,
  freeResult: ParsedIntent,
): ParsedIntent {
  let fixed = { ...result };

  if (!isPlausibleService(fixed.serviceName)) {
    if (isPlausibleService(freeResult.serviceName)) {
      fixed.serviceName = freeResult.serviceName;
      fixed.serviceNames = freeResult.serviceNames;
    } else {
      fixed = enrichFromText(cleanedText, { ...fixed, serviceName: undefined, serviceNames: [] });
      if (!isPlausibleService(fixed.serviceName)) {
        fixed.serviceName = undefined;
        fixed.serviceNames = [];
      }
    }
  }

  if (!fixed.durationMin) {
    fixed.durationMin = freeResult.durationMin ?? enrichFromText(cleanedText, fixed).durationMin;
  }

  // start: «процедура длится» в сыром тексте — длительность поверх ошибочной услуги
  if (!fixed.durationMin && isDurationProcedurePhrase(cleanedText)) {
    const dur = extractDuration(cleanedText);
    if (dur.durationMin) fixed.durationMin = dur.durationMin;
  }

  if (!isPlausibleService(fixed.serviceName)) {
    const fromFullText = resolveServicesFromText(cleanedText);
    if (fromFullText.length > 0) {
      fixed.serviceNames = fromFullText;
      fixed.serviceName = fromFullText.join(', ');
    } else {
      fixed.serviceName = undefined;
      fixed.serviceNames = [];
    }
  }
  // end: услуга из всего текста

  if (!isPlausibleNotes(fixed.notes)) {
    const fromRaw = extractNotesFromRaw(result.rawText);
    const fromFree = freeResult.notes;
    const fromTriggers = extractExplicitNotes(cleanedText).notes.join('. ');
    fixed.notes = fromRaw ?? fromFree ?? (fromTriggers || undefined);
  }

  fixed.notes = sanitizeNotes(fixed.notes);
  fixed.clientName = cleanServiceFromClientName(fixed.clientName ?? freeResult.clientName);

  if (!fixed.clientName && freeResult.clientName) {
    fixed.clientName = cleanServiceFromClientName(freeResult.clientName);
  }

  return fixed;
}
// end: главная проверка
// end: проверка логичности полей
