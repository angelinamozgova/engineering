// start: разлепление склеенных слов STT — словари услуг, якорей полей, имён

import { FIELD_ANCHORS, SERVICE_KEYWORDS } from './dictionary';

import { DESCRIPTOR_FORMS, NAME_FORMS } from './normalizeName';



// start: слова из ручных кейсов — дублируем, чтобы не зависеть только от словаря

const MANUAL_GLUE_WORDS = [

  'стоимость',

  'процедуры',

  'процедура',

  'аллергия',

  'аллергии',

  'опаздывает',

  'кошек',

  'кошку',

  'рублей',

  'рубля',

  'руб',

];

// end: ручные слова



// start: экранирование для RegExp

function escapeRegex(value: string): string {

  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

}

// end: экранирование



// start: собрать слова «ножниц» — якоря полей + услуги + ручной список

function buildDictionarySplitWords(): string[] {

  const words = new Set<string>(MANUAL_GLUE_WORDS);



  for (const anchors of Object.values(FIELD_ANCHORS)) {

    for (const anchor of anchors) {

      if (anchor.length >= 3) words.add(anchor.toLowerCase());

    }

  }



  for (const key of Object.keys(SERVICE_KEYWORDS)) {

    const lower = key.toLowerCase();

    if (lower.length >= 4) words.add(lower);

  }



  return [...words].sort((a, b) => b.length - a.length);

}

// end: словарь ножниц



// start: вставить пробел перед/после слова из словаря, если оно склеено

const INTERIOR_GLUE_MIN_LEN = 5;

export function splitGluedDictionaryWords(text: string): string {
  let working = text;
  const dictionaryWords = buildDictionarySplitWords();
  const protectedWords = new Set(dictionaryWords.filter((w) => w.length >= 6));

  for (const word of dictionaryWords) {
    const esc = escapeRegex(word);

    working = working.replace(
      new RegExp(`([a-zа-яё]{2,})(${esc})(?=\\s|$|[,.:;!?-])`, 'gi'),
      '$1 $2',
    );

    if (word.length >= INTERIOR_GLUE_MIN_LEN) {
      working = working.replace(
        new RegExp(`([a-zа-яё]{2,})(${esc})(?=[a-zа-яё])`, 'gi'),
        (full, before: string, kw: string) => {
          const merged = `${before}${kw}`.toLowerCase();
          if (protectedWords.has(merged)) return full;
          return `${before} ${kw}`;
        },
      );
      working = working.replace(
        new RegExp(`\\b(${esc})([a-zа-яё]{2,})`, 'gi'),
        (full, kw: string, after: string) => {
          const merged = `${kw}${after}`.toLowerCase();
          if (protectedWords.has(merged)) return full;
          return `${kw} ${after}`;
        },
      );
    }
  }

  return working.replace(/\s+/g, ' ').trim();
}

// end: словарь услуг и полей



// start: корни слов после «от» — для разлепления «светуотдаши»

function buildOtFollowPrefixes(): string {

  const roots = new Set<string>([

    'мам',

    'даш',

    'под',

    'сос',

    'кол',

    'алин',

    'ирин',

    'маш',

    'кат',

    'ол',

    'люд',

    'инн',

    'ян',

    'марин',

    'свет',

  ]);



  for (const key of Object.keys(NAME_FORMS)) {

    if (key.length >= 3) roots.add(key.slice(0, 3));

  }

  for (const key of Object.keys(DESCRIPTOR_FORMS)) {

    if (key.length >= 3) roots.add(key.slice(0, 3));

  }



  return [...roots]

    .filter((r) => r.length >= 3)

    .sort((a, b) => b.length - a.length)

    .map(escapeRegex)

    .join('|');

}

// end: корни после «от»



// start: разлепить предлоги по формам имён из NAME_FORMS (дополняет ручной whitelist)

export function splitGluedPrepositionsFromNameForms(text: string): string {

  const nameForms = [...new Set(Object.keys(NAME_FORMS).filter((k) => k.length >= 3))].sort(

    (a, b) => b.length - a.length,

  );



  let working = text;



  for (const name of nameForms) {

    const esc = escapeRegex(name);

    working = working.replace(

      new RegExp(`(${esc})(на)(?=[a-zа-яё]|\\s|$)`, 'gi'),

      '$1 $2 ',

    );

  }



  const otFollow = buildOtFollowPrefixes();

  const otNames = nameForms.filter((n) => n.endsWith('у') && n.length >= 3);



  for (const name of otNames) {

    const esc = escapeRegex(name);

    working = working.replace(new RegExp(`(${esc})(от)(?=${otFollow})`, 'gi'), '$1 $2 ');

  }



  return working.replace(/\s+/g, ' ').trim();

}

// end: предлоги по NAME_FORMS



// start: формы имён/контекста, после которых STT часто теряет «на» перед услугой

const NA_BEFORE_SERVICE_FORMS = [

  'мамы',

  'маме',

  'маму',

  'даши',

  'дашу',

  'свету',

  'светы',

  'алину',

  'алины',

  'ирину',

  'ирины',

  'машу',

  'катю',

  'олю',

  'люду',

  'инну',

  'яну',

  'марину',

  'работы',

  'работе',

];

// end: формы перед услугой



// start: вернуть «на», если STT съел предлог («мамы ламинирование» → «мамы на ламинирование»)

function buildServiceWordsForNaInsert(): string[] {

  return Object.keys(SERVICE_KEYWORDS)

    .filter((key) => key.length >= 5)

    .sort((a, b) => b.length - a.length);

}



export function insertMissingNaBeforeService(text: string): string {

  let working = text;

  const serviceWords = buildServiceWordsForNaInsert();

  const wordEdgeBefore = '(?<![a-zа-яё])';

  const wordEdgeAfter = '(?![a-zа-яё])';



  for (const form of NA_BEFORE_SERVICE_FORMS) {

    const formEsc = escapeRegex(form);

    for (const service of serviceWords) {

      const serviceEsc = escapeRegex(service);

      working = working.replace(

        new RegExp(

          `${wordEdgeBefore}(${formEsc})\\s+(?!на\\s)(${serviceEsc})${wordEdgeAfter}`,

          'gi',

        ),

        '$1 на $2',

      );

    }

  }



  return working.replace(/\s+/g, ' ').trim();

}

// end: пропущенное «на» перед услугой

// end: разлепление склеенных слов STT

