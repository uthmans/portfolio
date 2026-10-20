import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateSpace, validateAdvice, exampleSpace } from '../src/business/guide.ts';
import { calculateQuote } from '../src/business/model.ts';
const advice = { serviceId: 'workspace', reason: 'A workspace layout concept fits the stated home-office needs.', questions: ['What storage is already available?'], caveat: 'This is a fictional concept, not an ergonomic assessment.' };
test('space descriptions and service advice have bounded, validated shapes', () => {
  assert.equal(validateSpace(exampleSpace), exampleSpace);
  for (const v of ['', 'short', 'x'.repeat(2001), {}]) assert.throws(() => validateSpace(v));
  assert.deepEqual(validateAdvice(advice), advice);
  assert.equal(validateAdvice({ ...advice, serviceId: 'none' }).serviceId, 'none');
  for (const v of [{ ...advice, serviceId: 'construction' }, { ...advice, questions: null }, { ...advice, reason: '' }, { ...advice, questions: Array(6).fill('question') }]) assert.throws(() => validateAdvice(v));
});
test('AI pricing and room overrides are discarded; estimates use only the catalogue', () => {
  const accepted = validateAdvice({ ...advice, price: 0, total: 0, rooms: 99 });
  assert.deepEqual(accepted, advice);
  assert.equal(calculateQuote('workspace', 2, ['palette']).total, 485);
});
