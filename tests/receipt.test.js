import test from 'node:test';
import assert from 'node:assert/strict';

const api = await import('../assets/receipt.js').catch(error => {
  if (error.code === 'ERR_MODULE_NOT_FOUND') return {};
  throw error;
});
const draft = (patch = {}) => ({ outlet: 'carve', date: '2026-10-30', clientName: 'Alex Tan',
  phone: '', email: '', items: [{ description: 'Class pack', quantity: '1', price: '100.00' }], ...patch });

test('receipt totals show the requested 8 percent after pre-tax prices', () => {
  assert.equal(typeof api.buildReceipt, 'function');
  const receipt = api.buildReceipt(draft());
  assert.deepEqual([receipt.subtotalSen, receipt.taxSen, receipt.totalSen], [10000, 800, 10800]);
  assert.equal(api.formatMoney(receipt.totalSen), '108.00');
});

test('multiple quantities use exact sen and round tax once on the subtotal', () => {
  const receipt = api.buildReceipt(draft({ items: [
    { description: 'A', quantity: '3', price: '0.10' },
    { description: 'B', quantity: '1', price: '0.01' }
  ] }));
  assert.deepEqual([receipt.subtotalSen, receipt.taxSen, receipt.totalSen], [31, 2, 33]);
  assert.equal(api.buildReceipt(draft({items:[{description:'A',quantity:1,price:'0.07'}]})).taxSen, 1);
});

test('each selected outlet carries the correct legal identity and contact details', () => {
  const carve = api.buildReceipt(draft());
  const labs = api.buildReceipt(draft({ outlet: 'labs', clientName: ' 王 小明 ', phone: ' 012 345 6789 ', email: ' alex@example.com ' }));
  assert.equal(carve.outlet.company, 'KYU BRANDS SDN. BHD.');
  assert.equal(carve.outlet.registration, '202201044053 (1489750-D)');
  assert.equal(labs.outlet.company, 'KYU LABS SDN. BHD.');
  assert.equal(labs.outlet.registration, '202501054659 (1656065-T)');
  assert.equal(labs.clientName, '王 小明');
  assert.equal(labs.phone, '012 345 6789');
  assert.equal(labs.email, 'alex@example.com');
  assert.equal(carve.email, '');
  assert.equal(carve.phone, '');
});

test('a blank client name blocks generation even if the other fields are valid', () => {
  for (const clientName of ['', '  ', '\u00a0']) {
    assert.throws(() => api.buildReceipt(draft({ clientName })), error => error.field === 'clientName');
  }
});

test('invalid contacts, dates and missing purchases cannot generate a receipt', () => {
  for (const [patch, field] of [[{email:'alex@'},'email'], [{date:'2026-02-30'},'date'], [{date:''},'date'], [{outlet:'other'},'outlet'], [{items:[]},'items']]) {
    assert.throws(() => api.buildReceipt(draft(patch)), error => error.field === field);
  }
});

test('each purchase requires a description, valid price and whole positive quantity', () => {
  for (const patch of [{description:' '}, {price:''}, {price:'-1'}, {price:'1.001'}, {price:'Infinity'},
    {price:'1e3'}, {price:'1,00'}, {quantity:0}, {quantity:'1.5'}, {quantity:'-1'}, {quantity:1000}]) {
    assert.throws(() => api.buildReceipt(draft({items:[{description:'A',quantity:1,price:'1.00',...patch}]})), error => error.field?.startsWith('items.0.'));
  }
  assert.equal(api.buildReceipt(draft({items:[{description:'Complimentary item',quantity:1,price:'0'}]})).totalSen, 0);
});

test('automatic generation date follows Malaysia midnight and respects an explicit override', () => {
  const before = new Date('2026-10-30T15:59:59Z');
  const after = new Date('2026-10-30T16:00:00Z');
  assert.equal(api.malaysiaDate(before), '2026-10-30');
  assert.equal(api.malaysiaDate(after), '2026-10-31');
  assert.equal(api.resolveReceiptDate('2026-10-30', false, after), '2026-10-31');
  assert.equal(api.resolveReceiptDate('2026-09-01', true, after), '2026-09-01');
});
