/* BriefDrop – Reset password success interactions. */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  $$('[data-in]').forEach((el, i) => el.style.setProperty('--i', i));
  const title = $('.title');
  if (!reduce) { const t = title.textContent.trim(); title.setAttribute('aria-label', t); title.textContent = '';
    t.split(/\s+/).forEach((w, i, all) => { const s = document.createElement('span'); s.className = 'w'; s.setAttribute('aria-hidden', 'true'); s.style.setProperty('--i', i); s.textContent = w; title.append(s); if (i < all.length - 1) title.append(' '); }); }

  function confetti(x, y, n = 26) {
    const cols = ['#faae1f', '#f9e8c3', '#185adb', '#7aa5ff', '#3ecf8e', '#fff'];
    for (let i = 0; i < n; i++) {
      const d = document.createElement('i'), s = 5 + Math.random() * 6;
      d.style.cssText = `position:fixed;left:${x}px;top:${y}px;width:${s}px;height:${s * (i % 3 ? 1 : 2)}px;border-radius:${i % 2 ? '50%' : '2px'};background:${cols[i % 6]};pointer-events:none;z-index:60`; document.body.append(d);
      const a = -Math.PI / 2 + (Math.random() - .5) * 2.6, dist = 90 + Math.random() * 160;
      d.animate([{ transform: 'translate(-50%,-50%)', opacity: 1 }, { transform: `translate(calc(-50% + ${Math.cos(a) * dist}px), calc(-50% + ${Math.sin(a) * dist + 120}px)) rotate(${Math.random() * 540}deg)`, opacity: 0 }], { duration: 1200 + Math.random() * 600, easing: 'cubic-bezier(.2,.7,.4,1)' }).onfinish = () => d.remove();
    }
  }
  if (!reduce) { setTimeout(() => confetti(innerWidth / 2, Math.min(innerHeight * .3, 260)), 450); $('#art').addEventListener('click', (e) => confetti(e.clientX, e.clientY, 14)); }

  if (finePointer && !reduce) {
    const glow = $('.glow'), art = $('.art img'), cta = $('#go'); let f = 0;
    addEventListener('pointermove', (e) => { if (f) return; f = requestAnimationFrame(() => { f = 0;
      glow.style.setProperty('--gx', (e.clientX / innerWidth * 100).toFixed(1) + '%'); glow.style.setProperty('--gy', (e.clientY / innerHeight * 100).toFixed(1) + '%');
      art.style.setProperty('--px', (e.clientX / innerWidth - .5).toFixed(3)); art.style.setProperty('--py', (e.clientY / innerHeight - .5).toFixed(3)); }); }, { passive: true });
    cta.addEventListener('pointermove', (e) => { const r = cta.getBoundingClientRect(); cta.style.translate = `${((e.clientX - (r.left + r.width / 2)) * .1).toFixed(1)}px ${((e.clientY - (r.top + r.height / 2)) * .2).toFixed(1)}px`; });
    cta.addEventListener('pointerleave', () => { cta.style.translate = ''; });
  }
})();
