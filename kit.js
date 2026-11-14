/* BriefDrop – Your Ship Kit */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const store = { get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (_) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) {} } };
  const sess = (k) => { try { return JSON.parse(sessionStorage.getItem(k)); } catch (_) { return null; } };
  const toast = $('#toast'); let tt = 0;
  const say = (m) => { toast.textContent = m; toast.classList.add('is-on'); clearTimeout(tt); tt = setTimeout(() => toast.classList.remove('is-on'), 2800); };
  const hash = (s) => { let h = 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) | 0; return Math.abs(h); };

  /* ── data ────────────────────────────────────────────────────── */
  const params = new URLSearchParams(location.search), demo = params.has('demo');
  const DEMO = { id: 'demo-save', title: 'Design a calm savings experience for young adults', domain: 'Fintech', category: 'UI/UX', discipline: 'UI/UX Design' };
  const DEMO_STORY = { client: 'OyaPay', industry: 'Savings App',
    problem: 'Many people struggle to save because of rising expenses, irregular income, and unclear financial goals. This app helps users set achievable targets, automate savings, and track progress, making it easier to build an emergency fund and manage competing priorities.',
    challenge: 'The core challenge is designing and developing a secure, intuitive savings app that simplifies goal-setting, automates contributions, and clearly communicates progress while giving users control over their money.',
    constraints: ['mobile-first', 'max five primary nav destinations', 'accessible type sizes'] };
  const pool = (store.get('briefdrop.pool', null) || {}).briefs || [], saved = store.get('briefdrop.saved', []);
  const all = [...pool, ...(Array.isArray(saved) ? saved : []), store.get('briefdrop.first', null), sess('briefdrop.project')].filter(Boolean);
  const id = params.get('id');
  const B = demo ? DEMO : (id && all.find((b) => b.id === id)) || sess('briefdrop.project') || DEMO;
  const Sid = demo ? 'demo-save' : B.id;
  const S0 = demo ? DEMO_STORY : (sess('briefdrop.story.' + Sid) || {
    client: B.client || 'Your client', industry: B.domain || 'Project',
    problem: B.problem || `People in ${(B.domain || 'everyday life').toLowerCase()} often lose time and confidence because the experience around them is cluttered or hard to trust. ${B.title}.`,
    challenge: B.challenge || (B.summary || 'Deliver a focused, finishable answer with a clear point of view.'),
    constraints: B.constraints || ['mobile-first', 'accessible type sizes', 'finish within the time box'] });
  const kitStored = store.get('briefdrop.shipkit.' + Sid, null) || (demo ? { label: 'Personal challenge via Buildle', links: ['https://www.behance.net/gallery/demo'], reflection: 'I learned to simplify the flow and would test with real users earlier next time.', files: [] } : { label: 'Personal challenge via Buildle', links: [], reflection: '', files: [] });
  const editKey = 'briefdrop.kitedit.' + Sid, ed = store.get(editKey, {});
  const K = { problem: ed.problem || S0.problem, challenge: ed.challenge || S0.challenge, constraints: ed.constraints || S0.constraints, reflection: ed.reflection ?? kitStored.reflection, label: kitStored.label || 'Personal challenge via Buildle', links: kitStored.links || [] };

  /* ── render ──────────────────────────────────────────────────── */
  $('#back').href = 'ship.html' + location.search;
  $$('[data-k]').forEach((el) => { el.textContent = K[el.dataset.k] || ''; });
  $('#cons').innerHTML = K.constraints.map((c) => `<li>${esc(c)}</li>`).join('');
  if (K.reflection) $('#refl').hidden = false;
  if (K.links.length) { $('#lnk').hidden = false; $('#links').innerHTML = K.links.map((l) => `<li><a href="${esc(l)}" target="_blank" rel="noopener">${esc(l.replace(/^https?:\/\/(www\.)?/, ''))}</a></li>`).join(''); }
  $('#lbl').textContent = 'Label: ' + K.label;
  const cat = B.category === 'Design' || !B.category ? (B.discipline || 'Design').replace(' Design', '') : B.category;
  const short = (B.title || '').replace(/^(Design|Build|Create|Prototype|Redesign|Craft|Make)\s+(a|an|the)?\s*/i, '').replace(/^./, (c) => c.toUpperCase());
  $('#ct').textContent = short || B.title; $('#ctag').textContent = S0.industry;
  $('#cmeta').innerHTML = [S0.industry, S0.client, cat].filter(Boolean).map(esc).join('<i></i>');
  const h = hash(B.title), hue = h % 360, cv = $('#cover');
  cv.style.setProperty('--cbg', `linear-gradient(135deg, hsl(${hue} 55% 14%), hsl(${(hue + 40) % 360} 60% 22%))`);
  cv.style.setProperty('--c1', `hsl(${(hue + 10) % 360} 80% 52%)`); cv.style.setProperty('--c2', `hsl(${(hue + 190) % 360} 75% 45%)`);
  $$('.kit-hero > *, .kit-body > *').forEach((el, i) => el.style.setProperty('--i', i));

  /* cover tilt */
  if (!reduce && matchMedia('(hover:hover)').matches) {
    cv.addEventListener('pointermove', (e) => { const r = cv.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5; cv.style.transform = `perspective(700px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg)`; });
    cv.addEventListener('pointerleave', () => { cv.style.transform = ''; });
  }

  /* ── edit ────────────────────────────────────────────────────── */
  const card = $('#card'); let editing = false;
  function setEdit(on) {
    editing = on; card.classList.toggle('is-editing', on);
    $$('.kit-t, .kit-ul li', card).forEach((el) => { if (on) { el.contentEditable = 'plaintext-only'; if (el.contentEditable !== 'plaintext-only') el.contentEditable = 'true'; el.spellcheck = true; } else el.removeAttribute('contenteditable'); });
    $('#edit').textContent = on ? 'Save' : 'Edit'; $('#edit-top').textContent = on ? 'Save' : 'Edit'; $('#edit-top').classList.toggle('is-on', on);
    if (on) { $('.kit-t', card).focus(); say('Tap any text to edit it.'); }
    else {
      const next = { problem: $('[data-k=problem]').textContent.trim(), challenge: $('[data-k=challenge]').textContent.trim(), constraints: $$('#cons li').map((l) => l.textContent.trim()).filter(Boolean), reflection: $('[data-k=reflection]').textContent.trim() };
      Object.assign(K, next); store.set(editKey, next); say('Saved.');
    }
  }
  $('#edit').addEventListener('click', () => setEdit(!editing)); $('#edit-top').addEventListener('click', () => setEdit(!editing));

  /* ── export ──────────────────────────────────────────────────── */
  const md = () => [`# ${B.title}`, `*${[S0.industry, S0.client, cat].join(' · ')}*`, '', '## Problem', K.problem, '', '## Challenge', K.challenge, '', '## Constraints', ...K.constraints.map((c) => `- ${c}`),
    ...(K.reflection ? ['', '## Reflection', K.reflection] : []), ...(K.links.length ? ['', '## Links', ...K.links.map((l) => `- ${l}`)] : []), '', `_${K.label}_`].join('\n');
  const html = () => `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(B.title)}</title><style>body{font:16px/1.6 system-ui,sans-serif;max-width:640px;margin:40px auto;padding:0 20px;color:#222}h1{font-size:28px}h2{color:#185adb;font-size:20px;margin-top:28px}small,em{color:#666}</style><h1>${esc(B.title)}</h1><p><em>${esc([S0.industry, S0.client, cat].join(' · '))}</em></p><h2>Problem</h2><p>${esc(K.problem)}</p><h2>Challenge</h2><p>${esc(K.challenge)}</p><h2>Constraints</h2><ul>${K.constraints.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>${K.reflection ? `<h2>Reflection</h2><p>${esc(K.reflection)}</p>` : ''}${K.links.length ? `<h2>Links</h2><ul>${K.links.map((l) => `<li><a href="${esc(l)}">${esc(l)}</a></li>`).join('')}</ul>` : ''}<p><small>${esc(K.label)}</small></p>`;
  const dl = (name, text, type) => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); };
  const slug = (B.title || 'ship-kit').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
  const xd = $('#xdlg'), BR = window.BRANDS || {};
  $$('[data-b]', xd).forEach((el) => { el.innerHTML = BR[el.dataset.b] || ''; });
  const showList = (m) => { $('#x-main').hidden = m !== 'main'; $('#x-more').hidden = m !== 'more'; $$('.kit-ex__list:not([hidden]) > button', xd).forEach((b, i) => b.style.setProperty('--n', i)); };
  const openX = () => { if (editing) setEdit(false); showList('main'); xd.showModal(); };
  $('#export').addEventListener('click', openX);
  if (params.has('export')) setTimeout(openX, 300);

  /* cover card → PNG (canvas) */
  async function coverPng() {
    const W = 1080, H = Math.round(W * 215 / 354), c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
    const gr = g.createLinearGradient(0, 0, W, H); gr.addColorStop(0, `hsl(${hue} 55% 14%)`); gr.addColorStop(1, `hsl(${(hue + 40) % 360} 60% 22%)`); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    const blob = (x, y, r, col) => { const rg = g.createRadialGradient(x, y, 0, x, y, r); rg.addColorStop(0, col); rg.addColorStop(.85, col); rg.addColorStop(1, 'transparent'); g.fillStyle = rg; g.globalAlpha = .85; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); g.globalAlpha = 1; };
    blob(W * .88, H * .05, W * .32, `hsl(${(hue + 10) % 360} 80% 52%)`); blob(W * .06, H * 1.02, W * .24, `hsl(${(hue + 190) % 360} 75% 45%)`);
    try { await document.fonts.load('700 64px Unbounded'); } catch (_) {}
    g.fillStyle = '#fff'; g.font = '700 64px Unbounded, system-ui, sans-serif'; g.textBaseline = 'alphabetic';
    const words = ($('#ct').textContent || '').split(' '), lines = []; let line = '';
    for (const w of words) { const t = line ? line + ' ' + w : w; if (g.measureText(t).width > W * .8 && line) { lines.push(line); line = w; } else line = t; }
    lines.push(line); const shown = lines.slice(0, 3), y0 = H - 110 - (shown.length - 1) * 76;
    g.shadowColor = 'rgba(0,0,0,.35)'; g.shadowBlur = 40; shown.forEach((l, i) => g.fillText(l, 36, y0 + i * 76)); g.shadowBlur = 0;
    const tag = $('#ctag').textContent; g.font = '700 30px Nunito, system-ui, sans-serif'; const tw = g.measureText(tag).width + 40;
    g.fillStyle = 'rgba(0,0,0,.4)'; g.beginPath(); g.roundRect(36, H - 84, tw, 52, 26); g.fill(); g.fillStyle = '#fff'; g.fillText(tag, 56, H - 48);
    return new Promise((res) => c.toBlob(res, 'image/png'));
  }
  /* minimal store-only zip */
  const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return (u8) => { let c = 0xFFFFFFFF; for (let i = 0; i < u8.length; i++) c = t[(c ^ u8[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }; })();
  function zip(files) {
    const enc = new TextEncoder(), parts = [], cd = []; let off = 0; const d = new Date(), dt = ((d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1)), dd = (((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate());
    for (const f of files) {
      const nm = enc.encode(f.name), crc = CRC(f.data), h = new DataView(new ArrayBuffer(30));
      h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x800, true); h.setUint16(8, 0, true); h.setUint16(10, dt, true); h.setUint16(12, dd, true); h.setUint32(14, crc, true); h.setUint32(18, f.data.length, true); h.setUint32(22, f.data.length, true); h.setUint16(26, nm.length, true);
      parts.push(new Uint8Array(h.buffer), nm, f.data);
      const e = new DataView(new ArrayBuffer(46)); e.setUint32(0, 0x02014b50, true); e.setUint16(4, 20, true); e.setUint16(6, 20, true); e.setUint16(8, 0x800, true); e.setUint16(12, dt, true); e.setUint16(14, dd, true); e.setUint32(16, crc, true); e.setUint32(20, f.data.length, true); e.setUint32(24, f.data.length, true); e.setUint16(28, nm.length, true); e.setUint32(42, off, true);
      cd.push(new Uint8Array(e.buffer), nm); off += 30 + nm.length + f.data.length;
    }
    const cdSize = cd.reduce((s, x) => s + x.length, 0), end = new DataView(new ArrayBuffer(22)); end.setUint32(0, 0x06054b50, true); end.setUint16(8, files.length, true); end.setUint16(10, files.length, true); end.setUint32(12, cdSize, true); end.setUint32(16, off, true);
    return new Blob([...parts, ...cd, new Uint8Array(end.buffer)], { type: 'application/zip' });
  }
  const dlBlob = (name, blob) => { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); };
  const u8 = (s) => new TextEncoder().encode(s);
  const okd = $('#okdlg');
  function exported() {
    setTimeout(() => { if (xd.open) xd.close(); okd.showModal(); burst(); }, 450);
    const k = store.get('briefdrop.exports', 0); store.set('briefdrop.exports', (+k || 0) + 1);
    if (Sid !== 'demo-save') window.BriefDropNotifications.record({
      id: `export:${Sid}`, type: 'kit', title: 'Ship Kit exported',
      text: `You exported the Ship Kit for "${B.title}".`,
      href: 'kit.html?id=' + encodeURIComponent(Sid),
    });
  }
  function burst() {
    if (reduce) return; const cols = ['#faae1f', '#f9e8c3', '#185adb', '#7aa5ff', '#3ecf8e', '#fff'], cx = innerWidth / 2, cy = innerHeight - Math.min(260, innerHeight * .35);
    for (let i = 0; i < 34; i++) { const e = document.createElement('i'); const s = 5 + Math.random() * 6;
      e.style.cssText = `position:fixed;z-index:2000;pointer-events:none;left:${cx}px;top:${cy}px;width:${s}px;height:${s * (i % 3 ? 1 : 2)}px;border-radius:${i % 2 ? '50%' : '2px'};background:${cols[i % 6]}`; document.body.append(e);
      const a = -Math.PI / 2 + (Math.random() - .5) * 3, dist = 90 + Math.random() * 200;
      e.animate([{ transform: 'translate(-50%,-50%)', opacity: 1 }, { transform: `translate(calc(-50% + ${Math.cos(a) * dist}px), calc(-50% + ${Math.sin(a) * dist + 140}px)) rotate(${Math.random() * 600}deg)`, opacity: 0 }], { duration: 1100 + Math.random() * 500, easing: 'cubic-bezier(.2,.7,.4,1)' }).onfinish = () => e.remove(); }
  }
  okd.addEventListener('click', (e) => { if (e.target === okd) okd.close(); });
  if (params.has('exported')) setTimeout(() => { okd.showModal(); burst(); }, 500);
  const mark = (btn) => { btn.classList.add('is-done'); setTimeout(() => btn.classList.remove('is-done'), 900); };
  async function copyRich() {
    const hh = html(), body = (hh.match(/<h1[\s\S]*$/) || [hh])[0];
    if (navigator.clipboard && window.ClipboardItem) { await navigator.clipboard.write([new ClipboardItem({ 'text/html': new Blob([body], { type: 'text/html' }), 'text/plain': new Blob([md()], { type: 'text/plain' }) })]); }
    else await navigator.clipboard.writeText(md());
  }
  xd.addEventListener('click', async (e) => {
    if (e.target === xd || e.target.closest('[data-close]')) return xd.close();
    const b = e.target.closest('[data-x]'); if (!b) return; const a = b.dataset.x;
    try {
      if (a === 'paste') { await copyRich(); mark(b); exported(); }
      else if (a === 'readme') { dlBlob('README.md', new Blob([md()], { type: 'text/markdown' })); try { await navigator.clipboard.writeText(md()); } catch (_) {} mark(b); exported(); }
      else if (a === 'print') { xd.close(); setTimeout(() => { print(); exported(); }, 250); }
      else if (a === 'assets') showList('more');
      else if (a === 'back') showList('main');
      else if (a === 'md') { dlBlob(slug + '.md', new Blob([md()], { type: 'text/markdown' })); mark(b); exported(); }
      else if (a === 'cover') { dlBlob(slug + '-cover.png', await coverPng()); mark(b); exported(); }
      else if (a === 'zip') { const png = new Uint8Array(await (await coverPng()).arrayBuffer()); dlBlob(slug + '-ship-kit.zip', zip([{ name: 'cover.png', data: png }, { name: 'README.md', data: u8(md()) }, { name: 'case-study.html', data: u8(html()) }])); mark(b); exported(); }
    } catch (err) { say('That didn’t work in this browser. Try another option.'); }
  });

  $('#hist').addEventListener('click', () => say('History isn’t built yet.'));
  addEventListener('scroll', () => $('#top').classList.toggle('is-stuck', scrollY > 4), { passive: true });

  /* confetti on arrival */
  if (!reduce) setTimeout(() => {
    const cols = ['#faae1f', '#f9e8c3', '#185adb', '#7aa5ff', '#3ecf8e', '#fff'], r = $('#badge').getBoundingClientRect(), cx = r.left + 32, cy = r.top + 32;
    for (let i = 0; i < 30; i++) { const e = document.createElement('i'); const s = 5 + Math.random() * 6;
      e.style.cssText = `position:fixed;z-index:200;pointer-events:none;left:${cx}px;top:${cy}px;width:${s}px;height:${s * (i % 3 ? 1 : 2)}px;border-radius:${i % 2 ? '50%' : '2px'};background:${cols[i % 6]}`; document.body.append(e);
      const a = -Math.PI / 2 + (Math.random() - .5) * 3.2, dist = 80 + Math.random() * 170;
      e.animate([{ transform: 'translate(-50%,-50%)', opacity: 1 }, { transform: `translate(calc(-50% + ${Math.cos(a) * dist}px), calc(-50% + ${Math.sin(a) * dist + 120}px)) rotate(${Math.random() * 600}deg)`, opacity: 0 }], { duration: 1100 + Math.random() * 500, easing: 'cubic-bezier(.2,.7,.4,1)' }).onfinish = () => e.remove(); }
  }, 600);
})();
