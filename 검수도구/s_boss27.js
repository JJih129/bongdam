// v356 검증 — 보스 2페이즈(알→부화) · 조사 자가치유 · 증강-담이 겹침
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
    BD.questIdx = 5; fadeToStage(212, 0.55, 0.8);
  });
  await h.wait(2000);
  for (let t = 0; t < 40; t++) {
    const busy = await h.page.evaluate(() => {
      const b = document.getElementById('dialogue-box');
      return !!(b && b.getBoundingClientRect().height > 0) || !!window.__bdDamiOpeningBusy || !!(window.__bdChoiceState && __bdChoiceState.open);
    });
    if (!busy && t > 2) break;
    await h.page.keyboard.press(' '); await h.wait(450);
  }
  // 보스전 진입
  await h.page.evaluate(() => {
    const boss = (STAGES[212].objects || []).find(o => o && o.hazardId === 'final_boss_1');
    if (boss) { heroX = boss.rx + (boss.rw || 0.1) / 2; heroY = boss.ry + (boss.rh || 0.1) + 0.012; camX = heroX; camY = heroY; }
  });
  await h.wait(400);
  await h.page.keyboard.press('f'); await h.wait(500); await h.page.keyboard.press('f'); await h.wait(700);
  for (let k = 0; k < 20; k++) {
    const st = await h.page.evaluate(() => ({ b: !!(window.HSR && HSR.active), c: !!(window.__bdChoiceState && __bdChoiceState.open) }));
    if (st.b) break;
    if (st.c) { await h.wait(420); await h.page.keyboard.press('Enter'); await h.wait(420); continue; }
    await h.page.keyboard.press(' '); await h.wait(350);
    if (k % 5 === 4) { await h.page.keyboard.press('f'); await h.wait(350); }
  }
  await h.wait(1500);
  const p1 = await h.page.evaluate(() => ({
    boss: !!(window.HSR && HSR.active && HSR._isBoss),
    hp: HSR.enemy && HSR.enemy.hp, maxhp: HSR.enemy && HSR.enemy.maxhp,
    pending: !!HSR._pendingSecond,
    phase: window.__bdBossPhase,
    p1img: (() => { const i = document.querySelector('#hsr-enemy-sprite img'); return !!(i && window.__BD_BOSS_P1 && i.src === window.__BD_BOSS_P1); })(),
  }));
  say('① 1페이즈: ' + JSON.stringify(p1));
  const ok1 = p1.boss && p1.maxhp <= 160 && p1.pending && p1.phase === 1 && p1.p1img;
  say((ok1 ? '✅' : '❌') + ' ① 1페이즈 초기화 (HP 50%·연전 예약·P1 스프라이트)');
  await h.shot('b27_egg');
  // 엔진 부활 경로 재현 (checkEnemyDead의 연전 코드와 동일 필드 조작)
  await h.page.evaluate(() => {
    const second = HSR._pendingSecond; HSR._pendingSecond = null;
    HSR.enemy.maxhp = second.maxhp; HSR.enemy.hp = second.maxhp;
    HSR.enemy.atk = second.atk;
    try { refreshEnemyUI && refreshEnemyUI(); } catch (e) { }
  });
  await h.wait(1400);
  const p2 = await h.page.evaluate(() => ({
    phase: window.__bdBossPhase,
    hp: HSR.enemy.hp, maxhp: HSR.enemy.maxhp,
    flash: !!document.getElementById('bd-egg-flash'),
    p2img: (() => { const i = document.querySelector('#hsr-enemy-sprite img'); return !!(i && window.__BD_BOSS_P1 && i.src !== window.__BD_BOSS_P1); })(),
  }));
  say('② 진형태: ' + JSON.stringify(p2));
  say(((p2.phase === 2 && p2.maxhp > 200 && p2.flash && p2.p2img) ? '✅' : '❌') + ' ② 진형태 전환 (P2 스프라이트·풀HP·섬광)');
  await h.wait(800);
  await h.shot('b27_hatched');

  // ③ 증강 오버레이 중 담이 말풍선 숨김 (합성)
  await h.page.evaluate(() => {
    let ov = document.getElementById('bd-aug-overlay');
    if (!ov) {
      ov = document.createElement('div'); ov.id = 'bd-aug-overlay';
      ov.style.cssText = 'position:absolute;inset:0;z-index:120;';
      (document.querySelector('.hsr-enemy') || document.body).parentElement.appendChild(ov);
    }
    ov.style.display = 'flex';
    try { BD_DAMI.show('강화 중 테스트 대사입니다', { face: 'idle' }); } catch (e) { }
  });
  await h.wait(900);
  const a1 = await h.page.evaluate(() => {
    const b = document.getElementById('bd-dami-bubble');
    const cs = b ? getComputedStyle(b) : null;
    return { augOn: document.body.classList.contains('bd-aug-on'), vis: cs ? cs.visibility : null, op: cs ? cs.opacity : null };
  });
  say(((a1.augOn && (a1.vis === 'hidden' || a1.op === '0')) ? '✅' : '❌') + ' ③ 증강 중 담이 말풍선 숨김 ' + JSON.stringify(a1));
  await h.page.evaluate(() => { const ov = document.getElementById('bd-aug-overlay'); if (ov) ov.style.display = 'none'; });
  await h.wait(600);
  const a2 = await h.page.evaluate(() => document.body.classList.contains('bd-aug-on'));
  say((!a2 ? '✅' : '❌') + ' ③ 증강 종료 후 복귀');
  await h.page.keyboard.press('Escape'); await h.wait(800);
  for (let i = 0; i < 6; i++) { await h.page.keyboard.press(' '); await h.wait(300); }

  // ④ 조사 무반응 자가치유 — busy 강제 고착 후 F
  await h.page.evaluate(() => { fadeToStage(212, 0.5, 0.55); });
  await h.wait(1500);
  for (let t = 0; t < 30; t++) {
    const busy = await h.page.evaluate(() => !!window.__bdDamiOpeningBusy);
    if (!busy && t > 1) break;
    await h.page.keyboard.press(' '); await h.wait(400);
  }
  await h.page.evaluate(() => {
    window.__bdDamiOpeningBusy = true;   // 고착 재현
    const t = (STAGES[212].objects || []).find(x => x && x.hazardId && !x.isBoss && !x.__bdGone && !(BD.purified || {})[x.hazardId] && !BD_hzQuestGate(x));
    if (t) { heroX = t.rx + (t.rw || 0.04) / 2; heroY = t.ry + (t.rh || 0.05) + 0.012; camX = heroX; camY = heroY; window.__t4 = t.hazardId; }
  });
  await h.wait(400);
  await h.page.keyboard.press('f'); await h.wait(500); await h.page.keyboard.press('f');
  await h.wait(2500); // 재시도(0.9s) 대기
  const r4 = await h.page.evaluate(() => ({
    busy: !!window.__bdDamiOpeningBusy,
    choice: !!(window.__bdChoiceState && __bdChoiceState.open),
    dlg: (() => { const d = document.getElementById('dialogue-box'); return !!(d && d.getBoundingClientRect().height > 0); })(),
    hsr: !!(window.HSR && HSR.active),
  }));
  say('④ 자가치유 후: ' + JSON.stringify(r4));
  say(((r4.choice || r4.dlg || r4.hsr) && !r4.busy ? '✅' : '❌') + ' ④ busy 고착 상태에서 조사 반응 복구');
  say('콘솔 오류: ' + h.consoleErrors.length);
  h.consoleErrors.slice(0, 6).forEach(e => say('  ! ' + e.slice(0, 160)));
};
