/* 화면 크기별 «실제로 보이는 월드 영역» 비교 + 안전지도 패널 크기.
   월드 좌표는 0..1 정규화다(0190 의 SPAWN=[0.5,0.5]).
   따라서 보이는 월드 = 뷰포트px / (월드 1.0 당 화면px) 이고, 1.0 이면 «맵 전체». */
const { chromium } = require('playwright');
const CASES = [
  { 이름: 'PC 가로   1440x900', w: 1440, h: 900, dpr: 1, m: false },
  { 이름: '탭  가로   1280x800', w: 1280, h: 800, dpr: 2, m: true },
  { 이름: '폰  가로    874x300', w: 874, h: 300, dpr: 3, m: true },
  { 이름: '폰  가로    780x360', w: 780, h: 360, dpr: 3, m: true }
];
const URL = process.argv[2];

async function boot(ctx) {
  const p = await ctx.newPage();
  await p.goto(URL, { waitUntil: 'load', timeout: 180000 });
  await p.waitForTimeout(2500);
  await p.evaluate(() => { const x = document.getElementById('bd-title-start'); if (x) x.click(); });
  for (let i = 0; i < 25; i++) { await p.waitForTimeout(700);
    if (await p.evaluate(() => !!document.getElementById('char-card-1') && document.getElementById('char-card-1').getBoundingClientRect().width > 2)) break; }
  await p.evaluate(() => { const c = document.getElementById('char-card-1'); if (c) c.click(); });
  await p.waitForTimeout(900);
  await p.evaluate(() => { const g = [...document.querySelectorAll('button,.modal-btn')].filter(x => x.getBoundingClientRect().width > 2)
    .find(x => /모험\s*시작/.test(x.textContent || '')); if (g) g.click(); });
  for (let i = 0; i < 25; i++) { await p.waitForTimeout(900);
    const s = await p.evaluate(() => { try { return currentStage; } catch (e) { return null; } }); if (s && s !== 1) break; }
  await p.waitForTimeout(3500);
  return p;
}

(async () => {
  const b = await chromium.launch({ headless: true, channel: 'chrome' });
  for (const c of CASES) {
    const ctx = await b.newContext({ viewport: { width: c.w, height: c.h }, deviceScaleFactor: c.dpr, hasTouch: c.m, isMobile: c.m });
    const p = await boot(ctx);
    const r = await p.evaluate(() => {
      const f = window.BD_screenRectOfWorld;
      const gs = document.getElementById('game-screen');
      const z = parseFloat(getComputedStyle(document.body).zoom) || 1;
      let fov = '측정불가';
      if (f) {
        /* w/h 를 0 으로 주면 null 을 돌려준다 — 1 로 준다 */
        const a = f(0, 0, 1, 1), c2 = f(1, 1, 1, 1);
        if (a && c2) {
          const sx = c2.left - a.left, sy = c2.top - a.top;      /* 월드 1.0 당 화면 px */
          fov = { 가로: +(innerWidth / sx).toFixed(2), 세로: +(innerHeight / sy).toFixed(2),
            월드당px: Math.round(sx) + 'x' + Math.round(sy) };
        }
      }
      return { fov, 논리: gs ? gs.offsetWidth + 'x' + gs.offsetHeight : '?', zoom: +z.toFixed(3),
        대사창높이: (() => { const d = document.getElementById('dialogue-box');
          if (!d) return '없음'; const q = d.getBoundingClientRect();
          return q.height < 4 ? '숨김' : Math.round(q.height) + 'px (' + (q.height / innerHeight * 100).toFixed(0) + '%)'; })() };
    });
    /* 안전지도를 열어 패널 크기 */
    await p.evaluate(() => { try { if (window.BD_openSafetyMap) BD_openSafetyMap(); } catch (e) {} });
    await p.waitForTimeout(1400);
    const mapInfo = await p.evaluate(() => {
      const VW = innerWidth, VH = innerHeight;
      let best = null;
      document.querySelectorAll('div,section').forEach(e => {
        const s = getComputedStyle(e);
        if (s.display === 'none' || s.visibility === 'hidden') return;
        if (!/fixed|absolute/.test(s.position)) return;
        const q = e.getBoundingClientRect();
        if (q.width < 150 || q.height < 90) return;
        if (q.width > VW * 0.99 && q.height > VH * 0.99) return;      /* 배경 오버레이 제외 */
        if (e.querySelector('div,section')) { /* 컨테이너여도 지도 본체면 받는다 */ }
        if (!/상리|봉담|안전지도|마을|읍/.test(e.textContent || '')) return;
        if (!best || q.width * q.height > best.a) best = { a: q.width * q.height, e: e, q: q };
      });
      if (!best) return '지도 패널 못 찾음';
      const q = best.q, e = best.e;
      const hidden = e.scrollHeight - e.clientHeight;
      return { id: e.id || '.' + String(e.className).split(' ')[0],
        크기: Math.round(q.width) + 'x' + Math.round(q.height),
        '화면대비': (q.width / VW * 100).toFixed(0) + '% x ' + (q.height / VH * 100).toFixed(0) + '%',
        잘림: hidden > 8 ? hidden + 'px 숨음' : '없음',
        작은글씨: (() => { let n = 0, min = 99;
          e.querySelectorAll('*').forEach(x => { if (!x.children.length && (x.textContent || '').trim()) {
            const fs = parseFloat(getComputedStyle(x).fontSize) * (parseFloat(getComputedStyle(document.body).zoom) || 1);
            if (fs < 12) n++; if (fs < min) min = fs; } });
          return n + '개 (<12px), 최소 ' + min.toFixed(1) + 'px'; })() };
    });
    console.log('── ' + c.이름);
    console.log('   보이는 월드   가로 ' + (r.fov.가로 !== undefined ? r.fov.가로 : r.fov) + '  세로 ' + (r.fov.세로 !== undefined ? r.fov.세로 : '') + '   (1.00 = 맵 전체)');
    console.log('   논리 ' + r.논리 + ' · zoom ' + r.zoom + ' · 대사창 ' + r.대사창높이);
    console.log('   안전지도 ' + JSON.stringify(mapInfo));
    await p.screenshot({ path: '검수도구/_fov_' + c.w + '.png' });
    await ctx.close();
  }
  await b.close();
})().catch(e => { console.error(e.message); process.exit(1); });
