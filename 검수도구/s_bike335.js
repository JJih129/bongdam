// 212 자전거(최상단 배치) 도달·상호작용 가능성 검증
module.exports = async (h) => {
  const { say } = h;
  await h.click('#bd-title-start'); await h.wait(1500);
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
    if (st.onTitle && !st.modal && t > 3) await h.page.evaluate(() => { try { window.BD_startNewGame && BD_startNewGame(); } catch (e) { } }).catch(() => { });
    await h.wait(700);
  }
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
  await h.page.evaluate(() => {
    localStorage.setItem('bd_dami_awake', '1'); localStorage.setItem('bd_tut2_done', '1');
    localStorage.setItem('bd_dami_tutorial_done', '1'); localStorage.setItem('bd_battle_tutorial_done', '1');
    localStorage.setItem('bd_shop_tutorial_done_v75', '1');
    BD.questIdx = 1; BD.purified = BD.purified || {}; BD.purified.ow212_trash_1 = true;
    fadeToStage(212, 0.64, 0.12);
  });
  await h.wait(2200);
  // 오프닝(각성 인트로) 완주까지 충분히 대기 — 최대 100초
  for (let t = 0; t < 200; t++) {
    const b = await h.page.evaluate(() => {
      const db = document.getElementById('dialogue-box');
      return !!(db && db.getBoundingClientRect().height > 0) || !!window.__bdDamiOpeningBusy;
    });
    if (!b) break;
    await h.page.keyboard.press(' '); await h.wait(500);
  }
  await h.wait(1000);
  say('오프닝 종료: busy=' + await h.page.evaluate(() => !!window.__bdDamiOpeningBusy));
  // 주변 충돌 지형
  const col = await h.page.evaluate(() => {
    const rows = {};
    for (const y of [0.055, 0.065, 0.075, 0.085, 0.1]) {
      let s = '';
      for (let x = 0.55; x <= 0.73; x += 0.01) s += (_collidesAt(x, y) ? '#' : '.');
      rows[y.toFixed(3)] = s;
    }
    return rows;
  });
  Object.keys(col).forEach(y => say('y=' + y + ' [x0.55→0.73] ' + col[y]));
  // 사람 경로: 먼저 세아(주민)에게 F로 부탁 수락
  await h.page.evaluate(() => {
    const o = (STAGES[212].objects || []).find(x => x && x.resident && Math.abs((x.rx || 0) - 0.63) < 0.08);
    const t = o || (STAGES[212].objects || []).find(x => x && x.resident);
    if (t) { heroX = t.rx + (t.rw || 0.04) / 2; heroY = t.ry + (t.rh || 0.06) + 0.012; camX = heroX; camY = heroY; }
  });
  await h.wait(500);
  await h.page.keyboard.press('f'); await h.wait(500); await h.page.keyboard.press('f'); await h.wait(500);
  for (let i = 0; i < 14; i++) { await h.page.keyboard.press(' '); await h.wait(380); }
  // 자전거 정면(중앙 아래)으로 접근
  await h.page.evaluate(() => { heroX = 0.6405, heroY = 0.12; camX = heroX; camY = heroY; });
  await h.hold('w', 1500);
  const pos = await h.page.evaluate(() => [heroX.toFixed(3), heroY.toFixed(3)]);
  say('위로 걸은 후 위치: ' + JSON.stringify(pos));
  // F 상호작용
  await h.page.keyboard.press('f'); await h.wait(550); await h.page.keyboard.press('f'); await h.wait(800);
  let battle = false, sawChoice = false;
  for (let k = 0; k < 16 && !battle; k++) {
    const st = await h.page.evaluate(() => ({ choice: !!(window.__bdChoiceState && __bdChoiceState.open), hsr: !!(window.HSR && HSR.active) }));
    battle = st.hsr;
    if (st.choice) { sawChoice = true; await h.wait(450); await h.page.keyboard.press('Enter'); await h.wait(500); continue; }
    await h.page.keyboard.press(' '); await h.wait(350);
    if (k % 3 === 2) { await h.page.keyboard.press('f'); await h.wait(300); await h.page.keyboard.press('f'); await h.wait(300); }
  }
  say('선택창=' + sawChoice + ' 전투=' + battle + (battle ? ' ✅ 도달·상호작용 가능' : ' ❌ 진행 불가 배치 의심'));
  await h.shot('bike335');
  if (!battle) {
    const diag = await h.page.evaluate(() => {
      const o = (STAGES[212].objects || []).find(x => x && x.hazardId === 'ow212_bicycle_1');
      const out = {
        gate: (() => { try { return BD_hzQuestGate(o); } catch (e) { return 'err:' + String(e).slice(0, 40); } })(),
        gone: !!(o && o.__bdGone), hidden: !!(o && o.hidden),
        nearKind: window.__bdNearKind || null,
        purifiedFlag: !!(BD.purified && BD.purified.ow212_bicycle_1),
      };
      try { out.direct = String(BD_hazardInteract(o)).slice(0, 40); } catch (e) { out.direct = 'err:' + String(e).slice(0, 80); }
      return out;
    });
    say('진단: ' + JSON.stringify(diag));
    await h.wait(1500);
    const after = await h.page.evaluate(() => ({
      choice: !!(window.__bdChoiceState && __bdChoiceState.open),
      hsr: !!(window.HSR && HSR.active),
      dlg: (() => { const b = document.getElementById('dialogue-box'); return (b && b.getBoundingClientRect().height > 0) ? (b.textContent || '').replace(/\s+/g, ' ').slice(0, 60) : null; })(),
      toast: (() => { const t = document.getElementById('bd-toast'); return t ? (t.textContent || '').slice(0, 60) : null; })(),
    }));
    say('직접 호출 후: ' + JSON.stringify(after));
  }
};
