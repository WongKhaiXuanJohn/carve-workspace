import test from 'node:test';
import assert from 'node:assert/strict';

import { sortClasses } from '../assets/class-times.js';

test('re-adding the removed first class puts its earlier time back at the top', () => {
  const classes = [
    { id: 1, time: '09:15' }, { id: 2, time: '10:15' }, { id: 3, time: '12:15' },
    { id: 4, time: '13:15' }, { id: 5, time: '15:15' }, { id: 6, time: '08:15' }
  ];
  const sorted = sortClasses(classes);
  assert.deepEqual(sorted.map(item => item.time), ['08:15','09:15','10:15','12:15','13:15','15:15']);
  assert.equal(sorted[0], classes[5]);
  assert.deepEqual(classes.map(item => item.id), [1,2,3,4,5,6]);
});

test('editing a class later in the day moves that same class after earlier starts', () => {
  const edited = { id: 0, time: '17:30' };
  const sorted = sortClasses([edited, { id: 1, time: '09:15' }, { id: 2, time: '13:00' }]);
  assert.deepEqual(sorted.map(item => item.id), [1,2,0]);
  assert.equal(sorted[2], edited);
});

test('empty and incomplete entries stay after complete times without being lost', () => {
  const sorted = sortClasses([
    { id: 0, time: '' }, { id: 1, time: '15:15' }, { id: 2, time: '' },
    { id: 3, time: '00:05' }, { id: 4, time: '08:' }
  ]);
  assert.deepEqual(sorted.map(item => item.id), [3,1,0,2,4]);
});

test('equal times retain their identities so existing duplicate validation can report them', () => {
  const sorted = sortClasses([{id:0,time:'09:15'}, {id:1,time:'08:15'}, {id:2,time:'09:15'}]);
  assert.deepEqual(sorted.map(item => item.id), [1,0,2]);
});
