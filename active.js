/* BriefDrop – Active brief: countdown, deliverables, notes, ship */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const IC = window.ICONS || {};
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const store = { get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (_) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) {} } };
  const sess = (k) => { try { return JSON.parse(sessionStorage.getItem(k)); } catch (_) { return null; } };
  const toast = $('#toast'); let tt = 0;
  const say = (m) => { toast.textContent = m; toast.classList.add('is-on'); clearTimeout(tt); tt = setTimeout(() => toast.classList.remove('is-on'), 2800); };

  /* ── which brief ─────────────────────────────────────────────── */
  const DEMO = { id: 'demo-save', title: 'Design a calm savings experience for young adults', category: 'UI/UX', level: 'Intermediate', time: '4 weeks', deliverables: ['user flow', 'high-fidelity UI', 'wireframes', 'clickable prototype'] };
  const params = new URLSearchParams(location.search), demo = params.has('demo');
  const pool = (store.get('briefdrop.pool', null) || {}).briefs || [], saved = store.get('briefdrop.saved', []);
  const all = [...pool, ...(Array.isArray(saved) ? saved : []), store.get('briefdrop.first', null), sess('briefdrop.project'), sess('briefdrop.first')].filter(Boolean);
  const id = params.get('id');
  const B = demo ? DEMO : (id && all.find((b) => b.id === id)) || sess('briefdrop.project') || (() => { const s = store.get('briefdrop.started', []); return all.find((b) => s.includes(b.id)); })();
  if (!B) { location.replace('active-empty.html'); return; }
  const demoish = B === DEMO;
  const progKey = `briefdrop.progress.${B.id}`, timerKey = `briefdrop.timer.${B.id}`, notesKey = `briefdrop.notes.${B.id}`;
  if (!demoish) { const st = new Set(store.get('briefdrop.started', [])); st.add(B.id); store.set('briefdrop.started', [...st]); }

  /* ── fill ────────────────────────────────────────────────────── */
  $('#title').textContent = B.title;
  const cat = B.category || (B.discipline || 'Design');
  $('#meta').innerHTML = [cat, B.level, B.time].filter(Boolean).map(esc).join('<i></i>');
  $('#view').href = demoish ? 'project.html?demo' : 'project.html?id=' + encodeURIComponent(B.id);
  $$('.act-body > *').forEach((el, i) => el.style.setProperty('--i', i));
  const dels = (B.deliverables && B.deliverables.length ? B.deliverables : ['A first draft', 'A refined version']);
  let done = new Set(store.get(progKey, demo ? [0] : []));
  $('#del').innerHTML = dels.map((d, i) => `<label><input type="checkbox" data-i="${i}"${done.has(i) ? ' checked' : ''}><span class="box" aria-hidden="true">${IC.check || ''}</span><span class="t">${esc(d)}</span></label>`).join('');

  /* ── timer ───────────────────────────────────────────────────── */
  const total = Math.max(60, window.BriefAI.minutes(B.time) * 60) * 1000;
  let T = store.get(timerKey, null);
  if (!T || demo) T = { end: Date.now() + (demo ? ((2 * 60 + 14) * 60 + 37) * 1000 : total), total: demo ? total : total, paused: false, left: 0, shipped: false };
  const save = () => store.set(timerKey, T);
  const left = () => T.shipped ? T.left : T.paused ? T.left : Math.max(0, T.end - Date.now());
  const p2 = (n) => String(n).padStart(2, '0');
  const clockEl = $('#clock'), timeEl = $('#time'); let last = '';
  function paint() {
    const ms = left(), s = Math.ceil(ms / 1000), d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60), sec = s % 60;
    const txt = `${d ? `<span class="d">${d}d</span>` : ''}${p2(h)}<span class="c">:</span>${p2(m)}<span class="c">:</span>${p2(sec)}`;
    if (txt !== last) { timeEl.innerHTML = txt; last = txt; if (!reduce && !T.paused && !T.shipped) { timeEl.classList.remove('tick'); void timeEl.offsetWidth; timeEl.classList.add('tick'); } }
    timeEl.classList.toggle('is-long', d > 0 || h > 99);
    $('#track').style.transform = `scaleX(${Math.max(0, Math.min(1, ms / T.total))})`;
    clockEl.classList.toggle('is-low', !T.shipped && ms > 0 && ms < 3600000 && ms / T.total < .1);
    clockEl.classList.toggle('is-up', !T.shipped && ms <= 0);
    clockEl.classList.toggle('is-paused', !!T.paused && !T.shipped);
    clockEl.classList.toggle('is-shipped', !!T.shipped);
    $('#cap').textContent = T.shipped ? 'Shipped' : ms <= 0 ? 'Time’s up. Wrap it up and ship.' : T.paused ? 'Paused' : 'Time remaining';
    timeEl.setAttribute('aria-label', `${d ? d + ' days ' : ''}${h} hours ${m} minutes ${sec} seconds ${T.shipped ? 'shipped' : 'remaining'}`);
  }
  setInterval(paint, 250); document.addEventListener('visibilitychange', paint);
  const pauseBtn = $('#pause');
  function syncPause() { pauseBtn.textContent = T.paused ? 'Resume' : 'Pause'; pauseBtn.classList.toggle('is-on', !!T.paused); pauseBtn.setAttribute('aria-pressed', String(!!T.paused)); }
  pauseBtn.addEventListener('click', () => {
    if (T.shipped) return;
    if (T.paused) { T.end = Date.now() + T.left; T.paused = false; say('Clock running again.'); }
    else { T.left = left(); T.paused = true; say('Paused. Take a breather.'); }
    if (!demo) save(); syncPause(); paint();
  });

  /* ── deliverables ────────────────────────────────────────────── */
  function confetti(r) {
    if (reduce) return; const cx = r.left + r.width / 2, cy = r.top + r.height / 2, cols = ['#faae1f', '#f9e8c3', '#185adb', '#7aa5ff', '#3ecf8e', '#fff'];
    for (let i = 0; i < 26; i++) { const e = document.createElement('i'); const s = 5 + Math.random() * 6;
      e.style.cssText = `position:fixed;z-index:200;pointer-events:none;left:${cx}px;top:${cy}px;width:${s}px;height:${s * (i % 3 ? 1 : 2)}px;border-radius:${i % 2 ? '50%' : '2px'};background:${cols[i % 6]}`; document.body.append(e);
      const a = -Math.PI / 2 + (Math.random() - .5) * 2.6, dist = 80 + Math.random() * 150;
      e.animate([{ transform: 'translate(-50%,-50%)', opacity: 1 }, { transform: `translate(calc(-50% + ${Math.cos(a) * dist}px), calc(-50% + ${Math.sin(a) * dist + 110}px)) rotate(${Math.random() * 540}deg)`, opacity: 0 }], { duration: 1000 + Math.random() * 500, easing: 'cubic-bezier(.2,.7,.4,1)' }).onfinish = () => e.remove(); }
  }
  const ship = $('#ship');
  function count() {
    const n = $$('#del input').filter((x) => x.checked).length, all = n === dels.length;
    $('#cnt').innerHTML = all ? 'All delivered. Time to ship.' : `<b>${n}</b> of ${dels.length} delivered`;
    ship.classList.toggle('is-ready', all && !T.shipped);
  }
  $('#del').addEventListener('change', (e) => {
    done = new Set($$('#del input').filter((x) => x.checked).map((x) => +x.dataset.i)); if (!demo) store.set(progKey, [...done]);
    count();
    if (!demoish && done.size !== dels.length) window.BriefDropNotifications.record({
      id: `progress:${B.id}`, type: 'progress', title: 'Brief progress updated',
      text: `${done.size} of ${dels.length} deliverables are complete for "${B.title}".`,
      href: 'active.html?id=' + encodeURIComponent(B.id),
    });
    if (e.target.checked && done.size === dels.length) {
      confetti(e.target.nextElementSibling.getBoundingClientRect());
      if (!demoish) window.BriefDropNotifications.record({
        id: `complete:${B.id}`, type: 'progress', title: 'Deliverables complete',
        text: `You finished all deliverables for "${B.title}". Ready to ship?`,
        href: 'ship.html?id=' + encodeURIComponent(B.id),
      });
    }
  });

  /* ── notes ───────────────────────────────────────────────────── */
  const ta = $('#notes'), sv = $('#saved'); let nt = 0;
  ta.value = store.get(notesKey, '') || '';
  const grow = () => { ta.style.height = 'auto'; ta.style.height = Math.max(100, ta.scrollHeight + 3) + 'px'; };
  ta.addEventListener('input', () => { grow(); clearTimeout(nt); nt = setTimeout(() => { if (!demo) store.set(notesKey, ta.value); sv.textContent = 'Saved'; sv.classList.add('is-on'); setTimeout(() => sv.classList.remove('is-on'), 1200); }, 500); });

  /* ── ship ────────────────────────────────────────────────────── */
  const sdlg = $('#sdlg');
  function doShip() {
    T.left = left(); T.shipped = true; if (!demo) save();
    const sh = store.get('briefdrop.shipped', []); if (!demo && Array.isArray(sh) && !sh.includes(B.id)) { sh.push(B.id); store.set('briefdrop.shipped', sh); }
    if (!demoish) window.BriefDropNotifications.record({
      id: `ship:${B.id}`, type: 'ship', title: 'Project shipped',
      text: `"${B.title}" is shipped. Your Ship Kit is ready to build.`,
      href: 'ship.html?id=' + encodeURIComponent(B.id),
    });
    $('.cta__label', ship).textContent = 'Shipped'; ship.disabled = true; pauseBtn.disabled = true; pauseBtn.style.opacity = .4;
    confetti(ship.getBoundingClientRect()); say('Shipped. Nice work.'); count(); paint();
    const shipParams = new URLSearchParams(location.search); shipParams.set('id', B.id);
    location.href = 'ship.html?' + shipParams.toString();
  }
  ship.addEventListener('click', () => {
    if (T.shipped) return;
    const n = done.size;
    if (n === dels.length) return doShip();
    $('#sd-s').textContent = `You’ve ticked off ${n} of ${dels.length} deliverables. You can still ship, but the rest will stay unfinished.`;
    sdlg.showModal();
  });
  $('#sd-go').addEventListener('click', () => { sdlg.close(); doShip(); });
  sdlg.addEventListener('click', (e) => { if (e.target === sdlg || e.target.closest('[data-close]')) sdlg.close(); });

  /* ── menu ────────────────────────────────────────────────────── */
  const more = $('#more'), menu = $('#menu');
  const closeMenu = () => { menu.hidden = true; more.setAttribute('aria-expanded', 'false'); };
  more.addEventListener('click', (e) => { e.stopPropagation(); menu.hidden = !menu.hidden; more.setAttribute('aria-expanded', String(!menu.hidden)); });
  document.addEventListener('click', (e) => { if (!e.target.closest('.n-more')) closeMenu(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });
  menu.addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]'); if (!b) return; closeMenu();
    if (b.dataset.act === 'brief') location.href = $('#view').href;
    if (b.dataset.act === 'restart') { T = { end: Date.now() + total, total, paused: false, left: 0, shipped: false }; if (!demo) save(); ship.disabled = false; $('.cta__label', ship).textContent = 'Ship it'; pauseBtn.disabled = false; pauseBtn.style.opacity = ''; syncPause(); count(); paint(); say('Timer restarted.'); }
    if (b.dataset.act === 'copy') { const u = location.href; (navigator.clipboard ? navigator.clipboard.writeText(u) : Promise.reject()).then(() => say('Link copied.'), () => say('Couldn’t copy. Copy it from the address bar.')); }
    if (b.dataset.act === 'abandon') location.href = 'build.html';
  });

  $$('[data-soon]').forEach((t) => t.addEventListener('click', () => say(`${t.dataset.soon} isn’t built yet.`)));
  addEventListener('scroll', () => $('#top').classList.toggle('is-stuck', scrollY > 4), { passive: true });

  if (T.shipped) { $('.cta__label', ship).textContent = 'Shipped'; ship.disabled = true; pauseBtn.disabled = true; pauseBtn.style.opacity = .4; }
  if (!demo) save(); syncPause(); count(); paint(); grow();
})();
