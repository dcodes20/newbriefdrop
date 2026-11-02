/* BriefDrop – Onboarding step 2 interactions (progressive enhancement). */
(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const shake = (el) => { if (!reduce && el.animate) el.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-7px)' }, { transform: 'translateX(6px)' }, { transform: 'translateX(-4px)' }, { transform: 'translateX(2px)' }, { transform: 'translateX(0)' }], { duration: 380, easing: 'ease-out' }); };

  $$('[data-in]').forEach((el, i) => el.style.setProperty('--i', i));
  const levels = $$('.level');
  levels.forEach((l, i) => l.style.setProperty('--i', i));
  const title = $('.title');
  if (title && !reduce) {
    const text = title.textContent.trim();
    title.setAttribute('aria-label', text);
    title.textContent = '';
    text.split(/\s+/).forEach((word, i, all) => {
      const s = document.createElement('span');
      s.className = 'w'; s.setAttribute('aria-hidden', 'true'); s.style.setProperty('--i', i); s.textContent = word;
      title.append(s);
      if (i < all.length - 1) title.append(' ');
    });
  }

  const toast = $('#toast');
  let toastTimer = 0;
  const say = (msg) => { toast.textContent = msg; toast.classList.add('is-on'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('is-on'), 3200); };

  /* single select (radio semantics + arrow keys), remembered for the session */
  const sub = $('#sub'), KEY = 'briefdrop.level', original = sub.textContent;
  const store = {
    get() { try { return sessionStorage.getItem(KEY) || ''; } catch (_) { return ''; } },
    set(v) { try { sessionStorage.setItem(KEY, v); } catch (_) {} },
  };
  const current = () => levels.find((l) => l.getAttribute('aria-checked') === 'true');

  function select(l, focus) {
    levels.forEach((x) => { x.setAttribute('aria-checked', String(x === l)); x.tabIndex = x === l ? 0 : -1; });
    sub.textContent = original; sub.classList.remove('is-warn');
    store.set(l.dataset.level);
    if (focus) l.focus();
    if (!reduce) l.animate([{ scale: 1 }, { scale: 1.025, offset: .35 }, { scale: 1 }], { duration: 360, easing: 'cubic-bezier(.3,1.6,.5,1)' });
  }
  const saved = levels.find((l) => l.dataset.level === store.get());
  if (saved) select(saved, false);
  else levels.forEach((l, i) => { l.tabIndex = i === 0 ? 0 : -1; });

  levels.forEach((l, i) => {
    l.addEventListener('click', () => select(l, false));
    l.addEventListener('keydown', (e) => {
      const k = e.key;
      const d = (k === 'ArrowDown' || k === 'ArrowRight') ? 1 : (k === 'ArrowUp' || k === 'ArrowLeft') ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      select(levels[(i + d + levels.length) % levels.length], true);
    });
    if (finePointer) l.addEventListener('pointermove', (e) => {
      const r = l.getBoundingClientRect();
      l.style.setProperty('--mx', (e.clientX - r.left) + 'px'); l.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  /* Next */
  const next = $('#next'), label = $('.cta__label', next);
  next.addEventListener('click', () => {
    if (next.disabled) return;
    const sel = current();
    if (!sel) { sub.textContent = 'Pick the one that fits best'; sub.classList.add('is-warn'); shake($('#levels')); return; }
    next.disabled = true; next.classList.add('is-loading'); label.textContent = 'Saving';
    setTimeout(() => {
      location.href = 'onboarding-3.html';
    }, reduce ? 0 : 900);
  });

  if (finePointer && !reduce) {
    const glow = $('.glow');
    let frame = 0;
    addEventListener('pointermove', (e) => {
      if (frame) return;
      frame = requestAnimationFrame(() => { frame = 0; glow.style.setProperty('--gx', (e.clientX / innerWidth * 100).toFixed(1) + '%'); glow.style.setProperty('--gy', (e.clientY / innerHeight * 100).toFixed(1) + '%'); });
    }, { passive: true });
    next.addEventListener('pointermove', (e) => {
      const r = next.getBoundingClientRect();
      next.style.translate = `${((e.clientX - (r.left + r.width / 2)) * 0.1).toFixed(1)}px ${((e.clientY - (r.top + r.height / 2)) * 0.2).toFixed(1)}px`;
    });
    next.addEventListener('pointerleave', () => { next.style.translate = ''; });
  }
})();
