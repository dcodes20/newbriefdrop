/* BriefDrop – Onboarding step 3 interactions (progressive enhancement). */
(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

  $$('[data-in]').forEach((el, i) => el.style.setProperty('--i', i));
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

  /* confetti: a quick celebratory burst */
  const colors = ['#185adb', '#f9e8c3', '#faae1f', '#3ecf8e', '#7aa5ff'];
  function burst(x, y, n = 26) {
    if (reduce) return;
    for (let i = 0; i < n; i++) {
      const b = document.createElement('span');
      b.className = 'bit';
      b.style.cssText = `left:${x}px;top:${y}px;background:${colors[i % colors.length]};`;
      document.body.append(b);
      const a = (Math.PI * 2 * i) / n + Math.random() * .5, d = 70 + Math.random() * 150;
      const dx = Math.cos(a) * d, dy = Math.sin(a) * d - 60;
      b.animate(
        [{ transform: 'translate(-50%,-50%) rotate(0) scale(1)', opacity: 1 },
         { transform: `translate(${dx}px, ${dy}px) rotate(${Math.random() * 540 - 270}deg) scale(1)`, opacity: 1, offset: .55 },
         { transform: `translate(${dx * 1.1}px, ${dy + 120}px) rotate(${Math.random() * 720 - 360}deg) scale(.6)`, opacity: 0 }],
        { duration: 1100 + Math.random() * 500, easing: 'cubic-bezier(.2,.7,.4,1)' }
      ).onfinish = () => b.remove();
    }
  }
  const t = $('.title');
  setTimeout(() => { const r = t.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height / 2); }, reduce ? 0 : 700);

  /* illustration: pointer parallax + click to celebrate again */
  const done = $('#done'), img = $('.done__img', done);
  if (finePointer && !reduce) {
    let frame = 0;
    addEventListener('pointermove', (e) => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        done.style.setProperty('--px', ((e.clientX / innerWidth) - .5).toFixed(3));
        done.style.setProperty('--py', ((e.clientY / innerHeight) - .5).toFixed(3));
        const g = $('.glow'); g.style.setProperty('--gx', (e.clientX / innerWidth * 100).toFixed(1) + '%'); g.style.setProperty('--gy', (e.clientY / innerHeight * 100).toFixed(1) + '%');
      });
    }, { passive: true });
  }
  done.addEventListener('click', (e) => {
    burst(e.clientX, e.clientY, 18);
    if (!reduce) img.animate([{ transform: 'rotate(0) scale(1)' }, { transform: 'rotate(-1.6deg) scale(1.03)', offset: .3 }, { transform: 'rotate(1.2deg) scale(1.015)', offset: .6 }, { transform: 'rotate(0) scale(1)' }], { duration: 600, easing: 'cubic-bezier(.3,1.2,.5,1)' });
  });

  /* ── matched briefs: choose from what was picked in steps 1–2 ───────────── */
  const read = (k, fallback) => { try { const v = sessionStorage.getItem(k); return v == null ? fallback : v; } catch (_) { return fallback; } };
  let skills = []; try { skills = JSON.parse(read('briefdrop.skills', '[]')); } catch (_) {}
  const level = read('briefdrop.level', '');

  const BRIEFS = {
    ui: { chip: 'UI/UX Design', color: '#3ecf8e', title: 'Fintech app design.',
      text: 'You’ll own the design of our core workflow, the part of the product where users spend 80% of their time and where most of our drop-off happens.', img: 'assets/card-fintech.png' },
    write: { chip: 'Writing', color: '#7aa5ff', title: 'One story. Five hooks.',
      text: 'Turn a tiny everyday moment into five opening lines that make people want to read on.', lines: ['What if...', 'Nobody told', 'you this?'] },
    visual: { chip: 'Visual storytelling', color: '#faae1f', title: 'Find your fresh angle.',
      text: 'Take three photos of one object. Change the light, the crop, and the story it tells.', img: 'assets/card-visual.png' },
  };
  const MAP = { 'UI/UX Design': 'ui', 'Frontend Development': 'ui', 'Copywriting': 'write' };   // everything else is visual
  const keyFor = (s) => MAP[s] || 'visual';
  const matched = [...new Set(skills.map(keyFor))];
  const order = [...matched, ...Object.keys(BRIEFS).filter((k) => !matched.includes(k))];
  let idx = 0;

  const dlg = $('#pick');
  const E = { art: $('#pick-art'), why: $('#pick-why'), chip: $('#pick-chip'), dot: $('#pick-dot'), chipText: $('#pick-chip-text'), title: $('#pick-title'), text: $('#pick-text') };

  function show(animate) {
    const key = order[idx], b = BRIEFS[key];
    E.art.replaceChildren();
    if (b.img) { const im = new Image(); im.src = b.img; im.alt = ''; E.art.append(im); }
    else { const d = document.createElement('div'); d.className = 'art-text'; b.lines.forEach((l, n) => { const s = document.createElement('span'); s.textContent = l; if (n === 1) s.className = 'accent'; d.append(s); }); E.art.append(d); }
    const isMatch = matched.includes(key);
    E.why.textContent = isMatch
      ? `Matched to ${skills.filter((s) => keyFor(s) === key).join(' + ')}${level ? ` · ${level}` : ''}`
      : 'Something different to stretch you';
    E.chip.style.color = b.color; E.chipText.textContent = b.chip;
    E.title.textContent = b.title; E.text.textContent = b.text;
    if (animate && !reduce) {
      E.art.firstElementChild.animate([{ opacity: 0, transform: 'translateY(-60px) rotate(-14deg) scale(.8)' }, { opacity: 1, transform: 'translateY(6px) rotate(3deg)', offset: .6 }, { opacity: 1, transform: 'none' }], { duration: 650, easing: 'cubic-bezier(.3,1.3,.5,1)' });
      [E.why, E.chip, E.title, E.text].forEach((el, n) => el.animate([{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: 420, delay: 100 + n * 60, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'backwards' }));
    }
  }

  const cta = $('#show');
  if (finePointer && !reduce) {
    cta.addEventListener('pointermove', (e) => { const r = cta.getBoundingClientRect(); cta.style.translate = `${((e.clientX - (r.left + r.width / 2)) * 0.1).toFixed(1)}px ${((e.clientY - (r.top + r.height / 2)) * 0.2).toFixed(1)}px`; });
    cta.addEventListener('pointerleave', () => { cta.style.translate = ''; });
  }
  $('#pick-next').addEventListener('click', () => { idx = (idx + 1) % order.length; show(true); });
  $('.pick__close', dlg).addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
})();
