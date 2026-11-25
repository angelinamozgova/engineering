// start: извлечение полей из текста — общие правила для свободного и якорного разбора
import {
  APPOINTMENT_TRIGGERS,
  BIRTH_MARKERS,
  CLIENT_NAME_TRIGGERS,
  DATE_KEYWORDS,
  MONTH_KEYWORDS,
  NOTE_TRIGGERS,
  PHONE_MARKERS,
  PRICE_MARKERS,
  SERVICE_CONJUNCTIONS,
  SERVICE_KEYWORDS,
  STOP_WORDS,
  TAG_KEYWORDS,
  TIME_DAY_PARTS,
  WEEKDAY_KEYWORDS,
} from './dictionary';
import { normalizeClientNamePhrase } from './normalizeName';
import { resolveServicesFromText } from './serviceResolution';
import {
  cleanNoteContent,
  CLIENT_DESCRIPTOR_PREPOSITIONS,
  CLIENT_FIELD_GLUE_WORDS,
  findNoteAnchorIndex,
  NOTE_ANCHOR_WORDS,
  STRIP_FROM_CLIENT_SERVICE,
  stripClientNameTokens,
} from './fieldGlueWords';
import { hasServiceAntiTriggerNearby, isPlausibleServiceFragment } from './serviceRules';
import { CYR_TAIL, stripPricePhrases, stripWordsCyrillic } from './textBoundaries';

export const MASK = '\u0001';

const SERVICE_ENTRIES = Object.entries(SERVICE_KEYWORDS).sort(
  (a, b) => b[0].length - a[0].length,
);

// start: замена фрагмента маской
export function maskRange(text: string, start: number, len: number): string {
  return text.slice(0, start) + MASK.repeat(len) + text.slice(start + len);
}
// end: маска

// start: извлечь телефон
export function extractPhone(text: string): { phone?: string; text: string } {
  const markerRe = new RegExp(
    `(?:${PHONE_MARKERS.join('|')})\\s*[:\\-]?\\s*([+7\\d\\s\\-()]{10,18})`,
    'i',
  );
  const marked = text.match(markerRe);
  if (marked?.index !== undefined) {
    const digits = marked[1].replace(/\D/g, '');
    if (digits.length >= 10) {
      return {
        phone: digits.length >= 11 ? digits : `8${digits.slice(-10)}`,
        text: maskRange(text, marked.index, marked[0].length),
      };
    }
  }

  const plain = text.match(/(?:\+7|8)?[\s-]?(\d{3})[\s-]?(\d{3})[\s-]?(\d{2})[\s-]?(\d{2})/);
  if (plain?.index !== undefined) {
    const digits = plain[0].replace(/\D/g, '');
    if (digits.length >= 10) {
      return {
        phone: digits.length === 11 ? digits : `8${digits.slice(-10)}`,
        text: maskRange(text, plain.index, plain[0].length),
      };
    }
  }

  const compact = text.match(/\b(\d{10,11})\b/);
  if (compact?.index !== undefined) {
    const digits = compact[1];
    return {
      phone: digits.length === 11 ? digits : `8${digits.slice(-10)}`,
      text: maskRange(text, compact.index, compact[0].length),
    };
  }

  return { text };
}
// end: телефон

// start: извлечь цену / доход
export function extractPrice(text: string): { priceRub?: number; text: string } {
  const priceTail =
    '(?:\\s+(?:процедуры|процедура|процедуру|услуги|услуга|услугу|работы|работа|работу))?';
  const patterns = [
    new RegExp(
      `(?:доход|за|по|стоимость|цена|ценник|прайс|итого|выходит|стоит|сумма|оплата)${priceTail}\\s*(\\d[\\d\\s]{2,6})\\s*(?:р\\.?|руб\\.?|рубл(?:ей|я|ь)?|₽|к\\b|ка\\b)?`,
      'gi',
    ),
    /(\d{3,6})\s*(?:р\.?|руб\.?|рубл(?:ей|я|ь)?|₽|к\b|ка\b)/gi,
  ];

  let priceRub: number | undefined;
  let working = text;

  for (const re of patterns) {
    re.lastIndex = 0;
    const m = re.exec(text);
    if (m?.index !== undefined) {
      const num = parseInt(m[1].replace(/\s/g, ''), 10);
      if (!Number.isNaN(num) && num > 0) {
        priceRub = num;
        working = maskRange(working, m.index, m[0].length);
        break;
      }
    }
  }

  return { priceRub, text: working };
}
// end: цена

// start: второй проход цены — если первый не нашёл
export function extractPriceSecondPass(text: string): { priceRub?: number; text: string } {
  let working = text;
  let priceRub: number | undefined;

  const poltora = working.match(/(?:^|\s)полтор[аы]\s+тысяч(?:и|у)?(?:\s|$|[,.])/i);
  if (poltora?.index !== undefined) {
    priceRub = 1500;
    working = maskRange(working, poltora.index, poltora[0].trim().length);
    return { priceRub, text: working };
  }

  const zaBare = working.match(/(?:^|\s)за\s+(\d{3,6})(?:\s|$|[,.])/i);
  if (zaBare?.index !== undefined) {
    const num = parseInt(zaBare[1], 10);
    if (num >= 100 && num <= 999999) {
      priceRub = num;
      const start = zaBare.index + (zaBare[0].length - zaBare[0].trimStart().length);
      working = maskRange(working, start, zaBare[0].trim().length);
      return { priceRub, text: working };
    }
  }

  const bareRub = working.match(/(?:^|\s)(\d{3,6})(?:\s*(?:р\.?|руб\.?|₽))(?:\s|$|[,.])/i);
  if (bareRub?.index !== undefined) {
    const num = parseInt(bareRub[1], 10);
    if (num >= 100) {
      priceRub = num;
      const start = bareRub.index + (bareRub[0].length - bareRub[0].trimStart().length);
      working = maskRange(working, start, bareRub[0].trim().length);
      return { priceRub, text: working };
    }
  }

  const bareBeforeGlue = working.match(
    /(?:^|\s)(\d{3,6})(?=\s+(?:она|он|они|будет|длит|полчас|минут|час|руб|р\.|₽|$|[,.]))/i,
  );
  if (bareBeforeGlue?.index !== undefined) {
    const num = parseInt(bareBeforeGlue[1], 10);
    if (num >= 400 && num <= 999999) {
      priceRub = num;
      const start = bareBeforeGlue.index + (bareBeforeGlue[0].length - bareBeforeGlue[0].trimStart().length);
      working = maskRange(working, start, bareBeforeGlue[0].trim().length);
      return { priceRub, text: working };
    }
  }

  const bareEnd = working.match(/(?:^|\s)(\d{3,6})(?:\s*$|[,.])/);
  if (bareEnd?.index !== undefined) {
    const num = parseInt(bareEnd[1], 10);
    if (num >= 400 && num <= 999999) {
      priceRub = num;
      const start = bareEnd.index + (bareEnd[0].length - bareEnd[0].trimStart().length);
      working = maskRange(working, start, bareEnd[0].trim().length);
    }
  }

  return { priceRub, text: working };
}
// end: второй проход цены

// start: дата вида «20-е 10-е»
function parseOrdinalDayMonth(text: string): { iso?: string; start: number; len: number } {
  const patterns = [
    /(?:^|\s|на\s*)(\d{1,2})\s*[-]?\s*(?:е|го|ое)\s+(\d{1,2})\s*[-]?\s*(?:е|го|ое)(?=\s|$|[,.])/i,
    /(?:^|\s|на\s*)(\d{1,2})е\s+(\d{1,2})е(?=\s|$|[,.])/i,
  ];

  for (const re of patterns) {
    const m = re.exec(text);
    if (!m || m.index === undefined) continue;
    const day = Number(m[1]);
    const month = Number(m[2]);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      const year = new Date().getFullYear();
      return {
        iso: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        start: m.index,
        len: m[0].length,
      };
    }
  }

  return { start: -1, len: 0 };
}
// end: ordinal day month

// start: распознать дату DD.MM[.YYYY] или DD месяц
export function parseDateToken(fragment: string): string | undefined {
  const trimmed = fragment.trim();
  const numeric = trimmed.match(/(\d{1,2})[.\-/](\d{1,2})(?:[.\-/](\d{2,4}))?/);
  if (numeric) {
    const day = Number(numeric[1]);
    const month = Number(numeric[2]);
    let year = numeric[3] ? Number(numeric[3]) : new Date().getFullYear();
    if (year < 100) year += 2000;
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }

  const words = trimmed.match(/(\d{1,2})\s+([a-zа-я]+)(?:\s+(\d{2,4}))?/i);
  if (words) {
    const day = Number(words[1]);
    const monthKey = words[2].toLowerCase();
    const month = MONTH_KEYWORDS[monthKey];
    if (month) {
      let year = words[3] ? Number(words[3]) : new Date().getFullYear();
      if (year < 100) year += 2000;
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }

  return undefined;
}
// end: дата-токен

// start: извлечь дату рождения
export function extractBirthDate(text: string): { birthDate?: string; text: string } {
  for (const marker of BIRTH_MARKERS) {
    const idx = text.indexOf(marker);
    if (idx === -1) continue;
    const tail = text.slice(idx + marker.length, idx + marker.length + 30);
    const iso = parseDateToken(tail);
    if (iso) {
      const end = idx + marker.length + tail.length;
      return {
        birthDate: iso,
        text: maskRange(text, idx, Math.min(end - idx, marker.length + 20)),
      };
    }
  }
  return { text };
}
// end: ДР

// start: извлечь дату записи
export function extractAppointmentDate(text: string): { date?: string; text: string } {
  for (const [keyword, offset] of Object.entries(DATE_KEYWORDS)) {
    const idx = text.indexOf(keyword);
    if (idx !== -1) {
      const d = new Date();
      d.setDate(d.getDate() + offset);
      return {
        date: d.toISOString().slice(0, 10),
        text: maskRange(text, idx, keyword.length),
      };
    }
  }

  for (const keyword of Object.keys(WEEKDAY_KEYWORDS)) {
    const idx = text.indexOf(keyword);
    if (idx !== -1) {
      return { date: keyword, text: maskRange(text, idx, keyword.length) };
    }
  }

  const ordinal = parseOrdinalDayMonth(text);
  if (ordinal.iso && ordinal.start >= 0) {
    return {
      date: ordinal.iso,
      text: maskRange(text, ordinal.start, ordinal.len),
    };
  }

  const numeric = text.match(/(\d{1,2})[.\-/](\d{1,2})(?:[.\-/](\d{2,4}))?/);
  if (numeric?.index !== undefined) {
    const iso = parseDateToken(numeric[0]);
    if (iso) {
      return { date: iso, text: maskRange(text, numeric.index, numeric[0].length) };
    }
  }

  const monthMatch = text.match(
    /(\d{1,2})\s+(января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)/,
  );
  if (monthMatch?.index !== undefined) {
    const iso = parseDateToken(monthMatch[0]);
    if (iso) {
      return { date: iso, text: maskRange(text, monthMatch.index, monthMatch[0].length) };
    }
  }

  return { text };
}
// end: дата записи

// start: граница слова для кириллицы — \b в JS не работает с русскими буквами
const CYR_BOUNDARY = '(?:^|\\s|[,.:;!?-])';
const CYR_END = '(?=\\s|$|[,.:;!?-])';
// end: граница кириллицы

// start: извлечь время — allowBareHour для секции «время 12»
export function extractTime(
  text: string,
  options?: { allowBareHour?: boolean },
): { time?: string; text: string } {
  const colon = text.match(new RegExp(`${CYR_BOUNDARY}(\\d{1,2})[:.](\\d{2})${CYR_END}`));
  if (colon?.index !== undefined) {
    const h = colon[1].padStart(2, '0');
    const m = colon[2];
    const start = colon.index + (colon[0].length - colon[0].trimStart().length);
    return { time: `${h}:${m}`, text: maskRange(text, start, colon[0].trim().length) };
  }

  const withPart = text.match(
    /(?:^|\s)(\d{1,2})\s+(утра|утром|вечера|вечером|обеда|обед)(?=\s|$)|(?:^|\s)(\d{1,2})\s+(?:час|часа|часов)\s+(?:дня|днем|днём)(?=\s|$)/,
  );
  if (withPart?.index !== undefined) {
    let hour = parseInt(withPart[1] ?? withPart[3], 10);
    const partWord = withPart[2] ?? withPart[4] ?? 'дня';
    const part = TIME_DAY_PARTS[partWord];
    if (part === 'pm' && hour < 12) hour += 12;
    if (part === 'eve' && hour < 12) hour += 12;
    if (part === 'am' && hour === 12) hour = 0;
    const start = withPart.index + (withPart[0].length - withPart[0].trimStart().length);
    return {
      time: `${String(hour).padStart(2, '0')}:00`,
      text: maskRange(text, start, withPart[0].trim().length),
    };
  }

  const hoursOnly = text.match(/(?:^|\s)(?:в|к)\s+(\d{1,2})(?:\s+(?:час|часа|часов))?(?=\s|$|[,.])/);
  if (hoursOnly?.index !== undefined) {
    const hour = parseInt(hoursOnly[1], 10);
    if (hour >= 1 && hour <= 23) {
      const start = hoursOnly.index + (hoursOnly[0].length - hoursOnly[0].trimStart().length);
      return {
        time: `${String(hour).padStart(2, '0')}:00`,
        text: maskRange(text, start, hoursOnly[0].trim().length),
      };
    }
  }

  if (options?.allowBareHour) {
    const bare = text.match(/(?:^|\s)(\d{1,2})(?=\s|$|[,.])/);
    if (bare?.index !== undefined) {
      const hour = parseInt(bare[1], 10);
      if (hour >= 0 && hour <= 23) {
        const start = bare.index + (bare[0].length - bare[0].trimStart().length);
        return {
          time: `${String(hour).padStart(2, '0')}:00`,
          text: maskRange(text, start, bare[0].trim().length),
        };
      }
    }
  }

  return { text };
}
// end: время

// start: длительность в формате HH:MM — «длительность 03:00» или секция «03:00»
function parseClockDuration(
  text: string,
): { durationMin: number; start: number; len: number } | undefined {
  const trimmed = text.trim();
  const bare = trimmed.match(/^(\d{1,2})[:.](\d{2})$/);
  if (bare) {
    const hours = parseInt(bare[1], 10);
    const mins = parseInt(bare[2], 10);
    if (hours <= 8 && mins < 60) {
      return { durationMin: hours * 60 + mins, start: 0, len: bare[0].length };
    }
  }

  const withAnchor = text.match(
    /(?:^|\s)длительност(?:ь|и)\s+(\d{1,2})[:.](\d{2})(?=\s|$|[,.])/i,
  );
  if (withAnchor?.index !== undefined) {
    const hours = parseInt(withAnchor[1], 10);
    const mins = parseInt(withAnchor[2], 10);
    if (hours <= 8 && mins < 60) {
      const start = withAnchor.index + (withAnchor[0].length - withAnchor[0].trimStart().length);
      return { durationMin: hours * 60 + mins, start, len: withAnchor[0].trim().length };
    }
  }

  return undefined;
}
// end: HH:MM длительность

// start: извлечь длительность — «длится 30 минут», «03:00», кириллица без \b
export function extractDuration(text: string): { durationMin?: number; text: string } {
  const clock = parseClockDuration(text);
  if (clock) {
    return {
      durationMin: clock.durationMin,
      text: maskRange(text, clock.start, clock.len),
    };
  }

  const procedureMin = text.match(
    new RegExp(
      `(?:^|\\s)процедур${CYR_TAIL}\\s+(?:длит${CYR_TAIL}|будет\\s+идти|займ${CYR_TAIL}|заним${CYR_TAIL})\\s+(\\d{1,3})\\s*(?:мин|минут|минуты)(?=\\s|$|[,.])`,
      'i',
    ),
  );
  if (procedureMin?.index !== undefined) {
    const start = procedureMin.index + (procedureMin[0].length - procedureMin[0].trimStart().length);
    return {
      durationMin: parseInt(procedureMin[1], 10),
      text: maskRange(text, start, procedureMin[0].trim().length),
    };
  }

  const lastsMin = text.match(
    /(?:^|\s)(?:длится|длительность|занимает|идет|идёт)\s+(\d{1,3})\s*(?:мин|минут|минуты)(?=\s|$|[,.])/i,
  );
  if (lastsMin?.index !== undefined) {
    const start = lastsMin.index + (lastsMin[0].length - lastsMin[0].trimStart().length);
    return {
      durationMin: parseInt(lastsMin[1], 10),
      text: maskRange(text, start, lastsMin[0].trim().length),
    };
  }

  const hours = text.match(/(?:^|\s)(\d{1,3})\s*(?:час|часа|часов)(?=\s|$|[,.])/i);
  if (hours?.index !== undefined) {
    const h = parseInt(hours[1], 10);
    if (h >= 1 && h <= 8) {
      const start = hours.index + (hours[0].length - hours[0].trimStart().length);
      return {
        durationMin: h * 60,
        text: maskRange(text, start, hours[0].trim().length),
      };
    }
  }

  const min = text.match(/(?:^|\s)(\d{1,3})\s*(?:мин|минут|минуты)(?=\s|$|[,.])/i);
  if (min?.index !== undefined) {
    const start = min.index + (min[0].length - min[0].trimStart().length);
    return {
      durationMin: parseInt(min[1], 10),
      text: maskRange(text, start, min[0].trim().length),
    };
  }

  const willLast = text.match(
    new RegExp(
      `(?:^|\\s)(?:(?:она|он|они)\\s+)?(?:будет\\s+)?(?:длит${CYR_TAIL}|займ${CYR_TAIL}|заним${CYR_TAIL})\\s+(полчаса[a-zа-яё]*|пол\\s*часа[a-zа-яё]*|полтора\\s+часа|\\d{1,3}\\s*(?:мин|минут|минуты|час|часа|часов))(?=\\s|$|[,.])`,
      'i',
    ),
  );
  if (willLast?.index !== undefined) {
    const phrase = willLast[0].trim();
    const half = /полчаса|пол\s*часа/i.test(phrase);
    const oneHalfHour = /полтора\s+часа/i.test(phrase);
    const minFromPhrase = phrase.match(/(\d{1,3})\s*(?:мин|минут|минуты)/i);
    const hourFromPhrase = phrase.match(/(\d{1,3})\s*(?:час|часа|часов)/i);
    let durationMin: number | undefined;
    if (half) durationMin = 30;
    else if (oneHalfHour) durationMin = 90;
    else if (minFromPhrase) durationMin = parseInt(minFromPhrase[1], 10);
    else if (hourFromPhrase) durationMin = parseInt(hourFromPhrase[1], 10) * 60;

    if (durationMin) {
      const start = willLast.index + (willLast[0].length - willLast[0].trimStart().length);
      return { durationMin, text: maskRange(text, start, willLast[0].trim().length) };
    }
  }

  return { text };
}
// end: длительность

// start: извлечь услуги — явная фраза мастера, затем словарь; антитриггеры минут/длится
export function extractServices(text: string): { services: string[]; text: string } {
  const resolved = resolveServicesFromText(text);
  if (resolved.length === 0) {
    return { services: [], text };
  }

  let working = text;
  for (const service of resolved) {
    const idx = working.toLowerCase().indexOf(service.toLowerCase());
    if (idx >= 0) {
      working = maskRange(working, idx, service.length);
    }
  }

  for (const [keyword] of SERVICE_ENTRIES) {
    let from = 0;
    while (from < working.length) {
      const idx = working.toLowerCase().indexOf(keyword, from);
      if (idx === -1) break;
      if (!hasServiceAntiTriggerNearby(text, idx, idx + keyword.length)) {
        working = maskRange(working, idx, keyword.length);
      }
      from = idx + keyword.length;
    }
  }

  for (const conj of SERVICE_CONJUNCTIONS) {
    working = working.split(conj).join(' ');
  }

  return { services: resolved, text: working };
}
// end: услуги

// start: проверка — фрагмент годится как название услуги для якорного разбора
export function isValidServiceSegmentText(text: string): boolean {
  return isPlausibleServiceFragment(text);
}
// end: проверка фрагмента

// start: явные заметки по триггеру — только целые якоря, не «заметка» внутри «заметке»
const EXPLICIT_NOTE_TRIGGERS = [
  ...NOTE_ANCHOR_WORDS,
  ...NOTE_TRIGGERS.filter((t) => t.includes(' ')),
].sort((a, b) => b.length - a.length);

export function extractExplicitNotes(text: string): { notes: string[]; text: string } {
  const notes: string[] = [];
  let working = text;
  const lower = working.toLowerCase();

  for (const trigger of EXPLICIT_NOTE_TRIGGERS) {
    const idx = lower.indexOf(trigger.toLowerCase());
    if (idx === -1) continue;
    const tail = cleanNoteContent(
      working.slice(idx + trigger.length).replace(/^[\s:\-,]+/, '').trim(),
    );
    if (tail.length > 2) notes.push(tail);
    working = maskRange(working, idx, trigger.length + Math.min(tail.length, 80));
  }

  return { notes, text: working };
}
// end: заметки

const SERVICE_WORDS = new Set(Object.keys(SERVICE_KEYWORDS));
const CLIENT_FIELD_GLUE = new Set(CLIENT_FIELD_GLUE_WORDS.map((word) => word.toLowerCase()));
const TAG_WORDS = new Set(Object.keys(TAG_KEYWORDS));
const TIME_NOISE = new Set(['дня', 'днем', 'днём', 'утра', 'утром', 'вечера', 'вечером', 'обед', 'обеда']);
const MAX_NAME_CONTENT_WORDS = 3;

export interface ClientNameParts {
  name?: string;
  overflow: string[];
}

// start: слова цены — не должны попадать в имя даже без цифр
const PRICE_NAME_BLOCK = new Set([
  'стоимость',
  'стоимости',
  'стоит',
  'стоило',
  'цена',
  'цены',
  'цене',
  'цену',
  'доход',
  'дохода',
  'сумма',
  'сумму',
  'прайс',
  'оплата',
  'руб',
  'рублей',
  'рубля',
]);
// end: слова цены

// start: обломки «руб.» / «руб.в» — не имя клиента
function isPriceGarbageToken(token: string): boolean {
  const lower = token.toLowerCase().replace(/[^a-zа-яё]/gi, '');
  if (!lower) return true;
  if (/^руб[a-zа-яё]*$/.test(lower)) return true;
  if (/^уб[a-zа-яё]*$/.test(lower)) return true;
  return PRICE_NAME_BLOCK.has(lower);
}
// end: мусор цены в имени

// start: фильтр токенов имени
function filterNameTokens(text: string, extraStripWords: string[] = []): string[] {
  let working = text.replace(new RegExp(MASK, 'g'), ' ');
  working = stripPricePhrases(working);
  working = stripWordsCyrillic(working, [
    ...APPOINTMENT_TRIGGERS,
    ...CLIENT_NAME_TRIGGERS,
    ...STRIP_FROM_CLIENT_SERVICE,
    ...extraStripWords,
    ...PRICE_MARKERS,
    ...PHONE_MARKERS,
    ...BIRTH_MARKERS,
    ...Object.keys(WEEKDAY_KEYWORDS),
    ...Object.keys(DATE_KEYWORDS),
  ]);

  return working
    .split(/\s+/)
    .map((t) => t.trim().replace(/^[,.:;!?-]+|[,.:;!?-]+$/g, ''))
    .filter((t) => {
      if (!t) return false;
      const lower = t.toLowerCase();
      if (CLIENT_FIELD_GLUE.has(lower)) return false;
      if (t.length < 2 && !CLIENT_DESCRIPTOR_PREPOSITIONS.has(lower)) return false;
      if (STOP_WORDS.has(lower) && !CLIENT_DESCRIPTOR_PREPOSITIONS.has(lower)) return false;
      if (/^\d+$/.test(t)) return false;
      if (/^\d{1,2}-?е$/i.test(t)) return false;
      if (SERVICE_WORDS.has(lower)) return false;
      if (TAG_WORDS.has(lower)) return false;
      if (TIME_NOISE.has(lower)) return false;
      if (isPriceGarbageToken(t)) return false;
      return true;
    });
}
// end: фильтр токенов имени

// start: убрать обломки цены из готового имени клиента
export function stripPriceGarbageFromClientName(name?: string): string | undefined {
  if (!name?.trim()) return undefined;
  const kept = name
    .split(/\s+/)
    .filter((token) => token && !isPriceGarbageToken(token))
    .join(' ')
    .trim();
  return kept || undefined;
}
// end: чистка имени от цены

// start: обрезать имя перед «на ламинирование…» / услугой
function truncateBeforeServicePhrase(tokens: string[]): string[] {
  for (let i = 0; i < tokens.length; i++) {
    const lower = tokens[i].toLowerCase();
    if (lower !== 'на' && lower !== 'в') continue;

    const tail = tokens.slice(i + 1).join(' ').trim();
    if (!tail) continue;

    if (resolveServicesFromText(tail).length > 0) {
      return tokens.slice(0, i);
    }
  }

  return tokens;
}
// end: обрезка перед услугой

// start: разделить имя и overflow
function splitNameTokens(tokens: string[]): { nameTokens: string[]; overflowTokens: string[] } {
  const nameTokens: string[] = [];
  const overflowTokens: string[] = [];
  let contentWords = 0;

  for (const token of tokens) {
    const lower = token.toLowerCase();
    const isDescriptorPrep = CLIENT_DESCRIPTOR_PREPOSITIONS.has(lower);

    if (isDescriptorPrep) {
      if (contentWords < MAX_NAME_CONTENT_WORDS) {
        nameTokens.push(token);
      } else {
        overflowTokens.push(token);
      }
      continue;
    }

    if (CLIENT_FIELD_GLUE.has(lower)) {
      continue;
    }

    if (contentWords < MAX_NAME_CONTENT_WORDS) {
      nameTokens.push(token);
      contentWords++;
    } else {
      overflowTokens.push(token);
    }
  }

  return { nameTokens, overflowTokens };
}
// end: разделить имя

// start: отделить хвост заметок/тегов от блока имени
export function splitNoteTail(text: string): { head: string; tail: string } {
  const noteIdx = findNoteAnchorIndex(text);
  if (noteIdx > 0) {
    return { head: text.slice(0, noteIdx).trim(), tail: text.slice(noteIdx).trim() };
  }

  const keywords = [...EXPLICIT_NOTE_TRIGGERS, ...Object.keys(TAG_KEYWORDS)].sort(
    (a, b) => b.length - a.length,
  );

  let earliest = -1;
  for (const kw of keywords) {
    const idx = text.toLowerCase().indexOf(kw.toLowerCase());
    if (idx > 0 && (earliest === -1 || idx < earliest)) {
      earliest = idx;
    }
  }

  if (earliest > 0) {
    return { head: text.slice(0, earliest).trim(), tail: text.slice(earliest).trim() };
  }

  return { head: text, tail: '' };
}
// end: хвост заметок

// start: имя клиента
export function extractClientName(text: string, extraStripWords: string[] = []): ClientNameParts {
  let tokens = filterNameTokens(text, extraStripWords);
  if (tokens.length === 0) return { overflow: [] };

  tokens = truncateBeforeServicePhrase(tokens);
  if (tokens.length === 0) return { overflow: [] };

  const { nameTokens, overflowTokens } = splitNameTokens(tokens);
  const normalized = stripClientNameTokens(normalizeClientNamePhrase(nameTokens.join(' ')));

  return {
    name: normalized || undefined,
    overflow: overflowTokens,
  };
}
// end: имя

// start: заметки без дублей
export function collectAssignedWords(fields: {
  clientName?: string;
  serviceName?: string;
  serviceNames?: string[];
}): Set<string> {
  const words = new Set<string>();

  const addPhrase = (phrase?: string) => {
    if (!phrase) return;
    for (const w of phrase.toLowerCase().split(/[\s,]+/)) {
      if (w.length > 1) words.add(w);
    }
  };

  addPhrase(fields.clientName);
  addPhrase(fields.serviceName);
  for (const svc of fields.serviceNames ?? []) addPhrase(svc);

  return words;
}

export function isNoteDuplicate(note: string, assigned: Set<string>): boolean {
  const noteWords = note.toLowerCase().split(/\s+/).filter((w) => w.length > 1);
  if (noteWords.length === 0) return true;
  const overlap = noteWords.filter((w) => assigned.has(w)).length;
  return overlap / noteWords.length >= 0.5;
}

function sanitizeNoteText(note: string): string {
  return note
    .replace(new RegExp(MASK, 'g'), ' ')
    .replace(/(?:^|\s)(?:ублей|уб\.?|руб\.?)(?:\s|$)/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isGarbageNote(note: string): boolean {
  const t = sanitizeNoteText(note).toLowerCase();
  if (!t) return true;
  if (/^(?:ублей|уб|руб|рублей|рубля|лей|к)$/.test(t)) return true;
  if (/^(?:х+|x+)[уб]*$/.test(t)) return true;
  return false;
}

export function buildNotes(
  explicitNotes: string[],
  overflow: string[],
  fields: { clientName?: string; serviceName?: string; serviceNames?: string[] },
): string | undefined {
  const assigned = collectAssignedWords(fields);
  const parts: string[] = [];

  for (const note of explicitNotes) {
    const trimmed = sanitizeNoteText(note);
    if (trimmed && !isGarbageNote(trimmed) && !isNoteDuplicate(trimmed, assigned)) {
      parts.push(trimmed);
    }
  }

  if (overflow.length > 0) {
    const overflowText = sanitizeNoteText(overflow.join(' '));
    if (
      overflowText &&
      !isGarbageNote(overflowText) &&
      !isNoteDuplicate(overflowText, assigned)
    ) {
      parts.push(overflowText);
    }
  }

  return parts.length > 0 ? parts.join('. ') : undefined;
}
// end: заметки без дублей
// end: извлечение полей из текста
