// start: границы слов для кириллицы — \b и \w в JS не работают с русскими буквами
export const CYR_TAIL = '[a-zа-яё]*';
export const CYR_WORD = '[a-zа-яё]+';

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// start: убрать известные слова с границами для русского текста
export function stripWordsCyrillic(text: string, words: string[]): string {
  let working = text;
  const sorted = [...words].sort((a, b) => b.length - a.length);

  for (const word of sorted) {
    const escaped = escapeRegex(word);
    working = working.replace(
      new RegExp(`(?:^|\\s)${escaped}(?=\\s|$|[,.:;!?-])`, 'gi'),
      ' ',
    );
  }

  return working.replace(/\s+/g, ' ').trim();
}
// end: убрать слова

// start: фразы цены без цифр — «стоимость процедуры», «стоит услуга»
export function stripPricePhrases(text: string): string {
  return text
    .replace(
      /(?:^|\s)(?:стоимость|стоимости|стоит|стоило|цена|цену|доход|дохода|сумма|сумму|прайс|оплата)(?:\s+(?:процедуры|процедура|процедуру|услуги|услуга|услугу|работы|работа|работу))?/gi,
      ' ',
    )
    .replace(/\s+/g, ' ')
    .trim();
}
// end: фразы цены
// end: границы слов для кириллицы
