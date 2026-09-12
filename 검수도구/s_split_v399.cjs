/* (v399) JS 외부 분리(splitjs) 검증 — «번들 실행 전에 인라인 핸들러가 불리는 창»이 닫혔는가.
 *
 *   node 검수도구/s_split_v399.cjs [--url=http://localhost:8788/new/]
 *
 *   1. game.js 응답을 4초 지연시킨다(라우트 가로채기) — 느린 회선의 «마크업은 떴는데 JS 는 아직» 상태
 *   2. 그 사이에 마크업 핸들러가 부르는 함수(closeModal·selectCharacter)를 JS 로 호출한다
 *      → v398 에서는 ReferenceError, v399 에서는 큐에 쌓여야 한다
 *   3. 번들이 실행되면 큐가 비고(__bdPendCalls=null), 진짜 함수로 재생됐는지, 콘솔 오류 0 인지 본다
 *   4. index.html 크기·외부 스크립트 개수·부팅 잠금(bd-booting) 해제까지 확인
 */
'use strict';
const { chromium } = require('playwright');
const args = process.argv.slice(2);
const opt = (k, d) => { const a = args.find(x => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : d; };
const URL = opt('url', 'http://localhost:8788/new/');
let fails = 0;
const ok = (c, l, d) => { console.log('  ' + (c ? '✅' : '❌') + ' ' + l + (d ? '  — ' + d : '')); if (!c) fails++; };

(async () => {
  const browser = await chromium.launch();
  const c = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const p = await c.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(String(e.message || e)));
  p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  let gameJs = null;
  await p.route(/assets\/[0-9a-f]{8}_game\.js$/, async route => {
    gameJs = route.request().url();
    await new Promise(r => setTimeout(r, 4000));
    await route.continue();
  });
  console.log('▶ ' + URL);
  const nav = p.goto(URL, { waitUntil: 'load', timeout: 180000 });
  await p.waitForTimeout(1500);   /* 마크업은 파싱됐고 번들은 아직 지연 중 */
  const during = await p.evaluate(() => {
    const r = { booting: document.documentElement.classList.contains('bd-booting'),
                stubs: typeof closeModal === 'function' && !!closeModal.__bdStub,
                pendBefore: (window.__bdPendCalls || []).length };
    try { closeModal('continue'); selectCharacter(2); r.threw = null; } catch (e) { r.threw = String(e); }
    r.pendAfter = (window.__bdPendCalls || []).length;
    return r;
  });
  console.log('  지연 중: ' + JSON.stringify(during));
  ok(during.booting, '번들 전 부팅 잠금(bd-booting) 활성');
  ok(during.stubs, '스텁 설치됨(closeModal.__bdStub)');
  ok(during.threw === null, '정의 전 호출이 예외 없이 큐에 들어감', during.threw || ('큐 ' + during.pendBefore + '→' + during.pendAfter));
  ok(during.pendAfter === during.pendBefore + 2, '큐 길이 +2', '' + during.pendAfter);
  await nav;
  await p.waitForTimeout(2500);
  const after = await p.evaluate(() => ({
    booting: document.documentElement.classList.contains('bd-booting'),
    pend: window.__bdPendCalls,
    real: typeof closeModal === 'function' && !closeModal.__bdStub && typeof selectCharacter === 'function' && !selectCharacter.__bdStub,
    title: !!(document.getElementById('bd-title-start') && document.getElementById('bd-title-start').offsetHeight > 0),
    scripts: [...document.scripts].filter(s => s.src).map(s => s.src.replace(/^.*\//, '')),
    inline: [...document.scripts].filter(s => !s.src).length
  }));
  console.log('  번들 후: ' + JSON.stringify(after));
  ok(!after.booting, '번들 끝에서 부팅 잠금 해제');
  ok(after.pend === null, '큐 재생 완료(__bdPendCalls=null)');
  ok(after.real, '스텁이 진짜 함수로 교체됨');
  ok(after.title, '타이틀 표시');
  ok(after.scripts.length === 1 && /_game\.js$/.test(after.scripts[0]), '외부 스크립트 1개(game.js)', after.scripts.join(','));
  ok(errs.length === 0, '콘솔 오류 0', errs.slice(0, 3).join(' | '));

  /* 시작하기 → (0154 purge+reload) → 캐릭터 선택 → 필드 진입까지 — 분리 빌드에서 리로드 경로가 멀쩡한가 */
  await p.unroute(/assets\/[0-9a-f]{8}_game\.js$/);
  await p.evaluate(() => { const b = document.getElementById('bd-title-start'); if (b) b.click(); });
  let shown = false;
  for (let i = 0; i < 40; i++) { await p.waitForTimeout(500); shown = await p.evaluate(() => { const m = document.getElementById('bd-startsetup-modal'); return !!(m && m.classList.contains('show')); }).catch(() => false); if (shown) break; }
  ok(shown, '시작하기 → 리로드 → 캐릭터 선택 모달');
  await p.evaluate(() => { try { window.BD_pickStartChar(1); window.BD_confirmStartSetup(); } catch (e) {} });
  let stage = null;
  for (let i = 0; i < 40; i++) { await p.waitForTimeout(500); stage = await p.evaluate(() => { try { return currentStage; } catch (e) { return null; } }).catch(() => null); if (stage && stage !== 1) break; }
  ok(stage === 101 || stage === '101', '프롤로그 필드(101) 진입', 'stage ' + stage);
  ok(errs.length === 0, '콘솔 오류 0 (리로드 포함)', errs.slice(0, 3).join(' | '));
  await browser.close();
  console.log(fails ? '실패 ' + fails + '건' : '전부 통과');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error('실패: ' + e.message); process.exit(2); });
