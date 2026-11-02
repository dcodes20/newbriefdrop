/* BriefDrop – brief source.
   BriefAI.generate({ count, skills, level, discipline, topic, avoid }) → Promise<{ briefs, source }>
     source "claude" : briefs came from your backend (server/server.js → Claude).
     source "local"  : the backend wasn't reachable, so a local generator remixed a fresh set.
   Either way a brief is never repeated: recently seen titles are remembered and avoided. */
(() => {
  'use strict';

  const LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
  const TIME = { Beginner: '1–2 hours', Intermediate: '3–5 hours', Advanced: '6–8 hours', Expert: '1–2 days' };
  const LEVEL_FROM_ONBOARDING = { 'Just starting': 'Beginner', 'Getting good': 'Intermediate', 'Pretty solid': 'Advanced', 'Dangerous': 'Expert' };
  const DURATIONS = {
    Beginner: ['30 min', '45 min', '1–2 hours', '2 hours'],
    Intermediate: ['1–3 hours', '3–5 hours', '1 day', '2 days'],
    Advanced: ['3–5 hours', '6–8 hours', '1 week', '2 weeks'],
    Expert: ['1–2 days', '1 week', '2 weeks', '4 weeks'],
  };
  const CATEGORY = { 'UI/UX Design': 'Design', 'Illustration': 'Design', 'Graphics Design': 'Design', 'Logo Design': 'Design', 'Brand Design': 'Brand', 'Frontend Development': 'Development', 'Copywriting': 'Writing', 'Motion Design': 'Motion', 'Video Editing': 'Motion' };
  /* "1–3 hours" → 120, "45 min" → 45, "4 weeks" → 40320 (average of a range) */
  function minutes(str) {
    const m = String(str || '').toLowerCase().match(/(\d+(?:\.\d+)?)(?:\s*[–-]\s*(\d+(?:\.\d+)?))?\s*(min|hour|hr|day|week)/);
    if (!m) return 180;
    const a = parseFloat(m[1]), b = m[2] ? parseFloat(m[2]) : a, mult = { min: 1, hour: 60, hr: 60, day: 480, week: 2400 }[m[3]];
    return Math.round(((a + b) / 2) * mult);
  }
  const lowFirst = (t) => t.charAt(0).toLowerCase() + t.slice(1);
  const summaryFrom = (d) => (d && d.length >= 3 ? `Start with ${lowFirst(d[0])}, then ${lowFirst(d[1])}, and finish with ${lowFirst(d[2])}.` : 'A focused, finishable project to stretch your craft.');
  const DISCIPLINES = ['UI/UX Design', 'Illustration', 'Brand Design', 'Motion Design', 'Graphics Design', 'Copywriting', 'Video Editing', 'Logo Design', 'Frontend Development'];

  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const hash = (s) => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); };

  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (_) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) {} },
  };
  const readSession = (k, d) => { try { const v = sessionStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (_) { return d; } };

  /* ---- what the onboarding screens remembered ---- */
  function prefs() {
    let skills = readSession('briefdrop.skills', []);
    if (!Array.isArray(skills)) skills = [];
    let level = ''; try { level = sessionStorage.getItem('briefdrop.level') || ''; } catch (_) {}
    return { skills: skills.filter((s) => DISCIPLINES.includes(s)), level: LEVEL_FROM_ONBOARDING[level] || '' };
  }

  /* ---- local generator: a big pool of parts, mixed fresh every time ---- */
  const DOMAINS = {
    Fintech: { things: ['a calm savings experience', 'a bill-splitting flow', 'a first-investment onboarding', 'a spending insights screen', 'a no-stress budgeting tool', 'a round-up savings habit'], aud: ['young adults', 'freelancers', 'first-time earners', 'small shop owners', 'students abroad'] },
    Health: { things: ['a sleep wind-down routine', 'a gentle habit tracker', 'a medication reminder', 'a hydration companion', 'a post-workout recovery guide'], aud: ['night-shift workers', 'busy parents', 'new runners', 'people over 60', 'desk workers'] },
    Travel: { things: ['a last-minute weekend planner', 'a group trip budget tool', 'an offline city guide', 'a packing assistant', 'a local-food discovery map'], aud: ['solo travellers', 'backpackers', 'families', 'first-time flyers', 'remote workers'] },
    Food: { things: ['a weekly meal-prep planner', 'a leftovers rescue app', 'a street-food discovery feed', 'a recipe-by-pantry finder', 'a shared grocery list'], aud: ['students', 'home cooks', 'flatmates', 'busy professionals', 'new parents'] },
    Education: { things: ['a language practice streak', 'a revision timetable', 'a study-group matcher', 'a bite-sized coding lesson', 'a flashcard review loop'], aud: ['exam candidates', 'self-taught learners', 'teenagers', 'career switchers', 'night-school students'] },
    Climate: { things: ['a home energy tracker', 'a secondhand-first marketplace', 'a neighbourhood recycling map', 'a carbon-light commute planner', 'a repair-not-replace guide'], aud: ['renters', 'city commuters', 'small businesses', 'eco-curious beginners', 'community groups'] },
    Music: { things: ['a collaborative playlist room', 'a practice-session timer', 'a local gig finder', 'a lyric-writing notebook', 'a producer feedback loop'], aud: ['bedroom producers', 'choir singers', 'festival-goers', 'beginner guitarists', 'indie artists'] },
    Social: { things: ['a close-friends check-in', 'an event RSVP page', 'a neighbourhood skills swap', 'a shared memory scrapbook', 'a small-circle group chat space'], aud: ['long-distance friends', 'new city arrivals', 'alumni groups', 'hobby clubs', 'families'] },
    Gaming: { things: ['a squad scheduling tool', 'a cozy-game discovery shelf', 'a speedrun progress tracker', 'a tabletop session companion', 'a new-player onboarding'], aud: ['casual players', 'tabletop groups', 'streamers', 'returning gamers', 'esports fans'] },
    Mobility: { things: ['a safe-ride sharing flow', 'a bus-arrival glance widget', 'a bike-lane route planner', 'a parking finder', 'a school-run carpool board'], aud: ['commuters', 'students', 'delivery riders', 'older adults', 'night-out groups'] },
    Commerce: { things: ['a checkout that feels effortless', 'a size-and-fit finder', 'a preorder countdown', 'a local-maker storefront', 'a gift-picking assistant'], aud: ['first-time buyers', 'thrift lovers', 'small brands', 'gift-givers', 'mobile-first shoppers'] },
    Productivity: { things: ['a one-task-at-a-time focus screen', 'a meeting-notes digest', 'a Sunday planning ritual', 'a distraction-free inbox', 'a shared team to-do board'], aud: ['freelancers', 'remote teams', 'students', 'founders', 'creative leads'] },
    Civic: { things: ['a community issue reporter', 'a clear voting-guide', 'a local-events board', 'a public-service finder', 'a neighbourhood alert feed'], aud: ['first-time voters', 'residents', 'volunteers', 'older neighbours', 'local councils'] },
  };
  const FORMS = {
    'UI/UX Design': ['Design {t} for {a}', 'Redesign {t} so it feels effortless for {a}', 'Prototype {t} aimed at {a}', 'Map and design the key screens of {t} for {a}'],
    'Frontend Development': ['Build a responsive landing page for {t} aimed at {a}', 'Code an interactive prototype of {t} for {a}', 'Build the signup flow for {t} aimed at {a}'],
    'Brand Design': ['Name and brand {t} for {a}', 'Create a visual identity for {t} aimed at {a}', 'Define the tone and look of {t} for {a}'],
    'Copywriting': ['Write five hooks that sell {t} to {a}', 'Write the onboarding microcopy for {t} aimed at {a}', 'Write a launch email for {t} to {a}', 'Rewrite the app-store pitch for {t} aimed at {a}'],
    'Illustration': ['Illustrate a hero scene for {t} aimed at {a}', 'Draw a friendly mascot for {t} for {a}', 'Create a three-panel story that explains {t} to {a}'],
    'Motion Design': ['Animate a 10-second intro for {t} aimed at {a}', 'Design a delightful loading moment for {t} for {a}', 'Storyboard and animate a feature reveal of {t} for {a}'],
    'Graphics Design': ['Design a launch poster for {t} aimed at {a}', 'Create a social carousel that promotes {t} to {a}', 'Design an event flyer for {t} for {a}'],
    'Video Editing': ['Cut a 30-second teaser for {t} aimed at {a}', 'Edit a vertical promo for {t} for {a}', 'Turn raw clips into a story about {t} for {a}'],
    'Logo Design': ['Design a logo mark for {t} aimed at {a}', 'Create a wordmark and icon for {t} for {a}', 'Explore three logo directions for {t} for {a}'],
  };
  const DELIVERABLES = {
    'UI/UX Design': ['A one-line problem statement', 'Low-fidelity flow sketch', 'Three key screens in high fidelity', 'A clickable prototype', 'A short rationale for your choices'],
    'Frontend Development': ['A responsive layout at three widths', 'One meaningful interaction', 'Accessible focus states', 'A clean, commented repo', 'A short README'],
    'Brand Design': ['Name shortlist with a pick', 'Colour and type palette', 'Logo lockup', 'Voice in three adjectives', 'One mock application'],
    'Copywriting': ['Five headline options', 'One finished version, polished', 'A tone note', 'Two alternates for A/B testing', 'A one-line CTA'],
    'Illustration': ['Three rough thumbnails', 'One finished illustration', 'A limited colour palette', 'A black-and-white variant', 'A short process note'],
    'Motion Design': ['A storyboard', 'Timing and easing notes', 'The final animation', 'A looping variant', 'An exported preview'],
    'Graphics Design': ['A layout grid sketch', 'The final artwork', 'A dark and a light version', 'Print-ready or social-ready exports', 'A type pairing note'],
    'Video Editing': ['A shot list', 'A rough cut', 'The final edit with sound', 'A captioned version', 'A thumbnail frame'],
    'Logo Design': ['Ten quick sketches', 'Three refined directions', 'One final mark', 'Light, dark and mono versions', 'A minimum-size test'],
  };

  const seenTitles = () => store.get('briefdrop.seen', []);
  const remember = (titles) => store.set('briefdrop.seen', [...titles, ...seenTitles()].slice(0, 200));

  function localOne(o, avoid) {
    const p = prefs();
    const pool = (o.skills && o.skills.length ? o.skills : DISCIPLINES);
    const discipline = o.discipline || (o.spread && o.i != null ? pool[o.i % pool.length] : pick(pool));
    const level = LEVELS.includes(o.level) ? o.level : (o.level === 'mixed' ? pick(LEVELS) : (p.level || (Math.random() < .6 ? 'Intermediate' : pick(LEVELS))));
    let names = Object.keys(DOMAINS), domain = pick(names), things, aud;
    const topic = (o.topic || '').trim();
    if (topic) {
      const hit = names.find((n) => n.toLowerCase() === topic.toLowerCase());
      if (hit) domain = hit;
      else { domain = cap(topic.slice(0, 22)); }
    }
    if (DOMAINS[domain]) { things = DOMAINS[domain].things; aud = DOMAINS[domain].aud; }
    else {
      const base = DOMAINS[pick(names)];
      things = [`a ${topic.toLowerCase()} companion app`, `a ${topic.toLowerCase()} onboarding flow`, `a ${topic.toLowerCase()} community space`, `a ${topic.toLowerCase()} discovery feed`];
      aud = base.aud;
    }
    let title = '', tries = 0;
    do {
      title = cap(pick(FORMS[discipline] || FORMS['UI/UX Design']).replace('{t}', pick(things)).replace('{a}', pick(aud)));
      tries++;
    } while (avoid.has(title) && tries < 40);
    const deliverables = shuffle(DELIVERABLES[discipline] || DELIVERABLES['UI/UX Design']).slice(0, 3);
    return { title, domain, level, time: o.wide ? pick(DURATIONS[level]) : TIME[level], discipline, category: CATEGORY[discipline] || 'Design', summary: summaryFrom(deliverables), deliverables };
  }

  function localBriefs(o) {
    const avoid = new Set([...(o.avoid || []), ...seenTitles()]);
    const out = [];
    for (let i = 0; i < o.count; i++) { const b = localOne({ ...o, i: (o.offset || 0) + i }, avoid); avoid.add(b.title); out.push(b); }
    return out;
  }

  /* ---- backend (Claude) ---- */
  function endpoint() {
    const m = document.querySelector('meta[name="briefdrop-api"]');
    return m ? m.getAttribute('content') : '';
  }

  function clean(raw) {
    if (!raw || typeof raw.title !== 'string') return null;
    const title = raw.title.trim().replace(/\s+/g, ' ').slice(0, 140);
    if (title.length < 8) return null;
    const level = LEVELS.find((l) => l.toLowerCase() === String(raw.level || '').toLowerCase()) || 'Intermediate';
    const dl = Array.isArray(raw.deliverables) ? raw.deliverables.filter((d) => typeof d === 'string' && d.trim()).map((d) => d.trim().slice(0, 120)).slice(0, 5) : [];
    const disc = typeof raw.discipline === 'string' ? raw.discipline.slice(0, 40) : '';
    return {
      summary: (typeof raw.summary === 'string' && raw.summary.trim() ? raw.summary.trim().slice(0, 200) : summaryFrom(dl)),
      category: (typeof raw.category === 'string' && raw.category.trim() ? raw.category.trim().slice(0, 16) : (CATEGORY[disc] || 'Design')),
      title,
      domain: String(raw.domain || 'Design').trim().slice(0, 24) || 'Design',
      level,
      time: String(raw.time || TIME[level]).trim().slice(0, 20) || TIME[level],
      discipline: typeof raw.discipline === 'string' ? raw.discipline.slice(0, 40) : '',
      deliverables: dl.length >= 2 ? dl : ['A first draft', 'A refined version', 'A short note on your choices'],
    };
  }

  async function remote(o) {
    const url = endpoint();
    if (!url) throw new Error('no endpoint');
    const ctl = new AbortController();
    const to = setTimeout(() => ctl.abort(), o.count > 8 ? 45000 : 15000);
    try {
      const res = await fetch(url, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: ctl.signal,
        body: JSON.stringify({ count: o.count, wide: o.wide, skills: o.skills, level: o.level, discipline: o.discipline || '', topic: o.topic || '', avoid: o.avoid.slice(0, 30) }),
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      const list = (Array.isArray(data) ? data : data.briefs || []).map(clean).filter(Boolean);
      if (!list.length) throw new Error('empty');
      return list.slice(0, o.count);
    } finally { clearTimeout(to); }
  }

  async function generate(opts = {}) {
    const p = prefs();
    const o = {
      count: Math.max(1, Math.min(30, opts.count || 1)), wide: !!opts.wide, spread: !!opts.spread,
      skills: opts.skills || p.skills, level: opts.level || p.level,
      discipline: opts.discipline || '', topic: opts.topic || '',
      avoid: [...new Set([...(opts.avoid || []), ...seenTitles()])],
    };
    let briefs, source = 'claude';
    try { briefs = await remote(o); }
    catch (_) { briefs = localBriefs(o); source = 'local'; }
    // top up if the backend returned fewer than asked
    if (briefs.length < o.count) briefs = briefs.concat(localBriefs({ ...o, count: o.count - briefs.length, avoid: [...o.avoid, ...briefs.map((b) => b.title)] }));
    briefs.forEach((b) => { b.id = 'b_' + hash(b.title + Math.random()); b.source = source; });
    remember(briefs.map((b) => b.title));
    return { briefs, source };
  }

  /* A big pool in one go (the Briefs screen): chunks of 8 in parallel, each spread over a third of the crafts,
     mixed levels and durations. Each chunk falls back to the local generator on its own. */
  async function generateMany(n = 24, opts = {}) {
    const per = 8, chunks = Math.ceil(n / per);
    const jobs = Array.from({ length: chunks }, (_, i) => generate({
      count: Math.min(per, n - i * per), skills: DISCIPLINES.filter((_, k) => k % chunks === i),
      level: 'mixed', wide: true, spread: true, avoid: opts.avoid || [],
    }));
    const parts = await Promise.all(jobs);
    const seen = new Set(), briefs = [];
    parts.forEach((r) => r.briefs.forEach((b) => { if (!seen.has(b.title)) { seen.add(b.title); briefs.push(b); } }));
    if (briefs.length < n) {
      const extra = localBriefs({ count: n - briefs.length, skills: DISCIPLINES, level: 'mixed', wide: true, spread: true, avoid: [...seen], offset: briefs.length });
      extra.forEach((b) => { b.id = 'b_' + hash(b.title + Math.random()); b.source = 'local'; briefs.push(b); });
    }
    const sources = new Set(parts.map((r) => r.source));
    return { briefs: shuffle(briefs).slice(0, n), source: sources.size === 1 ? [...sources][0] : 'mixed' };
  }

  window.BriefAI = { generate, generateMany, minutes, DISCIPLINES, LEVELS };
})();
