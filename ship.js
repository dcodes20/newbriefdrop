/* BriefDrop – Ship it: links, files, reflection → Ship Kit */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const IC = window.ICONS || {}, BR = window.BRANDS || {};
  const store = { get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (_) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) {} } };
  const toast = $('#toast'); let tt = 0;
  const say = (m) => { toast.textContent = m; toast.classList.add('is-on'); clearTimeout(tt); tt = setTimeout(() => toast.classList.remove('is-on'), 2800); };
  const params = new URLSearchParams(location.search), id = params.get('id') || 'demo';
  const back = 'active.html' + location.search; $('#back').href = back; $('#cancel').href = back;
  $$('.bld-f').forEach((f, i) => f.style.setProperty('--i', i));
  const draftKey = `briefdrop.shipdraft.${id}`, draft = store.get(draftKey, {});

  /* ── links ───────────────────────────────────────────────────── */
  const MAX_LINKS = 6;
  const HOSTS = [['behance.net', 'behance'], ['dribbble.com', 'dribbble'], ['figma.com', 'figma'], ['github.com', 'github'], ['framer.', 'framer'], ['notion.', 'notion'], ['vercel.app', 'vercel'], ['netlify.app', 'netlify'], ['youtube.com', 'youtube'], ['youtu.be', 'youtube'], ['linkedin.com', 'linkedin']];
  const brandOf = (v) => { const h = v.toLowerCase(); const m = HOSTS.find(([k]) => h.includes(k)); return m ? m[1] : ''; };
  const iconFor = (v) => BR[brandOf(v)] || IC.link || '';
  const norm = (v) => { v = v.trim(); if (!v) return ''; return /^https?:\/\//i.test(v) ? v : 'https://' + v; };
  const valid = (v) => { try { const u = new URL(norm(v)); return /\.[a-z]{2,}$/i.test(u.hostname) || u.hostname === 'localhost'; } catch (_) { return false; } };
  const linksEl = $('#links');
  function addLink(val = '', focus = false) {
    if ($$('.shp-link', linksEl).length >= MAX_LINKS) return say('Six links is plenty.');
    const row = document.createElement('div'); row.className = 'shp-link' + (val || focus ? ' is-new' : '');
    row.innerHTML = `<span class="shp-ico"></span><input type="url" inputmode="url" autocapitalize="off" spellcheck="false" aria-label="Project link" placeholder="https://www.behance.net"><button type="button" class="shp-x" aria-label="Remove link">${IC.x || ''}</button>`;
    const inp = $('input', row), ic = $('.shp-ico', row); let cur = '';
    const paint = () => { const b = brandOf(inp.value) || (inp.value.trim() ? 'link' : 'behance'); if (b !== cur) { cur = b; ic.innerHTML = BR[b] || IC.link || ''; ic.classList.remove('pop'); void ic.offsetWidth; if (!reduce) ic.classList.add('pop'); } };
    inp.value = val; paint();
    inp.addEventListener('input', () => { paint(); row.classList.remove('is-bad'); $('#links-err').hidden = true; save(); prog(); });
    inp.addEventListener('blur', () => { if (inp.value.trim() && !valid(inp.value)) row.classList.add('is-bad'); });
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); if (inp.value.trim() && valid(inp.value)) addLink('', true); } });
    $('.shp-x', row).addEventListener('click', () => {
      const rm = () => { row.remove(); if (!$$('.shp-link', linksEl).length) addLink(); save(); prog(); upd(); };
      if (reduce) rm(); else { row.classList.add('is-out'); setTimeout(rm, 240); }
    });
    linksEl.append(row); upd(); if (focus) inp.focus();
  }
  const upd = () => { $('#addlink').disabled = $$('.shp-link', linksEl).length >= MAX_LINKS; };
  const links = () => $$('.shp-link input', linksEl).map((i) => i.value.trim()).filter(Boolean);
  (draft.links && draft.links.length ? draft.links : ['']).forEach((v) => addLink(v));
  $('#addlink').addEventListener('click', () => addLink('', true));

  /* ── files ───────────────────────────────────────────────────── */
  const MAX_FILES = 8, MAX_MB = 10; let files = [];
  const drop = $('#drop'), input = $('#file'), fl = $('#files'), ferr = $('#files-err');
  const fmt = (n) => n > 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB';
  function add(list) {
    const bad = [];
    for (const f of list) {
      if (files.length >= MAX_FILES) { bad.push(`Max ${MAX_FILES} files.`); break; }
      if (f.size > MAX_MB * 1048576) { bad.push(`${f.name} is over ${MAX_MB} MB.`); continue; }
      if (files.some((x) => x.name === f.name && x.size === f.size)) continue;
      files.push(f);
    }
    ferr.hidden = !bad.length; ferr.textContent = bad.join(' '); renderFiles(); prog();
  }
  function renderFiles() {
    fl.replaceChildren();
    files.forEach((f, i) => {
      const li = document.createElement('li'); li.className = 'shp-f'; li.title = `${f.name} · ${fmt(f.size)}`;
      if (f.type.startsWith('image/')) { const im = new Image(); im.alt = ''; im.src = URL.createObjectURL(f); im.onload = () => URL.revokeObjectURL(im.src); li.append(im); }
      else li.insertAdjacentHTML('beforeend', IC.file_text || '');
      const s = document.createElement('span'); s.textContent = f.name; li.append(s);
      const x = document.createElement('button'); x.type = 'button'; x.setAttribute('aria-label', 'Remove ' + f.name); x.innerHTML = IC.x || ''; x.addEventListener('click', () => { files.splice(i, 1); renderFiles(); prog(); ferr.hidden = true; });
      li.append(x); fl.append(li);
    });
  }
  drop.addEventListener('click', () => input.click());
  drop.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); } });
  input.addEventListener('change', () => { add([...input.files]); input.value = ''; });
  ['dragenter', 'dragover'].forEach((t) => drop.addEventListener(t, (e) => { e.preventDefault(); drop.classList.add('is-over'); }));
  ['dragleave', 'drop'].forEach((t) => drop.addEventListener(t, (e) => { e.preventDefault(); drop.classList.remove('is-over'); }));
  drop.addEventListener('drop', (e) => add([...e.dataTransfer.files]));
  addEventListener('dragover', (e) => e.preventDefault()); addEventListener('drop', (e) => e.preventDefault());
  addEventListener('paste', (e) => { const fs = [...(e.clipboardData?.files || [])]; if (fs.length) add(fs); });

  /* ── reflection / label ──────────────────────────────────────── */
  const rf = $('#reflect'), lb = $('#label');
  rf.value = draft.reflect || ''; if (draft.label) lb.value = draft.label;
  const grow = () => { rf.style.height = 'auto'; rf.style.height = Math.max(110, rf.scrollHeight + 3) + 'px'; $('#rcount').textContent = rf.value.length; };
  rf.addEventListener('input', () => { grow(); save(); prog(); }); lb.addEventListener('input', save); grow();
  function save() { store.set(draftKey, { links: links(), reflect: rf.value, label: lb.value }); }
  function prog() { const n = [links().length, files.length, rf.value.trim()].filter(Boolean).length; $('#prog').style.width = (n / 3 * 100) + '%'; }
  prog();

  /* ── generate ────────────────────────────────────────────────── */
  const go = $('#go'); let busy = false;
  function shake(el) { el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); }
  go.addEventListener('click', () => {
    if (busy) return;
    const ls = links(), badRows = $$('.shp-link', linksEl).filter((r) => { const v = $('input', r).value.trim(); return v && !valid(v); });
    badRows.forEach((r) => r.classList.add('is-bad'));
    if (badRows.length) { const e = $('#links-err'); e.hidden = false; e.textContent = 'One of those links doesn’t look right.'; shake($('#f-links')); return; }
    if (!ls.length && !files.length) { const e = $('#links-err'); e.hidden = false; e.textContent = 'Add at least one link or file so there’s something to show.'; shake($('#f-links')); $('.shp-link input', linksEl).focus(); return; }
    if (rf.value.trim().length < 20) { shake($('#f-reflect')); say('Write a sentence or two of reflection.'); rf.focus(); return; }
    busy = true; go.classList.add('is-loading'); go.disabled = true; $('.cta__label', go).textContent = 'Uploading...';
    const kit = { id, label: lb.value.trim(), links: ls.map(norm), files: files.map((f) => ({ name: f.name, size: f.size, type: f.type })), reflection: rf.value.trim(), at: Date.now() };
    setTimeout(() => {
      store.set(`briefdrop.shipkit.${id}`, kit); try { localStorage.removeItem(draftKey); } catch (_) {}
      if (!params.has('demo') && id !== 'demo') window.BriefDropNotifications.record({
        id: `kit:${id}`, type: 'kit', title: 'Ship Kit generated',
        text: `Your Ship Kit "${kit.label || 'Untitled'}" is ready.`,
        href: 'kit.html?id=' + encodeURIComponent(id),
      });
      params.set('id', id);
      location.href = 'kit.html?' + params.toString();
    }, 2500);
  });
  addEventListener('scroll', () => $('#top').classList.toggle('is-stuck', scrollY > 4), { passive: true });
})();
