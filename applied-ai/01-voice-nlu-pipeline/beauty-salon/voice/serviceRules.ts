// start: правила услуги — длительность vs процедура, антитриггеры, явные фразы

import { CYR_TAIL } from './textBoundaries';



const PROC = `процедур${CYR_TAIL}`;

const DLIT = `длит${CYR_TAIL}`;

const ZAIM = `займ${CYR_TAIL}`;

const ZANIM = `заним${CYR_TAIL}`;

const IDET = `ид${CYR_TAIL}`;

const PRODL = `продл${CYR_TAIL}`;

const POTREB = `потреб${CYR_TAIL}`;

// start: «процедура длится» — это длительность, не название услуги

export const DURATION_PROCEDURE_PHRASES: RegExp[] = [

  new RegExp(`(?:^|\\s)${PROC}\\s+${DLIT}`, 'i'),

  new RegExp(`(?:^|\\s)${PROC}\\s+будет\\s+идти`, 'i'),

  new RegExp(`(?:^|\\s)${PROC}\\s+будет\\s+${DLIT}`, 'i'),

  new RegExp(`(?:^|\\s)${PROC}\\s+${ZAIM}`, 'i'),

  new RegExp(`(?:^|\\s)${PROC}\\s+${ZANIM}`, 'i'),

  new RegExp(`(?:^|\\s)${PROC}\\s+${IDET}\\s`, 'i'),

  new RegExp(`(?:^|\\s)${PROC}\\s+${PRODL}`, 'i'),

  new RegExp(`(?:^|\\s)${PROC}\\s+${POTREB}`, 'i'),

  new RegExp(`(?:^|\\s)длительность\\s+${PROC}`, 'i'),

  new RegExp(`(?:^|\\s)длина\\s+${PROC}`, 'i'),

  new RegExp(`(?:^|\\s)по\\s+времени\\s+${PROC}`, 'i'),

  new RegExp(`(?:^|\\s)(?:она|он|они)\\s+(?:будет\\s+)?${DLIT}`, 'i'),

];

// end: фразы длительности



// start: антитриггеры — рядом слово из словаря НЕ услуга (цифры не включаем — «3D» ок)

export const SERVICE_ANTI_TRIGGERS = [

  'минут',

  'минуты',

  'минуту',

  'минутка',

  'час',

  'часа',

  'часов',

  'часы',

  'часик',

  'длится',

  'длиться',

  'длительность',

  'длительности',

  'занимает',

  'займет',

  'займёт',

  'идет',

  'идёт',

  'будет идти',

  'потребует',

  'продлится',

  'полчаса',

  'полчасаи',

];

// end: антитриггеры



// start: явная процедура — «на процедуру наращивания ресниц»

export const EXPLICIT_PROCEDURE_PATTERN = new RegExp(

  `(?:^|\\s)(?:на\\s+)?(?:процедуру|процедура|процедуры|услугу|услуги|работу|работа)\\s+(?!длит|будет\\s+ид|${ZAIM}|${ZANIM}|${IDET}|${PRODL}|${POTREB})([^,.!?]+?)(?=\\s+(?:за|${DLIT}|будет|${ZAIM}|заметк|на\\s+\\d{1,2}[:\\d])|[,.!?]|$)`,

  'gi',

);

// end: явная процедура



// start: «на урок / съёмку / фотосессию / лазерную эпиляцию» — без слова «процедура»

const NA_SERVICE_HEAD =

  'урок\\w*|заняти\\w*|фотосесс\\w*|фото\\s+сесс\\w*|съ[её]?м\\w*|видеос\\w*|лазерн\\w+|диодн\\w+|эпил\\w*|депил\\w*|шугар\\w*|репетитор\\w*';



export const EXPLICIT_NA_SERVICE_PATTERN = new RegExp(

  `(?:^|\\s)на\\s+(?:(${NA_SERVICE_HEAD})(?:\\s+([^,.!?]+?))?)(?=\\s+(?:за|${DLIT}|будет|${ZAIM}|заметк|на\\s+\\d{1,2}[:\\d])|[,.!?]|$)`,

  'gi',

);

// end: явная услуга после «на»



// start: текст — это фраза про длительность процедуры?

export function isDurationProcedurePhrase(text: string): boolean {

  return DURATION_PROCEDURE_PHRASES.some((re) => {

    re.lastIndex = 0;

    return re.test(` ${text.toLowerCase()} `);

  });

}

// end: проверка длительности



// start: после якоря «процедура» идёт длительность?

export function isProcedureAnchorAboutDuration(text: string, anchorEndIdx: number): boolean {

  const after = text.slice(anchorEndIdx).trimStart().toLowerCase();

  return new RegExp(

    `^(?:${DLIT}|будет\\s+ид|${ZAIM}|${ZANIM}|идет|идёт|${PRODL}|${POTREB}|минут|час|\\d+\\s*(?:мин|минут|час|часов))`,

  ).test(after);

}

// end: якорь длительности



// start: фрагмент похож на название услуги, а не на длительность/заметки?

export function isPlausibleServiceFragment(text: string): boolean {

  const t = text.trim().toLowerCase();

  if (!t || t.length > 70) return false;

  if (isDurationProcedurePhrase(t)) return false;

  if (/\u0001/.test(t)) return false;

  if (/(?:^|\s)(?:длит|займ|заним|минут|часов|полчаса|будет|заметк|любит|болта|приходит|обсужд|она|они)(?:\s|$)/.test(` ${t} `)) {

    return false;

  }

  if (/(?:^|\s)(?:клиент|телефон|тел|дата|время|длительность|процедур|услуг|работ)(?:\s|$)/.test(` ${t} `)) {

    return false;

  }

  if (t.split(/\s+/).filter(Boolean).length > 3) return false;

  return true;

}

// end: правдоподобная услуга



// start: рядом с позицией ключевого слова есть антитриггер?

export function hasServiceAntiTriggerNearby(

  text: string,

  matchStart: number,

  matchEnd: number,

  radius = 35,

): boolean {

  const sliceStart = Math.max(0, matchStart - radius);

  const sliceEnd = Math.min(text.length, matchEnd + radius);

  const window = ` ${text.slice(sliceStart, sliceEnd).toLowerCase()} `;



  if (isDurationProcedurePhrase(window)) return true;



  for (const trigger of SERVICE_ANTI_TRIGGERS) {

    if (window.includes(` ${trigger} `) || window.includes(` ${trigger},`)) {

      return true;

    }

  }



  return false;

}

// end: антитриггер рядом

// end: правила услуги

