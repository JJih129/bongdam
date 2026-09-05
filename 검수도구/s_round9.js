// 라운드 9 검증 — cheer 리듬 미니게임 완료 후 제거 + 유예 단축
module.exports = async function ({ page, say, shot, wait, consoleErrors }) {
  await wait(3500);
  await page.click('#bd-title-start', { timeout: 5000 });
  for (let t = 0; t < 20; t++) {
    await wait(700);
    const ok = await page.evaluate(() => {
      const m = document.getElementById('bd-startsetup-modal');
      if (m && m.classList.contains('show')) { const b = m.querySelector('button'); if (b) b.click(); }
      return typeof currentStage !== 'undefined' && Number(currentStage) === 101;
    });
    if (ok) break;
  }
  // 튜토 완료 플래그를 «212 진입 전»에 미리 — 진입 시 대기열에 걸린 필드 튜토가 전투 조작(E)을 잠그는 것 방지
  await page.evaluate(() => {
    localStorage.setItem('bd_dami_tutorial_done', '1');
    localStorage.setItem('bd_battle_tutorial_done', '1');
    localStorage.setItem('bd_battle_tutorial_seen', '1');
  });
  // 프롤로그 통과
  for (let i = 0; i < 4; i++) { await page.keyboard.press(' '); await wait(450); }
  await page.keyboard.down('a'); await wait(1500); await page.keyboard.up('a'); await wait(1300);
  await page.evaluate(() => { heroX = 0.565; heroY = 0.30; camX = heroX; camY = heroY; });
  await wait(500);
  let talking = false;
  for (let t = 0; t < 10 && !talking; t++) {
    await page.keyboard.press('f'); await wait(700);
    talking = await page.evaluate(() => { const vn = document.getElementById('dialogue-box'); return !!(vn && vn.offsetHeight > 0 && /문화의집 선생님/.test(vn.textContent || '')); });
    if (!talking) { await page.keyboard.press(' '); await wait(400); }
  }
  for (let i = 0; i < 16; i++) { await page.keyboard.press(' '); await wait(500); }
  await wait(1800); await page.keyboard.press(' '); await wait(3500);
  await page.evaluate(() => { heroX = 0.700; heroY = 0.15; camX = heroX; camY = heroY; });
  await wait(3000);
  for (let i = 0; i < 12; i++) { await page.evaluate(() => { const ov = document.getElementById('dialogue-overlay'); if (ov) ov.click(); }); await wait(400); }
  // 튜토 스킵 + cheer 스킬 장착 + 전투 진입
  // (v315 대응) 담이 오프닝(조사 잠금) 종료 대기
  for (let t = 0; t < 30; t++) { if (!(await page.evaluate(() => !!window.__bdDamiOpeningBusy))) break; await wait(1000); }
  await page.evaluate(() => {
    localStorage.setItem('bd_dami_tutorial_done', '1');
    localStorage.setItem('bd_battle_tutorial_done', '1');
    localStorage.setItem('bd_battle_tutorial_seen', '1');
    BD.unlockedSkills.push('cheer'); BD.equippedSkill = 'cheer';
    const o = (STAGES[212].objects || []).find(x => x && x.hazardId === 'ow212_trash_1');
    heroX = o.rx + o.rw / 2; heroY = o.ry + o.rh + 0.01; camX = heroX; camY = heroY;
  });
  // (v315 대응) 튜토 시작을 확인한 뒤 hazard 단계(조사 허용)까지 대기
  let seenTut = false;
  for (let t = 0; t < 45; t++) {
    const st = await page.evaluate(() => ({
      r: !!(window.BD_TUTOR && BD_TUTOR.isRunning && BD_TUTOR.isRunning()),
      s: window.__bdTutStepId || '',
    }));
    if (st.r) seenTut = true;
    if (seenTut && (!st.r || (st.s !== 'move' && st.s !== 'guide'))) break;
    if (!seenTut && t > 14) break;   // 튜토가 아예 안 뜨는 빌드 상태
    await wait(1000);
  }
  await wait(700);
  say('F 전: ' + JSON.stringify(await page.evaluate(() => ({
    tut: !!(window.BD_TUTOR && BD_TUTOR.isRunning && BD_TUTOR.isRunning()), step: window.__bdTutStepId || null,
    opening: !!window.__bdDamiOpeningBusy, stg: Number(currentStage),
    hero: [+Number(heroX).toFixed(3), +Number(heroY).toFixed(3)],
  }))));
  await page.evaluate(() => {
    if (!window.BD_hazardInteract.__spy) {
      const o = window.BD_hazardInteract;
      window.BD_hazardInteract = function () { window.__hzCalled = (window.__hzCalled || 0) + 1; return o.apply(this, arguments); };
      window.BD_hazardInteract.__spy = true;
    }
    window.__hzCalled = 0;
  });
  await page.keyboard.press('f'); await wait(1100);
  say('hz 호출: ' + await page.evaluate(() => window.__hzCalled));
  // 키 라우팅은 s_edge ④에서 검증 — 여기서는 직접 호출로 조사 개시 (목적: 리듬 미니게임)
  await page.evaluate(() => {
    const o = (STAGES[212].objects || []).find(x => x && x.hazardId === 'ow212_trash_1');
    if (o) BD_hazardInteract(o);
  });
  await wait(800);
  say('F 후: ' + JSON.stringify(await page.evaluate(() => ({
    hsr: !!(window.HSR && HSR.active),
    choice: !!(window.__bdChoiceState && __bdChoiceState.open),
    dlgH: (() => { const b = document.getElementById('dialogue-box'); return b ? Math.round(b.getBoundingClientRect().height) : -1; })(),
    toast: (() => { const t = document.getElementById('bd-toast'); return t && t.classList.contains('show') ? (t.textContent || '').slice(0, 30) : null; })(),
  }))));
  // 조사 선택 확정 → 독백 소화 → 전투 개시까지
  for (let k = 0; k < 14; k++) {
    await wait(600);
    await page.evaluate(() => { try { if (window.__bdChoiceState && __bdChoiceState.open) BD_choiceConfirm(); } catch (e) { } });
    if (await page.evaluate(() => !!(window.HSR && HSR.active))) break;
    await page.keyboard.press(' '); await wait(250);
    await page.keyboard.press(' '); await wait(250);
  }
  say('전투 개시: ' + await page.evaluate(() => !!(window.HSR && HSR.active)));
  await wait(3000);
  for (let t = 0; t < 20; t++) { if ((await page.evaluate(() => HSR.state)) === 'player') break; await wait(500); }
  // E → cheer 카드 선택 → 리듬 미니게임
  await page.keyboard.press('e'); await wait(900);
  const cardInfo = await page.evaluate(() => {
    const els = [...document.querySelectorAll('div,button')].filter(x => {
      const r = x.getBoundingClientRect();
      return r.width > 30 && r.height > 20 && /힘내라 봉담/.test(x.textContent || '') && x.children.length <= 4;
    });
    const c = els[els.length - 1];
    if (c) { c.click(); return { clicked: true, tag: c.tagName, cls: String(c.className).slice(0, 30) }; }
    return { clicked: false, all: [...document.querySelectorAll('div')].filter(d => /배지 스킬 카드/.test(d.textContent || '')).length };
  });
  say('카드 클릭:', JSON.stringify(cardInfo));
  await wait(1200);
  const mgOpen = await page.evaluate(() => !!document.getElementById('bd-mg-ddr'));
  say('리듬 미니게임 열림:', mgOpen);
  await shot('r9_01_rhythm_open');
  // 화살표 5개 정타 입력 (슬롯 문자를 읽어 매칭 키 전송)
  const KEY = { '◀': 'ArrowLeft', '▼': 'ArrowDown', '▲': 'ArrowUp', '▶': 'ArrowRight' };
  for (let i = 0; i < 7; i++) {
    const ch = await page.evaluate(() => { const s = document.querySelector('.ddr-slot-in'); return s ? s.textContent.trim() : null; });
    if (!ch || ch === '✓' || !KEY[ch]) break;
    await page.keyboard.press(KEY[ch]);
    await wait(220);
  }
  // 완료 후 제거 확인 (1.2초 내)
  await wait(1200);
  const after = await page.evaluate(() => ({
    ddrGone: !document.getElementById('bd-mg-ddr'),
    mgGone: !document.getElementById('bd-mg'),
    grade: window.__bdMgGrade || null,
  }));
  say('완료 후:', JSON.stringify(after));
  await shot('r9_02_after_complete');
  say('콘솔 오류:', consoleErrors.length);
  say(mgOpen && after.ddrGone && after.mgGone ? '✅ 라운드 9 검증 통과' : '❌ 확인 필요');
};
