import { buildSchedule, buildWhatsappUrl, DEFAULT_CLASSES, DEFAULT_WHATSAPP } from './heater.js';
import { sortClasses } from './class-times.js?v=39acec4e06';

export function initHeater(root) {
  const get = id => root.querySelector(`#${id}`);
  const form = get('heater-form');
  let nextClassId = 0;
  let classes = DEFAULT_CLASSES.map(time => ({ id: nextClassId++, time }));
  const views = new Map();
  let renderingTimes = false;
  const dateParts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kuala_Lumpur', year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(new Date()).map(part => [part.type, part.value]));
  get('heater-date').value = `${dateParts.year}-${dateParts.month}-${dateParts.day}`;
  get('heater-phone').value = DEFAULT_WHATSAPP;
  let plan;

  function update() {
    get('heater-feedback').textContent = '';
    try {
      plan = buildSchedule({ date: get('heater-date').value, pic: get('heater-pic').value, times: classes.map(item => item.time) });
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

  function renderTimes(focusId = null) {
    if (renderingTimes) return;
    renderingTimes = true;
    const container = get('heater-times');
    const active = container.contains(document.activeElement) ? document.activeElement : null;
    classes = sortClasses(classes);
    for (const [id, view] of views) {
      if (!classes.some(item => item.id === id)) {
        view.row.remove();
        views.delete(id);
      }
    }
    classes.forEach((item, index) => {
      let view = views.get(item.id);
      if (!view) {
        const row = document.createElement('div');
        row.className = 'class-row';
        const label = document.createElement('label');
        label.className = 'class-field';
        label.htmlFor = `class-time-${item.id}`;
        const title = document.createElement('span');
        const input = document.createElement('input');
        input.type = 'time';
        input.id = label.htmlFor;
        input.value = item.time;
        input.addEventListener('input', () => { item.time = input.value; update(); });
        // Sort committed time edits, keeping the same input node and its identity.
        input.addEventListener('change', () => { item.time = input.value; renderTimes(); update(); });
        input.addEventListener('blur', () => { renderTimes(); });
        label.append(title, input);
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'remove-class';
        remove.textContent = '×';
        remove.addEventListener('click', () => {
          const removedIndex = classes.indexOf(item);
          classes = classes.filter(entry => entry !== item);
          const next = classes[Math.min(removedIndex, classes.length - 1)];
          renderTimes(next?.id);
          update();
        });
        row.append(label, remove);
        view = { row, title, input, remove };
        views.set(item.id, view);
      }
      view.title.textContent = `Class ${index + 1}`;
      view.input.setAttribute('aria-label', `Class ${index + 1} start time`);
      view.remove.setAttribute('aria-label', `Remove class ${index + 1}`);
      view.remove.disabled = classes.length === 1;
      if (container.children[index] !== view.row) container.insertBefore(view.row, container.children[index] || null);
    });
    if (focusId !== null) views.get(focusId)?.input.focus({ preventScroll: true });
    else if (active?.isConnected && document.activeElement !== active) active.focus({ preventScroll: true });
    renderingTimes = false;
  }

  ['heater-date', 'heater-pic', 'heater-phone'].forEach(id => get(id).addEventListener('input', update));
  get('heater-add').addEventListener('click', () => {
    const item = { id: nextClassId++, time: '' };
    classes.push(item);
    renderTimes(item.id);
    update();
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    renderTimes();
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
