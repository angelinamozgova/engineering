// start: второй проход — пустые поля, нераспределённые слова, правки по исходному тексту
import type { ParsedIntent } from './parseIntent';
import {
  cleanNoteContent,
  filterOverflowForNotes,
  stripDurationGlueFromNotes,
  stripForClientOrService,
} from './fieldGlueWords';
import { normalizeServiceNames } from './serviceFieldNormalize';
import { resolveServicesFromText } from './serviceResolution';
import { isDurationProcedurePhrase } from './serviceRules';
import { isPlausibleService } from './validateFields';
import {
  collectAssignedWords,
  extractAppointmentDate,
  extractDuration,
  extractExplicitNotes,
  extractPhone,
  extractPrice,
  extractPriceSecondPass,
  extractTime,
} from './voiceExtractors';

// start: слова, уже занятые полями
function buildAssignedSet(result: ParsedIntent): Set<string> {
  const words = collectAssignedWords({
    clientName: result.clientName,
    serviceName: result.serviceName,
    serviceNames: result.serviceNames,
  });

  if (result.notes) {
    for (const w of result.notes.toLowerCase().split(/\s+/)) {
      if (w.length > 1) words.add(w);
    }
  }

  if (result.priceRub) words.add(String(result.priceRub));
  if (result.durationMin) {
    words.add(String(result.durationMin));
    if (result.durationMin === 30) words.add('полчаса');
  }

  return words;
}
// end: занятые слова

// start: есть ли в тексте явные заметки
function extractNotesIfMissing(result: ParsedIntent, cleanedText: string): string | undefined {
  if (result.notes?.trim()) return result.notes;

  const fromExplicit = extractExplicitNotes(cleanedText).notes.join('. ').trim();
  if (fromExplicit.length > 3) return fromExplicit;

  const lower = result.rawText.toLowerCase();
  const triggers = ['в заметке запиши', 'в заметке', 'заметке запиши', 'заметки что', 'заметка что'];

  for (const trigger of triggers.sort((a, b) => b.length - a.length)) {
    const idx = lower.indexOf(trigger);
    if (idx === -1) continue;
    let tail = result.rawText.slice(idx + trigger.length).replace(/^[\s,:-]+/, '').trim();
    tail = cleanNoteContent(tail);
    if (tail.length > 3) return tail;
  }

  return undefined;
}
// end: заметки

// start: второй проход по исходному тексту
export function secondPassFix(result: ParsedIntent, cleanedText: string): ParsedIntent {
  let fixed: ParsedIntent = { ...result };

  // start: почистить client/service от мостиков и якорей заметок
  fixed.clientName = stripForClientOrService(fixed.clientName);
  fixed.serviceName = stripForClientOrService(fixed.serviceName);
  fixed.serviceNames = (fixed.serviceNames ?? [])
    .map((s) => stripForClientOrService(s))
    .filter((s): s is string => Boolean(s));
  if (fixed.serviceNames.length > 0) {
    fixed.serviceName = fixed.serviceNames.join(', ');
  } else {
    fixed.serviceName = undefined;
  }
  // end: чистка полей

  // start: цена — повторный проход по полному тексту
  if (!fixed.priceRub) {
    const priceR = extractPrice(cleanedText);
    if (priceR.priceRub) {
      fixed.priceRub = priceR.priceRub;
    } else {
      const second = extractPriceSecondPass(cleanedText);
      if (second.priceRub) fixed.priceRub = second.priceRub;
    }
  }
  // end: цена

  // start: длительность
  if (!fixed.durationMin) {
    const dur = extractDuration(cleanedText);
    if (dur.durationMin) fixed.durationMin = dur.durationMin;
  }
  if (!fixed.durationMin && isDurationProcedurePhrase(cleanedText)) {
    const dur = extractDuration(cleanedText);
    if (dur.durationMin) fixed.durationMin = dur.durationMin;
  }
  // end: длительность

  // start: услуга из текста, если пусто
  if (!isPlausibleService(fixed.serviceName)) {
    const services = resolveServicesFromText(cleanedText);
    if (services.length > 0) {
      const normalized = normalizeServiceNames(services);
      fixed.serviceNames = normalized.services;
      fixed.serviceName = normalized.serviceName;
      if (normalized.durationMin && !fixed.durationMin) {
        fixed.durationMin = normalized.durationMin;
      }
    }
  }
  // end: услуга

  // start: дата, время, телефон — если пусто
  if (!fixed.date) {
    const dateR = extractAppointmentDate(cleanedText);
    if (dateR.date) fixed.date = dateR.date;
  }
  if (!fixed.time) {
    const timeR = extractTime(cleanedText);
    if (timeR.time) fixed.time = timeR.time;
  }
  if (!fixed.phone) {
    const phoneR = extractPhone(cleanedText);
    if (phoneR.phone) fixed.phone = phoneR.phone;
  }
  // end: прочие поля

  // start: заметки — явные триггеры; glue длительности убираем, «она» оставляем
  const notesCandidate = extractNotesIfMissing(fixed, cleanedText);
  if (notesCandidate) {
    fixed.notes = notesCandidate;
  }
  fixed.notes = stripDurationGlueFromNotes(fixed.notes);

  // start: нормализация услуги после второго прохода
  if (fixed.serviceName) {
    const normalized = normalizeServiceNames(
      fixed.serviceNames.length > 0 ? fixed.serviceNames : [fixed.serviceName],
    );
    fixed.serviceNames = normalized.services;
    fixed.serviceName = normalized.serviceName;
    if (normalized.durationMin && !fixed.durationMin) {
      fixed.durationMin = normalized.durationMin;
    }
    const noteOverflow = filterOverflowForNotes(normalized.overflow);
    if (noteOverflow.length > 0) {
      const extra = noteOverflow.join(' ').trim();
      fixed.notes = fixed.notes ? `${fixed.notes}. ${extra}` : extra;
      fixed.notes = stripDurationGlueFromNotes(fixed.notes);
    }
  }

  fixed.clientName = stripForClientOrService(fixed.clientName);

  void buildAssignedSet(fixed);

  return fixed;
}
// end: второй проход
// end: второй проход по исходному тексту
