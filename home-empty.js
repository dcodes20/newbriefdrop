/* BriefDrop – first-time Home. "Gimme a brief" asks BriefAI (Claude via your backend, or a local remix) for a fresh brief every time. */
(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const toast = $('#toast');
  let toastTimer = 0;
  const say = (msg) => { toast.textContent = msg; toast.classList.add('is-on'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('is-on'), 2800); };

  /* intro: headline words rise */
  const title = $('.empty__title');
  if (title && !reduce) {
    const text = title.textContent.trim();
    title.setAttribute('aria-label', text); title.textContent = '';
    text.split(/\s+/).forEach((w, i, a) => {
      const s = document.createElement('span'); s.className = 'w'; s.setAttribute('aria-hidden', 'true'); s.style.setProperty('--i', i); s.textContent = w;
      title.append(s); if (i < a.length - 1) title.append(' ');
    });
  }

  /* illustration: pointer parallax + click to scatter question marks */
  const art = $('#art'), img = $('.empty__img', art);
  if (finePointer && !reduce) {
    let frame = 0;
    addEventListener('pointermove', (e) => {
      if (frame) return;
      frame = requestAnimationFrame(() => { frame = 0; art.style.setProperty('--px', ((e.clientX / innerWidth) - .5).toFixed(3)); art.style.setProperty('--py', ((e.clientY / innerHeight) - .5).toFixed(3)); });
    }, { passive: true });
  }
  const glyphs = ['?', '?', '!', '✦'];
  const colors = ['#f9e8c3', '#faae1f', '#7aa5ff', '#ffffff'];
  function scatter(x, y, n = 9) {
    if (reduce) return;
    for (let i = 0; i < n; i++) {
      const g = document.createElement('span'); g.className = 'glyph'; g.textContent = glyphs[i % glyphs.length];
      g.style.cssText = `left:${x}px;top:${y}px;font-size:${14 + Math.random() * 16}px;color:${colors[i % colors.length]}`;
      document.body.append(g);
      const a = -Math.PI / 2 + (Math.random() - .5) * 2.4, d = 60 + Math.random() * 110;
      g.animate([{ transform: 'translate(-50%,-50%) scale(.4) rotate(0)', opacity: 0 }, { transform: `translate(calc(-50% + ${Math.cos(a) * d}px), calc(-50% + ${Math.sin(a) * d}px)) scale(1) rotate(${Math.random() * 60 - 30}deg)`, opacity: 1, offset: .35 }, { transform: `translate(calc(-50% + ${Math.cos(a) * d * 1.2}px), calc(-50% + ${Math.sin(a) * d + 70}px)) scale(.7) rotate(${Math.random() * 120 - 60}deg)`, opacity: 0 }], { duration: 1000 + Math.random() * 500, easing: 'cubic-bezier(.2,.7,.4,1)' }).onfinish = () => g.remove();
    }
  }
  art.addEventListener('click', (e) => {
    scatter(e.clientX, e.clientY);
    if (!reduce) img.animate([{ transform: 'rotate(0) scale(1)' }, { transform: 'rotate(-1.8deg) scale(1.03)', offset: .3 }, { transform: 'rotate(1.3deg) scale(1.015)', offset: .6 }, { transform: 'rotate(0) scale(1)' }], { duration: 600, easing: 'cubic-bezier(.3,1.2,.5,1)' });
  });

  /* header + nav */
  const bell = $('#bell');
  bell.addEventListener('click', () => { bell.classList.remove('ring'); void bell.offsetWidth; bell.classList.add('ring'); say('No notifications yet.'); });
  $$('[data-soon]').forEach((t) => t.addEventListener('click', () => { t.classList.remove('bump'); void t.offsetWidth; t.classList.add('bump'); say(`${t.dataset.soon} isn’t built in this prototype yet.`); }));
})();
