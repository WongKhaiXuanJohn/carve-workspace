export const outlets = Object.freeze({
  carve: Object.freeze({ id: 'carve', name: 'Carve @ Society MK', company: 'KYU BRANDS SDN. BHD.',
    registration: '202201044053 (1489750-D)',
    address: 'S-B3-05, Society @ Mont Kiara, 4, Jalan Kiara 1, Mont Kiara, 50480 Kuala Lumpur',
    phone: '60143657688', email: 'admin@carve.my' }),
  labs: Object.freeze({ id: 'labs', name: 'Carve Labs @ Steppes MK', company: 'KYU LABS SDN. BHD.',
    registration: '202501054659 (1656065-T)',
    address: 'UG-03-1, Steppes, 32, Jalan Kiara 3, Mont Kiara, 51200 Kuala Lumpur, Wilayah Persekutuan',
    phone: '60143657688', email: 'admin@carve.my' })
});

function invalid(message, field) {
  const error = new RangeError(message);
  error.field = field;
  throw error;
}

export function malaysiaDate(now = new Date()) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kuala_Lumpur',
    year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now).map(part => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function resolveReceiptDate(value, manual, now = new Date()) {
  return manual ? value : malaysiaDate(now);
}

export function formatMoney(sen) {
  return (sen / 100).toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function text(value, max, field) {
  const result = String(value ?? '').trim();
  if (result.length > max) invalid(`Please use ${max} characters or fewer.`, field);
  return result;
}

export function buildReceipt(draft) {
  const outlet = Object.hasOwn(outlets, draft.outlet) ? outlets[draft.outlet] : null;
  if (!outlet) invalid('Choose an outlet.', 'outlet');
  const date = String(draft.date ?? '');
  const parsedDate = new Date(`${date}T12:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(parsedDate.valueOf()) || parsedDate.toISOString().slice(0, 10) !== date) {
    invalid('Choose a valid receipt date.', 'date');
  }
  const clientName = text(draft.clientName, 160, 'clientName');
  if (!clientName) invalid('Enter the client name before generating a receipt.', 'clientName');
  const phone = text(draft.phone, 60, 'phone');
  const email = text(draft.email, 254, 'email');
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) invalid('Enter a valid email address, or leave it blank.', 'email');
  if (!Array.isArray(draft.items) || draft.items.length < 1 || draft.items.length > 100) {
    invalid('Add between 1 and 100 purchased items.', 'items');
  }
  const items = draft.items.map((item, index) => {
    const field = property => `items.${index}.${property}`;
    const description = text(item.description, 300, field('description'));
    if (!description) invalid(`Enter a description for item ${index + 1}.`, field('description'));
    const quantityText = String(item.quantity ?? '').trim();
    if (!/^[1-9]\d{0,2}$/.test(quantityText)) invalid(`Item ${index + 1}: quantity must be a whole number from 1 to 999.`, field('quantity'));
    const price = String(item.price ?? '').trim();
    if (!/^(?:\d+(?:\.\d{0,2})?|\.\d{1,2})$/.test(price) || Number(price) > 999999.99) {
      invalid(`Item ${index + 1}: enter a price from RM0.00 to RM999,999.99, with up to two decimal places.`, field('price'));
    }
    const [whole, fraction = ''] = price.split('.');
    const unitSen = Number(whole || '0') * 100 + Number(fraction.padEnd(2, '0'));
    const quantity = Number(quantityText);
    return { description, quantity, unitSen, amountSen: quantity * unitSen };
  });
  const subtotalSen = items.reduce((sum, item) => sum + item.amountSen, 0);
  // Integer arithmetic: apply 8% once, then round to the nearest sen.
  const taxSen = Math.floor((subtotalSen * 8 + 50) / 100);
  return { outlet, date, dateLabel: new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'long',
    year: 'numeric', timeZone: 'UTC' }).format(parsedDate), clientName, phone, email, items,
    subtotalSen, taxSen, totalSen: subtotalSen + taxSen };
}
