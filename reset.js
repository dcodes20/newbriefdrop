/* BriefDrop – Reset password interactions. */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  $$('[data-in]').forEach((el, i) => el.style.setProperty('--i', i));
  const title = $('#ask .title');
  if (!reduce) { const t = title.textContent.trim(); title.setAttribute('aria-label', t); title.textContent = '';
    t.split(/\s+/).forEach((w, i, all) => { const s = document.createElement('span'); s.className = 'w'; s.setAttribute('aria-hidden', 'true'); s.style.setProperty('--i', i); s.textContent = w; title.append(s); if (i < all.length - 1) title.append(' '); }); }

  const toast = $('#toast'); let tt = 0;
  const say = (m) => { toast.textContent = m; toast.classList.add('is-on'); clearTimeout(tt); tt = setTimeout(() => toast.classList.remove('is-on'), 3000); };

  const pw = $('#pw'), pw2 = $('#pw2'), meter = $('#meter'), bars = $$('.meter__bars i'), mt = $('#meter-t');
  const wraps = $$('.field'), form = $('#form'), cta = $('.cta', form), label = $('.cta__label', cta);
  const state = (v) => ({ len: v.length >= 8, let: /[a-z]/i.test(v), num: /\d/.test(v) });
  const score = (v) => { let s = 0; const st = state(v); if (st.len) s++; if (st.let && st.num) s++; if (v.length >= 12) s++; if (/[^a-z0-9]/i.test(v) && /[A-Z]/.test(v)) s++; return v ? Math.max(1, s) : 0; };
  const words = ['Use 8+ characters with a letter and a number.', 'Too weak, keep going.', 'Okay, make it longer.', 'Good password.', 'Strong password.'];
  let last = 0;

  function paint() {
    const v = pw.value, st = state(v), s = score(v);
    meter.dataset.s = s; mt.textContent = words[s];
    if (s !== last && s > last && !reduce) bars[s - 1].classList.remove('pop'), void bars[s - 1].offsetWidth, bars[s - 1].classList.add('pop');
    last = s;
    $$('.rules li').forEach((li) => { const k = li.dataset.r; li.classList.toggle('ok', k === 'match' ? !!pw2.value && pw2.value === v : st[k]); });
  }
  const msgs = {
    pw: (v) => (!v ? 'Enter a new password.' : v.length < 8 ? 'Use at least 8 characters.' : !/[a-z]/i.test(v) || !/\d/.test(v) ? 'Include a letter and a number.' : ''),
    pw2: (v) => (!v ? 'Confirm your new password.' : v !== pw.value ? 'Passwords don’t match.' : ''),
  };
  function check(input, show) {
    const wrap = input.closest('.field'), m = msgs[input.id](input.value), was = wrap.classList.contains('is-invalid');
    wrap.classList.toggle('is-invalid', !!m && show); input.setAttribute('aria-invalid', String(!!m && show));
    if (m && show) $('.field__err', wrap).textContent = m;
    if (m && show && !was && !reduce) wrap.animate([{ transform: 'none' }, { transform: 'translateX(-7px)' }, { transform: 'translateX(6px)' }, { transform: 'translateX(-4px)' }, { transform: 'translateX(2px)' }, { transform: 'none' }], { duration: 380, easing: 'ease-out' });
    return !m;
  }
  const touched = new Set();
  [pw, pw2].forEach((input) => {
    const wrap = input.closest('.field'), sync = () => wrap.classList.toggle('has-value', input.value.length > 0);
    input.addEventListener('input', () => { sync(); paint(); if (touched.has(input)) check(input, true); if (input === pw && touched.has(pw2)) check(pw2, true); });
    input.addEventListener('blur', () => { if (input.value) { touched.add(input); check(input, true); } });
    sync();
  });
  $$('.field__toggle').forEach((t) => {
    const input = t.parentElement.querySelector('input');
    t.addEventListener('click', () => {
      const show = t.getAttribute('aria-pressed') !== 'true';
      t.setAttribute('aria-pressed', String(show)); t.setAttribute('aria-label', (show ? 'Hide ' : 'Show ') + (input.id === 'pw' ? 'password' : 'confirmation'));
      const a = input.selectionStart, b = input.selectionEnd; input.type = show ? 'text' : 'password'; input.focus({ preventScroll: true }); try { input.setSelectionRange(a, b); } catch (_) {}
      if (!reduce) t.animate([{ transform: 'scale(1)' }, { transform: 'scale(.7,.15)', offset: .4 }, { transform: 'scale(1)' }], { duration: 280, easing: 'ease-out' });
    });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault(); if (cta.disabled) return;
    cta.disabled = true; cta.classList.add('is-loading'); label.textContent = 'Continuing';
    setTimeout(() => {
      location.href = 'reset-done.html';
    }, reduce ? 0 : 1000);
  });

  if (finePointer && !reduce) {
    const glow = $('.glow'); let f = 0;
    addEventListener('pointermove', (e) => { if (f) return; f = requestAnimationFrame(() => { f = 0; glow.style.setProperty('--gx', (e.clientX / innerWidth * 100).toFixed(1) + '%'); glow.style.setProperty('--gy', (e.clientY / innerHeight * 100).toFixed(1) + '%'); }); }, { passive: true });
    cta.addEventListener('pointermove', (e) => { const r = cta.getBoundingClientRect(); cta.style.translate = `${((e.clientX - (r.left + r.width / 2)) * .1).toFixed(1)}px ${((e.clientY - (r.top + r.height / 2)) * .2).toFixed(1)}px`; });
    cta.addEventListener('pointerleave', () => { cta.style.translate = ''; });
  }
})();
