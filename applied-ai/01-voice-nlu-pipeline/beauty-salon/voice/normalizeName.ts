// start: нормализация имени клиента — падежи → именительный, запятые по правилам
import {
  CLIENT_DESCRIPTOR_PREPOSITIONS,
  CLIENT_FIELD_GLUE_WORDS,
} from './fieldGlueWords';

export const PREPOSITIONS = new Set([
  ...CLIENT_DESCRIPTOR_PREPOSITIONS,
  ...CLIENT_FIELD_GLUE_WORDS,
]);

const CLIENT_FIELD_GLUE = new Set(CLIENT_FIELD_GLUE_WORDS.map((word) => word.toLowerCase()));

export const DESCRIPTOR_FORMS: Record<string, string> = {
  подружку: 'подружка',
  подружки: 'подружка',
  соседку: 'соседка',
  соседки: 'соседка',
  коллегу: 'коллега',
  коллеги: 'коллега',
  знакомую: 'знакомая',
  знакомой: 'знакомая',
  клиентку: 'клиентка',
  маму: 'мама',
  мамку: 'мама',
  дочку: 'дочка',
  начальницу: 'начальница',
  начальницы: 'начальница',
  подругу: 'подруга',
  сестру: 'сестра',
  жену: 'жена',
  невестку: 'невестка',
  куму: 'кума',
  крестницу: 'крестница',
  племянницу: 'племянница',
  тетю: 'тётя',
  тёту: 'тётя',
  бабушку: 'бабушка',
};

// start: топ имён — разные падежи → именительный
export const NAME_FORMS: Record<string, string> = {
  // женские
  ирину: 'Ирина', ирины: 'Ирина', ирине: 'Ирина', ириной: 'Ирина',
  марину: 'Марина', марины: 'Марина', марине: 'Марина',
  олю: 'Оля', оли: 'Оля', оле: 'Оля', олей: 'Оля',
  катю: 'Катя', кати: 'Катя', кате: 'Катя', катей: 'Катя',
  машу: 'Маша', маши: 'Маша', маше: 'Маша', машей: 'Маша',
  настю: 'Настя', насти: 'Настя', насте: 'Настя',
  таню: 'Таня', тани: 'Таня', тане: 'Таня',
  юлю: 'Юля', юли: 'Юля', юле: 'Юля',
  свету: 'Света', светы: 'Света', свете: 'Света',
  лену: 'Лена', лены: 'Лена', лене: 'Лена',
  аню: 'Аня', ани: 'Аня', ане: 'Аня',
  дашу: 'Даша', даши: 'Даши', даше: 'Даши',
  веру: 'Вера', веры: 'Вера', vere: 'Вера', вере: 'Вера',
  алину: 'Алина', алины: 'Алина', алине: 'Алина',
  viku: 'Вика', viki: 'Вика', vike: 'Вика', vikoy: 'Вика',
  викторию: 'Виктория', виктории: 'Виктория',
  елену: 'Елена', елены: 'Елена', елене: 'Елена',
  наташу: 'Наташа', наташи: 'Наташа',
  кристину: 'Кристина', кристины: 'Кристина',
  полину: 'Полина', полины: 'Полина',
  валю: 'Валя', вали: 'Валя',
  галю: 'Галя', гали: 'Галя',
  инну: 'Инна', инны: 'Инна',
  люду: 'Люда', люды: 'Люда',
  риту: 'Рита', риты: 'Рита',
  женю: 'Женя', жени: 'Женя',
  // мужские
  ивана: 'Иван', ивану: 'Иван', иваном: 'Иван',
  петра: 'Петр', петру: 'Петр',
  сергея: 'Сергей', сергею: 'Сергей',
  андрея: 'Андрей', андрею: 'Андрей',
  диму: 'Дима', димы: 'Дима', диме: 'Дима',
  сашу: 'Саша', саши: 'Саша', sashe: 'Саша',
  пашу: 'Паша', паши: 'Паша',
  колю: 'Коля', коли: 'Коля',
  ваню: 'Ваня', vани: 'Ваня',
  мишу: 'Миша', миши: 'Миша',
  лешу: 'Лёша', лёшу: 'Лёша',
  илью: 'Илья', ильи: 'Илья',
  максима: 'Максим', максиму: 'Максим',
  артема: 'Артём', артёма: 'Артём',
  романа: 'Роман', роману: 'Роман',
  // фамилии частые
  иванову: 'Иванова', иванова: 'Иванова', ивановой: 'Иванова',
  петрову: 'Петрова', петрова: 'Петрова',
  sidorovu: 'Сидорова', sidorova: 'Сидорова', сидорову: 'Сидорова', сидорова: 'Сидорова',
  смирнову: 'Смирнова', смирнова: 'Смирнова',
  кузнецову: 'Кузнецова', кузнецова: 'Кузнецова',
  попову: 'Попова', попова: 'Попова',
  соболеву: 'Соболева', соболева: 'Соболева', соболевой: 'Соболева',
};

const DESCRIPTOR_NOMINATIVE = new Set(Object.values(DESCRIPTOR_FORMS));

// start: правило окончаний — если нет в словаре
function ruleBasedNominative(word: string): string {
  const lower = word.toLowerCase();
  if (lower.length < 2) return capitalize(word);

  if (lower.endsWith('ую') && lower.length > 3) {
    return capitalize(lower.slice(0, -2) + 'ая');
  }
  if (lower.endsWith('ю') && !lower.endsWith('ую')) {
    return capitalize(lower.slice(0, -1) + 'я');
  }
  if (lower.endsWith('у') && !lower.endsWith('ую')) {
    return capitalize(lower.slice(0, -1) + 'а');
  }
  if (lower.endsWith('ой') || lower.endsWith('ей')) {
    return capitalize(lower.slice(0, -2) + 'а');
  }
  if (lower.endsWith('и') && lower.length > 3) {
    return capitalize(lower.slice(0, -1) + 'а');
  }

  return capitalize(word);
}
// end: правило окончаний

function capitalize(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

function isDescriptor(word: string): boolean {
  const lower = word.toLowerCase();
  return DESCRIPTOR_NOMINATIVE.has(lower) || lower in DESCRIPTOR_FORMS;
}

// start: одно слово → именительный падеж
export function normalizeWord(word: string, afterPreposition: boolean): string {
  const lower = word.toLowerCase().replace(/[^a-zа-яё0-9-]/gi, '');
  if (!lower) return '';

  if (afterPreposition) {
    if (NAME_FORMS[lower]) return NAME_FORMS[lower];
    if (DESCRIPTOR_FORMS[lower]) return DESCRIPTOR_FORMS[lower];
    return lower;
  }
  if (PREPOSITIONS.has(lower)) return lower;
  if (NAME_FORMS[lower]) return NAME_FORMS[lower];
  if (DESCRIPTOR_FORMS[lower]) return DESCRIPTOR_FORMS[lower];

  return ruleBasedNominative(lower);
}
// end: одно слово

// start: фраза имени — слова + запятые перед описателями
export function normalizeClientNamePhrase(raw: string): string {
  const tokens = raw
    .replace(/[,;]+/g, ' ')
    .split(/\s+/)
    .map((t) => t.trim())
    .filter(Boolean);

  if (tokens.length === 0) return '';

  const parts: string[] = [];
  let afterPrep = false;

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const lower = token.toLowerCase();

    if (CLIENT_FIELD_GLUE.has(lower)) {
      continue;
    }

    if (CLIENT_DESCRIPTOR_PREPOSITIONS.has(lower)) {
      afterPrep = true;
      parts.push(lower);
      continue;
    }

    const normalized = normalizeWord(token, afterPrep);
    if (!normalized) continue;

    if (
      parts.length > 0 &&
      isDescriptor(normalized) &&
      !parts[parts.length - 1].endsWith(',') &&
      !CLIENT_DESCRIPTOR_PREPOSITIONS.has(parts[parts.length - 1])
    ) {
      parts[parts.length - 1] = `${parts[parts.length - 1]},`;
    }

    parts.push(normalized);
    afterPrep = false;
  }

  return trimTrailingPrepositions(
    parts.join(' ').replace(/\s+,/g, ',').replace(/,\s+/g, ', ').trim(),
  );
}
// end: фраза имени

// start: убрать висящие предлоги в конце («Даша от мамы в» → «Даша от мамы»)
export function trimTrailingPrepositions(phrase: string): string {
  const tokens = phrase.split(/\s+/).filter(Boolean);
  while (
    tokens.length > 0 &&
    CLIENT_FIELD_GLUE.has(tokens[tokens.length - 1].toLowerCase())
  ) {
    tokens.pop();
  }
  return tokens.join(' ');
}
// end: висящие предлоги
// end: нормализация имени
