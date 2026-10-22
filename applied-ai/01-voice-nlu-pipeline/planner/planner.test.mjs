// start: planner voice NLU - node tests against standalone parser
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { parseVoiceTranscript } = require('./voice-parser.cjs');

test('creates a task from free-form phrase', () => {
  const items = parseVoiceTranscript('добавь задачу купить молоко завтра');
  assert.ok(items.length >= 1);
  assert.equal(items[0].type, 'task');
});

test('creates shopping item', () => {
  const items = parseVoiceTranscript('добавь в покупки хлеб и масло');
  assert.ok(items.some((i) => i.type === 'shopping'));
});

test('creates a habit segment', () => {
  const items = parseVoiceTranscript('привычка пить воду каждый день');
  assert.ok(items.some((i) => i.type === 'habit'));
});
// end: planner voice NLU tests
