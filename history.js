/* BriefDrop – generated Ship Kit history */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const store = { get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (_) { return d; } } };
  const session = (k) => { try { return JSON.parse(sessionStorage.getItem(k)); } catch (_) { return null; } };
  const prefix = 'briefdrop.shipkit.';
  const pool = store.get('briefdrop.pool', {});
  const saved = store.get('briefdrop.saved', []);
  const briefs = [
    ...(Array.isArray(pool.briefs) ? pool.briefs : []),
    ...(Array.isArray(saved) ? saved : []),
    store.get('briefdrop.first', null),
    session('briefdrop.project'),
    session('briefdrop.first'),
  ].filter(Boolean);
  const byId = new Map(briefs.filter((b) => b.id).map((b) => [String(b.id), b]));
  const entries = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith(prefix)) continue;
    const kit = store.get(key, null);
    if (!kit || typeof kit !== 'object' || Array.isArray(kit)) continue;
    const id = String(kit.id || key.slice(prefix.length));
    const brief = byId.get(id);
    entries.push({
      id,
      title: brief && brief.title || kit.title || kit.label || 'Ship Kit',
      label: kit.label || '',
      at: Number(kit.at) || 0,
      links: Array.isArray(kit.links) ? kit.links.length : 0,
      files: Array.isArray(kit.files) ? kit.files.length : 0,
    });
  }

  entries.sort((a, b) => b.at - a.at);
  const list = $('#list');
  $('#count').textContent = entries.length ? `${entries.length} ${entries.length === 1 ? 'Ship Kit' : 'Ship Kits'}` : '';
  $('#empty').hidden = entries.length > 0;
  list.innerHTML = entries.map((entry, i) => {
    const details = [entry.links && `${entry.links} ${entry.links === 1 ? 'link' : 'links'}`, entry.files && `${entry.files} ${entry.files === 1 ? 'file' : 'files'}`].filter(Boolean).join(' · ');
    const date = entry.at ? new Date(entry.at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'Date unavailable';
    const subtitle = entry.label && entry.label !== entry.title ? entry.label : details || 'Open your Ship Kit';
    const meta = details && subtitle !== details ? `${date} · ${details}` : date;
    return `<li class="n-item is-in" style="--i:${i}"><a class="n-row his-row" href="kit.html?id=${encodeURIComponent(entry.id)}">
      <span class="n-ib" aria-hidden="true"><svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 3h7l5 5v13H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" /><path d="M14 3v5h5" /><path d="m9 15 2 2 4-4" /></svg></span>
      <span class="n-body"><span class="n-t">${esc(entry.title)}</span><span class="n-d">${esc(subtitle)}</span><span class="n-time">${esc(meta)}</span></span>
      <span class="his-arrow" aria-hidden="true">›</span>
    </a></li>`;
  }).join('');

  const params = new URLSearchParams(location.search);
  if (params.has('id')) $('#back').href = 'kit.html' + location.search;
  addEventListener('scroll', () => $('#top').classList.toggle('is-stuck', scrollY > 4), { passive: true });
})();
