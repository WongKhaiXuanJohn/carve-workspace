import { formatMoney } from './receipt.js';

const escape = value => String(value).replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[character]);

export function receiptFilename(receipt) {
  const client = receipt.clientName.normalize('NFKC').replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '').slice(0, 60) || 'client';
  return `receipt-${receipt.outlet.id}-${receipt.date}-${client}.pdf`;
}

export function receiptMarkup(receipt) {
  const outlet = receipt.outlet;
  return `<article class="receipt-paper" aria-label="Receipt preview">
    <header class="receipt-paper-header"><img src="./assets/images/carve.svg" alt="Carve"><div><h2>Receipt</h2><p>${escape(receipt.dateLabel)}</p></div></header>
    <section class="receipt-business"><h3>${escape(outlet.name)}</h3><p class="receipt-company">${escape(outlet.company)}</p><p>Co. Reg. No. ${escape(outlet.registration)}</p><p>${escape(outlet.address)}</p><p>${escape(outlet.phone)}<span class="receipt-contact-divider"> · </span>${escape(outlet.email)}</p></section>
    <section class="receipt-client"><p class="receipt-eyebrow">RECEIVED FROM</p><h3>${escape(receipt.clientName)}</h3>${receipt.phone ? `<p class="client-contact">${escape(receipt.phone)}</p>` : ''}${receipt.email ? `<p class="client-contact">${escape(receipt.email)}</p>` : ''}</section>
    <table class="receipt-table"><thead><tr><th scope="col">Item</th><th scope="col">Qty</th><th scope="col">Price<br><small>MYR</small></th><th scope="col">Amount<br><small>MYR</small></th></tr></thead><tbody>${receipt.items.map(item => `<tr><td>${escape(item.description)}</td><td>${item.quantity}</td><td>${formatMoney(item.unitSen)}</td><td>${formatMoney(item.amountSen)}</td></tr>`).join('')}</tbody></table>
    <section class="receipt-totals" aria-label="Receipt totals"><div><span>Subtotal</span><span>RM ${formatMoney(receipt.subtotalSen)}</span></div><div><span>SST (8%)</span><span>RM ${formatMoney(receipt.taxSen)}</span></div><div class="receipt-grand-total"><strong>Total</strong><strong>RM ${formatMoney(receipt.totalSen)}</strong></div></section>
    <footer class="receipt-paper-footer"><p>Thank you for moving with us.</p><span>CARVE & CARVE LABS</span></footer>
  </article>`;
}
