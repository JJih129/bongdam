/* (v398) 미검증 항목 직접 확인 — drive.js 로는 못 만드는 조건을 직접 구성한다.
 *
 * drive.js 는 ctxOpts.isMobile 을 false 로 고정해 «pointer: coarse» 가 안 잡힌다.
 * 그래서 0249(플로팅 조이스틱)·0136·0259 처럼 coarse 를 조건으로 하는 코드가 실행되지 않아
 * 지금까지 CSS 효과만 간접 확인했다. 여기서는 컨텍스트를 직접 만들어 실기기 조건을 맞춘다.
 *
 * 확인 항목:
 *   ① 강조 링 정렬 — 0255 의 zoom 이중 적용 수정이 실제로 맞는 위치를 가리키는가
 *      (needGuide 는 «대화 중»이면 false 라, 대사를 넘겨야 링이 나타난다)
 *   ② 조이스틱 — 대기 중 숨김 / 터치한 «그 자리»에 나타나는가
 *
 * 사용: node verify_v398.cjs [url]
 */
'use strict';
const { chromium } = require('playwright');

const URL = process.argv[2] || 'http://localhost:8788/new/';
const VW = 874, VH = 300;

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: { width: VW, height: VH },
    deviceScaleFactor: 3,
    hasTouch: true,
    isMobile: true,                       /* ← 이것이 pointer: coarse 를 만든다 */
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'
  });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });

  const say = (...a) => console.log(...a);
  await page.goto(URL, { waitUntil: 'load', timeout: 180000 });
  await page.waitForTimeout(3000);

  const env = await page.evaluate(() => ({
    coarse: matchMedia('(pointer: coarse)').matches,
    touchPoints: navigator.maxTouchPoints,
    floating: !!window.__bdFloatingTouchV387,
    touchMode: document.documentElement.classList.contains('bd-touch-mode'),
    guide: !!window.BD_GUIDE, fit: !!window.BD_FIT, tap: !!window.BD_TAP
  }));
  say('▶ 환경 ' + JSON.stringify(env));
  if (!env.coarse) say('  ⚠ pointer:coarse 가 아님 — 아래 결과는 실기기와 다를 수 있음');

  /* ── 게임 진입 ── */
  await page.evaluate(() => { const b = document.getElementById('bd-title-start'); if (b) b.click(); });
  for (let i = 0; i < 25; i++) {
    await page.waitForTimeout(700);
    if (await page.evaluate(() => !!document.getElementById('char-card-1')
      && document.getElementById('char-card-1').getBoundingClientRect().width > 2)) break;
  }
  await page.evaluate(() => { const c = document.getElementById('char-card-1'); if (c) c.click(); });
  await page.waitForTimeout(900);
  await page.evaluate(() => {
    const g = [...document.querySelectorAll('button,.modal-btn')].filter(b => b.getBoundingClientRect().width > 2)
      .find(b => /모험\s*시작/.test(b.textContent || '')); if (g) g.click();
  });
  for (let i = 0; i < 25; i++) {
    await page.waitForTimeout(900);
    const st = await page.evaluate(() => { try { return typeof currentStage !== 'undefined' ? currentStage : null; } catch (e) { return null; } });
    if (st && st !== 1) break;
  }
  await page.waitForTimeout(2500);
  say('▶ 스테이지 ' + await page.evaluate(() => { try { return currentStage; } catch (e) { return '?'; } }));

  /* ── ① 대사를 넘겨 링이 나올 조건을 만든다 ── */
  for (let i = 0; i < 30; i++) {
    const need = await page.evaluate(() => {
      try {
        if (Number(currentStage) !== 101) return 'stage';
        var P = window.BD_PROGRESS && BD_PROGRESS.story;
        if (!P || !P.tutorialFlags) return 'noflags';
        if (P.tutorialFlags.badgeGiven) return 'badgeGiven';
        var vn = document.getElementById('dialogue-box');
        if (vn && vn.offsetHeight > 0) return 'dialogue';
        if (window.BD_isInputBlocked && BD_isInputBlocked()) return 'blocked';
        return 'OK';
      } catch (e) { return 'err:' + e.message; }
    });
    if (need === 'OK') { say('▶ 가이드 조건 충족 (시도 ' + i + ')'); break; }
    /* 대사 넘기기 — 화면 중앙 탭 */
    await page.touchscreen.tap(Math.round(VW / 2), Math.round(VH / 2)).catch(() => {});
    await page.waitForTimeout(700);
    if (i === 29) say('▶ 가이드 조건 미충족 (마지막 상태: ' + need + ')');
  }
  await page.waitForTimeout(1500);

  const ring = await page.evaluate(() => {
    const z = parseFloat(getComputedStyle(document.body).zoom) || 1;
    const r = document.getElementById('bd-prologue-guide-ring-v397');
    const rr = r && getComputedStyle(r).display !== 'none' ? r.getBoundingClientRect() : null;
    let t = null;
    try {
      const st = STAGES[101];
      const o = (st.objects || []).find(x => x && !x.hidden && /선생/.test(String(x.label || x.npcName || '')));
      if (o && window.BD_screenRectOfWorld)
        t = BD_screenRectOfWorld(Number(o.rx) || 0, Number(o.ry) || 0, Number(o.rw) || 0.05, Number(o.rh) || 0.075);
    } catch (e) {}
    /* 0183 스포트라이트(이미 보정된 기준)와도 비교 */
    const sp = document.getElementById('bd-spot');
    const spr = sp && getComputedStyle(sp).display !== 'none' ? sp.getBoundingClientRect() : null;
    return {
      zoom: z,
      링표시: !!rr,
      링: rr ? { x: Math.round(rr.left), y: Math.round(rr.top), w: Math.round(rr.width), h: Math.round(rr.height) } : null,
      선생님: t ? { x: Math.round(t.left), y: Math.round(t.top), w: Math.round(t.width), h: Math.round(t.height) } : null,
      중심거리: (rr && t)
        ? Math.round(Math.hypot((rr.left + rr.width / 2) - (t.left + t.width / 2),
                                (rr.top + rr.height / 2) - (t.top + t.height / 2))) + 'px' : '-',
      스포트라이트: spr ? { x: Math.round(spr.left), y: Math.round(spr.top) } : null
    };
  });
  say('▶ ① 강조 링: ' + JSON.stringify(ring));
  await page.screenshot({ path: '검수도구/_v/ring.png' }).catch(async () => {
    require('fs').mkdirSync('검수도구/_v', { recursive: true });
    await page.screenshot({ path: '검수도구/_v/ring.png' });
  });

  /* ── ② 조이스틱 — 대기 중 숨김 / 터치한 자리에 생기는가 ── */
  const idle = await page.evaluate(() => {
    const b = document.getElementById('tc-joy-base');
    if (!b) return { 상태: '요소 없음' };
    const r = b.getBoundingClientRect();
    return { opacity: getComputedStyle(b).opacity, 위치: Math.round(r.left) + ',' + Math.round(r.top) };
  });
  say('▶ ② 조이스틱 대기: ' + JSON.stringify(idle));

  /* 화면 좌하단이 아닌 «임의의 지점»을 눌러 본다 */
  const TX = 300, TY = 210;
  await page.touchscreen.tap(TX, TY).catch(() => {});
  await page.waitForTimeout(120);
  /* tap 은 즉시 떼므로, 누른 상태를 만들려면 수동 디스패치 */
  const held = await page.evaluate(([x, y]) => {
    const wrap = document.getElementById('tc-joystick');
    const t = new Touch({ identifier: 1, target: wrap || document.body, clientX: x, clientY: y });
    (wrap || document.body).dispatchEvent(new TouchEvent('touchstart',
      { bubbles: true, cancelable: true, touches: [t], targetTouches: [t], changedTouches: [t] }));
    (wrap || document.body).dispatchEvent(new PointerEvent('pointerdown',
      { bubbles: true, cancelable: true, clientX: x, clientY: y, pointerId: 1, isPrimary: true, pointerType: 'touch' }));
    return true;
  }, [TX, TY]);
  await page.waitForTimeout(400);
  const active = await page.evaluate(([x, y]) => {
    const b = document.getElementById('tc-joy-base');
    const w = document.getElementById('tc-joystick');
    if (!b) return { 상태: '요소 없음' };
    const r = b.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    return {
      opacity: getComputedStyle(b).opacity,
      active: w ? w.classList.contains('active') : null,
      중심: Math.round(cx) + ',' + Math.round(cy),
      누른곳: x + ',' + y,
      오차: Math.round(Math.hypot(cx - x, cy - y)) + 'px'
    };
  }, [TX, TY]);
  say('▶ ② 조이스틱 터치: ' + JSON.stringify(active));
  await page.screenshot({ path: '검수도구/_v/joy.png' });

  say('▶ 콘솔에러 ' + errs.length + (errs.length ? ' — ' + errs.slice(0, 3).join(' | ') : ''));
  await browser.close();
})().catch(e => { console.error('실패:', e.message); process.exit(1); });
