// start: мостики между полями — не попадают в client/service; в notes «она/он» допустимы
import {
  FIELD_ANCHORS,
  NOTE_ACTION_TRIGGERS,
  NOTE_SEMANTIC_TRIGGERS,
  NOTE_STRUCTURAL_TRIGGERS,
  SERVICE_KEYWORDS,
} from './dictionary';
import { CYR_TAIL } from './textBoundaries';

// start: связки времени и длительности — нигде кроме durationMin не храним
export const FIELD_GLUE_DURATION = [
  'будет',
  'будут',
  'длится',
  'длиться',
  'длит',
  'длительность',
  'длительности',
  'занимает',
  'займет',
  'займёт',
  'идет',
  'идёт',
  'идти',
  'потребует',
  'продлится',
  'полчаса',
  'полчасаи',
  'минут',
  'минуты',
  'минуту',
  'мин',
  'час',
  'часа',
  'часов',
  'часы',
];

// start: наречия на стыке полей — убираем из client/service, в заметках оставляем
export const FIELD_GLUE_ADVERBS = ['часто', 'иногда', 'обычно', 'редко'];

// start: предлоги в составе имени — «от мамы», «с работы»
export const CLIENT_DESCRIPTOR_PREPOSITIONS = new Set(['от', 'с', 'со', 'из', 'у']);
// end: предлоги имени

// start: мостики полей — не часть имени клиента (на услугу, за цену, на дату)
export const CLIENT_FIELD_GLUE_WORDS = [
  'на',
  'за',
  'в',
  'во',
  'к',
  'ко',
  'по',
  'для',
  'о',
  'об',
  'что',
];
// end: мостики полей

const CLIENT_FIELD_GLUE_SET = new Set(
  CLIENT_FIELD_GLUE_WORDS.map((word) => word.toLowerCase()),
);

// start: однословные ключи услуг — не должны попадать в имя («ногтей», «ресниц»)
const CLIENT_SERVICE_LEAK_SET = new Set(
  Object.keys(SERVICE_KEYWORDS)
    .filter((key) => !key.includes(' '))
    .map((key) => key.toLowerCase()),
);
// end: утечки услуг

// start: местоимения — убираем из client/service, в заметках оставляем
export const FIELD_GLUE_PRONOUNS = [
  'она',
  'он',
  'они',
  'ее',
  'её',
  'его',
  'ему',
  'ей',
  'их',
  'им',
];

// start: якоря заметок — не должны быть в client/service
export const NOTE_ANCHOR_WORDS = [
  ...FIELD_ANCHORS.notes,
  ...NOTE_STRUCTURAL_TRIGGERS.filter((t) => !t.includes(' ')),
];

// start: всё, что вырезаем из client и service
export const STRIP_FROM_CLIENT_SERVICE = [
  ...FIELD_ANCHORS.service,
  ...FIELD_ANCHORS.duration,
  ...FIELD_ANCHORS.price,
  ...FIELD_ANCHORS.client,
  ...FIELD_ANCHORS.date,
  ...FIELD_ANCHORS.time,
  ...FIELD_ANCHORS.phone,
  ...NOTE_ANCHOR_WORDS,
  ...NOTE_SEMANTIC_TRIGGERS.filter((t) => !t.includes(' ')),
  ...FIELD_GLUE_DURATION,
  ...FIELD_GLUE_ADVERBS,
  ...FIELD_GLUE_PRONOUNS,
  ...CLIENT_FIELD_GLUE_WORDS,
];

const STRIP_CLIENT_SERVICE_SET = new Set(
  STRIP_FROM_CLIENT_SERVICE.map((w) => w.toLowerCase()),
);

// start: хвост — только про длительность (в заметки не кладём)
const DURATION_ONLY_OVERFLOW = new RegExp(
  `^(?:(?:${FIELD_GLUE_PRONOUNS.join('|')})\\s+)?(?:будет\\s+)?(?:длит${CYR_TAIL}|займ${CYR_TAIL}|заним${CYR_TAIL}|идет|идёт)\\s*`,
  'i',
);

// start: вырезать токены из client/service
export function stripForClientOrService(text?: string): string | undefined {
  if (!text?.trim()) return undefined;

  const kept = text
    .split(/\s+/)
    .filter((token) => token && !STRIP_CLIENT_SERVICE_SET.has(token.toLowerCase()))
    .join(' ')
    .trim();

  return kept || undefined;
}
// end: client/service

// start: финальная чистка имени — мостики полей и слова услуг из словаря
export function stripClientNameTokens(text?: string): string | undefined {
  if (!text?.trim()) return undefined;

  const kept = text
    .split(/\s+/)
    .filter((token) => {
      const lower = token.toLowerCase().replace(/[^a-zа-яё]/gi, '');
      if (!lower) return false;
      if (CLIENT_FIELD_GLUE_SET.has(lower)) return false;
      if (CLIENT_SERVICE_LEAK_SET.has(lower)) return false;
      return true;
    })
    .join(' ')
    .trim();

  return kept || undefined;
}
// end: финальная чистка имени

// start: убрать мусор длительности из заметок, местоимения сохраняем
export function stripDurationGlueFromNotes(notes?: string): string | undefined {
  if (!notes?.trim()) return undefined;

  let working = notes;
  working = working.replace(
    new RegExp(
      `(?:^|\\s)(?:(?:она|он|они)\\s+)?(?:будет\\s+)?(?:длит${CYR_TAIL}|займ${CYR_TAIL}|заним${CYR_TAIL})\\s+(?:полчаса[a-zа-яё]*|\\d+\\s*(?:мин|минут|минуты|час|часа|часов))`,
      'gi',
    ),
    ' ',
  );

  const glueSet = new Set([...FIELD_GLUE_DURATION, 'будет', 'идти'].map((w) => w.toLowerCase()));
  working = working
    .split(/\s+/)
    .filter((token) => token && !glueSet.has(token.toLowerCase()))
    .join(' ')
    .trim();

  if (working.length < 3) return undefined;
  return working;
}
// end: заметки

// start: overflow — это только хвост длительности?
export function isDurationOnlyOverflow(text: string): boolean {
  const t = text.trim().toLowerCase();
  if (!t) return true;
  if (DURATION_ONLY_OVERFLOW.test(t)) return true;
  if (/^(?:длит|будет|полчас|минут|час)/.test(t)) return true;
  return false;
}
// end: проверка overflow

// start: overflow годится в заметки?
export function filterOverflowForNotes(overflow: string[]): string[] {
  return overflow
    .map((part) => part.trim())
    .filter((part) => part.length > 2 && !isDurationOnlyOverflow(part));
}
// end: overflow в заметки

// start: якоря заметок по основе слова — все падежи «заметк…», «комментар…»
const NOTE_STEM_PATTERNS = [
  /(?:^|[\s,.:;!?-])(?:в\s+)?заметк[a-zа-яё]*/gi,
  /(?:^|[\s,.:;!?-])(?:в\s+)?комментар[a-zа-яё]*/gi,
];

// start: найти начало блока заметок в тексте
export function findNoteAnchorIndex(text: string): number {
  let earliest = -1;

  for (const pattern of NOTE_STEM_PATTERNS) {
    pattern.lastIndex = 0;
    const match = pattern.exec(text);
    if (!match || match.index === undefined) continue;
    const start = match.index + (match[0].length - match[0].trimStart().length);
    if (start > 0 && (earliest === -1 || start < earliest)) {
      earliest = start;
    }
  }

  for (const anchor of [...NOTE_ANCHOR_WORDS].sort((a, b) => b.length - a.length)) {
    const idx = text.toLowerCase().indexOf(anchor.toLowerCase());
    if (idx > 0 && (earliest === -1 || idx < earliest)) {
      earliest = idx;
    }
  }

  return earliest;
}
// end: начало заметок

// start: убрать якоря заметок и обломки STT («х» от «заметках»)
export function stripNoteAnchorStems(text: string): string {
  let working = ` ${text} `;

  for (const pattern of NOTE_STEM_PATTERNS) {
    working = working.replace(pattern, ' ');
  }

  for (const anchor of [...NOTE_ANCHOR_WORDS].sort((a, b) => b.length - a.length)) {
    const escaped = anchor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    working = working.replace(new RegExp(`\\s${escaped}\\s`, 'gi'), ' ');
  }

  working = working.replace(/^\s*[a-zа-яё]\s+(?=[a-zа-яё]{3,})/i, ' ');

  return working.replace(/\s+/g, ' ').trim();
}
// end: якоря заметок

// start: очистить текст заметки от якорей — «она/он» в смысле сохраняем
const NOTE_CONTENT_PREFIX = [...NOTE_ANCHOR_WORDS].sort((a, b) => b.length - a.length);

export function cleanNoteContent(text: string): string {
  let working = stripNoteAnchorStems(text.trim());

  for (const anchor of NOTE_CONTENT_PREFIX) {
    const escaped = anchor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`^${escaped}[\\s,:-]*`, 'i');
    if (re.test(working)) {
      working = working.replace(re, '').trim();
      break;
    }
  }

  working = working.replace(/^(?:что|о том что|о том)\s+/i, '');

  for (const trigger of [...NOTE_ACTION_TRIGGERS].sort((a, b) => b.length - a.length)) {
    const escaped = trigger.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`^${escaped}[\\s,:-]*`, 'i');
    if (re.test(working)) {
      working = working.replace(re, '').trim();
      working = working.replace(/^(?:что|о том что|о том)\s+/i, '');
    }
  }

  return working.trim();
}
// end: очистка текста заметки
// end: мостики между полями
