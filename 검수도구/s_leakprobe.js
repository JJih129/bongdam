// 1단계 — 입력 잠금 누수 3경로 재현 (①대화 중 ESC ②시설 휴식 후 ③맵 전환 직후)
module.exports = async (h) => {
  const { say } = h;
  const leak = async (tag, secs = 6) => {
    for (let t = 0; t < secs; t++) {
      await h.wait(1000);
      const st = await h.page.evaluate(() => ({
        blk: !!(window.BD_isInputBlocked && window.BD_isInputBlocked()),
        scn: !!window.__bdSceneActive,
        ovl: (() => { const e = document.getElementById('dialogue-overlay'); return e ? getComputedStyle(e).display : '-'; })(),
        dlgH: (() => { const e = document.getElementById('dialogue-box'); return e ? e.getBoundingClientRect().height : 0; })(),
        modal: (() => { const m = [...document.querySelectorAll('.bd-modal.show')][0]; return m ? m.id : null; })(),
      }));
      say(`  [${tag}] +${t + 1}s ` + JSON.stringify(st));
      if (!st.blk && !st.scn) { say(`  [${tag}] ✅ 잠금 해제됨`); return true; }
    }
    say(`  [${tag}] ⛔ 누수! 잠금 유지`); await h.shot('LEAK_' + tag);
    return false;
  };
  const move = async () => {
    const p0 = await h.page.evaluate(() => [heroX, heroY]);
    await h.hold('d', 500); await h.hold('a', 300);
    const p1 = await h.page.evaluate(() => [heroX, heroY]);
    const moved = Math.abs(p1[0] - p0[0]) + Math.abs(p1[1] - p0[1]) > 0.001;
    say('  이동 가능: ' + moved);
    return moved;
  };

  // 준비 — 튜토 스킵, 와우리 진입
  await h.click('#bd-title-start');
  await h.wait(1500);
  await h.page.evaluate(() => { try { window.BD_pickStartChar(1); window.BD_confirmStartSetup(); } catch (e) { } });
  await h.wait(3000);
  await h.page.evaluate(() => {
    localStorage.setItem('bd_dami_awake', '1'); localStorage.setItem('bd_tut2_done', '1');
    localStorage.setItem('bd_dami_tutorial_done', '1'); localStorage.setItem('bd_battle_tutorial_done', '1');
    if (window.fadeToStage) fadeToStage(212, 0.5, 0.5);
  });
  await h.wait(2500);

  // ③ 맵 전환 직후 (방금 fadeToStage 했으니 그대로 검사)
  say('◇ 경로③ 맵 전환 직후');
  await leak('fade', 5);
  await move();

  // ① NPC 대화 중 ESC → 일시정지 → 닫기
  say('◇ 경로① 대화 중 ESC');
  const npcOK = await h.page.evaluate(() => {
    const st = STAGES[212];
    const o = (st.objects || []).find(x => x && x.type === 'npc' && !x.hidden);
    if (!o) return null;
    heroX = o.rx + (o.rw || 0.04) / 2; heroY = o.ry + (o.rh || 0.06) + 0.01; camX = heroX; camY = heroY;
    return o.label;
  });
  say('  NPC: ' + npcOK);
  await h.wait(500);
  await h.key('f', 2, 600);
  await h.wait(800);
  const talking = await h.page.evaluate(() => { const e = document.getElementById('dialogue-box'); return !!(e && e.getBoundingClientRect().height > 0); });
  say('  대화창 열림: ' + talking);
  await h.shot('leak1_talking');
  await h.page.keyboard.press('Escape'); await h.wait(700);
  await h.shot('leak1_after_esc');
  // 일시정지가 열렸다면 닫기
  await h.page.keyboard.press('Escape'); await h.wait(700);
  const r1 = await leak('esc-dialog', 6);
  if (!r1) {
    // 잔여 대화창이면 스페이스로 소진 시도 → 재검
    for (let i = 0; i < 8; i++) { await h.page.keyboard.press(' '); await h.wait(350); }
    await leak('esc-dialog-retry', 4);
  }
  await move();

  // ② 문화시설 휴식 → 안내 카드
  say('◇ 경로② 시설 휴식');
  await h.page.evaluate(() => {
    const lm = (STAGES[212].__v24Landmarks || []).find(l => /도서관|문화|주민|센터/.test(l.label || '')) || (STAGES[212].__v24Landmarks || [])[0];
    if (lm) { heroX = Number(lm.rx) + Number(lm.rw) / 2; heroY = Number(lm.ry) + Number(lm.rh) + 0.01; camX = heroX; camY = heroY; }
  });
  await h.wait(500);
  await h.key('f', 1, 400); await h.wait(1200);
  await h.shot('leak2_facility');
  // 카드/선택지 소진
  for (let i = 0; i < 10; i++) {
    const done = await h.page.evaluate(() => {
      const ch = document.querySelector('[id^="bd-ch-"]'); if (ch) { ch.click(); return false; }
      const ov = document.getElementById('dialogue-overlay'); if (ov && getComputedStyle(ov).display !== 'none') { ov.click(); return false; }
      const m = [...document.querySelectorAll('.bd-modal.show')][0];
      if (m) { const b = [...m.querySelectorAll('button')].find(x => /닫기|확인|나가기/.test(x.textContent || '')); if (b) { b.click(); return false; } }
      return true;
    });
    await h.wait(600);
    if (done) break;
  }
  await leak('facility-rest', 6);
  await move();

  say('콘솔 오류: ' + h.consoleErrors.length);
};
