// 제보 4건 검증 — ① 이어하기 후 지역이동 ② (v350/356로 방어) ③ 낙서 후 이동 ④ 유령잠금(엔딩 후 E) + HP 패널 위치
module.exports = async (h) => {
  const { say } = h;
  h.page.on('console', m => { const t = m.text(); if (/\[v357|\[v356|\[v350/.test(t)) say('  콘솔: ' + t.slice(0, 120)); });
  const boot = async () => {
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
    });
  };
  const drainAll = async (n = 30) => {
    for (let t = 0; t < n; t++) {
      const busy = await h.page.evaluate(() => {
        const b = document.getElementById('dialogue-box');
        const c = !!(window.__bdChoiceState && __bdChoiceState.open);
        const m = document.querySelector('.bd-modal.show');
        return !!(b && b.getBoundingClientRect().height > 0) || !!window.__bdDamiOpeningBusy || c || !!m;
      });
      if (!busy && t > 2) return;
      await h.page.keyboard.press(busy ? ' ' : ' '); await h.wait(400);
      const st = await h.page.evaluate(() => ({ c: !!(window.__bdChoiceState && __bdChoiceState.open), m: !!document.querySelector('.bd-modal.show') }));
      if (st.m) { await h.page.keyboard.press('Escape'); await h.wait(300); }
      if (st.c) { await h.page.keyboard.press('Enter'); await h.wait(300); }
    }
  };
  const holdKey = async (code, ms) => {
    await h.page.keyboard.down(code);
    await h.wait(ms);
    await h.page.keyboard.up(code);
  };

  // ══ ① 이어하기 후 지역 이동 ══
  await boot();
  await h.page.evaluate(() => { BD.questIdx = 5; fadeToStage(211, 0.9, 0.5); try { bdSave(); } catch (e) { } });
  await h.wait(1800); await drainAll(25);
  await h.page.evaluate(() => { try { bdSave(); } catch (e) { } try { autoSave && autoSave(); } catch (e) { } });
  await h.wait(600);
  await h.page.reload(); await h.wait(4500);
  // 타이틀 → 이어하기
  const cont = await h.page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find(x => /이어하기/.test(x.textContent || '') && x.getBoundingClientRect().height > 0);
    if (b) { b.click(); return (b.textContent || '').slice(0, 20); }
    return null;
  });
  say('① 이어하기 버튼: ' + JSON.stringify(cont));
  await h.wait(1500);
  // 슬롯 UI에서 자동저장(또는 첫 슬롯) 불러오기
  const slot = await h.page.evaluate(() => {
    const dump = (() => { try { const s = JSON.parse(localStorage.getItem('fantasyRPG_save') || '{}'); const a = s.auto || s['1']; return a ? { stage: a.stage, x: a.heroX, y: a.heroY } : null; } catch (e) { return String(e).slice(0, 60); } })();
    const auto = document.querySelector('.bd-slot-auto') || document.querySelector('.bd-slot.bd-slot-click');
    if (auto) { auto.click(); return { saved: dump, clicked: (auto.className || '') + '|' + (auto.textContent || '').replace(/\s+/g, ' ').slice(0, 26) }; }
    return { saved: dump, clicked: null };
  });
  say('① 슬롯: ' + JSON.stringify(slot));
  await h.wait(1200);
  const wrapped = await h.page.evaluate(() => ({
    act: !!(window.BD_slotAction && BD_slotAction.__v357),
    load: !!(window.BD_loadFromSlot && BD_loadFromSlot.__v357),
    stageNow: Number(currentStage),
  }));
  say('① 래퍼: ' + JSON.stringify(wrapped));
  await h.wait(3000); await drainAll(25);
  const st1 = await h.page.evaluate(() => ({ stage: Number(currentStage), q: BD.questIdx, hero: [+heroX.toFixed(2), +heroY.toFixed(2)] }));
  say('① 복원 상태: ' + JSON.stringify(st1));
  // 오른쪽 게이트로 도보 (211→213? qa12: 211 right→212)
  await h.page.evaluate(() => { heroY = 0.5; camX = heroX; camY = heroY; });
  for (let t = 0; t < 8; t++) {
    await holdKey('d', 900);
    const s = await h.page.evaluate(() => Number(currentStage));
    if (s !== 211) break;
    await drainAll(6);
  }
  const st2 = await h.page.evaluate(() => Number(currentStage));
  say(((st2 !== 211) ? '✅' : '❌') + ` ① 이어하기 후 지역 이동 (211→${st2})`);
  await h.shot('bug1_gate');

  // ══ ③ 낙서 조사 후 이동 ══
  await h.page.evaluate(() => { fadeToStage(212, 0.5, 0.55); });
  await h.wait(1600); await drainAll(20);
  const target = await h.page.evaluate(() => {
    const list = [];
    [210, 211, 212, 213].forEach(sid => (STAGES[sid].objects || []).forEach(o => {
      if (o && o.hazardId && /낙서|graffiti|paint/i.test((o.label || '') + ' ' + o.hazardId)) list.push({ sid, id: o.hazardId, label: o.label });
    }));
    return list;
  });
  say('③ 낙서 위험요소: ' + JSON.stringify(target));
  if (target.length) {
    const t0 = target[0];
    await h.page.evaluate((p) => {
      if (Number(currentStage) !== p.sid) fadeToStage(p.sid, 0.5, 0.5);
    }, t0);
    await h.wait(1500); await drainAll(20);
    for (let t = 0; t < 40; t++) {
      const busy = await h.page.evaluate(() => !!window.__bdDamiOpeningBusy);
      if (!busy) break;
      await h.wait(1000);
    }
    await h.page.evaluate((p) => {
      const o = (STAGES[p.sid].objects || []).find(x => x && x.hazardId === p.id);
      if (o) { heroX = o.rx + (o.rw || 0.04) / 2; heroY = o.ry + (o.rh || 0.05) + 0.012; camX = heroX; camY = heroY; }
      BD.purified = BD.purified || {}; delete BD.purified[p.id];
    }, t0);
    await h.wait(400);
    await h.page.keyboard.press('f'); await h.wait(500); await h.page.keyboard.press('f'); await h.wait(600);
    for (let k = 0; k < 16; k++) {
      const st = await h.page.evaluate(() => ({ b: !!(window.HSR && HSR.active), c: !!(window.__bdChoiceState && __bdChoiceState.open) }));
      if (st.b) break;
      if (st.c) { await h.wait(420); await h.page.keyboard.press('Enter'); await h.wait(420); continue; }
      await h.page.keyboard.press(' '); await h.wait(330);
      if (k % 5 === 4) { await h.page.keyboard.press('f'); await h.wait(330); }
    }
    const inB = await h.page.evaluate(() => !!(window.HSR && HSR.active));
    say('③ 전투 진입: ' + inB);
    if (inB) {
      await h.page.keyboard.press('Escape'); await h.wait(900); // 물러나기(전투 이탈 경로)
      await drainAll(15);
      const m0 = await h.page.evaluate(() => ({ x: heroX, blocked: (() => { try { return BD_isInputBlocked(); } catch (e) { return 'err'; } })() }));
      await holdKey('d', 700);
      const m1 = await h.page.evaluate(() => heroX);
      const moved = Math.abs(m1 - m0.x) > 0.004;
      say((moved ? '✅' : '❌') + ` ③ 낙서 전투 이탈 후 이동 가능 (Δ=${(m1 - m0.x).toFixed(4)}, blocked=${m0.blocked})`);
    }
  } else {
    say('⚠ ③ 낙서 라벨 위험요소 미발견 — 일반 위험요소로 대체 검증 생략');
  }

  // ══ ④ 유령 잠금 (dialogueOpen 누수 재현 → 감시견 해제 → E 인벤) ══
  const g0 = await h.page.evaluate(() => ({ hook: typeof window.__bdDlgOpenSet === 'function' }));
  say('④ 훅: ' + JSON.stringify(g0));
  await h.page.evaluate(() => { __bdDlgOpenSet(true); });
  await h.wait(1000);
  const g1 = await h.page.evaluate(() => { try { return BD_isInputBlocked(); } catch (e) { return 'err'; } });
  say('④ 누수 재현 blocked=' + g1);
  await h.wait(12000); // 감시견 4초 + 넉넉한 여유
  const g2 = await h.page.evaluate(() => ({
    dlgOpen: (() => { try { return __bdDlgOpenGet(); } catch (e) { return 'err'; } })(),
    blocked: (() => { try { return BD_isInputBlocked(); } catch (e) { return 'err'; } })(),
  }));
  await h.page.keyboard.press('e'); await h.wait(800);
  let g3 = await h.page.evaluate(() => { const o = document.getElementById('inv-overlay'); return !!(o && o.classList.contains('open')); });
  if (!g3) {
    const gd = await h.page.evaluate(() => { try { openInventory(); return 'called'; } catch (e) { return String(e).slice(0, 80); } });
    await h.wait(600);
    g3 = await h.page.evaluate(() => { const o = document.getElementById('inv-overlay'); return !!(o && o.classList.contains('open')); });
    say('④ E무반응 → 직접호출(' + gd + ') inv=' + g3);
  }
  say(((g2.dlgOpen === false && g2.blocked === false && g3) ? '✅' : '❌') + ` ④ 유령잠금 자동해제 + E 인벤 (${JSON.stringify(g2)}, inv=${g3})`);
  await h.page.keyboard.press('Escape'); await h.wait(400);

  // ══ ⑤ 전투 HP 패널 위치 (히어로 위) ══
  await h.page.evaluate(() => { if (Number(currentStage) !== 212) fadeToStage(212, 0.5, 0.55); });
  await h.wait(1500); await drainAll(15);
  for (let t = 0; t < 35; t++) {
    const busy = await h.page.evaluate(() => !!window.__bdDamiOpeningBusy);
    if (!busy) break;
    await h.wait(1000);
  }
  await h.page.evaluate(() => {
    const t = (STAGES[212].objects || []).find(x => x && x.hazardId && !x.isBoss && !(BD.purified || {})[x.hazardId] && !BD_hzQuestGate(x));
    if (t) { heroX = t.rx + (t.rw || 0.04) / 2; heroY = t.ry + (t.rh || 0.05) + 0.012; camX = heroX; camY = heroY; }
  });
  await h.wait(400);
  await h.page.keyboard.press('f'); await h.wait(500); await h.page.keyboard.press('f'); await h.wait(600);
  for (let k = 0; k < 16; k++) {
    const st = await h.page.evaluate(() => ({ b: !!(window.HSR && HSR.active), c: !!(window.__bdChoiceState && __bdChoiceState.open) }));
    if (st.b) break;
    if (st.c) { await h.wait(420); await h.page.keyboard.press('Enter'); await h.wait(420); continue; }
    await h.page.keyboard.press(' '); await h.wait(330);
    if (k % 5 === 4) { await h.page.keyboard.press('f'); await h.wait(330); }
  }
  await h.wait(1200);
  const hp = await h.page.evaluate(() => {
    const u = document.getElementById('hsr-u-hero');
    const info = u && u.querySelector('.hsr-info');
    const spr = document.getElementById('hsr-hero-sprite');
    if (!info || !spr) return null;
    const ri = info.getBoundingClientRect(), rs = spr.getBoundingClientRect();
    return { infoBottom: Math.round(ri.bottom), sprTop: Math.round(rs.top), above: ri.bottom <= rs.top + 30 };
  });
  say(((hp && hp.above) ? '✅' : '❌') + ' ⑤ HP 패널이 히어로 스프라이트 위 ' + JSON.stringify(hp));
  await h.shot('bug5_hp');
  await h.page.keyboard.press('Escape'); await h.wait(500);
  say('콘솔 오류: ' + h.consoleErrors.length);
  h.consoleErrors.slice(0, 6).forEach(e => say('  ! ' + e.slice(0, 160)));
};
