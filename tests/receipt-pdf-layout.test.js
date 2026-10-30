import test from 'node:test';
import assert from 'node:assert/strict';
import * as pdf from '../assets/receipt-pdf.js';

test('a multiline item is split to fit the available page space without losing lines', () => {
  assert.equal(typeof pdf.receiptRowChunk, 'function');
  const original = Array.from({length:100}, (_, index) => `Line ${index + 1}`);
  const first = pdf.receiptRowChunk(original, 81);
  assert.deepEqual(first.lines, ['Line 1','Line 2','Line 3','Line 4']);
  assert.equal(first.height, 81);
  assert.equal(first.rest[0], 'Line 5');
  let remaining = first.rest;
  const all = [...first.lines];
  while (remaining.length) {
    const chunk = pdf.receiptRowChunk(remaining, 501);
    assert.ok(chunk.height <= 501);
    assert.ok(chunk.lines.length > 0);
    all.push(...chunk.lines);
    remaining = chunk.rest;
  }
  assert.deepEqual(all, original);
});

test('no item text is drawn into the footer when the next line cannot fit', () => {
  for (const height of [30, 36, 38]) {
    const chunk = pdf.receiptRowChunk(['Next item'], height);
    assert.deepEqual(chunk.lines, []);
    assert.deepEqual(chunk.rest, ['Next item']);
    assert.equal(chunk.height, 0);
  }
});
