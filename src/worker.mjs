import { SITE } from './config.mjs';
import { documents } from './docs.mjs';
import { homePage, infoPage } from './html.mjs';
import { DEMO } from './demo.mjs';
import { TIERS, normalize, matchAnswer, etDate, resetAt, ROUND_MS, PREVIEW_MS } from '../public/rules.mjs';

const cache = new Map();
const json = (data, status = 200, extra = {}) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store', ...extra } });
const fail = (message, status = 400) => json({ error: message }, status);
const playerId = request => request.headers.get('Cookie')?.match(/(?:^|;\s*)ok_player=([a-f0-9-]{36})/)?.[1];
function headers(response, additional = {}) {
  const h = new Headers(response.headers);
  for (const [k, v] of Object.entries({ 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'strict-origin-when-cross-origin', 'Permissions-Policy': 'camera=(), microphone=(), geolocation=()', 'X-Frame-Options': 'SAMEORIGIN', ...additional })) h.set(k, v);
  return new Response(response.body, { status: response.status, headers: h });
}
export function validateReference(today, reveal, date) {
  if (today?.date !== date || reveal?.date !== date || today.prompts?.length !== 7 || reveal.prompts?.length !== 7) throw new Error('Reference puzzle date or round count mismatch');
  return { date, dayNumber: today.dayNumber, source: 'Reference snapshot from krillion.io', prompts: today.prompts.map(p => {
    const source = reveal.prompts.find(r => r.id === p.id && r.text === p.text);
    if (!source?.answers?.length) throw new Error('Missing reference answer set');
    return { id: p.id, text: p.text, answers: source.answers.filter(a => typeof a.answer === 'string' && TIERS[a.tier]).map(a => ({ answer: a.answer, tier: a.tier, ...(a.quip ? { quip: a.quip } : {}), ...(Array.isArray(a.aliases) ? { aliases: a.aliases.filter(x => typeof x === 'string') } : {}) })) };
  }) };
}
export async function syncPuzzle(env, date = etDate()) {
  const [t, r] = await Promise.all([
    fetch('https://krillion.io/api/today', { signal: AbortSignal.timeout(12000), headers: { 'User-Agent': 'OpenKrillion/1.0 (+https://openkrillion.com/about)' } }),
    fetch(`https://krillion.io/api/reveal?date=${date}`, { signal: AbortSignal.timeout(12000), headers: { 'User-Agent': 'OpenKrillion/1.0 (+https://openkrillion.com/about)' } }),
  ]);
  if (!t.ok || !r.ok) throw new Error('Reference service unavailable');
  const puzzle = validateReference(await t.json(), await r.json(), date);
  await env.DB.prepare('INSERT INTO puzzles(date,day_number,source,content) VALUES(?,?,?,?) ON CONFLICT(date) DO UPDATE SET day_number=excluded.day_number, source=excluded.source, content=excluded.content, updated_at=CURRENT_TIMESTAMP').bind(date, puzzle.dayNumber, puzzle.source, JSON.stringify(puzzle)).run();
  if (env.BUCKET) await env.BUCKET.put(`puzzles/${date}.json`, JSON.stringify(puzzle), { httpMetadata: { contentType: 'application/json' } });
  cache.set(date, puzzle);
  return puzzle;
}
async function puzzleFor(env, date) {
  if (cache.has(date)) return cache.get(date);
  const row = await env.DB.prepare('SELECT content FROM puzzles WHERE date=?').bind(date).first();
  if (row) { const p = JSON.parse(row.content); cache.set(date, p); return p; }
  if (env.REFERENCE_SYNC === 'true' && date === etDate()) {
    try { return await syncPuzzle(env, date); } catch (e) { console.warn('Puzzle synchronization failed:', e.message); }
  }
  return { ...DEMO, date, dayNumber: Math.floor((Date.parse(date) - Date.parse('2026-07-16')) / 86400000) + 1, sample: true };
}
async function saveSample(env, puzzle) {
  if (puzzle.sample) await env.DB.prepare('INSERT OR IGNORE INTO puzzles(date,day_number,source,content) VALUES(?,?,?,?)').bind(puzzle.date, puzzle.dayNumber, puzzle.source, JSON.stringify(puzzle)).run();
}
function promptDTO(puzzle) {
  return { date: puzzle.date, dayNumber: puzzle.dayNumber, sample: !!puzzle.sample, source: puzzle.source, resetsAt: resetAt(puzzle.date), prompts: puzzle.prompts.map(({ id, text }) => ({ id, text })) };
}
async function state(env, run) {
  const results = (await env.DB.prepare('SELECT round,raw_answer AS rawAnswer,answer,tier,score FROM answers WHERE run_id=? ORDER BY round').bind(run.id).all()).results;
  const puzzle = await puzzleFor(env, run.date);
  return { ...promptDTO(puzzle), runId: run.id, mode: run.mode, round: run.next_round, roundStart: run.round_start, pausedAt: run.paused_at || null, serverNow: Date.now(), completed: !!run.completed, results, score: results.reduce((s, r) => s + r.score, 0) };
}
async function ownRun(env, id, player) {
  if (!/^[a-f0-9-]{36}$/.test(id || '')) return null;
  return env.DB.prepare('SELECT * FROM runs WHERE id=? AND player=?').bind(id, player || '').first();
}
async function limit(env, request, player) {
  const window = Math.floor(Date.now() / 60000);
  const raw = `${player || ''}|${request.headers.get('CF-Connecting-IP') || 'local'}|${window}`;
  const key = [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw)))].map(x => x.toString(16).padStart(2, '0')).join('');
  const count = await env.DB.prepare('INSERT INTO rate_limits(key,window,count) VALUES(?,?,1) ON CONFLICT(key,window) DO UPDATE SET count=count+1 RETURNING count').bind(key, window).first();
  if (count.count === 1) await env.DB.prepare('DELETE FROM rate_limits WHERE window<?').bind(window - 5).run();
  return count.count <= 100;
}
async function api(request, env, url) {
  const date = etDate(), path = url.pathname, player = playerId(request);
  if (request.method === 'GET' && path === '/api/today') return json(promptDTO(await puzzleFor(env, date)));
  if (request.method === 'GET' && path === '/api/health') return json({ ok: true, name: SITE.name, database: !!(await env.DB.prepare('SELECT 1 AS ok').first()), storage: !!env.BUCKET });
  if (request.method === 'GET' && path === '/api/state') {
    const run = await ownRun(env, url.searchParams.get('run'), player);
    return run ? json(await state(env, run)) : fail('Dive not found on this browser.', 404);
  }
  if (request.method === 'GET' && path === '/api/review') {
    const run = await ownRun(env, url.searchParams.get('run'), player);
    if (!run?.completed) return fail('Finish your dive before opening the answer sheet.', 403);
    const puzzle = await puzzleFor(env, run.date);
    const population = (await env.DB.prepare("SELECT r.id,SUM(a.score) AS score FROM runs r JOIN answers a ON a.run_id=r.id WHERE r.date=? AND r.mode='daily' AND r.completed=1 GROUP BY r.id").bind(run.date).all()).results;
    const own = await state(env, run);
    const others = population.filter(p => p.id !== run.id);
    const dist = Array.from({ length: 71 }, () => 0);
    others.forEach(p => dist[Math.min(70, Math.floor(p.score / 10))]++);
    return json({ prompts: puzzle.prompts.map(p => ({ ...p, answers: p.answers.map(a => ({ ...a, score: TIERS[a.tier].score })).sort((a,b) => b.score - a.score || a.answer.localeCompare(b.answer)) })), population: others.length, betterThan: others.length >= 5 ? Math.round(others.filter(p => p.score < own.score).length / others.length * 100) : null, dist });
  }
  if (request.method !== 'POST') return fail('Unknown endpoint.', 404);
  if (request.headers.get('Origin') && request.headers.get('Origin') !== url.origin) return fail('Cross-origin requests are not accepted.', 403);
  if (Number(request.headers.get('Content-Length') || 0) > 8000) return fail('Request is too large.', 413);
  if (!await limit(env, request, player)) return fail('Too many requests. Take a breath and try again.', 429);
  let data; try { const raw = await request.text(); if (raw.length > 8000) return fail('Request is too large.', 413); data = JSON.parse(raw); } catch { return fail('Invalid request.'); }
  if (!data || typeof data !== 'object' || Array.isArray(data)) return fail('Invalid request.');
  if (path === '/api/start') {
    const id = player || crypto.randomUUID(), mode = data.practice === true ? 'practice' : 'daily';
    const puzzle = await puzzleFor(env, date); await saveSample(env, puzzle);
    let run = mode === 'daily' ? await env.DB.prepare("SELECT * FROM runs WHERE player=? AND date=? AND mode='daily'").bind(id, date).first() : null;
    if (!run) {
      const rid = crypto.randomUUID();
      await env.DB.prepare('INSERT OR IGNORE INTO runs(id,player,date,mode,round_start,created_at) VALUES(?,?,?,?,?,?)').bind(rid, id, date, mode, Date.now() + PREVIEW_MS, Date.now()).run();
      run = mode === 'daily' ? await env.DB.prepare("SELECT * FROM runs WHERE player=? AND date=? AND mode='daily'").bind(id,date).first() : await ownRun(env,rid,id);
    }
    return json(await state(env, run), 200, { 'Set-Cookie': `ok_player=${id}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000${url.protocol === 'https:' ? '; Secure' : ''}` });
  }
  if (path === '/api/pause') {
    const run = await ownRun(env,data.runId,player);
    if (!run) return fail('Dive not found.',404);
    if (data.paused === true && !run.completed && run.round_start !== null && !run.paused_at && Date.now() <= run.round_start + ROUND_MS) {
      await env.DB.prepare('UPDATE runs SET paused_at=? WHERE id=? AND paused_at IS NULL').bind(Date.now(),run.id).run();
    } else if (data.paused === false && run.paused_at) {
      await env.DB.prepare('UPDATE runs SET round_start=round_start+?-paused_at,paused_at=NULL WHERE id=? AND paused_at IS NOT NULL').bind(Date.now(),run.id).run();
    }
    return json(await state(env,await ownRun(env,run.id,player)));
  }
  if (path === '/api/next') {
    const run = await ownRun(env, data.runId, player);
    if (!run) return fail('Dive not found.',404);
    if (run.paused_at) return fail('Close the menu to resume your dive.',409);
    if (!run.completed && run.round_start === null) await env.DB.prepare('UPDATE runs SET round_start=? WHERE id=? AND round_start IS NULL AND completed=0').bind(Date.now()+PREVIEW_MS,run.id).run();
    return json(await state(env, await ownRun(env,run.id,player)));
  }
  if (path === '/api/answer') {
    const run = await ownRun(env,data.runId,player);
    if (!run) return fail('Dive not found.',404);
    if (run.paused_at) return fail('Close the menu to resume your dive.',409);
    if (run.completed || run.round_start === null || data.round !== run.next_round) return json({ state: await state(env, run), alreadyScored: true });
    if (Date.now() < run.round_start && env.LOCAL_DEVELOPMENT !== 'true') return fail('The answer window has not opened yet.',409);
    const puzzle = await puzzleFor(env,run.date), prompt = puzzle.prompts[run.next_round];
    const raw = typeof data.answer === 'string' ? data.answer.trim().slice(0,256) : '';
    const late = Date.now() > run.round_start + ROUND_MS;
    // A small network grace period applies only to the client's timed submission.
    // A late manual request cannot revive an expired answer window.
    const timely = !late || (data.timeout === true && Date.now() <= run.round_start + ROUND_MS + 1500);
    const match = raw && timely ? matchAnswer(raw,prompt.answers) : null;
    if (!match && raw && !late && !data.timeout) return json({ rejected: true, message: `“${raw}”: no echo. try again` });
    if (match?.correction && data.confirm !== true && !late && !data.timeout && data.previewCorrection !== false) return json({ correction: match.answer, original: raw });
    const result = { round: run.next_round, rawAnswer: raw || null, answer: match?.answer || null, tier: match?.tier || null, score: match ? TIERS[match.tier].score : 0, quip: match?.quip || null, promptText: prompt.text };
    const now = Date.now();
    await env.DB.batch([
      env.DB.prepare('INSERT OR IGNORE INTO answers(run_id,round,raw_answer,answer,tier,score,created_at) SELECT id,?,?,?,?,?,? FROM runs WHERE id=? AND next_round=? AND round_start IS NOT NULL AND completed=0').bind(result.round,result.rawAnswer,result.answer,result.tier,result.score,now,run.id,result.round),
      env.DB.prepare('UPDATE runs SET next_round=?,round_start=NULL,completed=? WHERE id=? AND next_round=? AND EXISTS(SELECT 1 FROM answers WHERE run_id=? AND round=?)').bind(result.round+1,result.round===6?1:0,run.id,result.round,run.id,result.round),
    ]);
    const fresh = await state(env, await ownRun(env,run.id,player));
    const accepted = fresh.results.find(r => r.round === result.round);
    return json({ result: { ...result, ...accepted }, state: fresh });
  }
  if (path === '/api/feedback') {
    if (!player) return fail('Play a dive first.',403);
    const text = String(data.text || '').trim().slice(0,1000), kind = data.kind === 'suggestion' ? 'suggestion' : 'rating';
    if (!text) return fail('Please enter a message.');
    const existing = await env.DB.prepare('SELECT COUNT(*) AS n FROM feedback WHERE player=? AND date=?').bind(player,date).first();
    if (existing.n >= 3) return fail('Thanks — enough feedback for today.',429);
    await env.DB.prepare('INSERT INTO feedback(player,date,kind,text,created_at) VALUES(?,?,?,?,?)').bind(player,date,kind,text,Date.now()).run();
    return json({ ok:true });
  }
  if (path === '/api/admin/sync') {
    if (!env.ADMIN_TOKEN || request.headers.get('Authorization') !== `Bearer ${env.ADMIN_TOKEN}`) return fail('Not found.',404);
    const p = await syncPuzzle(env,date); return json({ date:p.date, rounds:p.prompts.length });
  }
  return fail('Unknown endpoint.',404);
}
export default {
  async fetch(request,env,ctx) {
    const url = new URL(request.url);
    try {
      if (url.hostname === 'www.openkrillion.com') { url.hostname='openkrillion.com'; return Response.redirect(url.href,301); }
      if (url.pathname.startsWith('/api/')) return headers(await api(request,env,url));
      if (!['GET','HEAD'].includes(request.method)) return headers(fail('Method not allowed.',405));
      const docs = documents();
      if (docs[url.pathname]) return headers(new Response(request.method==='HEAD'?null:docs[url.pathname],{headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-cache'}}));
      if (url.pathname === '/') return headers(new Response(request.method==='HEAD'?null:homePage(url.searchParams.get('lang') === 'zh' ? 'zh':'en',env),{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-cache'}}));
      if (['/privacy','/about'].includes(url.pathname)) return headers(new Response(request.method==='HEAD'?null:infoPage(url.pathname),{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'public, max-age=300'}}));
      if (url.pathname === '/robots.txt') return headers(new Response('User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: https://openkrillion.com/sitemap.xml\n',{headers:{'Content-Type':'text/plain; charset=utf-8'}}));
      if (url.pathname === '/sitemap.xml') return headers(new Response('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+['/','/about','/privacy'].map(p=>`<url><loc>${SITE.origin}${p}</loc></url>`).join('')+'</urlset>',{headers:{'Content-Type':'application/xml; charset=utf-8'}}));
      if (url.pathname === '/BingSiteAuth.xml' && env.BING_VERIFY) return headers(new Response(`<?xml version="1.0"?><users><user>${env.BING_VERIFY.replace(/[^a-zA-Z0-9]/g,'')}</user></users>`,{headers:{'Content-Type':'application/xml'}}));
      // R2 is private: expose only deliberately public, versioned assets.
      if (url.pathname.startsWith('/media/')) {
        const key=url.pathname.slice(7);
        if (!/^assets\/[a-zA-Z0-9/_.-]+$/.test(key)||key.includes('..')) return fail('Not found.',404);
        const object=await env.BUCKET?.get(key);
        if(!object)return fail('Not found.',404);
        const h=new Headers({'Cache-Control':'public, max-age=86400'});object.writeHttpMetadata(h);h.set('ETag',object.httpEtag);
        return headers(new Response(request.method==='HEAD'?null:object.body,{headers:h}));
      }
      const asset = await env.ASSETS.fetch(request);
      return headers(asset, asset.ok ? { 'Cache-Control': url.pathname.endsWith('.woff2') ? 'public, max-age=31536000, immutable' : 'public, max-age=300' } : {});
    } catch (e) { console.error('Request failed:',e.message); return headers(fail('The signal is temporarily lost. Please retry.',503)); }
  },
  async scheduled(event,env,ctx) { ctx.waitUntil(syncPuzzle(env).catch(e=>console.error('Scheduled reference sync failed:',e.message))); },
};
