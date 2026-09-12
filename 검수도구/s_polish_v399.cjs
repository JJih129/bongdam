/* (v399) 0270_bd-mobile-polish 검증 — 모바일 잔여 4건을 수치로 잡는다.
 *
 *   node 검수도구/s_polish_v399.cjs [--url=http://localhost:8788/new/] [--headed]
 *
 *   A. iPhone 가로(874×300, DPR3, 터치): 시작 설정 모달의 «모험 시작» 버튼이 스크롤 없이 화면 안에 있는가
 *   B. 필드 진입 후 터치 버튼 라벨(«조사» 등)의 화면상 글자 높이
 *   C. 세로(390×844): 새 오버레이(#bd-rotate-v399)가 뜨고, 옛 것(#bd-rotate-overlay)은 숨고,
 *      5초 뒤 회전 잠금 힌트가 나오며, «그냥 계속하기»가 닫는가
 *   D. visualViewport 축소(키보드) 시뮬레이션: html.bd-kbd + --bd-vv-h 가 들어가는가
 *   스크린샷: 검수도구/shots_polish399/
 */
'use strict';
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const args = process.argv.slice(2);
const opt = k => { const a = args.find(x => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : null; };
const URL = opt('url') || 'http://localhost:8788/new/';
const SHOTS = path.join(__dirname, 'shots_polish399'); fs.mkdirSync(SHOTS, { recursive: true });
const log = s => console.log(s);
let fails = 0;
const ok = (cond, label, detail) => { log('  ' + (cond ? '✅' : '❌') + ' ' + label + (detail ? '  — ' + detail : '')); if (!cond) fails++; };

async function ctx(browser, w, h, dpr) {
  const c = await browser.newContext({
    viewport: { width: w, height: h }, deviceScaleFactor: dpr, hasTouch: true, isMobile: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'
  });
  const p = await c.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(String(e.message || e)));
  p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  return { c, p, errs };
}

async function clickStart(p) {
  await p.goto(URL, { waitUntil: 'load', timeout: 180000 });
  await p.waitForTimeout(3000);
  await p.evaluate(() => { const b = document.getElementById('bd-title-start'); if (b) b.click(); });
  for (let i = 0; i < 40; i++) {
    await p.waitForTimeout(500);
    const shown = await p.evaluate(() => { const m = document.getElementById('bd-startsetup-modal'); return !!(m && m.classList.contains('show')); }).catch(() => false);
    if (shown) return true;
  }
  return false;
}

(async () => {
  const browser = await chromium.launch({ headless: !args.includes('--headed') });

  /* ── A + B: iPhone 가로 ── */
  log('A. iPhone 가로 874×300 — 시작 설정 모달');
  {
    const { c, p, errs } = await ctx(browser, 874, 300, 3);
    const shown = await clickStart(p);
    ok(shown, '모달 표시', shown ? '' : '#bd-startsetup-modal .show 없음');
    await p.waitForTimeout(1200);
    const m = await p.evaluate(() => {
      const box = document.querySelector('#bd-startsetup-modal .bd-modal-box');
      const btn = [...document.querySelectorAll('#bd-startsetup-modal .modal-btn')].find(b => /모험\s*시작/.test(b.textContent));
      const img = document.querySelector('#bd-startsetup-modal img');
      const r = e => { if (!e) return null; const q = e.getBoundingClientRect(); return { x: Math.round(q.x), y: Math.round(q.y), w: Math.round(q.width), h: Math.round(q.height), bottom: Math.round(q.bottom) }; };
      return { box: r(box), btn: r(btn), img: r(img), scrollH: box ? box.scrollHeight : 0, clientH: box ? box.clientHeight : 0,
               zoom: parseFloat(getComputedStyle(document.body).zoom) || 1, vh: innerHeight, tier: document.documentElement.className };
    });
    log('  ' + JSON.stringify(m));
    await p.screenshot({ path: path.join(SHOTS, 'A_startsetup_874x300.png') });
    ok(m.btn && m.btn.bottom <= m.vh && m.btn.y >= 0, '«모험 시작» 버튼이 화면 안', m.btn ? 'bottom ' + m.btn.bottom + ' / vh ' + m.vh : '버튼 없음');
    ok(m.box && m.scrollH <= m.clientH + 2, '모달 내용이 스크롤 없이 들어감', 'scrollH ' + m.scrollH + ' clientH ' + m.clientH);
    ok(m.img && m.img.h <= 70, '초상 높이 축소(≤70px 화면)', m.img ? m.img.h + 'px' : '');
    const base = await p.evaluate(() => {
      const st = document.getElementById('bd-mobile-polish-v399-css'); st.disabled = true;
      const box = document.querySelector('#bd-startsetup-modal .bd-modal-box');
      const btn = [...document.querySelectorAll('#bd-startsetup-modal .modal-btn')].find(b => /모험\s*시작/.test(b.textContent));
      const q = btn.getBoundingClientRect();
      const r = { scrollH: box.scrollHeight, clientH: box.clientHeight, btnBottom: Math.round(q.bottom), imgH: Math.round(document.querySelector('#bd-startsetup-modal img').getBoundingClientRect().height) };
      st.disabled = false; return r;
    });
    log('  기준선(0270 CSS 끔): ' + JSON.stringify(base) + '  → 수정 후 scrollH ' + m.scrollH + '/' + m.clientH);
    await p.evaluate(() => { document.getElementById('bd-mobile-polish-v399-css').disabled = true; });
    await p.waitForTimeout(300); await p.screenshot({ path: path.join(SHOTS, 'A0_startsetup_baseline.png') });
    await p.evaluate(() => { document.getElementById('bd-mobile-polish-v399-css').disabled = false; });

    /* B: 필드 진입 → 터치 버튼 라벨 */
    log('B. 터치 버튼 라벨 크기');
    await p.evaluate(() => { try { window.BD_pickStartChar(1); window.BD_confirmStartSetup(); } catch (e) {} });
    for (let i = 0; i < 30; i++) {
      await p.waitForTimeout(800);
      const s = await p.evaluate(() => { try { return currentStage; } catch (e) { return null; } }).catch(() => null);
      if (s && s !== 1) break;
    }
    await p.waitForTimeout(2500);
    for (let i = 0; i < 20; i++) {
      const st = await p.evaluate(() => { const b = document.getElementById('tc-btn-f'); const vis = !!(b && b.getBoundingClientRect().height > 0); const blocked = !!(window.BD_isInputBlocked && BD_isInputBlocked()); return { vis, blocked }; });
      if (st.vis && !st.blocked) break;
      await p.touchscreen.tap(437, 150).catch(() => {}); await p.waitForTimeout(600);
    }
    const lb = await p.evaluate(() => {
      const el = document.querySelector('#tc-btn-f .tc-btn-label') || document.querySelector('.tc-btn-label');
      const btn = document.getElementById('tc-btn-f');
      if (!el) return null;
      const cs = getComputedStyle(el), r = el.getBoundingClientRect(), b = btn ? btn.getBoundingClientRect() : null;
      return { text: el.textContent, declared: cs.fontSize, opacity: cs.opacity, screenH: +r.height.toFixed(1), screenW: +r.width.toFixed(1),
               btn: b ? Math.round(b.width) + 'x' + Math.round(b.height) : null, visible: r.height > 0, clipped: btn ? (r.bottom > b.bottom + 1) : null };
    });
    log('  ' + JSON.stringify(lb));
    await p.screenshot({ path: path.join(SHOTS, 'B_field_874x300.png') });
    ok(lb && lb.declared === '12px' && lb.opacity === '1', '라벨 12px / opacity 1', lb ? lb.declared + ' / ' + lb.opacity : '라벨 없음');
    ok(lb && lb.screenH >= 7, '화면상 글자 높이 ≥7px (종전 5.2px)', lb ? lb.screenH + 'px' : '');
    ok(lb && lb.clipped === false, '버튼 밖으로 넘치지 않음', lb ? '버튼 ' + lb.btn : '');

    /* D: visualViewport 축소 시뮬레이션 (키보드) */
    log('D. visualViewport 축소(키보드) 시뮬레이션');
    const d = await p.evaluate(() => {
      const H = innerHeight;
      Object.defineProperty(window, 'visualViewport', { configurable: true, value: { height: H - 160, offsetTop: 0, width: innerWidth, addEventListener() {} } });
      window.BD_POLISH399.vv();
      const on = document.documentElement.classList.contains('bd-kbd');
      const h = document.documentElement.style.getPropertyValue('--bd-vv-h');
      Object.defineProperty(window, 'visualViewport', { configurable: true, value: { height: H, offsetTop: 0, width: innerWidth, addEventListener() {} } });
      window.BD_POLISH399.vv();
      const off = !document.documentElement.classList.contains('bd-kbd');
      return { on, h, off };
    });
    log('  ' + JSON.stringify(d));
    ok(d.on && d.h && d.off, 'bd-kbd 토글 + --bd-vv-h 기록/해제');
    ok(errs.length === 0, '콘솔 오류 0', errs.slice(0, 3).join(' | '));
    await c.close();
  }

  /* ── C: 세로 ── */
  log('C. 세로 390×844 — 방향 안내');
  {
    const { c, p, errs } = await ctx(browser, 390, 844, 3);
    await p.goto(URL, { waitUntil: 'load', timeout: 180000 });
    await p.waitForTimeout(3500);
    const s1 = await p.evaluate(() => {
      const n = document.getElementById('bd-rotate-v399'), o = document.getElementById('bd-rotate-overlay');
      const vis = e => !!(e && getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().height > 0);
      return { newShown: vis(n), oldShown: vis(o), late: !!(n && n.classList.contains('late')),
               bg: n ? getComputedStyle(n).backgroundColor : null, env: window.BD_POLISH399 && window.BD_POLISH399.env };
    });
    log('  ' + JSON.stringify(s1));
    await p.screenshot({ path: path.join(SHOTS, 'C1_portrait_overlay.png') });
    ok(s1.newShown, '새 오버레이 표시');
    ok(!s1.oldShown, '옛 오버레이 숨김');
    ok(!s1.late, '5초 전에는 힌트 없음');
    ok(/0\.6\d\)$/.test(s1.bg || ''), '반투명 배경', s1.bg);
    await p.waitForTimeout(5500);
    const s2 = await p.evaluate(() => { const n = document.getElementById('bd-rotate-v399'); const h = n && n.querySelector('.hint'); return { late: !!(n && n.classList.contains('late')), hintVisible: !!(h && getComputedStyle(h).display !== 'none'), hint: h ? h.textContent : '' }; });
    log('  ' + JSON.stringify(s2));
    await p.screenshot({ path: path.join(SHOTS, 'C2_portrait_late_hint.png') });
    ok(s2.late && s2.hintVisible, '5초 뒤 회전 잠금 힌트 표시', s2.hint);
    await p.evaluate(() => { document.querySelector('#bd-rotate-v399 .skip').click(); });
    await p.waitForTimeout(400);
    const s3 = await p.evaluate(() => { const n = document.getElementById('bd-rotate-v399'); return { shown: !!(n && n.classList.contains('show')), flag: sessionStorage.getItem('bd_rotate_skip_v399') }; });
    ok(!s3.shown && s3.flag === '1', '«그냥 계속하기» → 닫힘 + 세션 기억');
    /* 가로로 돌리면 자동 숨김, 다시 세로면(dismiss 됐으니) 안 뜸 */
    await p.setViewportSize({ width: 844, height: 390 }); await p.waitForTimeout(500);
    const s4 = await p.evaluate(() => { const n = document.getElementById('bd-rotate-v399'); return !!(n && n.classList.contains('show')); });
    ok(!s4, '가로 전환 시 숨김');
    ok(errs.length === 0, '콘솔 오류 0', errs.slice(0, 3).join(' | '));
    await c.close();
  }

  await browser.close();
  log(fails ? ('실패 ' + fails + '건') : '전부 통과');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error('실패:', e.message); process.exit(2); });
