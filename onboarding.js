/* BriefDrop – Onboarding step 1 interactions (progressive enhancement). */
(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* intro */
  $$('[data-in]').forEach((el, i) => el.style.setProperty('--i', i));
  $$('.chip').forEach((c, i) => c.style.setProperty('--i', i));
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

  /* selection (remembered for the session so a refresh/back keeps it) */
  const chips = $$('.chip');
  const sub = $('#sub');
  const KEY = 'briefdrop.skills';
  const store = {
    get() { try { return JSON.parse(sessionStorage.getItem(KEY) || '[]'); } catch (_) { return []; } },
    set(v) { try { sessionStorage.setItem(KEY, JSON.stringify(v)); } catch (_) {} },
  };
  const picked = () => chips.filter((c) => c.getAttribute('aria-pressed') === 'true').map((c) => c.textContent.trim());

  function renderSub(bump) {
    const n = picked().length;
    sub.classList.remove('is-warn');
    sub.textContent = n === 0 ? 'Pick one or more' : n === 1 ? '1 picked' : `${n} picked`;
    if (bump && n && !reduce) sub.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.12)', offset: .4 }, { transform: 'scale(1)' }], { duration: 300, easing: 'cubic-bezier(.3,1.6,.5,1)' });
  }

  const saved = store.get();
  chips.forEach((c) => { if (saved.includes(c.textContent.trim())) c.setAttribute('aria-pressed', 'true'); });
  renderSub(false);

  chips.forEach((c) => {
    c.addEventListener('click', () => {
      c.setAttribute('aria-pressed', String(c.getAttribute('aria-pressed') !== 'true'));
      store.set(picked());
      renderSub(true);
    });
    // desktop: chips lean toward the pointer
    if (finePointer && !reduce) {
      c.addEventListener('pointermove', (e) => {
        const r = c.getBoundingClientRect();
        c.style.translate = `${((e.clientX - (r.left + r.width / 2)) * 0.08).toFixed(1)}px -3px`;
      });
      c.addEventListener('pointerleave', () => { c.style.translate = ''; });
    }
  });

  /* Next */
  const next = $('#next'), label = $('.cta__label', next);
  next.addEventListener('click', () => {
    if (next.disabled) return;
    const sel = picked();
    if (!sel.length) {
      sub.textContent = 'Pick at least one to continue'; sub.classList.add('is-warn');
      if (!reduce) $('#chips').animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-7px)' }, { transform: 'translateX(6px)' }, { transform: 'translateX(-4px)' }, { transform: 'translateX(2px)' }, { transform: 'translateX(0)' }], { duration: 380, easing: 'ease-out' });
      return;
    }
    next.disabled = true; next.classList.add('is-loading'); label.textContent = 'Saving';
    setTimeout(() => {
      location.href = 'onboarding-2.html';
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
