import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const api = await import('../assets/heater.js').catch(error => {
  if (error.code === 'ERR_MODULE_NOT_FOUND') return {};
  throw error;
});

function originalMessage(times, pic = '') {
  const html = readFileSync(new URL('./fixtures/original-heater.html', import.meta.url), 'utf8');
  const inputs = { date: { value: '2026-10-30' }, pic: { value: pic }, phone: { value: '60143657688' } };
  const validation = html.slice(html.indexOf('function mins('), html.indexOf('function renderTimes('));
  const message = html.slice(html.indexOf('function text()'), html.indexOf('function render(){'));
  return vm.runInNewContext(`${validation}\n${message}\ntext().value`, { times, $: id => inputs[id] });
}

test('heater calculations are available as part of this application', () => {
  assert.equal(typeof api.buildSchedule, 'function');
  assert.equal(typeof api.buildWhatsappUrl, 'function');
});

test('a single class gets the full preheat and complete shutdown', () => {
  const plan = api.buildSchedule({ date: '2026-10-30', times: ['08:15'] });
  assert.deepEqual(plan.events.map(e => [e.minute, e.label]), [
    [475, 'ON all (DB + Remote)'], [530, 'OFF ALL']
  ]);
});

test('back-to-back classes retain the last-two-rows handoff', () => {
  const plan = api.buildSchedule({ date: '2026-10-30', times: ['08:15', '09:15'] });
  assert.deepEqual(plan.events.map(e => [e.minute, e.label]), [
    [475, 'ON all (DB + Remote)'], [530, 'OFF last 2 rows (8 switches DB)'],
    [550, 'ON last 2 rows (8 switches DB)'], [590, 'OFF ALL']
  ]);
  assert.equal(plan.events.some(e => e.gapAfter), false);
});

test('gaps get a complete shutdown followed by a full 20-minute preheat', () => {
  const plan = api.buildSchedule({ date: '2026-10-30', times: ['08:15', '10:15'] });
  assert.equal(plan.events[1].label, 'OFF ALL');
  assert.equal(plan.events[1].gapAfter, true);
  assert.equal(plan.events[2].minute, 595);
  assert.equal(plan.events[2].label, 'ON all (DB + Remote)');
});

test('the midday exception includes exactly noon through 3 PM', () => {
  for (const [time, minute, duration] of [['11:59',719,35],['12:00',720,30],['15:00',900,30],['15:01',901,35]]) {
    assert.equal(api.buildSchedule({date:'2026-10-30',times:[time]}).events[1].minute, minute + duration);
  }
});

test('typical generated instructions match the original scheduler verbatim', () => {
  const cases = [
    ['08:15'], ['08:15','09:15'], ['08:15','10:15'], ['12:00','13:00','15:00'],
    ['08:15','09:15','10:15','12:15','13:15','15:15'], ['15:01'], ['10:15','08:15','09:15']
  ];
  for (const times of cases) {
    assert.equal(api.buildSchedule({date:'2026-10-30',times,pic:' Nurin '}).message, originalMessage(times, ' Nurin '));
  }
});

test('class validation rejects duplicates, close starts, invalid clocks and missing schedules', () => {
  for (const times of [['08:15','08:15'],['08:15','09:14'],['25:00'],['09:99'],[],['']]) {
    assert.throws(() => api.buildSchedule({date:'2026-10-30',times}), { name: 'RangeError' });
  }
  for (const date of ['', '2026-02-30', 'not-a-date']) {
    assert.throws(() => api.buildSchedule({date,times:['08:15']}), { name: 'RangeError' });
  }
});

test('sorting does not mutate input and leap-day dates work', () => {
  const times = ['10:15','08:15','09:15'];
  const original = [...times];
  assert.equal(api.buildSchedule({date:'2028-02-29',times}).classCount, 3);
  assert.deepEqual(times, original);
});

test('midnight events clearly identify the previous or next day', () => {
  assert.match(api.buildSchedule({date:'2026-10-30',times:['00:10']}).message, /11:50 PM \(previous day\)/);
  assert.match(api.buildSchedule({date:'2026-10-30',times:['23:45']}).message, /12:20 AM \(next day\)/);
});

test('WhatsApp preparation encodes the exact message and requires a valid number', () => {
  const message = 'HEATER SCHEDULE\n8:15 AM – ON all & check DB';
  const url = new URL(api.buildWhatsappUrl(message, '+60 14-365 7688'));
  assert.equal(url.origin, 'https://wa.me');
  assert.equal(url.pathname, '/60143657688');
  assert.equal(url.searchParams.get('text'), message);
  assert.throws(() => api.buildWhatsappUrl(message, '12'), { name: 'RangeError' });
});
