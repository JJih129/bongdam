// 라운드 15 유닛 검증 — deltaTime·VN HUD·도착·배율·canRest·HP DOM·퀘스트 제목
module.exports = async (h) => {
  const { say } = h;
  const R = [];
  const chk = (n2, v) => { R.push([n2, v]); say(`${v ? '✅' : '❌'} ${n2}`); };
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
    fadeToStage(212, 0.55, 0.55);
  });
  await h.wait(2500);
  for (let i = 0; i < 8; i++) { await h.page.keyboard.press(' '); await h.wait(300); }

  // ⑥ deltaTime 래핑 + 계수
  const dt = await h.page.evaluate(() => ({ wrapped: !!(window.getMoveSpeed && getMoveSpeed.__v332), k: window.__bdFrameK }));
  say('⑥ ' + JSON.stringify(dt));
  chk('⑥ deltaTime 이동 래핑', dt.wrapped && dt.k > 0.5 && dt.k <= 2.01);

  // ② 캐릭터 배율 (212: 기본 0.85)
  const sc = await h.page.evaluate(() => ({ spr: window.BD_SPR, zoom: window.BD_CHAR_ZOOM, of: window.BD_charScaleOf ? BD_charScaleOf(212) : null }));
  say('② ' + JSON.stringify(sc));
  // BD_SPR = CHAR_ZOOM × (스테이지 고유 cs) × 0.85 — cs가 1이 아닐 수 있어 «축소 반영 여부»로 판정
  chk('② 스테이지 배율 0.85 적용', sc.of === 0.85 && sc.spr < sc.zoom * 0.95 && sc.spr > sc.zoom * 0.5);
  await h.shot('r15_scale');

  // ⑧ HP DOM 패널
  const hp = await h.page.evaluate(() => {
    const p = document.getElementById('bd-hp-dom');
    if (!p) return { el: false };
    return { el: true, num: p.querySelector('.hp-num').textContent, lv: p.querySelector('.xp-lv').textContent, expBottom: window.__bdExpBarBottom };
  });
  say('⑧ ' + JSON.stringify(hp));
  chk('⑧ HP 다크 패널 표시', hp.el && /\d+ \/ \d+/.test(hp.num || '') && hp.expBottom > 0);

  // ⑤ canRest 판정
  const cr = await h.page.evaluate(() => {
    const st = STAGES[212];
    const objs = st.objects || [];
    const pharm = objs.find(o => o && /약국/.test(o.label || ''));
    const lib = objs.find(o => o && /(도서관|문화의집)/.test(o.label || ''));
    const conv = objs.find(o => o && /(편의점|마트|CU|GS)/.test(o.label || ''));
    return {
      pharm: pharm ? BD_canRestAt(pharm) : 'none',
      lib: lib ? BD_canRestAt(lib) : 'none',
      conv: conv ? BD_canRestAt(conv) : 'none',
      override: (() => { const o = { label: '와우약국', canRest: true }; return BD_canRestAt(o); })(),
    };
  });
  say('⑤ ' + JSON.stringify(cr));
  chk('⑤ canRest 분류', cr.pharm === false && cr.lib === true && (cr.conv === false || cr.conv === 'none') && cr.override === true);

  // ⑤b 약국 카드에 쉬어가기 없음 (실 모달)
  await h.page.evaluate(() => {
    const lm = (STAGES[212].__v24Landmarks || []).find(l => l.facilityId === 'wawoo_pharmacy');
    if (lm) { heroX = Number(lm.interactionX); heroY = Number(lm.interactionY) + 0.005; camX = heroX; camY = heroY; }
  });
  await h.wait(500);
  await h.page.keyboard.press('f'); await h.wait(500); await h.page.keyboard.press('f'); await h.wait(900);
  const pharmModal = await h.page.evaluate(() => {
    const m = document.getElementById('bd-district-facility-modal');
    if (!m || !m.classList.contains('open')) return { open: false };
    const txt = m.textContent || '';
    return { open: true, rest: /쉬어 가기/.test(txt), shop: /상점|구경/.test(txt) };
  });
  say('⑤b 약국 카드: ' + JSON.stringify(pharmModal));
  chk('⑤b 약국 휴식 제거', pharmModal.open && !pharmModal.rest);
  await h.shot('r15_pharm');
  await h.page.keyboard.press('Escape'); await h.wait(400); await h.page.keyboard.press('Escape'); await h.wait(600);

  // ③ 도착 판정 — 신규 지역(211)의 미접근 위험요소로 원거리→반경 진입, 토스트 로그로 판정
  await h.page.evaluate(() => {
    // 토스트 전체 기록
    if (!window.__toastLog) {
      window.__toastLog = [];
      const o = window.BD_toast;
      window.BD_toast = function (t, d) { try { window.__toastLog.push(String(t)); } catch (e) { } return o.apply(this, arguments); };
    }
    localStorage.setItem('bd_battle_tutorial_done', '1');
    BD.questIdx = 3; BD.purified = BD.purified || {}; BD.purified.ow212_trash_1 = true;
    fadeToStage(211, 0.5, 0.9);   // 위험요소에서 먼 남단
  });
  await h.wait(2500);
  for (let i = 0; i < 8; i++) { await h.page.keyboard.press(' '); await h.wait(300); }
  const arr = await h.page.evaluate(async () => {
    const list = (STAGES[211].objects || []).filter(x => x && x.hazardId && !x.__bdGone && !(BD.purified || {})[x.hazardId] && !BD_hzQuestGate(x));
    if (!list.length) return { err: 'all gated' };
    const t = list[0];
    window.__toastLog.length = 0;
    heroX = t.rx + (t.rw || 0.04) / 2; heroY = t.ry + (t.rh || 0.05) + 0.01; camX = heroX; camY = heroY;
    await new Promise(r => setTimeout(r, 1800));
    // 진단 — 레이어 tick 로직 수동 재현
    const hr = BD_screenRectOfWorld(heroX, heroY, 0, 0);
    const r = BD_screenRectOfWorld(t.rx, t.ry, t.rw || 0, t.rh || 0);
    const d = (hr && r) ? Math.hypot((r.left + r.width / 2) - hr.left, (r.top + r.height / 2) - hr.top) : 'nullRect';
    const db = document.getElementById('dialogue-box');
    return {
      id: t.hazardId, log: window.__toastLog.slice(), d, hsr: !!(window.HSR && HSR.active),
      dlg: !!(db && db.getBoundingClientRect().height > 0),
    };
  });
  say('③ ' + JSON.stringify(arr));
  chk('③ 도착 안내 토스트', !arr.err && (arr.log || []).some(t => /도착/.test(t)));

  // ⑦ VN 중 HUD 숨김
  await h.page.evaluate(() => { try { showDialog('사서 도현', ['레이어 검증 대사']); } catch (e) { } });
  await h.wait(900);
  const vn = await h.page.evaluate(() => ({
    cls: document.body.classList.contains('bd-vn-on'),
    questOp: (() => { const q = document.getElementById('bd-quest-hud'); return q ? getComputedStyle(q).opacity : 'no'; })(),
    menuOp: (() => { const m = document.getElementById('bd-menu-btns'); return m ? getComputedStyle(m).opacity : 'no'; })(),
    hpOp: (() => { const p = document.getElementById('bd-hp-dom'); return p ? getComputedStyle(p).opacity : 'no'; })(),
  }));
  say('⑦ ' + JSON.stringify(vn));
  chk('⑦ VN 중 HUD 숨김', vn.cls && Number(vn.questOp) === 0 && Number(vn.menuOp) === 0 && Number(vn.hpOp) === 0);
  await h.shot('r15_vn');
  for (let i = 0; i < 5; i++) { await h.page.keyboard.press(' '); await h.wait(350); }
  const vnOff = await h.page.evaluate(() => ({ cls: document.body.classList.contains('bd-vn-on'), op: getComputedStyle(document.getElementById('bd-menu-btns')).opacity }));
  chk('⑦b VN 종료 후 HUD 복원', !vnOff.cls && Number(vnOff.op) === 1);

  // ① 퀘스트 메인 제목 (부탁 추적 시)
  // 동기 시퀀스로 — 게임 틱이 trackedQuest를 되돌리기 전에 읽는다
  const title = await h.page.evaluate(() => {
    try {
      // NPC_QUESTS는 클로저 — 추적 id만 설정 (renderQuestHud의 find는 id 기준)
      BD.trackedQuest = 'npc_seoyeon';
      const diag = { tid: BD.trackedQuest, rqh: typeof window.__bdRQH };
      if (window.__bdRQH) __bdRQH();
      const ch = document.querySelector('#bd-quest-hud .bd-ch');
      const txt = ch ? ch.textContent : null;
      BD.trackedQuest = null;
      if (window.__bdRQH) __bdRQH();
      return { txt, diag };
    } catch (e) { return { err: String(e).slice(0, 100) }; }
  });
  say('① ' + JSON.stringify(title));
  chk('① 메인 제목 상시', !!(title.txt && /↳/.test(title.txt) && title.txt.split('\n').length >= 2));
  await h.page.evaluate(() => { try { BD.trackedQuest = null; renderQuestHud(); } catch (e) { } });

  const pass = R.filter(r => r[1]).length;
  say(`결과: ${pass}/${R.length}`);
  say('콘솔 오류: ' + h.consoleErrors.length);
  h.consoleErrors.slice(0, 5).forEach(e => say('  ! ' + e.slice(0, 150)));
};
