/* BriefDrop – Build your brief */
(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const store = { get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} } };
  const sess = (k, v) => { try { if (v === undefined) return JSON.parse(sessionStorage.getItem(k)); sessionStorage.setItem(k, JSON.stringify(v)); } catch { return null; } };
  const toast = $('#toast'); let tt = 0;
  const say = (m) => { toast.textContent = m; toast.classList.add('is-on'); clearTimeout(tt); tt = setTimeout(() => toast.classList.remove('is-on'), 2800); };
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pick = (a) => a[Math.floor(Math.random() * a.length)];

  const SKILLS = window.BriefAI.DISCIPLINES;
  const INDUSTRIES = ['Fintech', 'Health', 'Travel', 'Food', 'Education', 'Climate', 'Music', 'Social', 'Gaming', 'Mobility', 'Commerce', 'Productivity', 'Civic'];
  const LEVELS = [['Just starting', 'Beginner'], ['Getting good', 'Intermediate'], ['Pretty solid', 'Advanced'], ['Dangerous', 'Expert']];
  const TIMES = ['15–30 min', '1–2 hours', 'A few days', '3 months'];
  const PLATFORMS = ['Mobile app', 'Web', 'Dashboard', 'Marketing site', 'Other'];
  const DEFAULT = { skill: 'UI/UX Design', level: '', time: '', industry: 'Fintech', goal: '', platform: '' };
  let S = { ...DEFAULT, ...(sess('briefdrop.build') || {}) };
  let busy = false;

  $$('.bld-f').forEach((f, i) => f.style.setProperty('--i', i));

  /* radio groups */
  function radios(box, items, key, cls) {
    box.replaceChildren();
    items.forEach((it) => {
      const [label, val] = Array.isArray(it) ? it : [it, it];
      const b = document.createElement('button'); b.type = 'button'; b.className = cls; b.setAttribute('role', 'radio'); b.dataset.v = val; b.textContent = label;
      b.addEventListener('click', (e) => {
        S[key] = S[key] === val ? '' : val;                // tap again to clear
        if (!reduce && cls === 'bld-o' && S[key]) ripple(b, e);
        render();
      });
      box.append(b);
    });
  }
  function ripple(b, e) {
    const r = b.getBoundingClientRect(), d = Math.max(r.width, r.height) * 2, i = document.createElement('i'); i.className = 'rip';
    i.style.cssText = `width:${d}px;height:${d}px;left:${(e.clientX || r.left + r.width / 2) - r.left - d / 2}px;top:${(e.clientY || r.top + r.height / 2) - r.top - d / 2}px`;
    b.append(i); setTimeout(() => i.remove(), 650);
  }
  radios($('#level'), LEVELS, 'level', 'bld-o');
  radios($('#time'), TIMES, 'time', 'bld-o');
  radios($('#platform'), PLATFORMS, 'platform', 'bld-c');

  function render() {
    for (const id of ['level', 'time', 'platform']) $$('[role=radio]', $('#' + id)).forEach((b) => b.setAttribute('aria-checked', String(b.dataset.v === S[id])));
    for (const id of ['skill', 'industry']) {
      const el = $('#' + id); el.classList.toggle('is-empty', !S[id]); el.classList.toggle('is-set', !!S[id]);
      $('.bld-sel__v', el).textContent = S[id] || (id === 'skill' ? 'Choose a skill' : 'Choose an industry');
    }
    if (document.activeElement !== $('#goal')) $('#goal').value = S.goal;
    const n = ['skill', 'level', 'time', 'industry', 'goal'].filter((k) => S[k]).length;
    $('#prog').style.width = (n / 5 * 100) + '%';
    sess('briefdrop.build', S);
  }
  $('#goal').addEventListener('input', (e) => { S.goal = e.target.value; render(); });
  $('#goal').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); e.target.blur(); } });

  /* pick sheets */
  const dlg = $('#pick'); let target = '';
  const OPTS = { skill: SKILLS, industry: INDUSTRIES };
  const TITLES = { skill: 'Skill', industry: 'Industry' };
  $$('[data-pick]').forEach((b) => b.addEventListener('click', () => {
    target = b.dataset.pick; $('#pick-t').textContent = TITLES[target];
    const list = $('#pick-list'); list.replaceChildren();
    OPTS[target].forEach((o) => {
      const li = document.createElement('button'); li.type = 'button'; li.className = 'bld-li'; li.setAttribute('role', 'option'); li.setAttribute('aria-selected', String(S[target] === o)); li.textContent = o;
      li.addEventListener('click', () => { S[target] = o; render(); dlg.close(); });
      list.append(li);
    });
    dlg.showModal();
    const sel = $('[aria-selected=true]', list); if (sel) sel.scrollIntoView({ block: 'center' });
  }));
  dlg.addEventListener('click', (e) => { if (e.target === dlg || e.target.closest('[data-close]')) dlg.close(); });

  /* reset / clear */
  function flash(ids) { ids.forEach((id, i) => { const f = $('#f-' + id); setTimeout(() => { f.classList.add('is-flash'); setTimeout(() => f.classList.remove('is-flash'), 450); }, i * 80); }); }
  $('#reset').addEventListener('click', () => { S = { ...DEFAULT }; render(); say('Back to defaults.'); });
  $('#clear').addEventListener('click', () => { S = { skill: '', level: '', time: '', industry: '', goal: '', platform: '' }; render(); say('Cleared. Pick what you like.'); });

  /* surprise */
  $('#surprise').addEventListener('click', () => {
    if (busy) return;
    S = { skill: pick(SKILLS), level: pick(LEVELS)[1], time: pick(TIMES), industry: pick(INDUSTRIES), goal: '', platform: Math.random() < .5 ? pick(PLATFORMS) : '' };
    render(); flash(['skill', 'level', 'time', 'industry', 'platform']);
    setTimeout(() => generate(true), reduce ? 0 : 700);
  });

  /* generate */
  function generate(surprise) {
    if (busy) return;
    if (!S.skill) { const f = $('#f-skill'); f.classList.remove('shake'); void f.offsetWidth; f.classList.add('shake'); say('Pick a skill first.'); $('#skill').focus(); return; }
    busy = true;
    const go = $('#go'); go.classList.add('is-loading'); go.disabled = true; $('.cta__label', go).textContent = surprise ? 'Preparing surprise' : 'Preparing brief';
    try {
      sessionStorage.setItem('briefdrop.build', JSON.stringify(S));
    } catch (_) {
      busy = false; go.classList.remove('is-loading'); go.disabled = false; $('.cta__label', go).textContent = 'Generate brief';
      say('Couldn’t save your choices. Check your browser storage and try again.');
      return;
    }
    document.body.classList.add('is-leaving');
    setTimeout(() => { location.href = 'build-loading.html'; }, reduce ? 0 : 180);
  }
  $('#go').addEventListener('click', () => generate(false));

  /* header shadow + magnetic CTA */
  addEventListener('scroll', () => $('#top').classList.toggle('is-stuck', scrollY > 4), { passive: true });
  if (!reduce && matchMedia('(hover:hover)').matches) {
    const g = $('#go');
    g.addEventListener('pointermove', (e) => { const r = g.getBoundingClientRect(); g.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .04}px, ${(e.clientY - r.top - r.height / 2) * .12 - 2}px)`; });
    g.addEventListener('pointerleave', () => { g.style.transform = ''; });
  }
  render();
})();
