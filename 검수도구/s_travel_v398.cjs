/* 탭 이동 검증 — 길찾기가 경로를 내고, 캐릭터가 실제로 그 지점까지 걸어가는가.
   추가로 «화면 좌표 → 월드 좌표» 역변환이 맞는지도 확인한다. */
const { chromium } = require('playwright');

(async () => {
  const b = await chromium.launch({ headless: true });
  const ctx = await b.newContext({ viewport: { width: 874, height: 300 }, deviceScaleFactor: 3, hasTouch: true, isMobile: true });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });

  await p.goto(process.argv[2], { waitUntil: 'load', timeout: 180000 });
  await p.waitForTimeout(3000);
  await p.evaluate(() => { const x = document.getElementById('bd-title-start'); if (x) x.click(); });
  for (let i = 0; i < 25; i++) {
    await p.waitForTimeout(700);
    if (await p.evaluate(() => !!document.getElementById('char-card-1')
      && document.getElementById('char-card-1').getBoundingClientRect().width > 2)) break;
  }
  await p.evaluate(() => { const c = document.getElementById('char-card-1'); if (c) c.click(); });
  await p.waitForTimeout(900);
  await p.evaluate(() => {
    const g = [...document.querySelectorAll('button,.modal-btn')].filter(x => x.getBoundingClientRect().width > 2)
      .find(x => /모험\s*시작/.test(x.textContent || '')); if (g) g.click();
  });
  for (let i = 0; i < 25; i++) {
    await p.waitForTimeout(900);
    const s = await p.evaluate(() => { try { return currentStage; } catch (e) { return null; } });
    if (s && s !== 1) break;
  }
  await p.waitForTimeout(2500);
  for (let i = 0; i < 12; i++) {
    const blocked = await p.evaluate(() => { try { return !!(window.BD_isInputBlocked && BD_isInputBlocked()); } catch (e) { return false; } });
    if (!blocked) break;
    await p.touchscreen.tap(437, 150).catch(() => {});
    await p.waitForTimeout(600);
  }

  console.log('▶ 시작 ' + JSON.stringify(await p.evaluate(() => ({
    api: typeof window.BD_TRAVEL, hero: [+heroX.toFixed(3), +heroY.toFixed(3)], stage: currentStage
  }))));

  /* ① 역변환 정확도 — 알려진 월드 지점을 화면으로 보냈다가 되돌린다 */
  const inv = await p.evaluate(() => {
    const out = [];
    for (const [wx, wy] of [[0.3, 0.3], [0.5, 0.6], [0.75, 0.4]]) {
      const r = BD_screenRectOfWorld(wx - 0.005, wy - 0.005, 0.01, 0.01);
      if (!r) { out.push({ wx, wy, 결과: '화면밖' }); continue; }
      const sx = r.left + r.width / 2, sy = r.top + r.height / 2;
      const back = window.BD_TRAVEL.toScreen(sx, sy);
      out.push({ 원본: [wx, wy], 복원: back ? [+back.x.toFixed(3), +back.y.toFixed(3)] : null,
        오차: back ? +Math.hypot(back.x - wx, back.y - wy).toFixed(4) : '-' });
    }
    return out;
  });
  console.log('▶ ① 화면→월드 역변환');
  inv.forEach(x => console.log('   ' + JSON.stringify(x)));

  /* ② 목표 — 너무 멀면 도중에 이벤트 트리거를 밟아 게임이 입력을 막는다.
        기능 자체를 보려면 «중간 거리»의 열린 지점을 쓴다. */
  const WANT = Number(process.argv[3] || 0.18);
  const target = await p.evaluate(want => {
    let best = null, bd = Infinity;
    for (let i = 1; i < 60; i++) for (let j = 1; j < 60; j++) {
      const x = i / 60, y = j / 60;
      try { if (_collidesAt(x, y)) continue; } catch (e) { continue; }
      const d = Math.hypot(heroX - x, heroY - y);
      const err = Math.abs(d - want);
      if (err < bd) { bd = err; best = { x: +x.toFixed(3), y: +y.toFixed(3), dist: +d.toFixed(3) }; }
    }
    return best;
  }, WANT);
  console.log('▶ ② 목표 ' + JSON.stringify(target));
  if (!target) { console.log('   열린 지점 없음'); await b.close(); return; }

  const t0 = Date.now();
  const started = await p.evaluate(t => {
    const path = window.BD_TRAVEL.path(t.x, t.y);
    if (!path) return { ok: false, 이유: '경로 없음' };
    return { ok: window.BD_TRAVEL.to(t.x, t.y), 경로점수: path.length };
  }, target);
  console.log('   길찾기 ' + JSON.stringify(started) + '  (' + (Date.now() - t0) + 'ms)');

  let last = null;
  for (let i = 0; i < 40; i++) {
    await p.waitForTimeout(500);
    last = await p.evaluate(t => ({
      hero: [+heroX.toFixed(3), +heroY.toFixed(3)],
      남은거리: +Math.hypot(heroX - t.x, heroY - t.y).toFixed(3),
      진행중: window.BD_TRAVEL.active(), 사유: window.__bdTravelLastStop||'-'
    }), target);
    if (!last.진행중) { console.log('   종료 ' + ((Date.now() - t0) / 1000).toFixed(1) + 's ' + JSON.stringify(last)); break; }
    if (i % 8 === 0) console.log('   ' + JSON.stringify(last));
  }
  if (last && last.진행중) console.log('   ⚠ 시간 초과 ' + JSON.stringify(last));
  console.log('▶ 거리 ' + target.dist + ' → ' + (last ? last.남은거리 : '?')
    + (last && last.남은거리 <= 0.06 ? '  ✅ 도착' : '  ❌ 미도달'));
  console.log('▶ 콘솔에러 ' + errs.length + (errs.length ? ' — ' + errs.slice(0, 2).join(' | ') : ''));
  await p.screenshot({ path: '검수도구/_tv.png' });
  await b.close();
})().catch(e => { console.error(e.message); process.exit(1); });
