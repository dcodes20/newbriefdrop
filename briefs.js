/* BriefDrop – Briefs. A big pool of briefs (Claude via your backend, or a local remix) that is replaced every 24 hours. */
(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const IC = window.ICONS || {};
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (_) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) {} },
  };
  const toast = $('#toast');
  let toastTimer = 0;
  const say = (msg) => { toast.textContent = msg; toast.classList.add('is-on'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('is-on'), 2800); };

  const POOL_KEY = 'briefdrop.pool', DAY = 24 * 60 * 60 * 1000, POOL_SIZE = 24, DAILY_N = 3;
  const grid = $('#grid'), none = $('#none');
  const emptyDemo = new URLSearchParams(location.search).get('demo') === 'empty';
  if (emptyDemo) $('.tabs .tab').href = 'home-empty.html';

  /* ── state ─────────────────────────────────────────────────────────── */
  let saved = store.get('briefdrop.saved', []); if (!Array.isArray(saved)) saved = [];
  let started = new Set(store.get('briefdrop.started', []));
  const S = { pool: null, filters: new Set(), q: '', sort: 'foryou', busy: false };
  const isSaved = (b) => saved.some((s) => s.id === b.id || s.title === b.title);
  const mins = (b) => window.BriefAI.minutes(b.time);

  function norm(b) {
    const d = b.discipline || '';
    return { ...b, discipline: d || 'Design', category: b.category || 'Design', time: b.time || '3–5 hours',
      summary: b.summary || (Array.isArray(b.deliverables) && b.deliverables.length >= 3 ? `Start with ${b.deliverables[0].toLowerCase()}, then ${b.deliverables[1].toLowerCase()}, and finish with ${b.deliverables[2].toLowerCase()}.` : `A focused ${b.domain || 'design'} project to stretch your craft.`),
      deliverables: Array.isArray(b.deliverables) && b.deliverables.length ? b.deliverables : ['A first draft', 'A refined version', 'A short note on your choices'] };
  }

  /* ── the 24-hour pool ──────────────────────────────────────────────── */
  const validPool = (p) => p && Array.isArray(p.briefs) && p.briefs.length >= 12 && typeof p.expiresAt === 'number' && p.expiresAt > Date.now();

  async function makePool() {
    const t0 = performance.now();
    const prev = (store.get(POOL_KEY, null) || {}).briefs || [];
    const { briefs, source } = await window.BriefAI.generateMany(POOL_SIZE, { avoid: prev.map((b) => b.title) });
    const wait = 800 - (performance.now() - t0);
    if (wait > 0 && !reduce) await new Promise((r) => setTimeout(r, wait));
    const now = Date.now();
    const list = briefs.map((b, i) => ({ ...norm(b), daily: i < DAILY_N }));
    const pool = { createdAt: now, expiresAt: now + DAY, source, briefs: list };
    store.set(POOL_KEY, pool);
    return pool;
  }

  async function ensurePool({ force = false } = {}) {
    let p = force ? null : store.get(POOL_KEY, null);
    if (validPool(p)) { S.pool = { ...p, briefs: p.briefs.map((b) => ({ ...norm(b), daily: !!b.daily })) }; return false; }
    S.busy = true;
    paintSkeleton();
    try { S.pool = await makePool(); } finally { S.busy = false; }
    return true;
  }

  /* ── filters ───────────────────────────────────────────────────────── */
  const skill = (names) => (b) => names.includes(b.discipline);
  const PILLS = [
    { k: 'all', l: 'All' },
    { k: 'uiux', l: 'UI/UX', g: 'skill', t: skill(['UI/UX Design']) },
    { k: 'fe', l: 'Frontend', g: 'skill', t: skill(['Frontend Development']) },
    { k: 'brand', l: 'Brand', g: 'skill', t: skill(['Brand Design', 'Logo Design']) },
    { k: 'u1', l: 'Under 1 hour', g: 'time', t: (b) => mins(b) < 60 },
    { k: 'h13', l: '1–3 hours', g: 'time', t: (b) => { const m = mins(b); return m >= 60 && m <= 180; } },
    { k: 'int', l: 'Intermediate', g: 'level', t: (b) => b.level === 'Intermediate' },
    { k: 'daily', l: 'Daily Drop', g: 'set', t: (b) => !!b.daily },
    { k: 'saved', l: 'Saved', g: 'set', t: (b) => isSaved(b) },
    { k: 'copy', l: 'Copywriting', g: 'skill', t: skill(['Copywriting']) },
    { k: 'motion', l: 'Motion', g: 'skill', t: skill(['Motion Design', 'Video Editing']) },
    { k: 'beg', l: 'Beginner', g: 'level', t: (b) => b.level === 'Beginner' },
    { k: 'adv', l: 'Advanced', g: 'level', t: (b) => b.level === 'Advanced' || b.level === 'Expert' },
  ];
  const pillsEl = $('#pills');
  PILLS.forEach((p) => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'b-pill'; b.dataset.k = p.k; b.textContent = p.l; b.setAttribute('aria-pressed', 'false');
    pillsEl.append(b);
  });
  function syncPills() {
    $$('.b-pill', pillsEl).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.k === 'all' ? S.filters.size === 0 : S.filters.has(b.dataset.k))));
  }
  pillsEl.addEventListener('click', (e) => {
    const b = e.target.closest('.b-pill'); if (!b) return;
    const k = b.dataset.k;
    if (k === 'all') S.filters.clear(); else if (S.filters.has(k)) S.filters.delete(k); else S.filters.add(k);
    syncPills(); apply({ animate: true });
    if (!reduce) b.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.12)', offset: .4 }, { transform: 'scale(1)' }], { duration: 300, easing: 'cubic-bezier(.3,1.6,.5,1)' });
  });

  /* ── sort ──────────────────────────────────────────────────────────── */
  const LV = { Beginner: 0, Intermediate: 1, Advanced: 2, Expert: 3 };
  const SORTS = [
    ['foryou', 'For you', null],
    ['short', 'Shortest first', (a, b) => mins(a) - mins(b)],
    ['long', 'Longest first', (a, b) => mins(b) - mins(a)],
    ['easy', 'Easiest first', (a, b) => (LV[a.level] ?? 1) - (LV[b.level] ?? 1)],
    ['hard', 'Hardest first', (a, b) => (LV[b.level] ?? 1) - (LV[a.level] ?? 1)],
  ];
  const sortDlg = $('#sortdlg'), sortOpts = $('#sortopts');
  SORTS.forEach(([k, l]) => {
    const b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'radio'); b.dataset.k = k; b.textContent = l; b.setAttribute('aria-checked', String(k === S.sort));
    b.addEventListener('click', () => { S.sort = k; $$('button', sortOpts).forEach((x) => x.setAttribute('aria-checked', String(x.dataset.k === k))); sortDlg.close(); apply({ animate: true }); });
    sortOpts.append(b);
  });
  $('#funnel').addEventListener('click', () => sortDlg.showModal());

  /* ── search ────────────────────────────────────────────────────────── */
  const q = $('#q'), qclear = $('#qclear');
  let qTimer = 0;
  q.addEventListener('input', () => { qclear.hidden = !q.value; clearTimeout(qTimer); qTimer = setTimeout(() => { S.q = q.value.trim().toLowerCase(); apply({ animate: false }); }, 120); });
  qclear.addEventListener('click', () => { q.value = ''; S.q = ''; qclear.hidden = true; q.focus(); apply({ animate: false }); });
  $('#searchbtn').addEventListener('click', () => { scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); q.focus({ preventScroll: true }); });
  $('#reset').addEventListener('click', () => { S.filters.clear(); S.q = ''; q.value = ''; qclear.hidden = true; syncPills(); apply({ animate: true }); });

  /* ── rendering ─────────────────────────────────────────────────────── */
  const hay = (b) => [b.title, b.summary, b.domain, b.discipline, b.category, b.level, b.time].join(' ').toLowerCase();

  function visible() {
    const base = S.filters.has('saved') ? [...S.pool.briefs, ...saved.map(norm).filter((s) => !S.pool.briefs.some((b) => b.title === s.title))] : S.pool.briefs;
    const groups = {};
    S.filters.forEach((k) => { const p = PILLS.find((x) => x.k === k); if (p && p.g) (groups[p.g] = groups[p.g] || []).push(p.t); });
    let list = base.filter((b) => Object.values(groups).every((tests) => tests.some((t) => t(b))));
    if (S.q) { const words = S.q.split(/\s+/); list = list.filter((b) => { const h = hay(b); return words.every((w) => h.includes(w)); }); }
    const srt = SORTS.find((s) => s[0] === S.sort)[2];
    if (srt) list = list.slice().sort(srt);
    return list;
  }

  const cardHTML = (b, i, animate) => {
    const sv = isSaved(b);
    return `<article class="b-card${animate ? ' is-in' : ''}" data-id="${esc(b.id)}" style="--i:${i}" tabindex="0" role="group" aria-label="${esc(b.title)}">
      <div class="b-row"><span class="b-cat">${esc(b.category)}</span><span class="b-dur">${esc(b.time)}</span></div>
      <h2 class="b-name">${esc(b.title)}</h2>
      <p class="b-sum">${esc(b.summary)}</p>
      <div class="b-foot"><div class="b-tags"><span class="b-tag">${esc(b.discipline)}</span>${b.daily ? '<span class="b-tag b-tag--daily">Daily Drop</span>' : ''}${started.has(b.id) ? '<span class="b-tag b-tag--go">In progress</span>' : ''}</div>
      <button class="b-bm" type="button" data-bm="${esc(b.id)}" aria-pressed="${sv}" aria-label="${sv ? 'Remove from saved' : 'Save brief'}">${IC.bookmark || ''}</button></div>
    </article>`;
  };

  function paintSkeleton() {
    grid.classList.remove('is-fresh'); none.hidden = true;
    grid.innerHTML = Array.from({ length: 6 }, () => '<div class="b-card b-card--sk"><div class="sk sk--k"></div><div class="sk sk--t"></div><div class="sk sk--m"></div><div class="sk sk--m" style="width:30%"></div></div>').join('');
    $('#count').textContent = 'Thinking up fresh briefs…';
    $('#src').hidden = true;
  }

  function apply({ animate = false, fresh = false } = {}) {
    if (!S.pool) return;
    const list = emptyDemo ? [] : visible();
    const noSavedBriefs = !emptyDemo && S.filters.has('saved') && saved.length === 0;
    grid.classList.toggle('is-fresh', fresh);
    grid.innerHTML = list.map((b, i) => cardHTML(b, i, animate || fresh)).join('');
    none.hidden = list.length > 0;
    const emptyArt = $('.b-none__art');
    emptyArt.hidden = list.length > 0;
    if (emptyDemo) {
      emptyArt.src = 'assets/empty%20brief.png';
      emptyArt.alt = 'An illustration of a person searching for a brief.';
      $('.b-none__t').textContent = 'No briefs yet.';
      $('.b-none__s').textContent = 'New briefs will appear here when they’re available.';
      $('#reset').hidden = true;
    } else if (noSavedBriefs) {
      emptyArt.src = 'assets/no%20save.png';
      emptyArt.alt = 'An illustration representing saved briefs.';
      $('.b-none__t').textContent = 'No saved briefs yet.';
      $('.b-none__s').textContent = 'Tap the bookmark on any brief to save it for later.';
    } else {
      emptyArt.src = 'assets/empty%20brief.png';
      emptyArt.alt = 'An illustration of a person searching for a brief.';
      $('.b-none__t').textContent = 'No briefs match.';
      $('.b-none__s').textContent = 'Try fewer filters or a different word.';
    }
    const total = S.pool.briefs.length;
    $('#count').textContent = emptyDemo ? '' : list.length === total && !S.q && S.filters.size === 0 ? `${total} briefs` : `${list.length} of ${total} briefs`;
    $('#funnel').classList.toggle('is-active', S.filters.size > 0 || S.sort !== 'foryou');
    const src = $('#src'); src.hidden = emptyDemo;
    if (emptyDemo) return;
    src.className = 'src' + (S.pool.source === 'claude' ? ' src--claude' : '');
    src.textContent = S.pool.source === 'claude' ? '✦ Claude' : S.pool.source === 'mixed' ? 'Claude + offline' : 'Offline mix';
    src.title = S.pool.source === 'claude' ? 'Generated by Claude' : 'Claude couldn’t be reached for some or all of these, so they were remixed on your device';
  }

  /* ── 24-hour countdown ─────────────────────────────────────────────── */
  const dropEl = $('#drop');
  const pad = (n) => String(n).padStart(2, '0');
  function tick() {
    if (emptyDemo || !S.pool || S.busy) return;
    const left = S.pool.expiresAt - Date.now();
    if (left <= 0) { newDrop(); return; }
    const h = Math.floor(left / 3600000), m = Math.floor(left / 60000) % 60, s = Math.floor(left / 1000) % 60;
    dropEl.innerHTML = `New drop in <b>${pad(h)}:${pad(m)}:${pad(s)}</b>`;
  }
  setInterval(tick, 1000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) tick(); });

  async function newDrop() {
    if (S.busy) return;
    const was = !!S.pool;
    await ensurePool({ force: true });
    apply({ fresh: true }); tick();
    if (was) { say('A fresh set of briefs just dropped.'); scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); }
  }

  /* ── detail sheet ──────────────────────────────────────────────────── */
  const dlgD = $('#detail');
  let current = null;
  const findBrief = (id) => [...(S.pool ? S.pool.briefs : []), ...saved].find((b) => b.id === id);
  function openDetail(b) {
    b = norm(b); current = b;
    $('#d-kick').textContent = `${b.category.toUpperCase()}${started.has(b.id) ? ' · IN PROGRESS' : ''}`;
    $('#d-title').textContent = b.title;
    $('#d-sum').textContent = b.summary;
    $('#d-meta').innerHTML = `<span>${esc(b.domain || b.discipline)}</span><i></i><span>${esc(b.level)}</span><i></i><span>${esc(b.time)}</span>`;
    const list = $('#d-list'); list.replaceChildren();
    b.deliverables.forEach((d, i) => { const li = document.createElement('li'); li.innerHTML = `<label><input type="checkbox" data-i="${i}"><span class="box" aria-hidden="true">${IC.check || ''}</span><span class="txt-l">${esc(d)}</span></label>`; list.append(li); });
    $('#d-begin').textContent = started.has(b.id) ? 'Keep going' : 'Begin';
    syncSave(); prog();
    if (typeof dlgD.showModal === 'function' && !dlgD.open) dlgD.showModal();
  }
  function prog() { const bx = $$('#d-list input'); const n = bx.filter((x) => x.checked).length; $('#d-prog').textContent = bx.length ? (n === bx.length ? 'All done. Nice work.' : `${n} of ${bx.length} done`) : ''; }
  function syncSave() { const on = current && isSaved(current); const btn = $('#d-save'); btn.setAttribute('aria-pressed', String(Boolean(on))); $('span', btn).textContent = on ? 'Saved' : 'Save'; }
  $('#d-list').addEventListener('change', prog);
  $('#d-save').addEventListener('click', () => { if (current) toggleSave(current); syncSave(); });
  $('#d-begin').addEventListener('click', () => {
    if (!current) return;
    started.add(current.id); store.set('briefdrop.started', [...started]);
    dlgD.close(); say('Brief started. Good luck.'); apply({ animate: false });
  });

  function toggleSave(b) {
    const i = saved.findIndex((s) => s.id === b.id || s.title === b.title);
    if (i >= 0) { saved.splice(i, 1); say('Removed from saved.'); } else { saved.unshift(b); say('Saved.'); }
    store.set('briefdrop.saved', saved);
    const savedFilter = S.filters.has('saved');
    if (savedFilter) { apply({ animate: false }); return; }
    $$(`[data-bm="${CSS.escape(b.id)}"]`).forEach((btn) => {
      const on = isSaved(b); btn.setAttribute('aria-pressed', String(on)); btn.setAttribute('aria-label', on ? 'Remove from saved' : 'Save brief');
      btn.classList.remove('pop'); void btn.offsetWidth; btn.classList.add('pop');
    });
  }

  /* ── events ────────────────────────────────────────────────────────── */
  grid.addEventListener('click', (e) => {
    const bm = e.target.closest('[data-bm]');
    if (bm) { e.stopPropagation(); const b = findBrief(bm.dataset.bm); if (b) toggleSave(b); return; }
    const card = e.target.closest('.b-card[data-id]'); if (!card) return;
    const b = findBrief(card.dataset.id); if (b) openDetail(b);
  });
  grid.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('.b-card[data-id]')) { e.preventDefault(); const b = findBrief(e.target.dataset.id); if (b) openDetail(b); }
  });
  document.addEventListener('click', (e) => {
    const cl = e.target.closest('[data-close]'); if (cl) { cl.closest('dialog').close(); return; }
    if (e.target instanceof HTMLDialogElement) e.target.close();
  });
  $$('[data-soon]').forEach((t) => t.addEventListener('click', () => { t.classList.remove('bump'); void t.offsetWidth; t.classList.add('bump'); say(`${t.dataset.soon} isn’t built in this prototype yet.`); }));

  const top = $('#top'); let ticking = false;
  addEventListener('scroll', () => { if (ticking) return; ticking = true; requestAnimationFrame(() => { ticking = false; top.classList.toggle('is-stuck', scrollY > 4); }); }, { passive: true });
  if (finePointer && !reduce) {
    document.addEventListener('pointermove', (e) => {
      const c = e.target.closest && e.target.closest('.b-card'); if (!c) return;
      const r = c.getBoundingClientRect(); c.style.setProperty('--mx', (e.clientX - r.left) + 'px'); c.style.setProperty('--my', (e.clientY - r.top) + 'px');
    }, { passive: true });
  }

  /* ── boot ──────────────────────────────────────────────────────────── */
  (async () => {
    if (emptyDemo) {
      S.pool = { briefs: [], source: 'offline', expiresAt: Date.now() + DAY };
      apply();
      return;
    }
    const force = /[?&]fresh\b/.test(location.search);      // ?fresh → skip the cache and make a new drop now
    const made = await ensurePool({ force });
    syncPills(); apply({ fresh: made, animate: !made }); tick();
  })();
})();
