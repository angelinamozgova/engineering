// start: разбор команды — предобработка STT, якоря полей, свободный разбор, сверка
import { APPOINTMENT_TRIGGERS, NOTE_TRIGGERS } from './dictionary';
import { parseExpenseFields, shouldParseAsExpense } from './expenseExtractors';
import { parseFromFieldAnchors } from './parseSegmented';
import { preprocessTranscript } from './preprocessTranscript';
import { mergeParsedResults, reconcileFields } from './reconcileFields';
import { secondPassFix } from './secondPass';
import { validateAndFixFields } from './validateFields';
import {
  buildNotes,
  extractAppointmentDate,
  extractBirthDate,
  extractClientName,
  extractDuration,
  extractExplicitNotes,
  extractPhone,
  extractPrice,
  extractServices,
  extractTime,
  splitNoteTail,
} from './voiceExtractors';

export type IntentType =
  | 'create_appointment'
  | 'add_note'
  | 'add_expense'
  | 'add_tag'
  | 'unknown';

export interface ParsedIntent {
  intent: IntentType;
  clientName?: string;
  serviceName?: string;
  serviceNames: string[];
  phone?: string;
  clientBirthDate?: string;
  note?: string;
  notes?: string;
  tag?: string;
  date?: string;
  time?: string;
  durationMin?: number;
  priceRub?: number;
  expenseAmountRub?: number;
  expenseDescription?: string;
  clientTagIds?: string[];
  rawText: string;
}

// start: определить intent по заполненным полям
function detectIntent(fields: Partial<ParsedIntent>): IntentType {
  const hasAppointment =
    Boolean(fields.clientName) ||
    (fields.serviceNames?.length ?? 0) > 0 ||
    Boolean(fields.date) ||
    Boolean(fields.time) ||
    Boolean(fields.phone) ||
    Boolean(fields.priceRub) ||
    Boolean(fields.clientBirthDate) ||
    Boolean(fields.notes);

  if (hasAppointment) return 'create_appointment';
  return 'unknown';
}
// end: intent

// start: свободный разбор — без якорей полей, порядок слов не важен
function parseFreeForm(working: string, rawText: string): ParsedIntent {
  const result: ParsedIntent = {
    intent: 'unknown',
    serviceNames: [],
    rawText,
  };

  // start: только заметка без записи
  const onlyNote =
    NOTE_TRIGGERS.some((t) => working.includes(t)) &&
    !APPOINTMENT_TRIGGERS.some((t) => working.includes(t));
  if (onlyNote && !/\d{1,2}[:\s]\d{2}/.test(working)) {
    const { notes } = extractExplicitNotes(working);
    result.intent = 'add_note';
    result.notes = notes.join('. ') || rawText;
    const nameParts = extractClientName(working);
    result.clientName = nameParts.name;
    if (nameParts.overflow.length > 0) {
      result.notes = [result.notes, nameParts.overflow.join(' ')].filter(Boolean).join('. ');
    }
    return result;
  }
  // end: только заметка

  // start: расход в финансы — до extractPrice, приоритет у записи клиента
  if (shouldParseAsExpense(working)) {
    const expense = parseExpenseFields(working);
    result.intent = 'add_expense';
    result.expenseAmountRub = expense.amountRub;
    result.expenseDescription = expense.description;
    return result;
  }
  // end: расход

  let text = working;

  const phoneR = extractPhone(text);
  text = phoneR.text;
  if (phoneR.phone) result.phone = phoneR.phone;

  const priceR = extractPrice(text);
  text = priceR.text;
  if (priceR.priceRub) result.priceRub = priceR.priceRub;

  const birthR = extractBirthDate(text);
  text = birthR.text;
  if (birthR.birthDate) result.clientBirthDate = birthR.birthDate;

  const dateR = extractAppointmentDate(text);
  text = dateR.text;
  if (dateR.date) result.date = dateR.date;

  const timeR = extractTime(text);
  text = timeR.text;
  if (timeR.time) result.time = timeR.time;

  const durR = extractDuration(text);
  text = durR.text;
  if (durR.durationMin) result.durationMin = durR.durationMin;

  const svcR = extractServices(text);
  text = svcR.text;
  result.serviceNames = svcR.services;
  if (svcR.services.length > 0) result.serviceName = svcR.services.join(', ');

  const noteR = extractExplicitNotes(text);
  text = noteR.text;

  const { head: nameBlock, tail: noteTail } = splitNoteTail(text);
  const nameParts = extractClientName(nameBlock);
  result.clientName = nameParts.name;
  const tailNotes = noteTail ? [noteTail] : [];
  result.notes = buildNotes([...noteR.notes, ...tailNotes], nameParts.overflow, result);

  result.intent = detectIntent(result);
  return result;
}
// end: свободный разбор

// start: главная функция — сырой STT → структура полей
export function parseVoiceText(text: string): ParsedIntent {
  const rawText = text;
  const cleaned = preprocessTranscript(text);

  const freeResult = parseFreeForm(cleaned, rawText);
  const { hasAnchors, result: anchoredResult } = parseFromFieldAnchors(cleaned);

  const merged = hasAnchors
    ? mergeParsedResults(anchoredResult, freeResult)
    : freeResult;

  if (freeResult.intent === 'add_note' && !hasAnchors) {
    merged.intent = 'add_note';
    return merged;
  }

  if (freeResult.intent === 'add_expense' && !hasAnchors) {
    return freeResult;
  }

  merged.intent = detectIntent(merged);

  const validated = validateAndFixFields(merged, cleaned, freeResult);
  const secondPass = secondPassFix(validated, cleaned);
  return reconcileFields(secondPass);
}
// end: главная функция
// end: разбор команды
