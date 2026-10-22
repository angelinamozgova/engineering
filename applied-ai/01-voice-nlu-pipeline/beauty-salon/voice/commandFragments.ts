// start: обломки команд STT — микрофон включается позже, «запиши» → «пиши» / «напиши»
import { APPOINTMENT_TRIGGERS, GLUED_COMMAND_SUFFIXES } from './dictionary';

// start: все слова-команды — запись, добавление, напоминание
const VOICE_COMMAND_WORDS = [...new Set([...APPOINTMENT_TRIGGERS, ...GLUED_COMMAND_SUFFIXES])].filter(
  (word) => !word.includes(' '),
);
// end: слова-команды

// start: ручной список обломков — дополняет suffix-match по командам
const MANUAL_COMMAND_FRAGMENTS = [
  'пиши',
  'апиши',
  'иши',
  'напиш',
  'апиш',
  'запис',
  'пис',
  'добав',
  'бавь',
  'ставь',
  'апомни',
  'помни',
];
// end: ручной список

// start: первое слово — обломок команды записи?
export function isCommandFragment(token: string): boolean {
  const lower = token.toLowerCase().replace(/[^a-zа-яё]/gi, '');
  if (lower.length < 3) return false;

  if (VOICE_COMMAND_WORDS.some((trigger) => trigger.toLowerCase() === lower)) {
    return true;
  }

  if (MANUAL_COMMAND_FRAGMENTS.some((frag) => lower === frag || lower.startsWith(frag))) {
    return true;
  }

  for (const trigger of VOICE_COMMAND_WORDS) {
    const full = trigger.toLowerCase();
    if (
      full.length >= 4 &&
      lower.length >= 3 &&
      lower.length < full.length &&
      full.endsWith(lower)
    ) {
      return true;
    }
  }

  return false;
}
// end: проверка обломка

// start: убрать обломок команды только в начале фразы
export function stripLeadingCommandFragment(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return trimmed;

  const firstWordMatch = trimmed.match(/^(\S+)(\s+|$)/);
  if (!firstWordMatch) return trimmed;

  const firstWord = firstWordMatch[1];
  if (!isCommandFragment(firstWord)) return trimmed;

  return trimmed.slice(firstWord.length).replace(/^\s+/, '').trim();
}
// end: обрезка начала
// end: обломки команд STT
