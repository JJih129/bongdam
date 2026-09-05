// 러시 플레이 재현 — 담이 오프닝·튜토 안내가 나오기 전에 첫 쓰레기 전투를 깨버린다
module.exports = async (h) => {
  const { say } = h;
  const L = require('./lib')(h);
  const A = require('./auto')(h, L);

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
  await h.wait(3000);
  // 프롤로그를 정상(실제) 경로로 빠르게
  for (let i = 0; i < 4; i++) { await h.page.keyboard.press(' '); await h.wait(400); }
  await h.page.evaluate(() => { heroX = 0.565; heroY = 0.30; camX = heroX; camY = heroY; });
  await h.wait(400);
  for (let t = 0; t < 10; t++) {
    await h.page.keyboard.press('f'); await h.wait(600);
    const talking = await h.page.evaluate(() => { const vn = document.getElementById('dialogue-box'); return !!(vn && vn.offsetHeight > 0 && /문화의집 선생님/.test(vn.textContent || '')); });
    if (talking) break;
    await h.page.keyboard.press(' '); await h.wait(300);
  }
  for (let i = 0; i < 16; i++) { await h.page.keyboard.press(' '); await h.wait(400); }
  await h.wait(1500); await h.page.keyboard.press(' '); await h.wait(3000);
  await h.page.evaluate(() => { heroX = 0.700; heroY = 0.15; camX = heroX; camY = heroY; });
  await h.wait(3000);
  // ★ 러시: 담이 오프닝을 소화하지 않고 즉시 쓰레기로 돌진해 F
  say('◇ 러시 시작 — 오프닝 무시하고 쓰레기 직행');
  await h.page.evaluate(() => {
    const o = (STAGES[212].objects || []).find(x => x && x.hazardId === 'ow212_trash_1');
    heroX = o.rx + o.rw / 2; heroY = o.ry + o.rh + 0.01; camX = heroX; camY = heroY;
  });
  await h.wait(400);
  const tut0 = await h.page.evaluate(() => ({ running: !!(window.BD_TUTOR && BD_TUTOR.isRunning && BD_TUTOR.isRunning()), opening: !!window.__bdDamiOpeningBusy }));
  say('돌진 시점 튜토 상태: ' + JSON.stringify(tut0));
  // F 연타로 선택지까지 → 조사한다
  for (let i = 0; i < 12; i++) {
    await h.page.keyboard.press('f'); await h.wait(350);
    await h.page.keyboard.press(' '); await h.wait(250);
    const ch = await h.page.evaluate(() => !!document.getElementById('bd-ch-investigate'));
    if (ch) break;
  }
  await h.page.evaluate(() => { try { window.BD_choiceConfirm && BD_choiceConfirm(); } catch (e) { } });
  await h.wait(2500);
  for (let i = 0; i < 6; i++) { await h.page.keyboard.press(' '); await h.wait(400); }
  const inB = await h.page.evaluate(() => !!(window.HSR && HSR.active));
  say('전투 진입: ' + inB);
  await h.shot('rush_battle');
  if (inB) await A.doBattle(90);
  await h.wait(2500);
  for (let i = 0; i < 8; i++) { await h.page.keyboard.press(' '); await h.wait(350); }

  // ── 상태 전수 덤프 ──
  const d = await h.page.evaluate(() => {
    const o = (STAGES[212].objects || []).find(x => x && x.hazardId === 'ow212_trash_1');
    return {
      purified: !!(BD.purified && BD.purified.ow212_trash_1),
      gone: !!(o && o.__bdGone), objPurFlag: !!(o && o._purified),
      questIdx: BD.questIdx,
      hudText: (() => { const e = document.getElementById('bd-quest-hud'); return e ? (e.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80) : null; })(),
      pct: (() => { try { return BD_MapProgress.region('wawoo').pct; } catch (e) { return 'ERR'; } })(),
      tutRunning: !!(window.BD_TUTOR && BD_TUTOR.isRunning && BD_TUTOR.isRunning()),
      fTarget: (() => { const e = document.getElementById('bd-f-target'); return e ? e.style.display : null; })(),
    };
  });
  say('러시 후 상태: ' + JSON.stringify(d));
  await h.shot('rush_after');
  // 쓰레기 재상호작용 시도 — 잔존 창 정리 후 깨끗한 상태에서 F 1회
  await h.page.keyboard.press('Escape'); await h.wait(500);
  await h.page.keyboard.press('Escape'); await h.wait(800);
  const pre = await h.page.evaluate(() => ({ choiceOpen: !!(window.__bdChoiceState && __bdChoiceState.open) }));
  say('F 전 상태: ' + JSON.stringify(pre));
  await h.wait(800);
  await h.page.evaluate(() => {
    if (!window.BD_showChoices.__spy) {
      const orig = window.BD_showChoices;
      window.BD_showChoices = function (o) { window.__lastChoiceStack = (new Error()).stack; return orig.apply(this, arguments); };
      window.BD_showChoices.__spy = true;
    }
    window.__lastChoiceStack = null;
  });
  await h.page.keyboard.press('f'); await h.wait(1000);
  const stack = await h.page.evaluate(() => (window.__lastChoiceStack || '').split('\n').slice(0, 7).join(' | ').replace(/file:\/\/[^ )]+/g, m => m.slice(-18)));
  say('선택창 스택: ' + stack);
  const re = await h.page.evaluate(() => ({
    dlgH: (() => { const b = document.getElementById('dialogue-box'); return b ? Math.round(b.getBoundingClientRect().height) : -1; })(),
    dlgTxt: (() => { const b = document.getElementById('dialogue-box'); return b && b.getBoundingClientRect().height > 0 ? (b.textContent || '').trim().slice(0, 50) : null; })(),
    choice: !!document.querySelector('[id^="bd-ch-"]'),
    choiceTitle: (() => { const b = document.querySelector('#bd-choice .bd-choicebox-title'); return b ? b.textContent.trim().slice(0, 40) : null; })(),
  }));
  say('재상호작용: ' + JSON.stringify(re));
  const objs = await h.page.evaluate(() => (STAGES[212].objects || [])
    .filter(o => o && /쓰레기/.test(o.label || ''))
    .map(o => ({ id: o.hazardId, lbl: o.label, rx: +Number(o.rx).toFixed(3), ry: +Number(o.ry).toFixed(3), gone: !!o.__bdGone, pur: !!(BD.purified && BD.purified[o.hazardId]), opt: !!o.bdOptional })));
  say('쓰레기 오브젝트 전수: ' + JSON.stringify(objs));
  // 30초 대기 — 튜토 침묵/가드 관찰
  for (let t = 0; t < 6; t++) {
    await h.wait(5000);
    const s = await h.page.evaluate(() => ({
      tut: !!(window.BD_TUTOR && BD_TUTOR.isRunning && BD_TUTOR.isRunning()),
      dami: (() => { const e = document.getElementById('bd-dami-hud'); return e && e.offsetHeight > 0 ? (e.textContent || '').trim().slice(0, 40) : null; })(),
      tgt: (() => { const nav = window.__bdNavOverride; if (nav) return nav.label; try { const g = BD_currentGuide(); return g && g.label; } catch (e) { return null; } })(),
    }));
    say(`+${(t + 1) * 5}s: ` + JSON.stringify(s));
  }
  await h.shot('rush_30s');
  say('콘솔 오류: ' + h.consoleErrors.length);
};
