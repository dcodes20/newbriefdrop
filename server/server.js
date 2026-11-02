/* BriefDrop – tiny backend that lets the app generate briefs with Claude.
 *
 *   ANTHROPIC_API_KEY=sk-ant-... node server/server.js          (from the project root)
 *   → open http://localhost:8787/home.html
 *
 * - Serves the static site and exposes POST /api/briefs  { count, skills, level, discipline, topic, avoid }
 * - Keeps your API key on the server (never in the browser).
 * - Optional: BRIEF_MODEL (default claude-sonnet-5-5), PORT (default 8787).
 * No dependencies; needs Node 18+. Not hardened for production (add auth / rate limiting before deploying).
 * If the key is missing or a call fails, it returns an error and the app falls back to its local generator.
 */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PORT = process.env.PORT || 8787;
const MODEL = process.env.BRIEF_MODEL || 'claude-sonnet-5-5';
const KEY = process.env.ANTHROPIC_API_KEY;
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.json': 'application/json' };

function prompt(b) {
  const count = Math.max(1, Math.min(30, Number(b.count) || 1));
  const bits = [
    `Invent ${count} fresh, specific practice briefs for a creative learner. Each is a small, realistic project they could finish in the stated time.`,
    b.discipline ? `Craft: ${String(b.discipline).slice(0, 40)}.` : (Array.isArray(b.skills) && b.skills.length ? `Pick crafts from: ${b.skills.slice(0, 9).join(', ')}.` : ''),
    b.level ? `Level: ${String(b.level).slice(0, 20)} (Beginner, Intermediate, Advanced or Expert).` : 'Mix levels, mostly Intermediate.',
    b.topic ? `Topic or industry: ${String(b.topic).slice(0, 28)}.` : 'Vary the industries widely.',
    Array.isArray(b.avoid) && b.avoid.length ? `Never repeat or closely echo these: ${b.avoid.slice(0, 30).map((t) => String(t).slice(0, 100)).join(' | ')}` : '',
    b.wide ? 'Vary the time commitment widely, from "30 min" to "4 weeks", matching the level.' : '',
    'Titles are one imperative sentence under 80 characters, like "Design a calm savings experience for young adults".',
    'Respond with JSON only, no prose: {"briefs":[{"title":string,"summary":string (one sentence, under 110 characters),"category":string (Design, Brand, Development, Writing or Motion),"domain":string (one or two words, e.g. Fintech),"level":"Beginner|Intermediate|Advanced|Expert","time":string (e.g. "3–5 hours"),"discipline":string,"deliverables":[3 short strings]}]}',
  ];
  return bits.filter(Boolean).join('\n');
}

async function briefs(body) {
  if (!KEY) { const e = new Error('ANTHROPIC_API_KEY is not set'); e.status = 503; throw e; }
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: MODEL, max_tokens: Math.min(8000, 300 + 220 * Math.max(1, Math.min(30, Number(body.count) || 1))), temperature: 1, messages: [{ role: 'user', content: prompt(body) }] }),
  });
  if (!r.ok) { const e = new Error('Anthropic API ' + r.status); e.status = 502; throw e; }
  const data = await r.json();
  const text = (data.content || []).map((c) => c.text || '').join('');
  const s = text.indexOf('{'), e = text.lastIndexOf('}');
  if (s < 0 || e < 0) throw Object.assign(new Error('No JSON in reply'), { status: 502 });
  return JSON.parse(text.slice(s, e + 1));
}

http.createServer(async (req, res) => {
  try {
    if (req.method === 'POST' && req.url === '/api/briefs') {
      let raw = ''; for await (const c of req) { raw += c; if (raw.length > 20000) throw Object.assign(new Error('Too large'), { status: 413 }); }
      const out = await briefs(JSON.parse(raw || '{}'));
      res.writeHead(200, { 'content-type': 'application/json' }); return res.end(JSON.stringify(out));
    }
    if (req.method !== 'GET') { res.writeHead(405); return res.end(); }
    let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/home.html';
    const file = path.normalize(path.join(ROOT, p));
    if (!file.startsWith(ROOT) || file.includes(path.sep + 'server' + path.sep)) { res.writeHead(403); return res.end(); }
    fs.readFile(file, (err, buf) => {
      if (err) { res.writeHead(404); return res.end('Not found'); }
      res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' }); res.end(buf);
    });
  } catch (err) {
    res.writeHead(err.status || 500, { 'content-type': 'application/json' }); res.end(JSON.stringify({ error: err.message }));
  }
}).listen(PORT, () => console.log(`BriefDrop on http://localhost:${PORT}  (${KEY ? 'Claude: ' + MODEL : 'no ANTHROPIC_API_KEY → local fallback'})`));
