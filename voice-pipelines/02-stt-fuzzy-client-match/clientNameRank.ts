// start: ранжирование имён клиентов после STT — расстояние Левенштейна по нормализованной строке

/** start: нормализация для сравнения имён */
export function normalizeForMatch(value: string): string {
  return value
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim();
}
// end: нормализация для сравнения имён

/** start: расстояние Левенштейна */
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const prev = new Array(b.length + 1);
  const curr = new Array(b.length + 1);

  for (let j = 0; j <= b.length; j += 1) prev[j] = j;

  for (let i = 1; i <= a.length; i += 1) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    for (let j = 0; j <= b.length; j += 1) prev[j] = curr[j];
  }
  return prev[b.length];
}
// end: расстояние Левенштейна

export type ClientMatch = {
  name: string;
  distance: number;
};

/** start: лучшее совпадение в справочнике клиентов */
export function bestClientMatch(
  spoken: string,
  roster: string[],
  maxDistance = 2,
): ClientMatch | null {
  const query = normalizeForMatch(spoken);
  if (!query) return null;

  let best: ClientMatch | null = null;

  for (const name of roster) {
    const candidate = normalizeForMatch(name);
    if (!candidate) continue;
    const distance = levenshtein(query, candidate);
    if (distance > maxDistance) continue;
    if (!best || distance < best.distance) {
      best = { name, distance };
    }
  }

  return best;
}
// end: лучшее совпадение в справочнике клиентов