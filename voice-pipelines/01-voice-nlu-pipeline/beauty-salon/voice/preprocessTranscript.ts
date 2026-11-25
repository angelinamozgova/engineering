// start: предобработка расшифровки STT — разлепить слова, убрать мусор, числа словами
import {
  FILLER_WORDS,
  GLUED_COMMAND_SUFFIXES,
  WORD_NUMBERS,
} from './dictionary';
import { stripLeadingCommandFragment } from './commandFragments';
import {
  insertMissingNaBeforeService,
  splitGluedDictionaryWords,
  splitGluedPrepositionsFromNameForms,
} from './gluedWordSplitters';
import { NAME_FORMS } from './normalizeName';

// start: типичные ошибки STT в названиях услуг
function fixServiceSttTypos(text: string): string {
  return text
    .replace(/лабиминирован/g, 'ламинирован')
    .replace(/лабминирован/g, 'ламинирован')
    .replace(/полчасаи/g, 'полчаса')
    .replace(/пол\s*часаи/g, 'полчаса')
    .replace(/лазерн(?:ая|ую|ой|ом)?\s*эпил(?:яция|яции|яцию)?/g, 'лазерная эпиляция')
    .replace(/диодн(?:ая|ую|ой|ым)?\s*эпил(?:яция|яции|яцию)?/g, 'диодная эпиляция')
    .replace(/лазер\s+эпил(?:яция|яции|яцию)?/g, 'лазерная эпиляция')
    .replace(/диод\s+эпил(?:яция|яции|яцию)?/g, 'диодная эпиляция')
    .replace(/фото\s*сесс(?:ия|ии|ию)?/g, 'фотосессия')
    .replace(/с[ьъ]емк/g, 'съемк')
    .replace(/урок\s+англ(?!ийского)/g, 'урок английского')
    .replace(/урок\s+франц(?!узского)/g, 'урок французского')
    .replace(/урок\s+немец(?!кого)/g, 'урок немецкого')
    .replace(/урок\s+испан(?!ского)/g, 'урок испанского')
    .replace(/урок\s+танц(?!ев)/g, 'урок танцев')
    .replace(/урок\s+вокал(?!а)/g, 'урок вокала');
}
// end: опечатки услуг

// start: «урок/занятие по …» — STT часто говорит «по английскому языку» (4 слова)
const LESSON_PO_NORMALIZERS: { re: RegExp; canonical: string }[] = [
  { re: /(?:урок|урока|занятие|занятия)\s+по\s+англ\w*(?:\s+язык\w*)?/gi, canonical: 'урок английского' },
  { re: /(?:урок|урока|занятие|занятия)\s+по\s+франц\w*(?:\s+язык\w*)?/gi, canonical: 'урок французского' },
  { re: /(?:урок|урока|занятие|занятия)\s+по\s+немец\w*(?:\s+язык\w*)?/gi, canonical: 'урок немецкого' },
  { re: /(?:урок|урока|занятие|занятия)\s+по\s+испан\w*(?:\s+язык\w*)?/gi, canonical: 'урок испанского' },
  { re: /(?:урок|урока|занятие|занятия)\s+по\s+итальян\w*(?:\s+язык\w*)?/gi, canonical: 'урок итальянского' },
  { re: /(?:урок|урока|занятие|занятия)\s+по\s+китай\w*(?:\s+язык\w*)?/gi, canonical: 'урок китайского' },
  { re: /(?:урок|урока|занятие|занятия)\s+по\s+япон\w*(?:\s+язык\w*)?/gi, canonical: 'урок японского' },
  { re: /(?:урок|урока|занятие|занятия)\s+по\s+корей\w*(?:\s+язык\w*)?/gi, canonical: 'урок корейского' },
  { re: /(?:урок|урока|занятие|занятия)\s+по\s+математ\w*/gi, canonical: 'урок математики' },
  { re: /(?:урок|урока|занятие|занятия)\s+по\s+физик\w*/gi, canonical: 'урок физики' },
  { re: /(?:урок|урока|занятие|занятия)\s+по\s+хими\w*/gi, canonical: 'урок химии' },
  { re: /(?:урок|урока|занятие|занятия)\s+по\s+биолог\w*/gi, canonical: 'урок биологии' },
  { re: /(?:урок|урока|занятие|занятия)\s+по\s+(?:информат|программ)\w*/gi, canonical: 'урок программирования' },
  { re: /(?:урок|урока|занятие|занятия)\s+по\s+танц\w*/gi, canonical: 'урок танцев' },
  { re: /(?:урок|урока|занятие|занятия)\s+по\s+вокал\w*/gi, canonical: 'урок вокала' },
  { re: /(?:урок|урока|занятие|занятия)\s+по\s+музык\w*/gi, canonical: 'урок музыки' },
  { re: /(?:урок|урока|занятие|занятия)\s+по\s+(?:рисован|живопис)\w*/gi, canonical: 'урок рисования' },
  { re: /(?:урок|урока|занятие|занятия)\s+по\s+логопед\w*/gi, canonical: 'урок логопедии' },
];

function normalizeLessonPhrases(text: string): string {
  let working = text;
  for (const { re, canonical } of LESSON_PO_NORMALIZERS) {
    working = working.replace(re, canonical);
  }
  working = working.replace(/англ\w*\s+(?:урок|урока|занятие|занятия)/gi, 'урок английского');
  working = working.replace(/(?:урок|занятие)\s+англ(?!ийского)/gi, 'урок английского');
  return working;
}
// end: урок/занятие по предмету

// start: базовая нормализация текста
export function normalizeSpeechText(text: string): string {
  return text
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/\s+/g, ' ')
    .trim();
}
// end: базовая нормализация

// start: убрать слова-паразиты
function removeFillers(text: string): string {
  let working = ` ${text} `;
  const sorted = [...FILLER_WORDS].sort((a, b) => b.length - a.length);

  for (const filler of sorted) {
    const escaped = filler.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    working = working.replace(new RegExp(`\\s${escaped}\\s`, 'g'), ' ');
  }

  return working.replace(/\s+/g, ' ').trim();
}
// end: убрать паразиты

// start: точка/запятая без пробела («руб.в заметки» → «руб. в заметки»)
function splitPunctuationBoundaries(text: string): string {
  return text.replace(/([,.;:])(?=[a-zа-яё])/gi, '$1 ');
}
// end: пунктуация без пробела

// start: разлепить типичные склейки STT («мамына» → «мамы на»), без разрезания «ламинирование»
function splitGluedPrepositions(text: string): string {
  return text
    .replace(
      /(мамы|маме|маму|даши|дашу|свету|светы|алину|алины|ирину|ирины|машу|катю|олю|люду|инну|яну|марину|работы|работе)(на)(?=[a-zа-яё]|\s|$)/gi,
      '$1 $2 ',
    )
    .replace(
      /(свету|алину|машу|дашу|катю|олю|люду|инну|яну|марину|светы|алины)(от)(?=даш|мам|под|сос|кол|ирин|алин)/gi,
      '$1 $2 ',
    );
}
// end: склеенные предлоги

// start: разделить цифры и буквы («12соболева» → «12 соболева»)
function splitDigitLetterBoundaries(text: string): string {
  return text
    .replace(/(\d)([a-zа-я])/gi, (full, digit, letter) => {
      // start: «3D/2D/4D» для ресниц не разбиваем — иначе словарь не найдёт объём
      if (letter.toLowerCase() === 'd' && /^[234]$/.test(digit)) return full;
      return `${digit} ${letter}`;
    })
    .replace(/([a-zа-я])(\d)/gi, '$1 $2');
}
// end: цифры и буквы

// start: отделить команду, склеенную с именем («настюсделай»)
function splitGluedCommandSuffixes(text: string): string {
  let working = text;
  const sorted = [...GLUED_COMMAND_SUFFIXES].sort((a, b) => b.length - a.length);

  for (const suffix of sorted) {
    const re = new RegExp(`([a-zа-я]{2,})(${suffix})\\b`, 'gi');
    working = working.replace(re, '$1 $2');
  }

  return working;
}
// end: склеенные команды

// start: отделить известное имя в начале длинного токена
function splitKnownNamePrefix(token: string): string[] {
  const lower = token.toLowerCase().replace(/[^a-zа-я0-9-]/gi, '');
  if (lower.length < 5) return [token];

  const nameKeys = Object.keys(NAME_FORMS).sort((a, b) => b.length - a.length);
  for (const key of nameKeys) {
    if (!lower.startsWith(key) || lower.length <= key.length + 2) continue;
    const rest = lower.slice(key.length);
    if (rest.length >= 3) {
      return [key, rest];
    }
  }

  return [token];
}
// end: известное имя

// start: разбить длинные склеенные токены по словарю имён
function splitGluedTokens(text: string): string {
  const tokens = text.split(/\s+/);
  const expanded: string[] = [];

  for (const token of tokens) {
    if (token.length >= 8 && /^[a-zа-я]+$/i.test(token)) {
      expanded.push(...splitKnownNamePrefix(token));
      continue;
    }
    expanded.push(token);
  }

  return expanded.join(' ');
}
// end: склеенные токены

// start: «опаздываетстоимость» — вставить пробел перед известным словом внутри токена
function splitGluedKnownWords(text: string): string {
  const knownWords = [
    'стоимость',
    'процедуры',
    'процедура',
    'аллергия',
    'аллергии',
    'опаздывает',
    'опаздываетстоимость',
    'кошек',
    'кошку',
    'рублей',
    'рубля',
    'руб',
  ].sort((a, b) => b.length - a.length);

  let working = text;
  for (const word of knownWords) {
    const re = new RegExp(`([a-zа-я]{2,})(${word})\\b`, 'gi');
    working = working.replace(re, '$1 $2');
    const re2 = new RegExp(`\\b(${word})([a-zа-я]{2,})`, 'gi');
    working = working.replace(re2, '$1 $2');
  }

  return working;
}
// end: склеенные известные слова

// start: собрать число из слов («две тысячи рублей» → «2000 рублей»)
function parseWordNumberPhrase(tokens: string[], start: number): { value: number; length: number } | null {
  if (start >= tokens.length) return null;

  let total = 0;
  let current = 0;
  let consumed = 0;
  let i = start;

  while (i < tokens.length) {
    const token = tokens[i].replace(/[^a-zа-я]/gi, '');
    if (!token) break;

    if (token === 'полторы' || token === 'полтора') {
      current += 1.5;
      consumed++;
      i++;
      continue;
    }

    const num = WORD_NUMBERS[token];
    if (num === undefined) break;

    if (num === 1000) {
      current = (current === 0 ? 1 : current) * 1000;
    } else if (num >= 100) {
      current += num;
    } else if (num >= 20) {
      current += num;
    } else {
      current += num;
    }

    consumed++;
    i++;
  }

  if (consumed === 0) return null;
  total = current;
  if (total <= 0) return null;

  return { value: Math.round(total), length: consumed };
}
// end: число из слов

// start: заменить числительные словами на цифры в тексте
function convertWordNumbers(text: string): string {
  const tokens = text.split(/\s+/);
  const result: string[] = [];

  for (let i = 0; i < tokens.length; i++) {
    const parsed = parseWordNumberPhrase(tokens, i);
    if (parsed && parsed.value >= 10) {
      result.push(String(parsed.value));
      i += parsed.length - 1;
      continue;
    }
    result.push(tokens[i]);
  }

  return result.join(' ');
}
// end: числительные

// start: исправить типичный мусор STT в цене («ххххххуб» рядом со «стоимость»)
function fixGarbledPriceTokens(text: string): string {
  if (!/(стоимост|цен|доход|руб)/i.test(text)) return text;

  return text.replace(
    /\b(?:х+|x+){2,}\s*(?:руб|рубл|р\.?|₽)?\b/gi,
    ' ',
  );
}
// end: мусор цены

// start: главная функция предобработки — сырой STT → чистый текст для парсера
export function preprocessTranscript(rawText: string): string {
  let working = normalizeSpeechText(rawText);
  working = stripLeadingCommandFragment(working);
  working = fixServiceSttTypos(working);
  working = normalizeLessonPhrases(working);
  working = splitPunctuationBoundaries(working);
  working = splitDigitLetterBoundaries(working);
  working = splitGluedPrepositions(working);
  working = splitGluedPrepositionsFromNameForms(working);
  working = splitGluedKnownWords(working);
  working = splitGluedDictionaryWords(working);
  working = insertMissingNaBeforeService(working);
  working = splitGluedCommandSuffixes(working);
  working = splitGluedTokens(working);
  working = convertWordNumbers(working);
  working = fixGarbledPriceTokens(working);
  working = removeFillers(working);
  return working.replace(/\s+/g, ' ').trim();
}
// end: главная функция предобработки
// end: предобработка расшифровки STT
