/* BriefDrop – Streak freeze popup page. Shares 'briefdrop.freeze' with Home. */
(() => {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const store = { get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (_) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) {} } };
  const weekId = () => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
  const fz = $('#fz'), go = $('#fz-go'), no = $('#fz-no');
  const leave = () => { if (reduce) { location.href = 'home.html'; return; } fz.classList.add('is-out'); setTimeout(() => { location.href = 'home.html'; }, 300); };

  const s = store.get('briefdrop.freeze', {});
  if (s.week === weekId() && s.used) { $('#fz-t').textContent = 'Streak already frozen'; $('#fz-s').textContent = 'You’ve used this week’s free freeze. A new one arrives on Monday.'; fz.classList.add('is-frozen'); go.disabled = true; go.textContent = 'Frozen'; no.textContent = 'Back to Home'; }

  go.addEventListener('click', () => {
    if (go.disabled) return; go.disabled = true; go.textContent = 'Frozen';
    store.set('briefdrop.freeze', { week: weekId(), used: true });
    fz.classList.add('is-frozen'); $('#fz-t').textContent = 'Streak frozen';
    $('#fz-s').textContent = 'A missed day this week won’t break your streak.';
    if (!reduce) { const r = $('#fz-flame').getBoundingClientRect();
      for (let i = 0; i < 14; i++) { const f = document.createElement('i'); f.className = 'fz-flake'; f.textContent = i % 3 ? '✦' : '❄'; f.style.cssText = `left:${r.left + r.width / 2}px;top:${r.top + r.height / 2}px`; document.body.append(f);
        const a = (i / 14) * Math.PI * 2, d = 50 + Math.random() * 70;
        f.animate([{ transform: 'translate(-50%,-50%) scale(.5)', opacity: 1 }, { transform: `translate(calc(-50% + ${Math.cos(a) * d}px), calc(-50% + ${Math.sin(a) * d + 30}px)) scale(1) rotate(180deg)`, opacity: 0 }], { duration: 1000 + Math.random() * 500, easing: 'cubic-bezier(.2,.7,.4,1)' }).onfinish = () => f.remove(); } }
    setTimeout(leave, reduce ? 0 : 1400);
  });
  no.addEventListener('click', (e) => { e.preventDefault(); leave(); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape') leave(); });
})();
