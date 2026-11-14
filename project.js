/* BriefDrop – Project (the full brief). Reads a brief, fills in the client story, lets you start / remix / reroll / save. */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const IC = window.ICONS || {};
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const store = { get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (_) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) {} } };
  const sess = { get(k) { try { return JSON.parse(sessionStorage.getItem(k)); } catch (_) { return null; } }, set(k, v) { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch (_) {} } };
  const toast = $('#toast'); let tt = 0;
  const say = (m) => { toast.textContent = m; toast.classList.add('is-on'); clearTimeout(tt); tt = setTimeout(() => toast.classList.remove('is-on'), 2800); };
  const hash = (s) => { let h = 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) | 0; return Math.abs(h); };
  const pick = (a, n) => a[n % a.length];

  let saved = store.get('briefdrop.saved', []); if (!Array.isArray(saved)) saved = [];
  const started = new Set(store.get('briefdrop.started', []));
  const isSaved = (b) => saved.some((s) => s.id === b.id || s.title === b.title);

  /* ── the client story ──────────────────────────────────────────────── */
  const CLIENTS = ['SaveZ', 'Northwind', 'Kōmi', 'Lumen & Co', 'Tidal', 'Fernhill', 'Orbit Labs', 'Bloomery', 'Paperplane', 'Moxie', 'Atlas Row', 'Juniper'];
  const BY = {
    'UI/UX Design': { req: ['onboarding', 'dashboard', 'core flow', 'detail view', 'empty states'], con: ['mobile-first', 'max five primary nav destinations', 'accessible type sizes'], ch: 'designing an intuitive, trustworthy experience that makes the main task obvious, keeps the effort low and gives people clear feedback at every step' },
    'Frontend Development': { req: ['responsive layout', 'keyboard support', 'loading states', 'form validation', 'dark mode'], con: ['no frameworks required', 'works from 320px up', 'WCAG AA contrast'], ch: 'building a fast, accessible and well-structured interface that behaves on every screen size and handles real-world states gracefully' },
    'Brand Design': { req: ['logo mark', 'colour palette', 'type pairing', 'tone of voice', 'sample applications'], con: ['works in one colour', 'readable at small sizes', 'distinct from competitors'], ch: 'turning a few personality traits into a visual identity that feels consistent, memorable and true to the audience' },
    'Logo Design': { req: ['primary logo', 'icon version', 'colour variants', 'clear-space rules', 'mockups'], con: ['works in one colour', 'readable at 24px', 'no gradients in the mark'], ch: 'distilling the idea into a simple, ownable mark that holds up from a favicon to a billboard' },
    'Copywriting': { req: ['headline options', 'body copy', 'calls to action', 'microcopy', 'tone guide'], con: ['plain language', 'under 120 words per section', 'one clear action per screen'], ch: 'writing clearly and with personality, so people understand the offer quickly and feel confident taking the next step' },
    'Motion Design': { req: ['storyboard', 'key animation', 'easing choices', 'sound or beat notes', 'exported loop'], con: ['under 15 seconds', 'respects reduced motion', 'works without sound'], ch: 'using movement to explain and delight without slowing anyone down or distracting from the message' },
    'Illustration': { req: ['concept sketches', 'colour study', 'final artwork', 'one alternate crop', 'usage notes'], con: ['limited palette', 'works on light and dark', 'scales without losing detail'], ch: 'building a cohesive illustration style that communicates the idea at a glance and feels human' },
    'Graphics Design': { req: ['layout grid', 'hero graphic', 'type hierarchy', 'colour system', 'export set'], con: ['print and screen safe', 'two typefaces at most', 'clear focal point'], ch: 'creating a bold, balanced composition with a clear hierarchy that gets noticed and understood in seconds' },
    'Video Editing': { req: ['rough cut', 'pacing pass', 'titles and captions', 'colour pass', 'final export'], con: ['under 60 seconds', 'captions on by default', 'vertical and horizontal cuts'], ch: 'shaping raw footage into a tight story with rhythm, clarity and a strong opening hook' },
  };
  const bundle = (b) => BY[b.discipline] || BY['UI/UX Design'];

  function story(b) {
    const h = hash(b.title), pack = bundle(b), dom = b.domain || 'everyday life', client = b.client || pick(CLIENTS, h), low = dom.toLowerCase();
    const del = (b.deliverables || []).filter(Boolean);
    return {
      client, industry: b.industry || dom,
      problem: b.problem || `People in ${low} often lose time and confidence because the experience around them is cluttered, inconsistent or hard to trust. ${client} wants a focused answer that feels simple for first-time users while still respecting what experienced ones need.`,
      challenge: b.challenge || `The core challenge is ${pack.ch}, all within a tight scope and a clear point of view.`,
      required: Array.isArray(b.required) && b.required.length ? b.required : pack.req.slice(0, 3 + (h % 3)),
      constraints: Array.isArray(b.constraints) && b.constraints.length ? b.constraints : pack.con,
      deliverables: del.length ? del.map((d) => d.toLowerCase()) : ['a first draft', 'a refined version', 'a short note on your choices'],
    };
  }

  /* ── which brief? ──────────────────────────────────────────────────── */
  const DEMO = { id: 'demo-savez', title: 'Design a calm savings experience for young adults', domain: 'Fintech', level: 'Intermediate', time: '3–5 hours', discipline: 'UI/UX Design', category: 'Design',
    summary: 'Make saving simple and build toward what matters most. Set personal goals, automate your savings, and track your progress—all in one place, at your own pace.',
    client: 'SaveZ', industry: 'Fintech', required: ['onboarding', 'dashboard', 'goal creation', 'progress view', 'history'], constraints: ['mobile-first', 'max five primary nav destinations', 'accessible type sizes'], deliverables: ['user flow', 'wireframes', 'high-fidelity UI', 'clickable prototype'],
    problem: 'Many people struggle to save because of rising expenses, irregular income, and unclear financial goals. This app helps users set achievable targets, automate savings, and track progress, making it easier to build an emergency fund and manage competing priorities.',
    challenge: 'The core challenge is designing and developing a secure, intuitive savings app that simplifies goal-setting, automates contributions, and clearly communicates progress while giving users control over their money.' };
  const params = new URLSearchParams(location.search);
  function load() {
    const id = params.get('id'); const pool = (store.get('briefdrop.pool', null) || {}).briefs || [];
    const all = [...pool, ...saved, store.get('briefdrop.first', null), sess('briefdrop.project'), sess('briefdrop.first')].filter(Boolean);
    function sess(k) { try { return JSON.parse(sessionStorage.getItem(k)); } catch (_) { return null; } }
    if (id) { const f = all.find((b) => b && b.id === id); if (f) return f; }
    if (params.has('demo')) return DEMO;
    return sess('briefdrop.project') || DEMO;
  }
  let B = load();

  /* ── render ────────────────────────────────────────────────────────── */
  const doc = $('#doc');
  const progKey = () => 'briefdrop.progress.' + B.id;
  const prog = () => store.get(progKey(), []);
  function render(swap) {
    const s = story(B), done = new Set(prog());
    document.title = `BriefDrop – ${B.title}`;
    const li = (t) => `<div class="p-li">${esc(t)}</div>`;
    const meta = [B.level, B.time, B.discipline].filter(Boolean).map((m) => `<span>${esc(m)}</span>`).join('<i></i>');
    doc.innerHTML = `
      <p class="p-cat">${esc(B.category || 'Design')}</p>
      <h1 class="p-title">${esc(B.title)}</h1>
      <div class="p-meta">${meta}</div>
      <div class="p-client"><p><span class="k">Client:</span> <span class="v">${esc(s.client)}</span></p><p><span class="k">Industry:</span> <span class="v">${esc(s.industry)}</span></p><p>${esc(B.summary || '')}</p></div>
      <section class="p-sec"><h2 class="p-h">Problem</h2><p>${esc(s.problem)}</p></section>
      <section class="p-sec"><h2 class="p-h">Challenge</h2><p>${esc(s.challenge)}</p></section>
      <section class="p-sec"><h2 class="p-h">Required</h2><div class="p-cols" style="grid-template-rows:repeat(${Math.ceil(s.required.length / 2)},auto)">${s.required.map(li).join('')}</div></section>
      <section class="p-sec"><h2 class="p-h">Constraints</h2><div class="p-list">${s.constraints.map(li).join('')}</div></section>
      <section class="p-sec"><h2 class="p-h">Deliverables</h2><div class="p-del">${s.deliverables.map((d, i) => `<label><input type="checkbox" data-i="${i}"${done.has(i) ? ' checked' : ''}><span class="box" aria-hidden="true">${IC.check || ''}</span><span class="t">${esc(d)}</span></label>`).join('')}</div><p class="p-count" id="cnt" aria-live="polite"></p></section>`;
    $$('#doc > *').forEach((el, i) => el.style.setProperty('--i', i));
    doc.classList.remove('is-swap'); if (swap) { void doc.offsetWidth; doc.classList.add('is-swap'); }
    sync(); count();
    sess.set('briefdrop.project', B);
    const u = new URL(location.href); u.searchParams.delete('demo'); u.searchParams.set('id', B.id); history.replaceState(null, '', u);
  }
  function count() { const bx = $$('.p-del input'), n = bx.filter((x) => x.checked).length; const c = $('#cnt'); if (c) c.innerHTML = n === bx.length && bx.length ? 'All delivered. Nice work.' : `<b>${n}</b> of ${bx.length} delivered`; }
  doc.addEventListener('change', (e) => { if (!e.target.matches('.p-del input')) return; store.set(progKey(), $$('.p-del input').filter((x) => x.checked).map((x) => +x.dataset.i)); count();
    if ($$('.p-del input').every((x) => x.checked)) { confetti($('.p-count').getBoundingClientRect()); say('Brief complete. Well done.'); } });

  function sync() {
    const sv = isSaved(B);
    const bm = $('#bm'); bm.setAttribute('aria-pressed', String(sv)); bm.setAttribute('aria-label', sv ? 'Remove from saved' : 'Save brief');
    const later = $('#later'); later.setAttribute('aria-pressed', String(sv)); $('span', later).textContent = sv ? 'Saved' : 'Save for later';
    const st = $('#start'); const on = started.has(B.id); st.classList.toggle('is-started', on); $('span', st).textContent = on ? 'Keep going' : 'Start';
  }
  function toggleSave() {
    const i = saved.findIndex((s) => s.id === B.id || s.title === B.title);
    if (i >= 0) { saved.splice(i, 1); say('Removed from saved.'); } else {
      saved.unshift(B); say('Saved for later.');
      window.BriefDropNotifications.record({
        id: `save:${B.id}`, type: 'save', title: 'Brief saved',
        text: `"${B.title}" was added to your Saved briefs.`, href: 'saved.html',
      });
    }
    store.set('briefdrop.saved', saved); sync();
    const bm = $('#bm'); bm.classList.remove('pop'); void bm.offsetWidth; bm.classList.add('pop');
  }
  $('#bm').addEventListener('click', toggleSave); $('#later').addEventListener('click', toggleSave);

  /* ── start ── */
  function confetti(r) {
    if (reduce) return; const cx = r.left + r.width / 2, cy = r.top + r.height / 2, cols = ['#faae1f', '#f9e8c3', '#185adb', '#7aa5ff', '#3ecf8e', '#fff'];
    for (let i = 0; i < 22; i++) { const d = document.createElement('i'); d.className = 'p-confetti'; const s = 5 + Math.random() * 6;
      d.style.cssText = `left:${cx}px;top:${cy}px;width:${s}px;height:${s * (i % 3 ? 1 : 2)}px;border-radius:${i % 2 ? '50%' : '2px'};background:${cols[i % 6]}`; document.body.append(d);
      const a = -Math.PI / 2 + (Math.random() - .5) * 2.6, dist = 70 + Math.random() * 130;
      d.animate([{ transform: 'translate(-50%,-50%)', opacity: 1 }, { transform: `translate(calc(-50% + ${Math.cos(a) * dist}px), calc(-50% + ${Math.sin(a) * dist + 100}px)) rotate(${Math.random() * 540}deg)`, opacity: 0 }], { duration: 1000 + Math.random() * 500, easing: 'cubic-bezier(.2,.7,.4,1)' }).onfinish = () => d.remove(); }
  }
  $('#start').addEventListener('click', () => {
    const was = started.has(B.id); started.add(B.id); store.set('briefdrop.started', [...started]); sync();
    if (!was) window.BriefDropNotifications.record({
      id: `start:${B.id}`, type: 'progress', title: 'Brief started',
      text: `You started "${B.title}".`, href: 'active.html?id=' + encodeURIComponent(B.id),
    });
    if (!was) { confetti($('#start').getBoundingClientRect()); say('Brief started. The clock is running.'); }
    else say('Welcome back. Pick up where you left off.');
    const to = 'active.html?id=' + encodeURIComponent(B.id) + (params.has('demo') ? '&demo' : '');
    setTimeout(() => { location.href = to; }, reduce ? 0 : (was ? 350 : 800));
  });

  /* ── remix ── */
  let busy = false;
  /* remix sheet: pick twists, then apply */
  const rx = $('#rx'), opts = $('#rx-opts');
  const INDUSTRIES = ['Fintech', 'Health', 'Travel', 'Food', 'Education', 'Climate', 'Music', 'Social', 'Gaming', 'Mobility', 'Commerce', 'Productivity', 'Civic'];
  const AUDIENCES = ['night-shift workers', 'first-time founders', 'people over 60', 'students abroad', 'busy parents', 'freelancers', 'small shop owners', 'new runners', 'remote teams'];
  const WILD = ['must work fully offline', 'only two colours allowed', 'no text longer than six words', 'one-handed use only', 'no images at all', 'must be done in a single screen', 'built for a 3-second glance'];
  const LV = window.BriefAI.LEVELS || ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
  const LABEL = { industry: 'new industry', audience: 'new audience', wild: 'wilder constraint', easier: 'easier', harder: 'harder' };
  const selected = () => $$('.rx__o[aria-pressed="true"]', opts).map((b) => b.dataset.k);
  function openRemix() { $$('.rx__o', opts).forEach((b) => b.setAttribute('aria-pressed', 'false')); if (!rx.open) rx.showModal(); }
  opts.addEventListener('click', (e) => {
    const b = e.target.closest('.rx__o'); if (!b) return; const on = b.getAttribute('aria-pressed') !== 'true'; b.setAttribute('aria-pressed', String(on));
    if (on && (b.dataset.k === 'easier' || b.dataset.k === 'harder')) { const other = $(`.rx__o[data-k="${b.dataset.k === 'easier' ? 'harder' : 'easier'}"]`, opts); other.setAttribute('aria-pressed', 'false'); }
  });
  rx.addEventListener('click', (e) => { if (e.target === rx) rx.close(); });
  const rnd = (a, not) => { const l = a.filter((x) => x !== not); return l[Math.floor(Math.random() * l.length)]; };
  async function applyRemix() {
    if (busy) return; let picks = selected();
    if (!picks.length) { const all = ['industry', 'audience', 'wild', Math.random() < .5 ? 'easier' : 'harder']; picks = all.sort(() => Math.random() - .5).slice(0, 2); }
    rx.close(); busy = true; $$('.p-bar .p-btn').forEach((b) => (b.disabled = true)); $('#remix').classList.add('is-busy'); doc.style.transition = 'opacity .2s'; doc.style.opacity = '.45';
    try {
      let level = B.level, li = Math.max(0, LV.indexOf(B.level));
      if (picks.includes('easier')) level = LV[Math.max(0, li - 1)]; if (picks.includes('harder')) level = LV[Math.min(LV.length - 1, li + 1)];
      const topic = picks.includes('industry') ? rnd(INDUSTRIES, B.domain) : B.domain;
      const t0 = performance.now();
      const { briefs } = await window.BriefAI.generate({ count: 1, discipline: B.discipline, level, topic, avoid: [B.title] });
      const wait = 700 - (performance.now() - t0); if (wait > 0 && !reduce) await new Promise((r) => setTimeout(r, wait));
      const nb = briefs && briefs[0]; if (!nb) throw new Error('empty');
      if (picks.includes('audience')) { const aud = rnd(AUDIENCES); nb.audience = aud; nb.title = nb.title.replace(/\s+(aimed at|for)\s+.+$/i, '') + ` aimed at ${aud}`; nb.summary = nb.summary; }
      if (picks.includes('wild')) nb.constraints = [...bundle(nb).con.slice(0, 2), rnd(WILD)];
      if (picks.includes('easier') || picks.includes('harder')) nb.level = level;
      B = nb; render(true); scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
      say(`Remixed: ${picks.map((k) => LABEL[k]).join(' + ')}.`);
    } catch (_) { say('Couldn’t remix just now. Try again.'); }
    finally { doc.style.opacity = ''; $('#remix').classList.remove('is-busy'); $$('.p-bar .p-btn').forEach((b) => (b.disabled = false)); busy = false; }
  }
  $('#rx-apply').addEventListener('click', applyRemix);
  $('#remix').addEventListener('click', openRemix);
  const rr = $('#rr');
  function openReroll() {
    const n = prog().length, st = started.has(B.id), note = $('#rr-note');
    note.hidden = !(n || st); if (n || st) note.textContent = n ? `You’ve ticked off ${n} deliverable${n === 1 ? '' : 's'} on this one. That progress will be cleared.` : 'You’ve started this brief. Rerolling replaces it.';
    if (!rr.open) rr.showModal(); $('#rr-keep').focus();
  }
  rr.addEventListener('click', (e) => { if (e.target === rr) rr.close(); });
  $('#rr-keep').addEventListener('click', () => { rr.close(); say('Kept. Good choice.'); });
  $('#rr-go').addEventListener('click', () => { rr.close(); location.href = 'build.html'; });
  $('#reroll').addEventListener('click', openReroll);

  /* ── share / menu ── */
  async function copyLink() { try { await navigator.clipboard.writeText(location.href); say('Link copied.'); } catch (_) { say('Copy the link from the address bar.'); } }
  const pop = $('#share-pop'), scrim = $('#scrim');
  $$('.p-sh__i', pop).forEach((el, i) => el.style.setProperty('--k', i));
  const shareOpen = () => !pop.hidden;
  function openShare() { closeMenu(); pop.classList.remove('is-out'); pop.hidden = false; scrim.hidden = false; $('#share').setAttribute('aria-expanded', 'true'); $('.p-sh__i', pop).focus({ preventScroll: true }); }
  function closeShare(focus) { if (pop.hidden) return; const done = () => { pop.hidden = true; scrim.hidden = true; pop.classList.remove('is-out'); }; $('#share').setAttribute('aria-expanded', 'false'); if (reduce) done(); else { pop.classList.add('is-out'); scrim.hidden = true; setTimeout(done, 180); } if (focus) $('#share').focus(); }
  $('#share').addEventListener('click', (e) => { e.stopPropagation(); shareOpen() ? closeShare() : openShare(); });
  scrim.addEventListener('click', () => closeShare());
  const tell = () => ({ url: location.href, title: B.title, text: `${B.title} · a BriefDrop challenge` });
  pop.addEventListener('click', async (e) => {
    const it = e.target.closest('.p-sh__i'); if (!it) return; const k = it.dataset.s, t = tell(), u = encodeURIComponent(t.url), tx = encodeURIComponent(t.text);
    const open = (url) => window.open(url, '_blank', 'noopener');
    if (k === 'copy') { await copyLink(); it.classList.add('is-done'); $('span:last-child', it).textContent = 'Copied'; setTimeout(() => { it.classList.remove('is-done'); $('span:last-child', it).textContent = 'Copy link'; closeShare(); }, 900); return; }
    if (k === 'linkedin') open(`https://www.linkedin.com/sharing/share-offsite/?url=${u}`);
    else if (k === 'x') open(`https://twitter.com/intent/tweet?text=${tx}&url=${u}`);
    else if (k === 'behance') { try { await navigator.clipboard.writeText(t.url); } catch (_) {} open('https://www.behance.net/'); say('Link copied. Paste it into your Behance project.'); }
    else if (k === 'dribbble') { try { await navigator.clipboard.writeText(t.url); } catch (_) {} open('https://dribbble.com/shots/new'); say('Link copied. Paste it into your Dribbble shot.'); }
    else if (k === 'more') { if (navigator.share) { try { await navigator.share(t); } catch (_) {} } else say('No other share options on this device.'); }
    if (k !== 'more') closeShare();
  });
  const menu = $('#menu'), more = $('#more');
  const closeMenu = () => { menu.hidden = true; more.setAttribute('aria-expanded', 'false'); };
  more.addEventListener('click', (e) => { e.stopPropagation(); closeShare(); const open = menu.hidden; menu.hidden = !open; more.setAttribute('aria-expanded', String(open)); if (open) $('button', menu).focus(); });
  menu.addEventListener('click', (e) => { const a = e.target.closest('[data-act]'); if (!a) return; closeMenu();
    ({ copy: copyLink, share: openShare, remix: openRemix, reroll: openReroll, reset: () => { store.set(progKey(), []); $$('.p-del input').forEach((x) => (x.checked = false)); count(); say('Progress reset.'); } })[a.dataset.act](); });
  document.addEventListener('click', (e) => { if (!menu.hidden && !e.target.closest('.p-more')) closeMenu(); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape') { if (shareOpen()) { closeShare(true); return; } closeMenu(); more.focus(); } });
  $('#back').addEventListener('click', (e) => { try { if (document.referrer && new URL(document.referrer).origin === location.origin && history.length > 1) { e.preventDefault(); history.back(); } } catch (_) {} });

  /* reading progress */
  const bar = $('#prog'); let tk = false;
  const upd = () => { tk = false; const max = document.documentElement.scrollHeight - innerHeight; bar.style.setProperty('--p', max > 0 ? Math.min(1, scrollY / max).toFixed(3) : 0); };
  addEventListener('scroll', () => { if (!tk) { tk = true; requestAnimationFrame(upd); } }, { passive: true });
  addEventListener('storage', (e) => { if (e.key === 'briefdrop.saved') { saved = store.get('briefdrop.saved', []); sync(); } });

  render(false); upd();
})();
