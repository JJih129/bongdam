/* 모바일 이식 종합 실측 — FOV / 주인공 크기 / 깜박임 / 우상단 겹침 */
const { chromium } = require('playwright');
const SIZE = { w: 874, h: 300, dpr: 3 };
(async () => {
  const b = await chromium.launch({ headless: true, channel: 'chrome' });
  const p = await (await b.newContext({ viewport: { width: SIZE.w, height: SIZE.h }, deviceScaleFactor: SIZE.dpr, hasTouch: true, isMobile: true })).newPage();
  await p.goto(process.argv[2], { waitUntil: 'load', timeout: 180000 });
  await p.waitForTimeout(3000);
  await p.evaluate(() => { const x = document.getElementById('bd-title-start'); if (x) x.click(); });
  for (let i = 0; i < 25; i++) { await p.waitForTimeout(700);
    if (await p.evaluate(() => !!document.getElementById('char-card-1') && document.getElementById('char-card-1').getBoundingClientRect().width > 2)) break; }
  await p.evaluate(() => { const c = document.getElementById('char-card-1'); if (c) c.click(); });
  await p.waitForTimeout(900);
  await p.evaluate(() => { const g = [...document.querySelectorAll('button,.modal-btn')].filter(x => x.getBoundingClientRect().width > 2)
    .find(x => /모험\s*시작/.test(x.textContent || '')); if (g) g.click(); });
  for (let i = 0; i < 25; i++) { await p.waitForTimeout(900);
    const s = await p.evaluate(() => { try { return currentStage; } catch (e) { return null; } }); if (s && s !== 1) break; }
  await p.waitForTimeout(4000);

  /* ── 1. FOV : 화면에 보이는 월드 영역을 BD_screenRectOfWorld 로 역산 ── */
  const fov = await p.evaluate(() => {
    const f = window.BD_screenRectOfWorld; if (!f) return 'BD_screenRectOfWorld 없음';
    const a = f(0, 0, 1, 1), c = f(100, 100, 1, 1);
    if (!a || !c) return '측정불가';
    const sx = (c.left - a.left) / 100, sy = (c.top - a.top) / 100;   /* 월드1당 화면px */
    const gs = document.getElementById('game-screen');
    const z = parseFloat(getComputedStyle(document.body).zoom) || 1;
    /* 화면 전체(CSS px)를 월드 단위로 환산 */
    return { '월드1당_화면px_가로': +sx.toFixed(3), '월드1당_화면px_세로': +sy.toFixed(3),
      '보이는_월드_가로': Math.round(innerWidth / sx), '보이는_월드_세로': Math.round(innerHeight / sy),
      '논리프레임': gs.offsetWidth + 'x' + gs.offsetHeight, zoom: +z.toFixed(3) };
  });

  /* ── 2. 주인공이 화면에서 차지하는 크기 ── */
  const hero = await p.evaluate(() => {
    const f = window.BD_screenRectOfWorld; if (!f) return '없음';
    let hx, hy; try { hx = player.x; hy = player.y; } catch (e) { return 'player 없음'; }
    const r = f(hx, hy, (typeof player.w === 'number' ? player.w : 32), (typeof player.h === 'number' ? player.h : 48));
    if (!r) return '측정불가';
    return { 화면크기: Math.round(r.width) + 'x' + Math.round(r.height),
      '화면높이대비%': +(r.height / innerHeight * 100).toFixed(1),
      월드좌표: Math.round(hx) + ',' + Math.round(hy),
      화면중앙에서: Math.round(r.left + r.width / 2 - innerWidth / 2) + ',' + Math.round(r.top + r.height / 2 - innerHeight / 2) };
  });

  /* ── 3. 우상단 버튼들 — 실제로 겹치는가 / 몇 줄인가 ── */
  const top = await p.evaluate(() => {
    const els = [...document.querySelectorAll('button,[role=button],div')].filter(e => {
      const s = getComputedStyle(e); if (s.display === 'none' || s.visibility === 'hidden') return false;
      const r = e.getBoundingClientRect();
      return r.width > 8 && r.height > 8 && r.top < innerHeight * 0.42 && r.right > innerWidth * 0.5 && r.width < innerWidth * 0.5;
    }).filter(e => !e.querySelector('button'));
    const box = e => { const r = e.getBoundingClientRect(); return { id: e.id || ('.' + (e.className || '').toString().split(' ')[0]),
      글: (e.textContent || '').trim().slice(0, 10),
      L: Math.round(r.left), T: Math.round(r.top), R: Math.round(r.right), B: Math.round(r.bottom) }; };
    const list = els.map(box);
    const over = [];
    for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
      const a = list[i], c = list[j];
      const ow = Math.min(a.R, c.R) - Math.max(a.L, c.L), oh = Math.min(a.B, c.B) - Math.max(a.T, c.T);
      if (ow > 4 && oh > 4) over.push(a.id + '(' + a.글 + ') ↔ ' + c.id + '(' + c.글 + ') 겹침 ' + ow + 'x' + oh);
    }
    const rows = [...new Set(list.map(e => Math.round(e.T / 8)))].length;
    const mb = document.getElementById('bd-menu-btns');
    return { 버튼: list, 겹침: over, 줄수추정: rows,
      메뉴줄_flexwrap: mb ? getComputedStyle(mb).flexWrap : '없음' };
  });

  /* ── 4. 깜박임 : 3초 동안 요소의 display 가 몇 번 바뀌는가 ── */
  const flick = await p.evaluate(async () => {
    const IDS = ['bd-touch-mapbtn', 'bd-mb-map', 'bd-mb-toggle', 'bd-bag-top', 'bd-menu-btns',
      'bd-hp-dom', 'bd-keybar', 'bd-scroll-hint-v398', 'bd-modal-escape-v398-btn', 'dialogue-box'];
    const st = {}; IDS.forEach(i => st[i] = { 변화: 0, 마지막: null, 생성: 0 });
    const snap = () => IDS.forEach(i => {
      const e = document.getElementById(i);
      const v = e ? (getComputedStyle(e).display === 'none' ? '숨김' : '보임') : '없음';
      if (st[i].마지막 !== null && st[i].마지막 !== v) st[i].변화++;
      if (st[i].마지막 === '없음' && v !== '없음') st[i].생성++;
      st[i].마지막 = v;
    });
    for (let i = 0; i < 120; i++) { snap(); await new Promise(r => requestAnimationFrame(r)); }
    const out = {}; Object.keys(st).forEach(k => { if (st[k].변화 > 0 || st[k].생성 > 0) out[k] = st[k]; });
    return { '3초간_상태변화': out, 관찰프레임: 120 };
  });

  console.log('■ FOV        ' + JSON.stringify(fov));
  console.log('■ 주인공     ' + JSON.stringify(hero));
  console.log('■ 우상단     겹침 ' + top.겹침.length + '건 · flexWrap=' + top.메뉴줄_flexwrap);
  top.버튼.forEach(x => console.log('     ' + x.id.padEnd(22) + ' ' + ('[' + x.글 + ']').padEnd(13) + ' L' + x.L + ' T' + x.T + ' R' + x.R + ' B' + x.B));
  top.겹침.forEach(x => console.log('     ⚠ ' + x));
  console.log('■ 깜박임     ' + JSON.stringify(flick['3초간_상태변화']));
  await p.screenshot({ path: '검수도구/_port.png' });
  await b.close();
})().catch(e => { console.error(e.message); process.exit(1); });
