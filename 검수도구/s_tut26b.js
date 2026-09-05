// 스포트라이트 정합 불변식 검증 — zoom 요소 rect가 시각 좌표를 반영하는지 + 링 실측(합성)
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
  await h.wait(3500);
  const d = await h.page.evaluate(() => {
    let el = document.getElementById('bd-menu-btns');
    if (!el || el.getBoundingClientRect().width < 5) {
      el = document.createElement('div');
      el.id = 'bd-tut26-probe';
      el.style.cssText = 'position:fixed;top:60px;right:40px;width:120px;height:44px;background:rgba(16,24,44,.9);border:1px solid #888;border-radius:10px;z-index:9000;color:#fff;font-size:13px;display:flex;align-items:center;justify-content:center;';
      el.textContent = '테스트 버튼';
      document.body.appendChild(el);
    }
    const id = el.id;
    const z = el.style.zoom;
    el.style.zoom = '';
    const r0 = el.getBoundingClientRect();
    el.style.zoom = '1.2';
    const r1 = el.getBoundingClientRect();
    el.style.zoom = z; // 복원
    // 시각 검증용: 확대 상태 rect에 노란 링을 그려 스크린샷으로 확인
    el.style.zoom = '1.2';
    void el.offsetWidth;
    const r = el.getBoundingClientRect();
    const ring = document.createElement('div');
    ring.id = 'bd-tut26-ring';
    ring.style.cssText = 'position:fixed;left:' + r.left + 'px;top:' + r.top + 'px;width:' + r.width + 'px;height:' + r.height + 'px;'
      + 'border:3px solid #ffd86b;border-radius:10px;z-index:99999;pointer-events:none;box-shadow:0 0 14px rgba(255,216,107,.8);';
    document.body.appendChild(ring);
    return {
      id, base: [r0.width, r0.height].map(v => Math.round(v)),
      zoomed: [r1.width, r1.height].map(v => Math.round(v)),
      ratioW: +(r1.width / Math.max(1, r0.width)).toFixed(2),
      ratioH: +(r1.height / Math.max(1, r0.height)).toFixed(2),
    };
  });
  say('불변식: ' + JSON.stringify(d));
  const ok = d.ratioW >= 1.15 && d.ratioW <= 1.25 && d.ratioH >= 1.15 && d.ratioH <= 1.25;
  say((ok ? '✅' : '❌') + ' zoom 요소 rect = 확대 좌표 반환 (스포트라이트는 매 프레임 rect 추적 → 자동 정렬)');
  await h.shot('tut26_ring');
  await h.page.evaluate(() => {
    const r = document.getElementById('bd-tut26-ring'); if (r) r.remove();
    const p = document.getElementById('bd-tut26-probe'); if (p) p.remove();
    const el = document.getElementById('bd-menu-btns');
    if (el) el.style.zoom = '';
  });
  say('콘솔 오류: ' + h.consoleErrors.length);
};
