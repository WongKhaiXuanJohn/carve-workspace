import test from 'node:test';
import assert from 'node:assert/strict';
import { moduleForHash, modules } from '../assets/modules.js';

test('Receipt opens directly as the second available workspace tool', () => {
  assert.equal(moduleForHash('#/receipt').id, 'receipt');
  assert.equal(modules.filter(module => module.available)[1].path, '/receipt');
});
