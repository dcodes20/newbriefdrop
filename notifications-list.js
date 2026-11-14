/* BriefDrop – Notifications list. Reads 'briefdrop.notifs'; empty by default (the "all caught up" state). ?demo seeds a few. */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const IC = window.ICONS || {};
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const store = { get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (_) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) {} } };
  const toast = $('#toast'); let tt = 0;
  const say = (m, undo) => { toast.textContent = m; if (undo) { const b = document.createElement('button'); b.type = 'button'; b.textContent = 'Undo'; b.style.cssText = 'margin-left:14px;color:#7aa5ff;font-weight:700;pointer-events:auto'; b.addEventListener('click', () => { undo(); toast.classList.remove('is-on'); }); toast.append(b); } toast.classList.add('is-on'); clearTimeout(tt); tt = setTimeout(() => toast.classList.remove('is-on'), undo ? 5000 : 2800); };

  const H = 3600e3;
  let N = store.get('briefdrop.notifs', []); if (!Array.isArray(N)) N = [];
  const save = () => store.set('briefdrop.notifs', N);
  const params = new URLSearchParams(location.search);
  if (params.has('reset') || (params.has('demo') && !N.length)) {
    const now = Date.now();
    N = [
      { id: 'd1', type: 'drop', title: 'Today’s Daily Drop is ready', text: 'A fresh 45-minute UI brief just dropped.', at: now - 1 * H, read: false, href: 'home.html' },
      { id: 'd2', type: 'streak', title: 'Your streak is at risk', text: 'You still have time to ship something today and keep the 4-day streak.', at: now - 3 * H, read: true, href: 'home.html' },
      { id: 'd3', type: 'badge', title: 'Badge unlocked: First Ship', text: 'You finished your first build. Nice work.', at: now - 26 * H, read: true, soon: 'Badges' },
      { id: 'd4', type: 'kit', title: 'You have an unexported Ship Kit', text: 'Your last build is ready to copy to your portfolio.', at: now - 50 * H, read: true, soon: 'Ship Kit export' },
    ]; save();
  }

  const list = $('#list'), empty = $('#empty'), tools = $('#tools'), top = $('#top');
  const S = { f: 'all' };
  const ago = (t) => { const m = Math.round((Date.now() - t) / 60000); if (m < 1) return 'Just now'; if (m < 60) return `${m}m ago`; const h = Math.round(m / 60); if (h < 24) return `${h}h ago`; const d = Math.round(h / 24); return d === 1 ? 'Yesterday' : `${d} days ago`; };
  const ICON = { drop: ['', IC.calendar_days], streak: ['n-ib--streak', IC.flame], badge: ['', IC.trophy], kit: ['', IC.info], save: ['n-ib--save', IC.bookmark], progress: ['', IC.check], ship: ['', IC.trophy] };
  const vis = () => N.filter((n) => S.f === 'all' || (S.f === 'unread' ? !n.read : S.f === 'activity' ? ['save', 'progress', 'ship', 'kit'].includes(n.type) : n.type === S.f));

  function render(anim) {
    const v = vis(); list.replaceChildren();
    v.forEach((n, i) => {
      const [cls, svg] = ICON[n.type] || ICON.drop;
      const li = document.createElement('li'); li.className = `n-item${n.read ? '' : ' is-unread'}${anim ? ' is-in' : ''}`; li.dataset.id = n.id; li.style.setProperty('--i', i);
      li.innerHTML = `<button class="n-row" type="button"><span class="n-ib ${cls}" aria-hidden="true">${svg || ''}</span><span class="n-body"><span class="n-t">${esc(n.title)}</span><span class="n-d">${esc(n.text)}</span></span><span class="n-ts"><span aria-hidden="true">${IC.timer || ''}</span><span class="n-time">${ago(n.at)}</span></span></button><button class="n-x" type="button" aria-label="Dismiss notification">${IC.x || ''}</button>`;
      list.append(li);
    });
    const unread = N.filter((n) => !n.read).length;
    tools.hidden = N.length === 0;
    $('#count').textContent = N.length ? (unread ? `${unread} new` : 'All read') : '';
    $('#readall').hidden = unread === 0;
    const nothing = v.length === 0;
    if (nothing) {
      const filtered = N.length > 0;
      $('#et').textContent = filtered ? 'Nothing here' : 'You’re all caught up';
      $('#es').textContent = filtered ? 'No notifications match this filter.' : 'Updates about saved briefs, progress and completed Ship Kits will appear here.';
      $('#ep').hidden = filtered;
    }
    const wasHidden = empty.hidden; empty.hidden = !nothing; if (nothing && wasHidden) { empty.style.animation = 'none'; void empty.offsetWidth; empty.style.animation = ''; }
    $('#filter').classList.toggle('is-active', S.f !== 'all');
  }

  list.addEventListener('click', (e) => {
    const li = e.target.closest('.n-item'); if (!li) return; const n = N.find((x) => x.id === li.dataset.id); if (!n) return;
    if (e.target.closest('.n-x')) { dismiss([n.id], 'Notification dismissed.'); return; }
    if (!n.read) { n.read = true; save(); }
    if (n.soon) { li.classList.remove('is-unread'); render(false); say(`${n.soon} isn’t built in this prototype yet.`); return; }
    location.href = n.href || 'home.html';
  });
  function dismiss(ids, msg) {
    const gone = N.map((n, i) => ({ n, i })).filter((x) => ids.includes(x.n.id));
    const done = () => { N = N.filter((n) => !ids.includes(n.id)); save(); render(false); say(msg, () => { gone.forEach((g) => N.splice(Math.min(g.i, N.length), 0, g.n)); save(); render(true); }); };
    const els = reduce ? [] : $$('.n-item').filter((el) => ids.includes(el.dataset.id));
    if (!els.length) return done(); els.forEach((el) => el.classList.add('is-out')); setTimeout(done, 300);
  }
  $('#readall').addEventListener('click', () => { N.forEach((n) => (n.read = true)); save(); render(false); say('All caught up.'); });
  $('#clearall').addEventListener('click', () => dismiss(N.map((n) => n.id), 'Notifications cleared.'));

  /* swipe left to dismiss (touch / pen) */
  let sw = null;
  list.addEventListener('pointerdown', (e) => { if (e.pointerType === 'mouse') return; const li = e.target.closest('.n-item'); if (!li || e.target.closest('.n-x')) return; sw = { li, x: e.clientX, y: e.clientY, dx: 0, lock: false }; });
  list.addEventListener('pointermove', (e) => { if (!sw) return; const dx = e.clientX - sw.x, dy = e.clientY - sw.y; if (!sw.lock && Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) { sw = null; return; } if (Math.abs(dx) > 8) { sw.lock = true; sw.dx = Math.min(0, dx); sw.li.style.transition = 'none'; sw.li.style.transform = `translateX(${sw.dx}px)`; sw.li.style.opacity = String(1 + sw.dx / 300); } });
  const end = () => { if (!sw) return; const { li, dx } = sw; sw = null; li.style.transition = ''; if (dx < -90) { li.classList.add('is-out'); dismiss([li.dataset.id], 'Notification dismissed.'); } else { li.style.transform = ''; li.style.opacity = ''; } };
  list.addEventListener('pointerup', end); list.addEventListener('pointercancel', end);

  /* filter menu */
  const menu = $('#menu'), fb = $('#filter');
  const close = () => { menu.hidden = true; fb.setAttribute('aria-expanded', 'false'); };
  fb.addEventListener('click', (e) => { e.stopPropagation(); const open = menu.hidden; menu.hidden = !open; fb.setAttribute('aria-expanded', String(open)); if (open) $('[aria-checked="true"]', menu).focus(); });
  menu.addEventListener('click', (e) => { const b = e.target.closest('[data-f]'); if (!b) return; S.f = b.dataset.f; $$('button', menu).forEach((x) => x.setAttribute('aria-checked', String(x === b))); close(); render(true); });
  document.addEventListener('click', (e) => { if (!menu.hidden && !e.target.closest('.n-more')) close(); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape') { close(); } });

  $('#back').addEventListener('click', (e) => { try { if (document.referrer && new URL(document.referrer).origin === location.origin && history.length > 1) { e.preventDefault(); history.back(); } } catch (_) {} });
  addEventListener('storage', (e) => {
    if (e.key !== 'briefdrop.notifs') return;
    N = store.get('briefdrop.notifs', []);
    if (!Array.isArray(N)) N = [];
    render(false);
  });
  addEventListener('scroll', () => top.classList.toggle('is-stuck', scrollY > 4), { passive: true });
  setInterval(() => { if (N.length && !document.hidden) { $$('.n-item').forEach((li) => { const n = N.find((x) => x.id === li.dataset.id); if (n) $('.n-time', li).textContent = ago(n.at); }); } }, 60000);

  /* empty-state art: parallax + tap to scatter sparkles */
  const art = $('#art');
  if (finePointer && !reduce) addEventListener('pointermove', (e) => { if (empty.hidden) return; art.style.setProperty('--px', ((e.clientX / innerWidth) - .5).toFixed(3)); art.style.setProperty('--py', ((e.clientY / innerHeight) - .5).toFixed(3)); }, { passive: true });
  art.addEventListener('click', (e) => {
    if (reduce) return; const gl = ['✦', 'z', '✦', 'Z'], col = ['#faae1f', '#7aa5ff', '#f9e8c3', '#fff'];
    for (let i = 0; i < 9; i++) { const g = document.createElement('span'); g.className = 'n-glyph'; g.textContent = gl[i % 4]; g.style.cssText = `left:${e.clientX}px;top:${e.clientY}px;font-size:${14 + Math.random() * 16}px;color:${col[i % 4]}`; document.body.append(g);
      const a = -Math.PI / 2 + (Math.random() - .5) * 2.4, d = 60 + Math.random() * 110;
      g.animate([{ transform: 'translate(-50%,-50%) scale(.4)', opacity: 0 }, { transform: `translate(calc(-50% + ${Math.cos(a) * d}px), calc(-50% + ${Math.sin(a) * d}px)) scale(1)`, opacity: 1, offset: .35 }, { transform: `translate(calc(-50% + ${Math.cos(a) * d * 1.2}px), calc(-50% + ${Math.sin(a) * d + 70}px)) scale(.7)`, opacity: 0 }], { duration: 1000 + Math.random() * 500, easing: 'cubic-bezier(.2,.7,.4,1)' }).onfinish = () => g.remove(); }
  });
  render(true);
})();
