// 우측 붉은 스트립 요소 식별
module.exports = async (h) => {
  const { say } = h;
  await h.click('#bd-title-start'); await h.wait(1500);
  // (v326 부팅) 리로드+자동클릭 흐름 — 타이틀 버튼이 사라질 때까지 대기
  for (let t = 0; t < 40; t++) {
    const st = await h.page.evaluate(() => {
      const btn = document.getElementById('bd-title-start');
      const onTitle = !!(btn && btn.offsetHeight > 0);
      const m = document.getElementById('bd-startsetup-modal');
      const modal = !!(m && m.classList.contains('show'));
      if (modal) { try { BD_pickStartChar(1); BD_confirmStartSetup(); } catch (e) { } }
      return { onTitle, modal };
    }).catch(() => ({ onTitle: true, modal: false }));
    if (!st.onTitle && !st.modal) break;
    if (st.onTitle && !st.modal && t > 3) await h.page.evaluate(() => { try { window.BD_startNewGame && BD_startNewGame(); } catch (e) { } }).catch(() => { });   // 퍼지 훅 우회 직접 시작
    await h.wait(700);
  }
  // 전환 프레임(타이틀 숨김→모달 표시 사이) 조기 탈출 보정 — 늦게 뜬 캐릭터 선택 정리
  for (let t2 = 0; t2 < 14; t2++) {
    const m2 = await h.page.evaluate(() => {
      const m = document.getElementById('bd-startsetup-modal');
      if (m && m.classList.contains('show')) { try { BD_pickStartChar(1); BD_confirmStartSetup(); } catch (e) { } return true; }
      return false;
    }).catch(() => false);
    if (!m2 && t2 > 2) break;
    await h.wait(600);
  }
  await h.wait(2500);
  for (let i = 0; i < 6; i++) { await h.page.keyboard.press(' '); await h.wait(400); }
  await h.page.evaluate(() => { localStorage.setItem('bd_tut2_done', '1'); if (window.fadeToStage) fadeToStage(212, 0.5, 0.5); });
  await h.wait(2500);
  const info = await h.page.evaluate(() => {
    const out = [];
    for (const y of [320, 400, 460]) {
      const els = document.elementsFromPoint(1272, y).slice(0, 4).map(e => (e.id || '') + '.' + String(e.className).slice(0, 30) + '<' + e.tagName + '>');
      out.push(y + ': ' + els.join(' | '));
    }
    const cb = document.getElementById('bd-concept-map-button');
    out.push('conceptBtn: ' + (cb ? getComputedStyle(cb).display : 'none-el'));
    return out;
  });
  info.forEach(l => say(l));
};
