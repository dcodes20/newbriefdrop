/* BriefDrop – Saved: everything you bookmarked on Home / Briefs (localStorage 'briefdrop.saved'). */
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
  const toast = $('#toast'); let tt = 0;
  const say = (msg, undo, ms = 2800) => {
    toast.textContent = msg;
    if (undo) { const b = document.createElement('button'); b.type = 'button'; b.className = 'undo'; b.textContent = 'Undo'; b.addEventListener('click', () => { undo(); toast.classList.remove('is-on'); }); toast.append(b); }
    toast.classList.add('is-on'); clearTimeout(tt); tt = setTimeout(() => toast.classList.remove('is-on'), undo ? 5000 : ms);
  };

  let saved = store.get('briefdrop.saved', []); if (!Array.isArray(saved)) saved = [];
  const started = new Set(store.get('briefdrop.started', []));
  const mins = (b) => window.BriefAI.minutes(b.time);
  const norm = (b) => ({ ...b, discipline: b.discipline || 'Design', category: b.category || b.discipline || 'Design', domain: b.domain || '', level: b.level || 'Intermediate', time: b.time || '3–5 hours',
    summary: b.summary || (Array.isArray(b.deliverables) && b.deliverables.length >= 3 ? `Start with ${b.deliverables[0].toLowerCase()}, then ${b.deliverables[1].toLowerCase()}, and finish with ${b.deliverables[2].toLowerCase()}.` : `A focused ${b.domain || 'design'} project to stretch your craft.`),
    deliverables: Array.isArray(b.deliverables) && b.deliverables.length ? b.deliverables : ['A first draft', 'A refined version', 'A short note on your choices'] });
  const persist = () => store.set('briefdrop.saved', saved);

  const S = { filters: new Set(), q: '', edit: false, sel: new Set() };
  const skill = (n) => (b) => n.includes(b.discipline);
  const PILLS = [
    { k: 'all', l: 'All' },
    { k: 'uiux', l: 'UI/UX', g: 'skill', t: skill(['UI/UX Design']) },
    { k: 'fe', l: 'Frontend', g: 'skill', t: skill(['Frontend Development']) },
    { k: 'brand', l: 'Brand', g: 'skill', t: skill(['Brand Design', 'Logo Design']) },
    { k: 'u1', l: 'Under 1 hour', g: 'time', t: (b) => mins(b) < 60 },
    { k: 'h13', l: '1–3 hours', g: 'time', t: (b) => { const m = mins(b); return m >= 60 && m <= 180; } },
    { k: 'int', l: 'Intermediate', g: 'level', t: (b) => b.level === 'Intermediate' },
    { k: 'daily', l: 'Daily Drop', g: 'set', t: (b) => !!b.daily },
  ];
  const grid = $('#grid'), empty = $('#empty'), pillsEl = $('#pills'), q = $('#q'), qclear = $('#qclear');
  PILLS.forEach((p) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'b-pill'; b.dataset.k = p.k; b.textContent = p.l; b.setAttribute('aria-pressed', 'false'); pillsEl.append(b); });
  const syncPills = () => $$('.b-pill', pillsEl).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.k === 'all' ? S.filters.size === 0 : S.filters.has(b.dataset.k))));
  pillsEl.addEventListener('click', (e) => {
    const b = e.target.closest('.b-pill'); if (!b) return; const k = b.dataset.k;
    if (k === 'all') S.filters.clear(); else if (S.filters.has(k)) S.filters.delete(k); else S.filters.add(k);
    syncPills(); render(true);
    if (!reduce) b.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.12)', offset: .4 }, { transform: 'scale(1)' }], { duration: 300, easing: 'cubic-bezier(.3,1.6,.5,1)' });
  });
  let qt = 0;
  q.addEventListener('input', () => { qclear.hidden = !q.value; clearTimeout(qt); qt = setTimeout(() => { S.q = q.value.trim().toLowerCase(); render(false); }, 120); });
  qclear.addEventListener('click', () => { q.value = ''; S.q = ''; qclear.hidden = true; q.focus(); render(false); });

  const hay = (b) => [b.title, b.summary, b.domain, b.discipline, b.category, b.level, b.time].join(' ').toLowerCase();
  function visible() {
    const groups = {};
    S.filters.forEach((k) => { const p = PILLS.find((x) => x.k === k); if (p && p.g) (groups[p.g] = groups[p.g] || []).push(p.t); });
    let list = saved.map(norm).filter((b) => Object.values(groups).every((t) => t.some((f) => f(b))));
    if (S.q) { const w = S.q.split(/\s+/); list = list.filter((b) => { const h = hay(b); return w.every((x) => h.includes(x)); }); }
    return list;
  }

  function card(b, i, anim) {
    const meta = [b.domain || b.category, b.level, b.time].filter(Boolean).map((m) => `<span>${esc(m)}</span>`).join('<i></i>');
    return `<article class="b-card s-card${anim ? ' is-in' : ''}${S.sel.has(b.id) ? ' is-sel' : ''}" data-id="${esc(b.id)}" style="--i:${i}" tabindex="0" role="group" aria-label="${esc(b.title)}">
      <div class="s-top"><div class="s-meta">${meta}</div><span class="s-check" aria-hidden="true">${IC.check || ''}</span></div>
      <h2 class="b-name">${esc(b.title)}</h2>
      <p class="b-sum">${esc(b.summary)}</p>
      <div class="b-foot"><div class="b-tags"><span class="b-tag">${esc(b.discipline)}</span>${b.daily ? '<span class="b-tag b-tag--daily">Daily Drop</span>' : ''}${started.has(b.id) ? '<span class="b-tag b-tag--go">In progress</span>' : ''}</div>
      <button class="b-bm" type="button" data-bm="${esc(b.id)}" aria-pressed="true" aria-label="Remove from saved">${IC.bookmark || ''}</button></div>
    </article>`;
  }

  function render(anim = false) {
    const list = visible();
    grid.innerHTML = list.map((b, i) => card(b, i, anim)).join('');
    const none = list.length === 0, total = saved.length;
    empty.hidden = !none;
    if (none) {
      const filtered = total > 0;
      $('#empty-t').textContent = filtered ? 'Nothing matches' : 'Nothing saved yet';
      $('#empty-s').textContent = filtered ? 'Try loosening the filters or search for something else.' : 'Tap the bookmark on any brief to keep it here for later.';
      const cta = $('#empty-cta'); $('.cta__label', cta).textContent = filtered ? 'Clear filters' : 'Browse briefs';
      cta.href = filtered ? '#' : 'briefs.html'; cta.dataset.clear = filtered ? '1' : '';
    }
    $('#count').textContent = total ? (list.length === total ? `${total} saved ${total === 1 ? 'brief' : 'briefs'}` : `${list.length} of ${total} saved`) : '';
    $('#edit').hidden = total === 0;
    if (total === 0 && S.edit) setEdit(false);
    paintBar();
  }
  $('#empty-cta').addEventListener('click', (e) => { if (e.currentTarget.dataset.clear) { e.preventDefault(); S.filters.clear(); S.q = ''; q.value = ''; qclear.hidden = true; syncPills(); render(true); } });

  /* ── remove with undo ── */
  function removeIds(ids, label) {
    const gone = saved.map((b, i) => ({ b, i })).filter((x) => ids.has(x.b.id));
    if (!gone.length) return;
    const finish = () => {
      saved = saved.filter((b) => !ids.has(b.id)); gone.forEach((g) => S.sel.delete(g.b.id)); persist(); render(false);
      say(label || `${gone.length} removed.`, () => { gone.slice().sort((a, b) => a.i - b.i).forEach((g) => saved.splice(Math.min(g.i, saved.length), 0, g.b)); persist(); render(true); });
    };
    const els = reduce ? [] : ids.size ? $$('.s-card').filter((c) => ids.has(c.dataset.id)) : [];
    if (!els.length) return finish();
    els.forEach((c) => c.classList.add('is-out')); setTimeout(finish, 330);
  }

  grid.addEventListener('click', (e) => {
    const card = e.target.closest('.s-card'); if (!card) return; const id = card.dataset.id;
    if (S.edit) { toggleSel(id); return; }
    const bm = e.target.closest('[data-bm]');
    if (bm) { e.stopPropagation(); removeIds(new Set([id]), 'Removed from saved.'); return; }
    const b = saved.find((x) => x.id === id); if (b) openDetail(norm(b));
  });
  grid.addEventListener('keydown', (e) => { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('.s-card')) { e.preventDefault(); e.target.click(); } });

  /* ── edit mode ── */
  const bar = $('#bar'), rm = $('#rm'), edit = $('#edit');
  function toggleSel(id) { S.sel.has(id) ? S.sel.delete(id) : S.sel.add(id); const c = $$('.s-card').find((x) => x.dataset.id === id); if (c) c.classList.toggle('is-sel', S.sel.has(id)); paintBar(); }
  function paintBar() {
    const n = S.sel.size, vis = visible();
    rm.disabled = n === 0; $('span', rm).textContent = n ? `Remove ${n}` : 'Remove';
    $('#selall').textContent = vis.length && vis.every((b) => S.sel.has(b.id)) ? 'Deselect all' : 'Select all';
  }
  function setEdit(on) {
    S.edit = on; S.sel.clear(); document.body.classList.toggle('editing', on);
    edit.setAttribute('aria-pressed', String(on)); edit.textContent = on ? 'Done' : 'Edit'; bar.hidden = !on;
    $$('.s-card').forEach((c) => c.classList.remove('is-sel')); paintBar();
  }
  edit.addEventListener('click', () => setEdit(!S.edit));
  $('#selall').addEventListener('click', () => { const vis = visible(), all = vis.every((b) => S.sel.has(b.id)); vis.forEach((b) => (all ? S.sel.delete(b.id) : S.sel.add(b.id))); $$('.s-card').forEach((c) => c.classList.toggle('is-sel', S.sel.has(c.dataset.id))); paintBar(); });
  rm.addEventListener('click', () => { if (S.sel.size) removeIds(new Set(S.sel)); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && S.edit && !$('dialog[open]')) setEdit(false); });

  /* ── detail sheet ── */
  const dlg = $('#detail'); let current = null;
  function openDetail(b) {
    current = b;
    $('#d-kick').textContent = `${b.category.toUpperCase()}${started.has(b.id) ? ' · IN PROGRESS' : ''}`;
    $('#d-title').textContent = b.title; $('#d-sum').textContent = b.summary;
    $('#d-meta').innerHTML = `<span>${esc(b.domain || b.discipline)}</span><i></i><span>${esc(b.level)}</span><i></i><span>${esc(b.time)}</span>`;
    const list = $('#d-list'); list.replaceChildren();
    b.deliverables.forEach((d, i) => { const li = document.createElement('li'); li.innerHTML = `<label><input type="checkbox" data-i="${i}"><span class="box" aria-hidden="true">${IC.check || ''}</span><span class="txt-l">${esc(d)}</span></label>`; list.append(li); });
    $('#d-begin').textContent = started.has(b.id) ? 'Keep going' : 'Begin';
    const btn = $('#d-save'); btn.setAttribute('aria-pressed', 'true'); $('span', btn).textContent = 'Saved';
    prog(); if (!dlg.open) dlg.showModal();
  }
  const prog = () => { const bx = $$('#d-list input'), n = bx.filter((x) => x.checked).length; $('#d-prog').textContent = bx.length ? (n === bx.length ? 'All done. Nice work.' : `${n} of ${bx.length} done`) : ''; };
  $('#d-list').addEventListener('change', prog);
  $('#d-save').addEventListener('click', () => { if (!current) return; const b = current; dlg.close(); removeIds(new Set([b.id]), 'Removed from saved.'); });
  $('#d-begin').addEventListener('click', () => { if (!current) return; started.add(current.id); store.set('briefdrop.started', [...started]); dlg.close(); say('Brief started. Good luck.'); render(false); });
  document.addEventListener('click', (e) => { const cl = e.target.closest('[data-close]'); if (cl) { cl.closest('dialog').close(); return; } if (e.target instanceof HTMLDialogElement) e.target.close(); });

  $$('[data-soon]').forEach((t) => t.addEventListener('click', () => { t.classList.remove('bump'); void t.offsetWidth; t.classList.add('bump'); say(`${t.dataset.soon} isn’t built in this prototype yet.`); }));
  $('#back').addEventListener('click', (e) => { if (history.length > 1 && document.referrer && new URL(document.referrer).origin === location.origin) { e.preventDefault(); history.back(); } });

  const top = $('#top'); let tk = false;
  addEventListener('scroll', () => { if (tk) return; tk = true; requestAnimationFrame(() => { tk = false; top.classList.toggle('is-stuck', scrollY > 4); }); }, { passive: true });
  addEventListener('storage', (e) => { if (e.key === 'briefdrop.saved') { saved = store.get('briefdrop.saved', []); render(false); } });
  if (finePointer && !reduce) document.addEventListener('pointermove', (e) => { const c = e.target.closest && e.target.closest('.b-card'); if (!c) return; const r = c.getBoundingClientRect(); c.style.setProperty('--mx', (e.clientX - r.left) + 'px'); c.style.setProperty('--my', (e.clientY - r.top) + 'px'); }, { passive: true });

  /* ?demo seeds a few saved briefs so the screen can be previewed (only when nothing is saved) */
  if (/[?&]demo\b/.test(location.search) && !saved.length) {
    saved = [
      { id: 'demo-1', title: 'Design a calm savings experience for young adults', domain: 'Fintech', level: 'Intermediate', time: '3–5 hours', discipline: 'UI/UX Design', category: 'UI/UX Design', summary: 'Make saving simple and build toward what matters most. Set personal goals, automate your savings, and track your progress—all in one place, at your own pace.', deliverables: ['User flow', 'Key screens', 'Short case note'] },
      { id: 'demo-2', title: 'Build a responsive pricing page with a billing toggle', domain: 'SaaS', level: 'Beginner', time: '45 minutes', discipline: 'Frontend Development', category: 'Frontend', summary: 'Ship a clean, accessible pricing page with monthly and yearly plans that switches smoothly between billing periods.', deliverables: ['Responsive layout', 'Billing toggle', 'Accessible markup'] },
      { id: 'demo-3', title: 'Create a visual identity for a neighbourhood coffee roaster', domain: 'Food & Drink', level: 'Intermediate', time: '1–3 hours', discipline: 'Brand Design', category: 'Brand', summary: 'Craft a logo, palette and packaging sketch that feels warm, local and a little bold.', deliverables: ['Logo', 'Colour palette', 'Packaging sketch'] },
    ];
    persist();
  }
  syncPills(); render(true);
})();
