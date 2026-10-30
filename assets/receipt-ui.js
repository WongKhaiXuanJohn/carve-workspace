import { buildReceipt, malaysiaDate, resolveReceiptDate } from './receipt.js?v=d000e45b03';
import { receiptMarkup, receiptFilename } from './receipt-view.js?v=6f7d3c3cf1';

export function initReceipt(root) {
  const get = id => root.querySelector(`#${id}`);
  const form = get('receipt-form');
  const items = get('receipt-items');
  const date = get('receipt-date');
  const errorBox = get('receipt-error');
  const feedback = get('receipt-feedback');
  let manualDate = false, busy = false, nextItemId = 0;

  function readDraft() {
    return { outlet: form.querySelector('[name="receipt-outlet"]:checked')?.value,
      date: date.value, clientName: get('receipt-name').value, phone: get('receipt-phone').value,
      email: get('receipt-email').value, items: [...items.children].map(row => ({
        description: row.querySelector('[data-field="description"]').value,
        quantity: row.querySelector('[data-field="quantity"]').value,
        price: row.querySelector('[data-field="price"]').value
      })) };
  }
  function clearError() {
    errorBox.textContent = '';
    root.querySelectorAll('[aria-invalid]').forEach(field => field.removeAttribute('aria-invalid'));
  }
  function showError(error, focus = false) {
    clearError();
    errorBox.textContent = error.message;
    let target;
    if (error.field?.startsWith('items.')) {
      const [, index, property] = error.field.split('.');
      target = items.children[index]?.querySelector(`[data-field="${property}"]`);
    } else {
      target = { clientName: get('receipt-name'), date, phone: get('receipt-phone'), email: get('receipt-email'),
        outlet: form.querySelector('[name="receipt-outlet"]'), items: items.querySelector('textarea') }[error.field];
    }
    target?.setAttribute('aria-invalid', 'true');
    if (focus) target?.focus();
  }
  function updatePreview() {
    const draft = readDraft();
    try {
      const preview = buildReceipt({ ...draft, clientName: draft.clientName.trim() || 'Client name',
        items: draft.items.map(item => ({ ...item, description: item.description.trim() || 'Item description',
          quantity: item.quantity || '1', price: item.price || '0' })) });
      get('receipt-preview').innerHTML = receiptMarkup(preview);
    } catch (error) {
      const notice = document.createElement('p');
      notice.className = 'receipt-preview-notice';
      notice.textContent = error.message;
      get('receipt-preview').replaceChildren(notice);
    }
  }
  function refreshDate() {
    if (!manualDate) date.value = malaysiaDate();
    get('receipt-date-hint').textContent = manualDate ? 'Using your selected date.' : 'Defaults to today in Malaysia.';
    updatePreview();
  }
  function relabelItems() {
    [...items.children].forEach((row, index) => {
      row.querySelector('.receipt-item-title').textContent = `Item ${index + 1}`;
      row.querySelectorAll('[data-field]').forEach(input => input.setAttribute('aria-label',
        `Item ${index + 1} ${input.dataset.field === 'price' ? 'price before SST' : input.dataset.field}`));
      const remove = row.querySelector('.receipt-remove');
      remove.setAttribute('aria-label', `Remove item ${index + 1}`);
      remove.disabled = items.children.length === 1;
    });
    get('receipt-add').disabled = items.children.length >= 100;
  }
  function addItem(focus = false) {
    if (items.children.length >= 100) return;
    const id = nextItemId++;
    const row = document.createElement('div');
    row.className = 'receipt-item';
    // Only fixed, application-owned markup is used here. User values stay in inputs.
    row.innerHTML = `<div class="receipt-item-heading"><span class="receipt-item-title"></span><button class="receipt-remove" type="button">Remove ×</button></div>
      <label class="receipt-field" for="receipt-item-${id}">Description<textarea id="receipt-item-${id}" data-field="description" rows="2" maxlength="300" placeholder="e.g. Reformer 10-class pack" required></textarea></label>
      <div class="receipt-item-values"><label class="receipt-field" for="receipt-qty-${id}">Quantity<input id="receipt-qty-${id}" data-field="quantity" type="number" min="1" max="999" step="1" value="1" required></label>
      <label class="receipt-field" for="receipt-price-${id}">Price before SST (RM)<input id="receipt-price-${id}" data-field="price" type="text" inputmode="decimal" maxlength="12" placeholder="0.00" required></label></div>`;
    row.querySelector('.receipt-remove').addEventListener('click', () => {
      row.remove(); relabelItems(); clearError(); updatePreview();
      items.lastElementChild.querySelector('textarea').focus();
    });
    items.append(row); relabelItems(); updatePreview();
    if (focus) row.querySelector('textarea').focus();
  }
  function snapshot() {
    date.value = resolveReceiptDate(date.value, manualDate);
    refreshDate();
    return buildReceipt(readDraft());
  }
  function setBusy(value) {
    busy = value;
    form.setAttribute('aria-busy', String(value));
    form.querySelectorAll('input, textarea, button').forEach(control => { control.disabled = value; });
    if (!value) relabelItems();
    get('receipt-download').textContent = value ? 'Preparing PDF…' : 'Download receipt PDF ↓';
  }
  date.addEventListener('input', () => { manualDate = true; get('receipt-date-hint').textContent = 'Using your selected date.'; });
  get('receipt-today').addEventListener('click', () => { manualDate = false; clearError(); refreshDate(); });
  form.addEventListener('input', () => {
    feedback.textContent = '';
    if (errorBox.textContent) {
      try { buildReceipt(readDraft()); clearError(); } catch (error) { showError(error); }
    }
    updatePreview();
  });
  get('receipt-add').addEventListener('click', () => { clearError(); addItem(true); });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (busy) return;
    let receipt;
    try { receipt = snapshot(); clearError(); } catch (error) { showError(error, true); return; }
    setBusy(true); feedback.textContent = '';
    try {
      const { createReceiptPdf } = await import('./receipt-pdf.js?v=d3fd618457');
      const bytes = await createReceiptPdf(receipt);
      const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url; link.download = receiptFilename(receipt);
      document.body.append(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      feedback.textContent = 'Your PDF download has started. Save it before leaving this page.';
    } catch (error) {
      errorBox.textContent = 'The PDF could not be prepared. Your details are still here. Please try again, or use Print.';
    } finally { setBusy(false); }
  });
  get('receipt-print-button').addEventListener('click', () => {
    let receipt;
    try { receipt = snapshot(); clearError(); } catch (error) { showError(error, true); return; }
    const printRoot = document.getElementById('receipt-print');
    printRoot.innerHTML = receiptMarkup(receipt);
    document.body.classList.add('printing-receipt');
    try { window.print(); } catch (error) {
      document.body.classList.remove('printing-receipt');
      errorBox.textContent = 'Printing is unavailable. Please download the PDF instead.';
    }
  });
  window.addEventListener('afterprint', () => {
    document.body.classList.remove('printing-receipt');
    document.getElementById('receipt-print').replaceChildren();
  });
  const clearDialog = get('receipt-clear-dialog');
  get('receipt-clear').addEventListener('click', () => clearDialog.showModal());
  get('receipt-clear-cancel').addEventListener('click', () => clearDialog.close());
  get('receipt-clear-confirm').addEventListener('click', () => {
    for (const id of ['receipt-name', 'receipt-phone', 'receipt-email']) get(id).value = '';
    items.replaceChildren(); manualDate = false; clearError(); feedback.textContent = '';
    addItem(); refreshDate(); clearDialog.close(); get('receipt-name').focus();
  });
  window.addEventListener('focus', () => { if (!root.hidden && !busy) refreshDate(); });
  date.value = malaysiaDate(); addItem(); refreshDate();
  return { refreshDate };
}
