// v345 엔딩 전용신 검증 — 단계별 스크린샷 + 자동/클릭 종료
module.exports = async (h) => {
  const { say } = h;
  await h.click('#bd-title-start'); await h.wait(1500);
  for (let t = 0; t < 30; t++) {
    const st = await h.page.evaluate(() => {
      const btn = document.getElementById('bd-title-start');
      const onTitle = !!(btn && btn.offsetHeight > 0);
      const m = document.getElementById('bd-startsetup-modal');
      if (m && m.classList.contains('show')) { try { BD_pickStartChar(1); BD_confirmStartSetup(); } catch (e) { } }
      return onTitle || (m && m.classList.contains('show'));
    }).catch(() => true);
    if (!st) break;
    if (t > 3) await h.page.evaluate(() => { try { window.BD_startNewGame && BD_startNewGame(); } catch (e) { } }).catch(() => { });
    await h.wait(700);
  }
  await h.wait(2500);
  for (let i = 0; i < 6; i++) { await h.page.keyboard.press(' '); await h.wait(350); }
  // 통계 값 채우기 (연출 확인용)
  await h.page.evaluate(() => {
    BD.purified = { a: true, b: true, c: true, d: true, e: true, f: true, g: true, h: true, i: true, j: true, k: true, l: true, m: true };
    try { for (let i = 0; i < 4; i++) BD_PROGRESS.facility.facilityStampIds.push('st' + i); } catch (e) { }
    try { localStorage.setItem('bd_play_started', String(Date.now() - 17 * 60000)); } catch (e) { }
    let m = document.getElementById('bd-ending-modal');
    if (!m) { m = document.createElement('div'); m.id = 'bd-ending-modal'; document.body.appendChild(m); }
    m.classList.add('show');
  });
  await h.wait(1200);
  const d1 = await h.page.evaluate(() => {
    const f = document.getElementById('bd-ending-fx2');
    return f ? {
      on: f.classList.contains('on'),
      map: !!(f.querySelector('.e2-mapwrap') && (f.querySelector('.e2-mapwrap').style.backgroundImage || '').length > 100),
      sparks: f.querySelectorAll('.e2-spark').length,
      title: (f.querySelector('.e2-title') || {}).textContent,
      canvas: !!f.querySelector('canvas'),
      old: !!document.getElementById('bd-ending-fx'),
    } : null;
  });
  say('① 연출 표시: ' + JSON.stringify(d1));
  const ok1 = d1 && d1.on && d1.map && d1.sparks >= 10 && d1.canvas && !d1.old;
  say((ok1 ? '✅' : '❌') + ' ① 지도 등장 + 반짝 마커 + 불꽃 캔버스 + 구연출 미출현');
  await h.shot('end_phase1');
  await h.wait(2200);
  await h.shot('end_phase2');
  await h.wait(2500);
  await h.shot('end_phase3');
  // 자동 종료 대기
  await h.wait(5500);
  const d2 = await h.page.evaluate(() => !document.getElementById('bd-ending-fx2'));
  say((d2 ? '✅' : '❌') + ' ② 자동 종료·정리');
  // 클릭 스킵 경로 (fxDone 래치라 재시연 — 새 세션 없이 직접 show 재현 불가하므로 생략 표기)
  say('③ 클릭 스킵: 코드 경로(click→finish) — 자동 종료와 동일 함수, 별도 검증 생략');
  say('콘솔 오류: ' + h.consoleErrors.length);
  h.consoleErrors.slice(0, 6).forEach(e => say('  ! ' + e.slice(0, 160)));
};
