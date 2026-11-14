/* BriefDrop – You (profile). Real numbers from localStorage; ?demo shows the Figma example. */
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
  const qs = new URLSearchParams(location.search), demo = qs.has('demo'), demoEmpty = qs.get('demo') === 'empty';
  const num = (k) => +store.get(k, 0) || 0;
  $$('.y-head > *, .y-stats, .y-sec').forEach((el, i) => el.style.setProperty('--i', i));

  /* ── data ────────────────────────────────────────────────────── */
  const pool = (store.get('briefdrop.pool', null) || {}).briefs || [], saved = store.get('briefdrop.saved', []);
  const known = [...pool, ...(Array.isArray(saved) ? saved : []), store.get('briefdrop.first', null), sess('briefdrop.project')].filter(Boolean);
  const byId = (id) => known.find((b) => b.id === id);
  const startedIds = store.get('briefdrop.started', []), shippedIds = store.get('briefdrop.shipped', []);
  const fmtDate = (t) => { const d = new Date(t); return [d.getDate(), d.getMonth() + 1, d.getFullYear() % 100].map((n) => String(n).padStart(2, '0')).join('/'); };
  const cat = (b) => (b && (b.category && b.category !== 'Design' ? b.category : (b.discipline || 'Design').replace(' Design', ''))) || 'Design';

  let D;
  if (demo) {
    D = { name: 'Dcodes', xp: 1240, streak: 4, shipped: 5, months: 8, skills: [['UI/UX Design', 80]], avoided: [],
      builds: [{ name: 'OyaPay', cat: 'UI/UX', date: '29/10/26', status: 'ship', href: 'kit.html?demo' }, { name: 'OyaPay', cat: 'UI/UX', date: '29/10/26', status: 'ab', href: 'project.html?demo' }],
      badges: { first: true, remix: true, exp: true, week: false, ten: false, early: false } };
    if (demoEmpty) D.builds = [];
  } else {
    const rows = [...new Set([...startedIds, ...shippedIds])].map((id) => {
      const b = byId(id) || {}, kit = store.get('briefdrop.shipkit.' + id, null), tm = store.get('briefdrop.timer.' + id, null);
      const shipped = shippedIds.includes(id), at = (kit && kit.at) || (tm && tm.end ? tm.end - (tm.total || 0) : Date.now());
      return { id, name: (b.client || b.domain || b.title || 'Untitled brief'), cat: cat(b), date: fmtDate(at), at, status: shipped ? 'ship' : 'go', href: shipped ? 'kit.html?id=' + encodeURIComponent(id) : 'active.html?id=' + encodeURIComponent(id), disc: b.discipline || 'UI/UX Design' };
    }).sort((a, b) => b.at - a.at);
    let joined = store.get('briefdrop.joined', null); if (!joined) { joined = Date.now(); store.set('briefdrop.joined', joined); }
    const ticks = known.reduce((n, b) => n + (store.get('briefdrop.progress.' + b.id, []) || []).length, 0);
    const shipped = shippedIds.length, exp = num('briefdrop.exports');
    const counts = {}; rows.forEach((r) => { counts[r.disc] = (counts[r.disc] || 0) + 1; });
    const top = Math.max(1, ...Object.values(counts)), all = (window.BriefAI && window.BriefAI.DISCIPLINES) || [];
    const skills = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k, v]) => [k, Math.round(v / top * 100 * (rows.length > 1 ? .85 : .6) + (v === top ? 15 : 0))]);
    const avoided = rows.length >= 2 ? all.filter((d) => !counts[d]).slice(0, 1).map((d) => [d, 0]) : [];
    D = { name: store.get('briefdrop.name', 'Dcodes'), xp: shipped * 250 + ticks * 20 + rows.length * 30 + exp * 40, streak: 4, shipped, months: Math.max(1, Math.ceil((Date.now() - joined) / 2629800000)), skills, avoided, builds: rows,
      badges: { first: shipped >= 1, remix: num('briefdrop.remixes') >= 1, exp: exp >= 1, week: false, ten: shipped >= 10, early: !!store.get('briefdrop.earlybird', false) } };
  }

  /* ── header ──────────────────────────────────────────────────── */
  const LADDER = [['Rookie', 0], ['Shipper', 600], ['Maker', 1600], ['Pro', 3500], ['Legend', 7000]];
  let li = 0; LADDER.forEach(([, t], i) => { if (D.xp >= t) li = i; });
  const cur = LADDER[li], nx = LADDER[li + 1];
  $('#name').textContent = D.name; $('#rank').textContent = `${cur[0]} · ${D.xp.toLocaleString('en-US')} XP`;
  const pct = nx ? Math.round((D.xp - cur[1]) / (nx[1] - cur[1]) * 100) : 100;
  $('#next').textContent = nx ? `${(nx[1] - D.xp).toLocaleString('en-US')} XP to ${nx[0]}` : 'Top rank reached';
  $('#pbar').setAttribute('aria-valuenow', pct); $('#pbar').setAttribute('aria-label', nx ? `${pct}% of the way to ${nx[0]}` : 'Top rank');
  requestAnimationFrame(() => requestAnimationFrame(() => { $('#pbar').style.setProperty('--p', pct + '%'); }));
  $('#st-t').textContent = D.streak + '-day streak';
  $('#streak').addEventListener('click', () => { $('#streak').classList.remove('hot'); void $('#streak').offsetWidth; $('#streak').classList.add('hot'); say(`${D.streak}-day streak. Start a brief today to keep it going.`); });

  /* avatar: initials, or a photo you pick (kept in this browser) */
  const hue = [...D.name].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);
  $('#av-i').style.setProperty('--avbg', `linear-gradient(135deg, hsl(${hue} 70% 45%), hsl(${(hue + 60) % 360} 70% 35%))`);
  const initial = () => ($('#name').textContent.trim()[0] || 'D').toUpperCase();
  $('#av-i').textContent = initial();
  const photo = !demo && store.get('briefdrop.avatar', null);
  if (photo) { $('#av-img').src = photo; $('#av-img').hidden = false; }
  $('#av').addEventListener('click', () => $('#av-file').click());
  $('#av-file').addEventListener('change', () => {
    const f = $('#av-file').files[0]; if (!f || !f.type.startsWith('image/')) return;
    const im = new Image(), url = URL.createObjectURL(f);
    im.onload = () => { const s = 160, c = document.createElement('canvas'); c.width = c.height = s; const g = c.getContext('2d'), m = Math.min(im.width, im.height); g.drawImage(im, (im.width - m) / 2, (im.height - m) / 2, m, m, 0, 0, s, s); URL.revokeObjectURL(url);
      const d = c.toDataURL('image/jpeg', .85); $('#av-img').src = d; $('#av-img').hidden = false; if (!demo) store.set('briefdrop.avatar', d); say('Photo updated.'); };
    im.src = url;
  });
  const nameEl = $('#name');
  nameEl.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); nameEl.blur(); } });
  nameEl.addEventListener('input', () => { if (nameEl.textContent.length > 24) nameEl.textContent = nameEl.textContent.slice(0, 24); });
  nameEl.addEventListener('blur', () => { const v = nameEl.textContent.trim() || 'Dcodes'; nameEl.textContent = v; $('#av-i').textContent = initial(); if (!demo) store.set('briefdrop.name', v); });

  /* ── stats count-up ──────────────────────────────────────────── */
  $$('[data-n]').forEach((el) => {
    const to = D[el.dataset.n]; if (reduce || !to) { el.textContent = to; return; }
    const t0 = performance.now() + 350; const step = (t) => { const k = Math.min(1, Math.max(0, (t - t0) / 900)); el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(step); }; requestAnimationFrame(step);
  });

  /* ── skills ──────────────────────────────────────────────────── */
  const COLORS = ['#febc0a', '#7aa5ff', '#3ecf8e', '#ff8a5b', '#c86bff'];
  const sk = $('#skills');
  const skRows = [...D.skills.map((s) => [...s, false]), ...D.avoided.map((s) => [...s, true])];
  if (!skRows.length) sk.innerHTML = '<p class="y-empty">Ship a few briefs and your strongest skills will show up here.</p>';
  else sk.innerHTML = skRows.map(([n, p, av], i) => `<div class="y-sk${av ? ' is-avoid' : ''}" style="--c:${COLORS[i % COLORS.length]}"><span class="y-sk__n">${IC.component || ''}${esc(n)}</span><span class="y-sk__t" role="progressbar" aria-valuenow="${p}" aria-valuemin="0" aria-valuemax="100" aria-label="${esc(n)}"><i data-w="${p}"></i></span><span class="y-sk__p">${p}%</span></div>`).join('');
  const fill = () => $$('.y-sk__t i', sk).forEach((i) => { i.style.width = i.dataset.w + '%'; });
  if ('IntersectionObserver' in window && !reduce) { const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { fill(); io.disconnect(); } }, { threshold: .3 }); io.observe(sk); } else fill();

  /* ── builds ──────────────────────────────────────────────────── */
  const bl = $('#builds'); let open = false; const LIM = 3;
  const LBL = { ship: ['Shipped', 'is-ship'], ab: ['Abandoned', 'is-ab'], go: ['In progress', 'is-go'] };
  function paintBuilds() {
    if (!D.builds.length) { bl.innerHTML = '<div class="y-none"><p class="y-none__t">No builds yet</p><p class="y-none__s">Your first one is waiting on Home.</p><a class="cta y-none__cta" href="home.html"><span class="cta__label">Gimme a brief</span></a></div>'; $('#seeall').hidden = false; $('#seeall').textContent = 'See all'; return; }
    const list = open ? D.builds : D.builds.slice(0, LIM); $('#seeall').hidden = D.builds.length <= LIM; $('#seeall').textContent = open ? 'Show less' : 'See all';
    bl.innerHTML = list.map((b, i) => `<a class="y-b${open && i >= LIM ? ' is-new' : ''}" href="${esc(b.href)}" style="animation-delay:${open && i >= LIM ? (i - LIM) * 50 : 0}ms"><span class="y-b__d"><span class="y-b__n">${esc(b.name)}</span><span class="y-b__m">${esc(b.cat)}<i></i>${esc(b.date)}</span></span><span class="y-b__s ${LBL[b.status][1]}">${LBL[b.status][0]}</span></a>`).join('');
  }
  $('#seeall').addEventListener('click', () => {
    if (!D.builds.length) { const n = $('.y-none'); n.classList.remove('nudge'); void n.offsetWidth; n.classList.add('nudge'); return say('Nothing to see yet. Ship your first brief.'); }
    open = !open; paintBuilds();
  });
  paintBuilds();

  /* ── badges ──────────────────────────────────────────────────── */
  const BADGES = [['first', 'First Ship', 'rgba(115,87,216,.5)', 'Ship your first brief.'], ['remix', 'Remix Master', 'rgba(249,232,195,.5)', 'Remix a brief.'], ['exp', 'Exported', 'rgba(198,255,74,.5)', 'Export a Ship Kit.'], ['week', '7-Day Streak', '', 'Keep a 7-day streak.'], ['ten', 'Ten Builds', '', 'Ship ten briefs.'], ['early', 'Early Bird', '', 'Start a brief before 8am.']];
  $('#badges').innerHTML = BADGES.map(([k, n, bg]) => `<button type="button" class="y-badge${D.badges[k] ? ' is-on' : ''}" data-k="${k}"${bg ? ` style="--bg-b:${bg}"` : ''}>${n}</button>`).join('');
  $('#badges').addEventListener('click', (e) => { const b = e.target.closest('.y-badge'); if (!b) return; const d = BADGES.find((x) => x[0] === b.dataset.k); say(D.badges[d[0]] ? `${d[1]}: earned.` : `${d[1]}: ${d[3]}`); });

  addEventListener('scroll', () => $('#top').classList.toggle('is-stuck', scrollY > 4), { passive: true });
})();
