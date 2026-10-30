import test from 'node:test';
import assert from 'node:assert/strict';
import { buildReceipt } from '../assets/receipt.js';
import * as view from '../assets/receipt-view.js';
const receipt = patch => buildReceipt({outlet:'labs',date:'2026-09-12',clientName:'Alex Tan',phone:'',email:'',
  items:[{description:'Private session',quantity:2,price:'100.00'}],...patch});

test('receipt preview presents the chosen outlet, date and separately calculated tax', () => {
  assert.equal(typeof view.receiptMarkup,'function');
  const html = view.receiptMarkup(receipt());
  for (const value of ['Carve Labs @ Steppes MK','KYU LABS SDN. BHD.','202501054659 (1656065-T)',
    '12 September 2026','Alex Tan','Private session','200.00','16.00','216.00','SST (8%)']) assert.ok(html.includes(value),value);
  assert.ok(!html.includes('Receipt number'));
  assert.ok(!html.includes('CARVE-000'));
});

test('customer text is escaped and multilingual text stays intact', () => {
  const html = view.receiptMarkup(receipt({clientName:'王小明 <img src=x onerror=alert(1)>',
    items:[{description:'Yoga & café <script>alert(1)</script>',quantity:1,price:'10'}]}));
  assert.ok(html.includes('王小明 &lt;img'));
  assert.ok(html.includes('Yoga &amp; café &lt;script&gt;'));
  assert.ok(!html.includes('<script>'));
  assert.ok(!html.includes('<img src=x'));
});

test('optional client contacts are included only when supplied', () => {
  assert.ok(!view.receiptMarkup(receipt()).includes('client-contact'));
  const html = view.receiptMarkup(receipt({phone:'0123456789',email:'alex@example.com'}));
  assert.ok(html.includes('0123456789'));
  assert.ok(html.includes('alex@example.com'));
});

test('download filenames keep the outlet and selected date without unsafe file characters', () => {
  assert.equal(view.receiptFilename(receipt()), 'receipt-labs-2026-09-12-Alex-Tan.pdf');
  assert.equal(view.receiptFilename(receipt({clientName:'../王小明 / Test: A'})), 'receipt-labs-2026-09-12-王小明-Test-A.pdf');
});
