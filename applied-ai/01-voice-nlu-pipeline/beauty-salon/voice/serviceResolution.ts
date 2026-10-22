// start: поиск услуги — явная фраза мастера, затем словарь по всему тексту
import { SERVICE_KEYWORDS } from './dictionary';
import { splitServiceDurationTail } from './serviceFieldNormalize';
import {
  EXPLICIT_NA_SERVICE_PATTERN,
  EXPLICIT_PROCEDURE_PATTERN,
  hasServiceAntiTriggerNearby,
  isPlausibleServiceFragment,
} from './serviceRules';

const SERVICE_ENTRIES = Object.entries(SERVICE_KEYWORDS).sort(
  (a, b) => b[0].length - a[0].length,
);

// start: языки и предметы — уточнить «урок» / «занятие» по контексту
const LESSON_CONTEXT: { re: RegExp; canonical: string }[] = [
  { re: /англ|english|inglish/, canonical: 'урок английского' },
  { re: /франц|french/, canonical: 'урок французского' },
  { re: /немец|deutsch|german/, canonical: 'урок немецкого' },
  { re: /испан|spanish/, canonical: 'урок испанского' },
  { re: /итальян|italian/, canonical: 'урок итальянского' },
  { re: /китай|chinese/, canonical: 'урок китайского' },
  { re: /япон|japanese/, canonical: 'урок японского' },
  { re: /корей|korean/, canonical: 'урок корейского' },
  { re: /математ|алгебр|геометр/, canonical: 'урок математики' },
  { re: /физик/, canonical: 'урок физики' },
  { re: /хими/, canonical: 'урок химии' },
  { re: /биолог/, canonical: 'урок биологии' },
  { re: /информат|программ|код|python|пайтон/, canonical: 'урок программирования' },
  { re: /танц|хореограф|dance/, canonical: 'урок танцев' },
  { re: /вокал|пен|singing/, canonical: 'урок вокала' },
  { re: /музык|фортеп|гитар|скрипк|пиан/, canonical: 'урок музыки' },
  { re: /рисован|живопис|арт/, canonical: 'урок рисования' },
  { re: /логопед/, canonical: 'урок логопедии' },
];
// end: контекст уроков

// start: уточнить тип эпиляции по словам рядом в фразе
function resolveEpilationCanonical(canonical: string, text: string): string {
  if (!/эпил|депил|шugar|шугар|воск|удален.*волос|лазер|диод|ipl|ипл|фотоэпил|электро/i.test(text)) {
    return canonical;
  }
  if (/лазер|alex|алекс|nd.?yag|неодим/i.test(text)) {
    if (/бикини/i.test(text)) return 'лазерная эпиляция бикини';
    if (/ног/i.test(text)) return 'лазерная эпиляция ног';
    if (/подмыш/i.test(text)) return 'лазерная эпиляция подмышек';
    if (/лиц/i.test(text)) return 'лазерная эпиляция лица';
    return 'лазерная эпиляция';
  }
  if (/диод|diode/i.test(text)) return 'диодная эпиляция';
  if (/фото|ipl|ипл/i.test(text)) return 'фотоэпиляция';
  if (/электро/i.test(text)) return 'электроэпиляция';
  if (/шugar|шугар|сахар/i.test(text)) return 'шугаринг';
  if (/воск/i.test(text)) return 'депиляция воск';
  return canonical;
}
// end: контекст эпиляции

// start: уточнить съёмку — фото или видео
function resolveShootingCanonical(canonical: string, text: string): string {
  if (canonical !== 'фотосессия' && canonical !== 'съёмка') return canonical;
  if (/видео|video|клип|ролик/i.test(text)) return 'видеосъёмка';
  if (/семейн/i.test(text)) return 'семейная фотосессия';
  if (/портрет/i.test(text)) return 'портретная съёмка';
  if (/предмет/i.test(text)) return 'предметная съёмка';
  if (/репортаж/i.test(text)) return 'репортажная съёмка';
  if (/love\s*story|лав[\s-]?стори/i.test(text)) return 'Love Story съёмка';
  if (/студ/i.test(text)) return 'фотосессия в студии';
  if (/природ|улиц|парк/i.test(text)) return 'фотосессия на природе';
  return canonical;
}
// end: контекст съёмки

// start: уточнить ламинирование / эпиляцию / урок / съёмку по контексту
function resolveCanonical(keyword: string, canonical: string, text: string): string {
  if (canonical === 'ламинирование' || keyword.includes('лами')) {
    if (/ресниц|реснич/.test(text)) return 'ламинирование ресниц';
    if (/бров/.test(text)) return 'ламинирование бровей';
    return canonical;
  }

  if (
    canonical === 'эпиляция' ||
    canonical === 'депиляция' ||
    canonical === 'шугаринг' ||
    /эпил|лазер|диод|ipl|ипл|удален.*волос/i.test(canonical)
  ) {
    return resolveEpilationCanonical(canonical, text);
  }

  if (canonical === 'урок' || canonical === 'занятие' || canonical === 'репетиторство') {
    for (const { re, canonical: lesson } of LESSON_CONTEXT) {
      if (re.test(text)) return lesson;
    }
    return canonical;
  }

  if (canonical === 'фотосессия' || /съем|съём|фото/i.test(canonical)) {
    return resolveShootingCanonical(canonical, text);
  }

  return canonical;
}
// end: resolveCanonical

// start: найти услуги в фрагменте по словарю с антитриггерами
function matchServicesInFragment(
  text: string,
  fullContext: string,
  offsetInFull = 0,
): string[] {
  const found: { start: number; end: number; canonical: string }[] = [];
  const lower = text.toLowerCase();

  for (const [keyword, canonical] of SERVICE_ENTRIES) {
    let from = 0;
    while (from < lower.length) {
      const idx = lower.indexOf(keyword, from);
      if (idx === -1) break;

      const absStart = idx + offsetInFull;

      const overlaps = found.some(
        (f) => idx < f.end && idx + keyword.length > f.start,
      );

      if (
        !overlaps &&
        !hasServiceAntiTriggerNearby(fullContext, absStart, absStart + keyword.length)
      ) {
        found.push({
          start: idx,
          end: idx + keyword.length,
          canonical: resolveCanonical(keyword, canonical, fullContext),
        });
      }

      from = idx + keyword.length;
    }
  }

  found.sort((a, b) => a.start - b.start);
  return [...new Set(found.map((f) => f.canonical))];
}
// end: match в фрагменте

// start: «стоимость процедуры» — не явная услуга
function isPriceProcedureContext(text: string, matchIndex: number): boolean {
  const before = text.slice(Math.max(0, matchIndex - 24), matchIndex).toLowerCase();
  return /(?:стоимость|цена|цене|цену|доход|оплат\w*|прайс|сумм\w*)\s*$/.test(before);
}
// end: цена + процедура

// start: разобрать явную фразу услуги — словарь или сырой фрагмент
function collectServiceFromExplicitFragment(
  text: string,
  rawFragment: string,
  matchIndex: number,
  fullMatch: string,
): string[] {
  const { servicePart: fragment } = splitServiceDurationTail(rawFragment);
  if (!fragment) return [];
  if (/^(?:не\s+)?обсужд/i.test(fragment)) return [];

  const fragmentOffset = matchIndex + fullMatch.indexOf(fragment);
  const matched = matchServicesInFragment(fragment, text, fragmentOffset);
  if (matched.length > 0) return matched;

  if (!isPlausibleServiceFragment(fragment)) return [];
  if (fragment.length <= 50) return [fragment];
  return [];
}
// end: явный фрагмент

// start: явные фразы — «на процедуру …» и «на урок / съёмку / лазерную эпиляцию»
function extractExplicitProcedurePhrases(text: string): string[] {
  const services: string[] = [];
  const patterns = [
    EXPLICIT_PROCEDURE_PATTERN,
    EXPLICIT_NA_SERVICE_PATTERN,
  ];

  for (const pattern of patterns) {
    const re = new RegExp(pattern.source, pattern.flags);
    let m: RegExpExecArray | null;

    while ((m = re.exec(text)) !== null) {
      if (pattern === EXPLICIT_PROCEDURE_PATTERN && isPriceProcedureContext(text, m.index)) {
        continue;
      }

      const rawFragment =
        pattern === EXPLICIT_NA_SERVICE_PATTERN
          ? [m[1], m[2]].filter(Boolean).join(' ').trim()
          : m[1]?.trim();
      if (!rawFragment) continue;

      services.push(
        ...collectServiceFromExplicitFragment(text, rawFragment, m.index, m[0]),
      );
    }
  }

  return [...new Set(services)];
}
// end: явные фразы

// start: убрать явные фразы процедуры — чтобы не дублировать при полном скане
function textWithoutExplicitProcedurePhrases(text: string): string {
  return text
    .replace(EXPLICIT_PROCEDURE_PATTERN, ' ')
    .replace(EXPLICIT_NA_SERVICE_PATTERN, ' ');
}
// end: маска явных фраз

// start: дописать 2D/3D/4D к наращиванию ресниц, если мастер назвал объём
function attachLashVolume(services: string[], text: string): string[] {
  const vol = text.match(/(?:^|\s)([234]\s*d)(?=\s|$|[,.])/i)?.[1]?.replace(/\s+/g, '').toUpperCase();
  if (!vol) return services;

  return services.map((s) => {
    if (s === 'наращивание ресниц') return `наращивание ресниц ${vol}`;
    if (s.startsWith('наращивание ресниц') && !/[234]D/.test(s)) {
      return `${s} ${vol}`;
    }
    return s;
  });
}
// end: объём ресниц

// start: убрать дубли — оставляем более длинное название
function dedupePreferLonger(services: string[]): string[] {
  const unique = [...new Set(services)];
  return unique.filter(
    (s) => !unique.some((other) => other !== s && other.includes(s) && other.length > s.length),
  );
}
// end: дедуп

// start: главная функция — приоритет явности, потом словарь по всему тексту
export function resolveServicesFromText(text: string): string[] {
  const { servicePart } = splitServiceDurationTail(text);
  const scanSource = servicePart || text;

  const explicit = extractExplicitProcedurePhrases(scanSource);
  if (explicit.length > 0) {
    return dedupePreferLonger(attachLashVolume(explicit, scanSource));
  }

  const scanned = matchServicesInFragment(
    textWithoutExplicitProcedurePhrases(scanSource),
    scanSource,
  );
  if (scanned.length > 0) {
    return dedupePreferLonger(attachLashVolume(scanned, scanSource));
  }

  return [];
}
// end: главная функция
// end: поиск услуги
