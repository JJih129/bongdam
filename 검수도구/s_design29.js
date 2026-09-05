// v365 검증 — 오프닝 비차단 조사 · 게이트 주민 지목+추적 · 안전 수칙 카드 · 경계 칩
module.exports = async (h) => {
  const { say } = h;
  await h.click('#bd-title-start'); await h.wait(1500);
  for (let t = 0; t < 40; t++) {
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
  await h.page.evaluate(() => {
    localStorage.setItem('bd_dami_awake', '1'); localStorage.setItem('bd_tut2_done', '1');
    localStorage.setItem('bd_dami_tutorial_done', '1'); localStorage.setItem('bd_battle_tutorial_done', '1');
    localStorage.setItem('bd_shop_tutorial_done_v75', '1');
    BD.questIdx = 3;
    fadeToStage(211, 0.5, 0.6);
  });
  await h.wait(2200);
  // ① 오프닝 재생 중 조사 — busy 상태에서 곧장 F
  const busy0 = await h.page.evaluate(() => !!window.__bdDamiOpeningBusy);
  say('① 오프닝 busy=' + busy0);
  await h.page.evaluate(() => {
    const t = (STAGES[211].objects || []).find(x => x && x.hazardId && !x.isBoss);
    if (t) { heroX = t.rx + (t.rw || 0.04) / 2; heroY = t.ry + (t.rh || 0.05) + 0.012; camX = heroX; camY = heroY; window.__t1 = t.hazardId; }
  });
  await h.wait(600);
  await h.page.keyboard.press('f');
  let reacted = false, gateDlg = null;
  for (let k = 0; k < 10; k++) {
    await h.wait(420);
    const st = await h.page.evaluate(() => ({
      c: !!(window.__bdChoiceState && __bdChoiceState.open),
      d: (() => { const x = document.getElementById('dialogue-box'); return (x && x.getBoundingClientRect().height > 0) ? (x.textContent || '').replace(/\s+/g, ' ').slice(0, 60) : null; })(),
    }));
    if (st.c || st.d) { reacted = true; gateDlg = st.d; break; }
  }
  say((reacted ? '✅' : '❌') + ' ① 오프닝 중 조사 반응 (dlg=' + (gateDlg || 'choice') + ')');
  // ② 게이트 안내: 미수락 상태라면 위 반응이 주민 지목 독백이어야 함 + 추적 시작
  const tr = await h.page.evaluate(() => window.__bdTrack ? __bdTrack.label : null);
  const named = gateDlg && /의 이야기를 들어보자|이야기를 들어보자/.test(gateDlg);
  say(((named && tr) ? '✅' : (named ? '⚠추적 미시작' : '⚠게이트 미발동(수락상태?)')) + ` ② 주민 지목(${named}) · 추적(${tr})`);
  await h.shot('d29_gate');
  await h.page.evaluate(() => { try { BD_mapTrackClear(); } catch (e) { } });
  for (let i = 0; i < 12; i++) { await h.page.keyboard.press(' '); await h.wait(300); }

  // ③ 안전 수칙 카드 (합성: 결과 모달 + lastHz)
  await h.page.evaluate(() => {
    window.__bdLastHz = { hazardVariant: 'glass', hazardId: 'test' };
    let m = document.getElementById('bd-result-modal');
    if (!m) { m = document.createElement('div'); m.id = 'bd-result-modal'; m.className = 'bd-modal'; document.body.appendChild(m); m.innerHTML = '<div><h3>결과</h3><button>확인</button></div>'; }
    m.classList.add('show');
  });
  await h.wait(900);
  const tip = await h.page.evaluate(() => {
    const t = document.querySelector('#bd-result-modal .bd-safetip');
    return t ? (t.textContent || '').slice(0, 50) : null;
  });
  say(((tip && /유리/.test(tip)) ? '✅' : '❌') + ' ③ 안전 수칙 카드 (' + tip + ')');
  await h.shot('d29_safetip');
  await h.page.evaluate(() => { const m = document.getElementById('bd-result-modal'); if (m) m.classList.remove('show'); });

  // ④ 경계 칩
  await h.page.evaluate(() => { heroX = 0.9; heroY = 0.5; camX = heroX; camY = heroY; });
  await h.wait(900);
  const c1 = await h.page.evaluate(() => {
    const d = document.getElementById('bd-gate-right');
    return d && d.style.display !== 'none' ? d.textContent : null;
  });
  await h.shot('d29_chip');
  await h.page.evaluate(() => { heroX = 0.5; heroY = 0.5; camX = heroX; camY = heroY; });
  await h.wait(900);
  const c2 = await h.page.evaluate(() => { const d = document.getElementById('bd-gate-right'); return d && d.style.display !== 'none'; });
  say(((c1 && !c2) ? '✅' : '❌') + ` ④ 경계 칩 표시/숨김 (근접="${c1}" 중앙=${c2})`);
  say('콘솔 오류: ' + h.consoleErrors.length);
  h.consoleErrors.slice(0, 6).forEach(e => say('  ! ' + e.slice(0, 160)));
};
