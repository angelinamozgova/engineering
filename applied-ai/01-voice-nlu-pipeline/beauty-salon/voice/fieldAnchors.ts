// start: разрезка текста по якорям полей («клиент …», «дата …»)
import { FIELD_ANCHORS, type FieldAnchorType } from './dictionary';
import { isProcedureAnchorAboutDuration } from './serviceRules';

export interface FieldSegment {
  field: FieldAnchorType;
  text: string;
  anchor: string;
}

export interface SegmentedTranscript {
  hasAnchors: boolean;
  segments: FieldSegment[];
  remainder: string;
}

// start: все якоря одним списком — длинные первыми
const ANCHOR_ENTRIES: { field: FieldAnchorType; anchor: string }[] = Object.entries(
  FIELD_ANCHORS,
)
  .flatMap(([field, anchors]) =>
    anchors.map((anchor) => ({ field: field as FieldAnchorType, anchor })),
  )
  .sort((a, b) => b.anchor.length - a.anchor.length);
// end: список якорей

// start: «процедура длится» / «процедура будет идти» — не поле «процедура»
function isFalseServiceAnchor(text: string, idx: number, anchor: string): boolean {
  if (anchor !== 'процедура' && anchor !== 'процедуру' && anchor !== 'процедуры') {
    return false;
  }
  return isProcedureAnchorAboutDuration(text, idx + anchor.length);
}
// end: ложный якорь процедуры

// start: найти позиции якорей в тексте
function findAnchorHits(text: string): { index: number; field: FieldAnchorType; anchor: string }[] {
  const hits: { index: number; field: FieldAnchorType; anchor: string }[] = [];
  const lower = text.toLowerCase();

  for (const entry of ANCHOR_ENTRIES) {
    let from = 0;
    while (from < lower.length) {
      const idx = lower.indexOf(entry.anchor, from);
      if (idx === -1) break;

      const before = idx === 0 ? ' ' : lower[idx - 1];
      const after = lower[idx + entry.anchor.length] ?? ' ';
      const isWordBoundary =
        /[\s,.:;!?-]/.test(before) && /[\s,.:;!?-]/.test(after);

      if (isWordBoundary && !isFalseServiceAnchor(lower, idx, entry.anchor)) {
        hits.push({ index: idx, field: entry.field, anchor: entry.anchor });
      }

      from = idx + entry.anchor.length;
    }
  }

  hits.sort((a, b) => a.index - b.index);

  const deduped: typeof hits = [];
  for (const hit of hits) {
    const overlaps = deduped.some(
      (d) => hit.index < d.index + d.anchor.length && hit.index + hit.anchor.length > d.index,
    );
    if (!overlaps) deduped.push(hit);
  }

  return deduped;
}
// end: позиции якорей

// start: разрезать текст на секции по найденным якорям
export function segmentByFieldAnchors(text: string): SegmentedTranscript {
  const hits = findAnchorHits(text);

  if (hits.length === 0) {
    return { hasAnchors: false, segments: [], remainder: text };
  }

  const segments: FieldSegment[] = [];
  let remainder = text.slice(0, hits[0].index).trim();

  for (let i = 0; i < hits.length; i++) {
    const hit = hits[i];
    const contentStart = hit.index + hit.anchor.length;
    const contentEnd = i + 1 < hits.length ? hits[i + 1].index : text.length;
    const chunk = text.slice(contentStart, contentEnd).replace(/^[\s:\-]+/, '').trim();

    if (chunk) {
      segments.push({ field: hit.field, text: chunk, anchor: hit.anchor });
    }
  }

  return {
    hasAnchors: segments.length > 0,
    segments,
    remainder,
  };
}
// end: разрезка по якорям
// end: разрезка текста по якорям полей
