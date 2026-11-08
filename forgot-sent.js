/* BriefDrop – Forgot password success interactions. */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  $$('[data-in]').forEach((el, i) => el.style.setProperty('--i', i));

  const title = $('.title');
  if (!reduce) {
    const t = title.textContent.trim(); title.setAttribute('aria-label', t); title.textContent = '';
    t.split(/\s+/).forEach((w, i, all) => { const s = document.createElement('span'); s.className = 'w'; s.setAttribute('aria-hidden', 'true'); s.style.setProperty('--i', i); s.textContent = w; title.append(s); if (i < all.length - 1) title.append(' '); });
  }
  const toast = $('#toast'); let tt = 0;
  const say = (m) => { toast.textContent = m; toast.classList.add('is-on'); clearTimeout(tt); tt = setTimeout(() => toast.classList.remove('is-on'), 3200); };
  $('#reset').addEventListener('click', () => { location.href = 'reset.html'; });

  const again = $('#again'); let n = 0, timer = 0;
  const html = again.innerHTML;
  again.addEventListener('click', () => {
    if (again.disabled) return;
    say('Reset email isn’t connected in this prototype, so nothing was actually sent.');
    n = 30; again.disabled = true;
    const tick = () => { if (n <= 0) { clearInterval(timer); again.disabled = false; again.innerHTML = html; } else again.textContent = `You can try again in ${n--}s`; };
    tick(); timer = setInterval(tick, 1000);
    if (!reduce) $('#art').animate([{ transform: 'none' }, { transform: 'scale(1.03) rotate(-.8deg)' }, { transform: 'none' }], { duration: 500, easing: 'cubic-bezier(.3,1.5,.5,1)' });
  });

  if (finePointer && !reduce) {
    const glow = $('.glow'), art = $('.art img'); let f = 0;
    addEventListener('pointermove', (e) => { if (f) return; f = requestAnimationFrame(() => { f = 0;
      glow.style.setProperty('--gx', (e.clientX / innerWidth * 100).toFixed(1) + '%'); glow.style.setProperty('--gy', (e.clientY / innerHeight * 100).toFixed(1) + '%');
      art.style.setProperty('--px', (e.clientX / innerWidth - .5).toFixed(3)); art.style.setProperty('--py', (e.clientY / innerHeight - .5).toFixed(3)); }); }, { passive: true });
    const cta = $('#reset');
    cta.addEventListener('pointermove', (e) => { const r = cta.getBoundingClientRect(); cta.style.translate = `${((e.clientX - (r.left + r.width / 2)) * .1).toFixed(1)}px ${((e.clientY - (r.top + r.height / 2)) * .2).toFixed(1)}px`; });
    cta.addEventListener('pointerleave', () => { cta.style.translate = ''; });
  }
})();
