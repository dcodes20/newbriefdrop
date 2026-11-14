/* BriefDrop – Settings */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const store = { get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (_) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) {} } };
  const toast = $('#toast'); let tt = 0;
  const say = (m) => { toast.textContent = m; toast.classList.add('is-on'); clearTimeout(tt); tt = setTimeout(() => toast.classList.remove('is-on'), 2800); };
  const S = Object.assign({ appearance: true, lowdata: false }, store.get('briefdrop.settings', {}));
  const save = () => store.set('briefdrop.settings', S);

  /* switches */
  const setSw = (el, on) => el.setAttribute('aria-checked', String(!!on));
  function applyTheme() { document.documentElement.dataset.theme = S.appearance ? 'dark' : 'light'; document.querySelector('meta[name=theme-color]').content = S.appearance ? '#0a0a0a' : '#f6f4ee'; }
  function applyData() { document.documentElement.classList.toggle('lowdata', !!S.lowdata); }
  setSw($('#sw-app'), S.appearance); setSw($('#sw-data'), S.lowdata); applyTheme(); applyData();
  $('#sw-app').addEventListener('click', () => { S.appearance = !S.appearance; setSw($('#sw-app'), S.appearance); applyTheme(); save(); say(S.appearance ? 'Dark appearance.' : 'Light appearance across pages.'); });
  $('#sw-data').addEventListener('click', () => { S.lowdata = !S.lowdata; setSw($('#sw-data'), S.lowdata); applyData(); save(); say(S.lowdata ? 'Low-data mode on. Motion reduced.' : 'Low-data mode off.'); });

  /* sheets */
  const open = (id) => { const d = $('#' + id); if (id === 'account') { $('#a-name').value = store.get('briefdrop.name', 'Dcodes'); let m = ''; try { m = JSON.parse(sessionStorage.getItem('briefdrop.email')) || sessionStorage.getItem('briefdrop.email') || ''; } catch (_) { m = sessionStorage.getItem('briefdrop.email') || ''; } $('#a-mail').value = store.get('briefdrop.mail', m); } if (id === 'delete') { $('#d-in').value = ''; $('#d-go').disabled = true; } d.showModal(); };
  $$('[data-open]').forEach((b) => b.addEventListener('click', () => open(b.dataset.open)));
  $('#about').addEventListener('click', () => open('aboutd'));
  $$('dialog.sheet').forEach((d) => d.addEventListener('click', (e) => { if (e.target === d || e.target.closest('[data-close]')) d.close(); }));

  /* account */
  $('#a-save').addEventListener('click', () => {
    const n = $('#a-name').value.trim() || 'Dcodes', m = $('#a-mail').value.trim();
    if (m && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(m)) { $('#a-mail').focus(); return say('That email doesn’t look right.'); }
    store.set('briefdrop.name', n); store.set('briefdrop.mail', m); $('#account').close(); say('Account saved.');
  });

  /* notifications */
  const NP = Object.assign({ drop: true, streak: true, timer: false }, store.get('briefdrop.notifprefs', {}));
  $$('[data-pref]').forEach((b) => { setSw(b, NP[b.dataset.pref]); b.addEventListener('click', () => { NP[b.dataset.pref] = !NP[b.dataset.pref]; setSw(b, NP[b.dataset.pref]); store.set('briefdrop.notifprefs', NP); }); });
  const params = new URLSearchParams(location.search);
  if (params.get('open') === 'notifs') {
    const from = params.get('from');
    if (from === 'notifications.html' || from === 'notifications-empty.html') $('#back').href = from;
    open('notifs');
  }

  /* regions */
  const PACKS = ['Nigeria', 'Ghana', 'Kenya', 'South Africa', 'Egypt', 'India', 'Brazil', 'UK', 'Global'];
  let R = new Set(store.get('briefdrop.regions', ['Global']));
  const rl = $('#r-list');
  rl.innerHTML = PACKS.map((p) => `<button type="button" class="s-chip" aria-pressed="${R.has(p)}" data-p="${p}">${p}</button>`).join('');
  rl.addEventListener('click', (e) => { const b = e.target.closest('[data-p]'); if (!b) return; const p = b.dataset.p; R.has(p) ? R.delete(p) : R.add(p); if (!R.size) R.add('Global'); $$('[data-p]', rl).forEach((x) => x.setAttribute('aria-pressed', String(R.has(x.dataset.p)))); store.set('briefdrop.regions', [...R]); });

  /* export all my data */
  $('#export').addEventListener('click', () => {
    const out = { exportedAt: new Date().toISOString(), local: {}, session: {} };
    for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k.startsWith('briefdrop.')) { try { out.local[k] = JSON.parse(localStorage.getItem(k)); } catch (_) { out.local[k] = localStorage.getItem(k); } } }
    for (let i = 0; i < sessionStorage.length; i++) { const k = sessionStorage.key(i); if (k.startsWith('briefdrop.')) { try { out.session[k] = JSON.parse(sessionStorage.getItem(k)); } catch (_) { out.session[k] = sessionStorage.getItem(k); } } }
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' })); a.download = 'briefdrop-data.json'; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    say('Your data was downloaded as briefdrop-data.json.');
  });

  /* log out / delete */
  $('#lo-go').addEventListener('click', () => { try { sessionStorage.clear(); } catch (_) {} location.href = 'signin.html'; });
  $('#d-in').addEventListener('input', (e) => { $('#d-go').disabled = e.target.value.trim().toUpperCase() !== 'DELETE'; });
  $('#d-go').addEventListener('click', () => {
    try { Object.keys(localStorage).filter((k) => k.startsWith('briefdrop.')).forEach((k) => localStorage.removeItem(k)); sessionStorage.clear(); } catch (_) {}
    location.href = 'welcome.html';
  });

  addEventListener('scroll', () => $('#top').classList.toggle('is-stuck', scrollY > 4), { passive: true });
})();
