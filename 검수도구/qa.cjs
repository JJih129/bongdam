/* (v398) 모바일 검증 단일 진입점.
 *
 * 왜 만들었나 — 반복 낭비를 없애기 위해:
 *   ① 실행 방식이 두 갈래로 갈려 매번 «어느 러너였지»를 다시 떠올려야 했다.
 *      drive.js 는 ctxOpts.isMobile 을 false 로 고정해 «pointer: coarse» 를 못 만든다.
 *      그래서 0249(플로팅 조이스틱)·0136·0259 처럼 coarse 를 조건으로 하는 코드는
 *      drive.js 로 검증할 수 없다 — 이걸 모르고 «CSS 만 확인» 하고 넘어간 적이 있다.
 *   ② 스크립트마다 «시작하기 → 캐릭터 선택 → 모험 시작 → 스테이지 대기» 부팅 30줄을
 *      복붙하고 있었다. 한 곳으로 모은다.
 *   ③ 화면 크기·DPR·터치 조합을 매번 손으로 조립했다. 프리셋으로 둔다.
 *
 * 사용:
 *   node 검수도구/qa.cjs <검사> [--url=...] [--size=iphone|tablet|874x300] [--dpr=3] [--headed]
 *
 *   검사: env       실행 환경과 적용된 패치 확인 (가장 먼저 돌려 볼 것)
 *         hud       우상단 버튼 겹침 + 안내 강조
 *         travel    탭 이동(길찾기·도착)
 *         joystick  플로팅 조이스틱(대기 숨김·터치 위치)
 *         guide     프롤로그 강조 링 정렬
 *         all       위 전부
 *
 * drive.js 시나리오(s_*_v398.js)는 그대로 쓴다 — 성능·UI 전수·텍스트처럼
 * coarse 가 필요 없는 검사는 기존 하네스가 더 편하다. 역할이 다르다.
 */
'use strict';
const { chromium } = require('playwright');

const args = process.argv.slice(2);
const check = args.find(a => !a.startsWith('--')) || 'env';
const opt = k => { const a = args.find(x => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : null; };

const SIZES = {
  iphone: { w: 874, h: 300, dpr: 3 },   /* 아이폰 가로 + Safari 주소창·탭바 */
  phone: { w: 780, h: 340, dpr: 3 },
  tablet: { w: 1280, h: 800, dpr: 2 }
};
const sizeArg = opt('size') || 'iphone';
let SZ = SIZES[sizeArg];
if (!SZ) {
  const m = /^(\d+)x(\d+)$/.exec(sizeArg);
  if (!m) { console.error('알 수 없는 --size: ' + sizeArg); process.exit(1); }
  SZ = { w: +m[1], h: +m[2], dpr: 3 };
}
if (opt('dpr')) SZ.dpr = Number(opt('dpr'));
const URL = opt('url') || 'http://localhost:8788/new/';

/* ── 공용 부팅 — 여기 한 곳만 고치면 모든 검사가 따라온다 ── */
async function boot(p, log) {
  await p.goto(URL, { waitUntil: 'load', timeout: 180000 });
  await p.waitForTimeout(3000);
  await p.evaluate(() => { const b = document.getElementById('bd-title-start'); if (b) b.click(); });
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
  const st = await p.evaluate(() => { try { return currentStage; } catch (e) { return '?'; } });
  log('  부팅 완료 — 스테이지 ' + st);
  return st;
}

/* 대사를 넘겨 입력 차단을 푼다 (강조 링처럼 «대화 중엔 숨김» 조건이 있는 검사용) */
async function clearDialogue(p) {
  for (let i = 0; i < 15; i++) {
    const blocked = await p.evaluate(() => { try { return !!(window.BD_isInputBlocked && BD_isInputBlocked()); } catch (e) { return false; } });
    if (!blocked) return true;
    await p.touchscreen.tap(Math.round(SZ.w / 2), Math.round(SZ.h / 2)).catch(() => {});
    await p.waitForTimeout(600);
  }
  return false;
}

const CHECKS = {
  async env(p, log) {
    const r = await p.evaluate(() => ({
      'pointer:coarse': matchMedia('(pointer: coarse)').matches,
      maxTouchPoints: navigator.maxTouchPoints,
      zoom: (() => { try { return parseFloat(getComputedStyle(document.body).zoom) || 1; } catch (e) { return 1; } })(),
      패치: {
        지연로딩: !!window.__BD_LAZY, 탭보정: !!window.BD_TAP, 화면맞춤: !!window.BD_FIT,
        모바일안내: !!window.BD_GUIDE, 전체화면복원: !!window.BD_FSR,
        모달탈출: !!window.BD_MODAL_ESCAPE, 탭이동: !!window.BD_TRAVEL, HUD통합: !!window.BD_HUD,
        플로팅조이스틱: !!window.__bdFloatingTouchV387
      }
    }));
    log('  ' + JSON.stringify(r, null, 1).replace(/\n/g, '\n  '));
    return Object.values(r.패치).every(Boolean) ? 0 : 1;
  },

  async hud(p, log) {
    await p.evaluate(() => {
      ['bd-bag-top', 'bd-mb-map'].forEach(id => { const e = document.getElementById(id); if (e) e.style.display = 'block'; });
      if (window.BD_HUD) window.BD_HUD.consolidate();
    });
    await p.waitForTimeout(800);
    const r = await p.evaluate(() => {
      const R = window.BD_HUD.rects();
      const ov = (a, b) => {
        if (!a || !b || a === '없음' || b === '없음' || !a.w || !b.w) return 0;
        return Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x))
             * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
      };
      const pairs = [['bd-mb-map', 'bd-bag-top'], ['bd-mb-map', 'bd-mb-toggle'],
                     ['bd-bag-top', 'bd-mb-toggle'], ['bd-mb-toggle', 'bd-settings-btn']];
      window.BD_HUD.hilite('map', 3000);
      const map = document.getElementById('bd-mb-map');
      return { 배치: R, 겹침: pairs.map(([a, b]) => ({ 쌍: a + '↔' + b, px2: ov(R[a], R[b]) })),
               지도강조: map ? map.classList.contains('bd-hud-hilite') : null };
    });
    r.겹침.forEach(x => log('  ' + x.쌍.padEnd(40) + x.px2 + (x.px2 ? ' ❌' : ' ✅')));
    log('  지도강조 ' + (r.지도강조 ? '✅' : '❌'));
    return r.겹침.some(x => x.px2) ? 1 : 0;
  },

  async travel(p, log) {
    await clearDialogue(p);
    const t = await p.evaluate(() => {
      let best = null, bd = Infinity;
      for (let i = 1; i < 60; i++) for (let j = 1; j < 60; j++) {
        const x = i / 60, y = j / 60;
        try { if (_collidesAt(x, y)) continue; } catch (e) { continue; }
        const e = Math.abs(Math.hypot(heroX - x, heroY - y) - 0.18);
        if (e < bd) { bd = e; best = { x: +x.toFixed(3), y: +y.toFixed(3), dist: +Math.hypot(heroX - x, heroY - y).toFixed(3) }; }
      }
      return best;
    });
    if (!t) { log('  열린 지점 없음'); return 1; }
    const ok = await p.evaluate(q => window.BD_TRAVEL.to(q.x, q.y), t);
    if (!ok) { log('  경로 없음'); return 1; }
    let last = null;
    for (let i = 0; i < 30; i++) {
      await p.waitForTimeout(500);
      last = await p.evaluate(q => ({ 남은: +Math.hypot(heroX - q.x, heroY - q.y).toFixed(3),
        진행: window.BD_TRAVEL.active(), 사유: window.__bdTravelLastStop || '-' }), t);
      if (!last.진행) break;
    }
    log('  거리 ' + t.dist + ' → ' + last.남은 + '  사유 ' + last.사유 + ((last.남은 <= 0.09 || /도착/.test(last.사유)) ? '  ✅' : '  ❌'));
    return (last.남은 <= 0.09 || /도착/.test(last.사유)) ? 0 : 1;
  },

  async joystick(p, log) {
    /* 0249 는 «canvas» 에 리스너를 단다(#tc-joystick 이 아니다 — 그 요소는 0x0 여도 무관).
       그래서 canvas 가 실제로 이벤트를 받을 수 있는 상태여야 한다.
       프롤로그 대사창(#dialogue-box)이 화면을 덮고 있으면 canvas 까지 닿지 않는다 —
       실제로 이것 때문에 «조이스틱이 안 된다»고 잘못 판정한 적이 있다. */
    await clearDialogue(p);
    await p.waitForTimeout(600);
    const idle = await p.evaluate(() => {
      const b = document.getElementById('tc-joy-base');
      return b ? getComputedStyle(b).opacity : '없음';
    });
    /* 조이스틱은 «게임 화면 좌하단»의 정해진 영역 안을 눌러야 반응한다.
       화면 밖으로 잘린 부분을 누르면 아무 일도 일어나지 않으므로,
       영역과 뷰포트가 겹치는 부분의 «중앙»을 눌러야 검사가 의미 있다. */
    const reg = await p.evaluate(() => {
      const w = document.getElementById('tc-joystick');
      if (!w) return null;
      const r = w.getBoundingClientRect();
      const gs = document.getElementById('game-screen');
      return { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height),
        보이는하단: Math.round(Math.min(r.bottom, innerHeight)),
        zoom: (() => { try { return parseFloat(getComputedStyle(document.body).zoom) || 1; } catch (e) { return 1; } })(),
        게임화면: gs ? Math.round(gs.getBoundingClientRect().width) + 'x' + Math.round(gs.getBoundingClientRect().height) : '-' };
    });
    /* canvas 좌하단 쪽의 «가려지지 않은» 지점을 고른다 */
    const pick = await p.evaluate(() => {
      const c = document.getElementById('game-canvas');
      if (!c) return null;
      const r = c.getBoundingClientRect();
      for (const [fx, fy] of [[0.25, 0.72], [0.2, 0.6], [0.35, 0.8], [0.15, 0.45]]) {
        const x = Math.round(r.left + r.width * fx), y = Math.round(r.top + r.height * fy);
        const top = document.elementFromPoint(x, y);
        if (top === c) return { x, y, 위: 'canvas' };
      }
      const top = document.elementFromPoint(Math.round(r.left + r.width * 0.25), Math.round(r.top + r.height * 0.72));
      return { x: null, 위: top ? (top.tagName + '#' + (top.id || '')) : 'null' };
    });
    if (!pick || pick.x == null) { log('  ❌ canvas 가 가려져 있다 (' + (pick && pick.위) + ')'); return 1; }
    const TX = pick.x, TY = pick.y;
    log('  누르는 지점 ' + TX + ',' + TY + ' (canvas 노출 확인)');
    /* 합성 dispatchEvent 로는 0249 가 반응하지 않는다(신뢰 이벤트가 아니라 touches 구성이
       실제와 달라진다). CDP 로 «누른 상태»를 만들어 실제 터치와 같게 준다.
       Playwright 의 touchscreen.tap 은 즉시 떼기 때문에 누른 상태를 볼 수 없다. */
    const cdp = await p.context().newCDPSession(p);
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: TX, y: TY, id: 1, radiusX: 12, radiusY: 12, force: 1 }]
    });
    await p.waitForTimeout(450);
    const act = await p.evaluate(([x, y]) => {
      const b = document.getElementById('tc-joy-base');
      if (!b) return { 상태: '없음' };
      const r = b.getBoundingClientRect();
      return { opacity: getComputedStyle(b).opacity,
        오차: Math.round(Math.hypot(r.left + r.width / 2 - x, r.top + r.height / 2 - y)) };
    }, [TX, TY]);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }).catch(() => {});
    log('  대기 opacity ' + idle + (idle === '0' ? ' ✅' : ' ❌ (숨겨져야 함)'));
    log('  터치 중 opacity ' + act.opacity + (parseFloat(act.opacity) > 0.5 ? ' ✅' : ' ❌'));
    log('  터치 위치 오차 ' + act.오차 + 'px' + (act.오차 <= 6 ? ' ✅' : ' ❌'));
    return (idle === '0' && act.오차 <= 6) ? 0 : 1;
  },

  async guide(p, log) {
    await clearDialogue(p);
    await p.waitForTimeout(1200);
    const r = await p.evaluate(() => {
      const g = document.getElementById('bd-prologue-guide-ring-v397');
      const rr = g && getComputedStyle(g).display !== 'none' ? g.getBoundingClientRect() : null;
      let t = null;
      try {
        const o = (STAGES[101].objects || []).find(x => x && !x.hidden && /선생/.test(String(x.label || x.npcName || '')));
        if (o) t = BD_screenRectOfWorld(+o.rx || 0, +o.ry || 0, +o.rw || .05, +o.rh || .075);
      } catch (e) {}
      return { 링표시: !!rr, 중심거리: (rr && t)
        ? Math.round(Math.hypot(rr.left + rr.width / 2 - (t.left + t.width / 2), rr.top + rr.height / 2 - (t.top + t.height / 2))) : null };
    });
    if (!r.링표시) { log('  링이 표시되지 않음 (조건 미충족 — 배지를 이미 받았거나 대화 중)'); return 0; }
    log('  링 ↔ 선생님 중심거리 ' + r.중심거리 + 'px' + (r.중심거리 <= 4 ? ' ✅' : ' ❌'));
    return r.중심거리 <= 4 ? 0 : 1;
  }
};

/* all 실행 순서 — «상태를 바꾸는» 검사를 뒤로 보낸다.
   travel 은 캐릭터와 카메라를 움직여서, 먼저 돌면 guide 의 강조 링 정렬이 30px 어긋난 것처럼
   보인다(단독 실행은 0px). 순서가 결과를 바꾸면 그 검사는 신뢰할 수 없다. */
const ORDER = ['env', 'hud', 'joystick', 'guide', 'travel'];

(async () => {
  const list = check === 'all' ? ORDER.filter(c => CHECKS[c]) : [check];
  for (const c of list) if (!CHECKS[c]) { console.error('알 수 없는 검사: ' + c + '\n가능: ' + Object.keys(CHECKS).join(', ') + ', all'); process.exit(1); }

  const browser = await chromium.launch({ headless: !args.includes('--headed') });
  const ctx = await browser.newContext({
    viewport: { width: SZ.w, height: SZ.h }, deviceScaleFactor: SZ.dpr,
    hasTouch: true, isMobile: true,          /* ← drive.js 가 못 하는 부분: pointer:coarse */
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'
  });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });

  console.log('▶ ' + URL + '  ' + SZ.w + 'x' + SZ.h + ' DPR' + SZ.dpr + ' (터치·모바일)');
  await boot(p, console.log);

  let bad = 0;
  for (const c of list) {
    console.log('▶ ' + c);
    try { bad += await CHECKS[c](p, console.log); }
    catch (e) { console.log('  실패: ' + e.message); bad++; }
  }
  console.log('▶ 콘솔에러 ' + errs.length + (errs.length ? ' — ' + errs.slice(0, 3).join(' | ') : ''));
  console.log(bad ? '❌ 실패 ' + bad + '건' : '✅ 전부 통과');
  await browser.close();
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error('실패: ' + e.message); process.exit(1); });
