import { buildSchedule, buildWhatsappUrl, DEFAULT_CLASSES, DEFAULT_WHATSAPP } from './heater.js';

export function initHeater(root) {
  const get = id => root.querySelector(`#${id}`);
  const form = get('heater-form');
  const times = [...DEFAULT_CLASSES];
  const dateParts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kuala_Lumpur', year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(new Date()).map(part => [part.type, part.value]));
  get('heater-date').value = `${dateParts.year}-${dateParts.month}-${dateParts.day}`;
  get('heater-phone').value = DEFAULT_WHATSAPP;
  let plan;

  function update() {
    get('heater-feedback').textContent = '';
    try {
      plan = buildSchedule({ date: get('heater-date').value, pic: get('heater-pic').value, times });
      get('heater-message').textContent = plan.message;
      get('heater-count').textContent = `${plan.classCount} ${plan.classCount === 1 ? 'class' : 'classes'}`;
      get('heater-error').textContent = '';
      get('heater-copy').disabled = false;
      get('heater-generate').disabled = false;
    } catch (error) {
      plan = null;
      get('heater-error').textContent = error.message;
      get('heater-message').textContent = 'Your heater schedule will appear here when the date and class times are ready.';
      get('heater-count').textContent = 'Check details';
      get('heater-copy').disabled = true;
      get('heater-generate').disabled = true;
    }
    const whatsapp = get('heater-whatsapp');
    try {
      if (!plan) throw new Error('');
      whatsapp.href = buildWhatsappUrl(plan.message, get('heater-phone').value);
      whatsapp.removeAttribute('aria-disabled');
      whatsapp.removeAttribute('tabindex');
      get('heater-phone-error').textContent = '';
    } catch (error) {
      whatsapp.removeAttribute('href');
      whatsapp.setAttribute('aria-disabled', 'true');
      whatsapp.setAttribute('tabindex', '-1');
      get('heater-phone-error').textContent = plan ? error.message : '';
    }
  }

  function renderTimes(focusIndex = null) {
    const container = get('heater-times');
    container.replaceChildren();
    times.forEach((time, index) => {
      const row = document.createElement('div');
      row.className = 'class-row';
      const label = document.createElement('label');
      label.className = 'class-field';
      label.htmlFor = `class-time-${index}`;
      label.textContent = `Class ${index + 1}`;
      const input = document.createElement('input');
      input.type = 'time';
      input.id = label.htmlFor;
      input.value = time;
      input.setAttribute('aria-label', `Class ${index + 1} start time`);
      input.addEventListener('input', () => { times[index] = input.value; update(); });
      label.append(input);
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'remove-class';
      remove.textContent = '×';
      remove.setAttribute('aria-label', `Remove class ${index + 1}`);
      remove.disabled = times.length === 1;
      remove.addEventListener('click', () => {
        times.splice(index, 1);
        renderTimes(Math.min(index, times.length - 1));
        update();
      });
      row.append(label, remove);
      container.append(row);
    });
    if (focusIndex !== null) get(`class-time-${focusIndex}`)?.focus();
  }

  ['heater-date', 'heater-pic', 'heater-phone'].forEach(id => get(id).addEventListener('input', update));
  get('heater-add').addEventListener('click', () => { times.push(''); renderTimes(times.length - 1); update(); });
  form.addEventListener('submit', event => {
    event.preventDefault();
    update();
    if (!plan) return;
    get('heater-output-title').focus({ preventScroll: true });
    get('heater-output').scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
    get('heater-feedback').textContent = 'Schedule ready to copy or share.';
  });
  get('heater-whatsapp').addEventListener('click', event => {
    if (get('heater-whatsapp').getAttribute('aria-disabled') === 'true') event.preventDefault();
  });
  get('heater-copy').addEventListener('click', async () => {
    if (!plan) return;
    try {
      await navigator.clipboard.writeText(plan.message);
      get('heater-feedback').textContent = 'Schedule copied to clipboard.';
    } catch {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(get('heater-message'));
      selection.removeAllRanges();
      selection.addRange(range);
      get('heater-feedback').textContent = 'The schedule is selected. Use Copy from your browser menu.';
    }
  });
  renderTimes();
  update();
}
