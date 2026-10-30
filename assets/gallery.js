export function initGallery(root) {
  const slides = [...root.querySelectorAll('.gallery-slide')];
  const caption = root.querySelector('#gallery-title');
  const control = root.querySelector('#gallery-pause');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let paused = reduced.matches;
  let active = false;
  let index = 0;
  let timer;

  function select(next) {
    index = next;
    slides.forEach((slide, i) => {
      slide.classList.toggle('current', i === index);
      slide.setAttribute('aria-hidden', String(i !== index));
    });
    caption.textContent = slides[index].dataset.caption;
  }

  function advance() {
    for (let offset = 1; offset <= slides.length; offset++) {
      const next = (index + offset) % slides.length;
      if (slides[next].dataset.failed !== 'true') {
        select(next);
        return;
      }
    }
  }

  function sync() {
    window.clearInterval(timer);
    control.textContent = paused ? 'Resume photo switching' : 'Pause photo switching';
    control.setAttribute('aria-label', paused ? 'Resume automatic photo switching' : 'Pause automatic photo switching');
    control.setAttribute('aria-pressed', String(paused));
    if (active && !paused && !document.hidden) timer = window.setInterval(advance, 8000);
  }

  slides.forEach((slide, i) => {
    slide.style.objectPosition = slide.dataset.position;
    const failed = () => {
      slide.dataset.failed = 'true';
      if (index === i) advance();
    };
    slide.addEventListener('error', failed);
    if (slide.complete && !slide.naturalWidth) failed();
  });
  control.addEventListener('click', () => { paused = !paused; sync(); });
  reduced.addEventListener('change', event => { paused = event.matches; sync(); });
  document.addEventListener('visibilitychange', sync);
  sync();
  return { setActive(value) { active = value; sync(); } };
}
