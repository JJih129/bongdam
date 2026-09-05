/* (v398) 전체화면 유지 검증 — 「시작하기」가 리로드를 일으켜 전체화면이 풀리는 문제.
 *
 * 확인할 것:
 *   1) 사용자 제스처로 전체화면에 들어가는가
 *   2) 「시작하기」 후 리로드로 풀리는가
 *   3) 리로드 뒤 «첫 실제 입력»에 복원되는가 (0015 의 firstActivation 컨트롤러)
 *
 * Playwright 의 page.click 은 실제 사용자 제스처로 취급되므로 전체화면 요청이 통한다.
 *
 * 사용: VW=852 VH=340 TOUCH=1 node drive.js s_fs_v398.js --url=http://localhost:8788/new/
 */
'use strict';

const fsState = (h) => h.page.evaluate(() => ({
  fs: !!(document.fullscreenElement || document.webkitFullscreenElement),
  refs: (() => { try { return sessionStorage.getItem('bd_refs'); } catch (e) { return 'n/a'; } })(),
  freshAt: (() => { try { return sessionStorage.getItem('bd_fresh_at'); } catch (e) { return 'n/a'; } })(),
  autoOpen: (() => { try { return sessionStorage.getItem('bd_auto_open_start'); } catch (e) { return 'n/a'; } })(),
  stage: (() => { try { return typeof currentStage !== 'undefined' ? currentStage : null; } catch (e) { return null; } })(),
  hasCtl: typeof window.BD_requestFullscreen === 'function'
}));

module.exports = async (h) => {
  h.say('▶ 0) 초기 상태 ' + JSON.stringify(await fsState(h)));

  /* ── 1) 실제 제스처로 전체화면 진입 ── */
  h.say('▶ 1) 전체화면 진입 시도 (실제 클릭)');
  let entered = false;
  try {
    await h.page.click('#bd-fullscreen-return', { timeout: 3000 });
    await h.wait(1200);
    entered = (await fsState(h)).fs;
  } catch (e) { h.say('  전체화면 버튼 클릭 실패: ' + String(e.message).split('\n')[0]); }

  if (!entered) {
    /* 버튼이 없으면 아무 곳이나 눌러 firstActivation 을 트리거 */
    try { await h.page.mouse.click(400, 200); await h.wait(1200); } catch (e) {}
    entered = (await fsState(h)).fs;
  }
  h.say('  진입 결과: ' + (entered ? '✅ 전체화면' : '❌ 실패(헤드리스 제약일 수 있음)'));
  h.say('  ' + JSON.stringify(await fsState(h)));

  /* ── 2) 시작하기 → 리로드 ── */
  h.say('▶ 2) 「시작하기」 클릭');
  try { await h.page.click('#bd-title-start', { timeout: 4000 }); }
  catch (e) { h.say('  클릭 실패: ' + String(e.message).split('\n')[0]); }

  /* 리로드가 실제로 일어나는지 확인 */
  let reloaded = false;
  try {
    await h.page.waitForNavigation({ timeout: 8000 });
    reloaded = true;
  } catch (e) { /* 내비게이션 없음 */ }
  h.say('  리로드 발생: ' + (reloaded ? '✅ 예 (여기서 전체화면이 풀린다)' : '아니오'));
  await h.wait(3000);
  h.say('  리로드 직후: ' + JSON.stringify(await fsState(h)));

  /* ── 3) 리로드 뒤 첫 실제 입력으로 복원되는가 ── */
  h.say('▶ 3) 리로드 뒤 실제 입력 → 복원 확인');
  try { await h.page.mouse.click(430, 170); } catch (e) {}
  await h.wait(1500);
  const after = await fsState(h);
  h.say('  ' + JSON.stringify(after));
  h.say('  복원: ' + (after.fs ? '✅ 됨' : '❌ 안 됨'));

  await h.shot('fs_after');
  h.say('');
  h.say('콘솔 에러 ' + h.consoleErrors.length + '건');
  if (h.consoleErrors.length) h.say('  ' + h.consoleErrors.slice(0, 3).join(' | '));
};
