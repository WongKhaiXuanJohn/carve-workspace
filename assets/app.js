import { modules, moduleForHash } from './modules.js?v=1096f3594a';
import { initGallery } from './gallery.js';
import { initHeater } from './heater-ui.js?v=e4202b7930';
import { initReceipt } from './receipt-ui.js?v=7412f3e918';

const side = document.getElementById('sidebar');
const menu = document.getElementById('menu');
const closeButton = document.getElementById('menu-close');
const overlay = document.getElementById('overlay');
const mobile = window.matchMedia('(max-width: 760px)');
const gallery = initGallery(document.querySelector('.gallery'));

document.getElementById('skip-content').addEventListener('click', event => {
  event.preventDefault();
  document.getElementById('main').focus();
});

document.getElementById('module-nav').innerHTML = modules.map(module => `
  <a class="nav" href="#${module.path}" data-page="${module.id}">
    <svg viewBox="0 0 20 20" aria-hidden="true">${module.icon}</svg>
    <span>${module.label}</span>${module.available === false ? '<span class="dot" aria-label="Coming soon"></span>' : ''}
  </a>`).join('');

document.getElementById('tools-list').innerHTML = modules.slice(1).map((module, index) => `
  <article class="tool"><span class="number">${String(index + 1).padStart(2, '0')}</span>
    <div><h3>${module.title || module.label}${module.tag ? ` <span class="tag">${module.tag}</span>` : ''}</h3><p>${module.description}</p></div>
    <a href="#${module.path}" data-page="${module.id}" class="${module.available ? 'action' : 'text-button'}" aria-label="${module.available ? 'Open' : 'Preview'} ${module.label}">
      ${module.available ? 'Open tool <b aria-hidden="true">→</b>' : '<span class="soon"><i aria-hidden="true"></i>Coming soon <span aria-hidden="true">→</span></span>'}
    </a></article>`).join('');

function setMenu(open, returnFocus = false) {
  side.classList.toggle('open', open);
  overlay.classList.toggle('open', open);
  menu.setAttribute('aria-expanded', String(open));
  side.inert = mobile.matches && !open;
  if (open && mobile.matches) {
    side.setAttribute('role', 'dialog');
    side.setAttribute('aria-modal', 'true');
    side.setAttribute('aria-label', 'Workspace navigation');
  } else {
    side.removeAttribute('role');
    side.removeAttribute('aria-modal');
    side.removeAttribute('aria-label');
  }
  if (returnFocus) menu.focus();
}

function renderRoute(focusHeading = true) {
  const module = moduleForHash(window.location.hash);
  document.querySelectorAll('.page').forEach(page => { page.hidden = page.id !== module.id; });
  document.querySelectorAll('.nav').forEach(link => {
    const selected = link.dataset.page === module.id;
    link.classList.toggle('active', selected);
    if (selected) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  document.getElementById('breadcrumb').textContent = `Workspace / ${module.label}`;
  document.title = `${module.label} · Carve Workspace`;
  gallery.setActive(module.id === 'home');
  if (module.id === 'receipt') receipt.refreshDate();
  setMenu(false);
  if (focusHeading) {
    const heading = document.querySelector(`#${module.id} h1`);
    heading.setAttribute('tabindex', '-1');
    heading.focus({ preventScroll: true });
  }
  window.scrollTo({ top: 0, behavior: 'instant' });
}

document.addEventListener('click', event => {
  const trigger = event.target.closest('[data-page]');
  if (!trigger || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button > 0) return;
  const module = modules.find(item => item.id === trigger.dataset.page);
  if (!module) return;
  event.preventDefault();
  if (window.location.hash === `#${module.path}`) renderRoute();
  else window.location.hash = module.path;
});
window.addEventListener('hashchange', () => renderRoute());
menu.addEventListener('click', () => {
  const open = !side.classList.contains('open');
  setMenu(open);
  if (open) closeButton.focus();
});
closeButton.addEventListener('click', () => setMenu(false, true));
overlay.addEventListener('click', () => setMenu(false, true));
mobile.addEventListener('change', () => setMenu(false));
document.addEventListener('keydown', event => {
  if (!side.classList.contains('open')) return;
  if (event.key === 'Escape') { setMenu(false, true); return; }
  if (event.key !== 'Tab') return;
  const controls = [...side.querySelectorAll('button, a[href]')];
  const first = controls[0];
  const last = controls.at(-1);
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
});

document.getElementById('workspace-date').textContent = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Kuala_Lumpur', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
}).format(new Date());
initHeater(document.getElementById('heater'));
const receipt = initReceipt(document.getElementById('receipt'));
renderRoute(false);
