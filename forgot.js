/* BriefDrop – Forgot password interactions. */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

  $$('[data-in]').forEach((el, i) => el.style.setProperty('--i', i));
  const title = $('#ask .title');
  if (title && !reduce) {
    const text = title.textContent.trim();
    title.setAttribute('aria-label', text); title.textContent = '';
    text.split(/\s+/).forEach((w, i, all) => {
      const s = document.createElement('span'); s.className = 'w'; s.setAttribute('aria-hidden', 'true'); s.style.setProperty('--i', i); s.textContent = w; title.append(s);
      if (i < all.length - 1) title.append(' ');
    });
  }

  const toast = $('#toast'); let tt = 0;
  const say = (m) => { toast.textContent = m; toast.classList.add('is-on'); clearTimeout(tt); tt = setTimeout(() => toast.classList.remove('is-on'), 3000); };

  const form = $('#form'), cta = $('.cta', form), label = $('.cta__label', cta);
  form.addEventListener('submit', (e) => {
    e.preventDefault(); if (cta.disabled) return;
    cta.disabled = true; cta.classList.add('is-loading'); label.textContent = 'Continuing';
    setTimeout(() => { location.href = 'forgot-sent.html'; }, reduce ? 0 : 700);
  });

  if (finePointer && !reduce) {
    const glow = $('.glow'); let f = 0;
    addEventListener('pointermove', (e) => { if (f) return; f = requestAnimationFrame(() => { f = 0; glow.style.setProperty('--gx', (e.clientX / innerWidth * 100).toFixed(1) + '%'); glow.style.setProperty('--gy', (e.clientY / innerHeight * 100).toFixed(1) + '%'); }); }, { passive: true });
    cta.addEventListener('pointermove', (e) => { const r = cta.getBoundingClientRect(); cta.style.translate = `${((e.clientX - (r.left + r.width / 2)) * .1).toFixed(1)}px ${((e.clientY - (r.top + r.height / 2)) * .2).toFixed(1)}px`; });
    cta.addEventListener('pointerleave', () => { cta.style.translate = ''; });
  }
})();
