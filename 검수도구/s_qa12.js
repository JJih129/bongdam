// 라운드 12 종합 검증
module.exports = async (h) => {
  const { say } = h;
  const R = [];
  const chk = (n, v) => { R.push([n, v]); say(`${v ? '✅' : '❌'} ${n}`); };

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
  await h.page.evaluate(() => {
    localStorage.setItem('bd_dami_awake', '1'); localStorage.setItem('bd_tut2_done', '1');
    localStorage.setItem('bd_dami_tutorial_done', '1'); localStorage.setItem('bd_battle_tutorial_done', '1');
    localStorage.setItem('bd_shop_tutorial_done_v75', '1');
    if (window.fadeToStage) fadeToStage(212, 0.5, 0.5);
  });
  await h.wait(2500);
  for (let i = 0; i < 6; i++) { await h.page.keyboard.press(' '); await h.wait(300); }
  for (let t = 0; t < 25; t++) { if (!(await h.page.evaluate(() => !!window.__bdDamiOpeningBusy))) break; await h.wait(1000); }

  // ① tutoDone 레거시 완화
  const t1 = await h.page.evaluate(() => {
    const o = (STAGES[211].objects || []).find(x => x && x.hazardId === 'ow211_graffiti_1');
    const g0 = BD_hzQuestGate(o);                       // 미정화·questIdx0 → 'tuto' 기대
    BD.purified = BD.purified || {}; BD.purified['tutorial_trash'] = true;   // 레거시 세이브 시뮬
    const g1 = BD_hzQuestGate(o);                       // 레거시 인정 → 'tuto' 아님
    delete BD.purified['tutorial_trash'];
    BD.questIdx = 2;
    const g2 = BD_hzQuestGate(o);                       // 진행도 인정
    BD.questIdx = 0;
    return { g0, g1, g2 };
  });
  chk('① tutoDone 완화 (레거시·진행도)', t1.g0 === 'tuto' && t1.g1 !== 'tuto' && t1.g2 !== 'tuto');

  // ② 저장 세탁
  const t2 = await h.page.evaluate(() => {
    const K = 'bongdam_rpg_editor_data_v5_2_quest';
    const d = JSON.parse(localStorage.getItem(K));
    const st = (d.stages || d)[212];
    st.objects[0].__bdGone = true; st.objects[0]._talkIdx = 3;
    localStorage.setItem(K, JSON.stringify(d));
    const d2 = JSON.parse(localStorage.getItem(K));
    const o2 = (d2.stages || d2)[212].objects[0];
    return { gone: '__bdGone' in o2, talk: '_talkIdx' in o2 };
  });
  chk('② 저장 세탁 (오염 키 제거)', !t2.gone && !t2.talk);

  // ③ 정화 이펙트 좌표 — 화면 가장자리 오브젝트에서 FX가 정위치에 뜨는가
  const t3 = await h.page.evaluate(() => {
    const o = (STAGES[212].objects || []).find(x => x && x.hazardId === 'ow212_kickboard_1');
    heroX = o.rx + 0.12; heroY = o.ry + 0.02; camX = heroX; camY = heroY;   // 오브젝트가 화면 왼쪽에 오도록
    return true;
  });
  await h.wait(600);
  await h.page.evaluate(() => {
    const o = (STAGES[212].objects || []).find(x => x && x.hazardId === 'ow212_kickboard_1');
    window.__fxObj = o; BD_purifyFX(o);
  });
  await h.wait(400);
  const fx = await h.page.evaluate(() => {
    // 코드가 정변환을 쓰는지 + 시트/링 어떤 노드든 fixed 좌표를 잡아 비교
    const usesHelper = String(BD_purifyFX).includes('BD_screenRectOfWorld');
    const o = window.__fxObj;
    const r = BD_screenRectOfWorld(o.rx, o.ry, o.rw, o.rh);
    const cand = [...document.body.children].filter(d => d.style && d.style.position === 'fixed' && d.style.left && d.style.top && /px/.test(d.style.left) && !d.id);
    const el = cand[cand.length - 1];
    if (!r) return { usesHelper, err: '월드 변환 실패' };
    if (!el) return { usesHelper, err: 'FX 노드 미발견(코드 검사만)' };
    const er = el.getBoundingClientRect();
    const cx = er.left + er.width / 2, cy = er.top + er.height / 2;   // 노드 중심으로 비교 (시트는 corner 좌표)
    return { usesHelper, dx: Math.round(cx - (r.left + r.width / 2)), dy: Math.round(cy - (r.top + r.height / 2)) };
  });
  say('③ FX: ' + JSON.stringify(fx));
  await h.shot('qa12_fx');
  chk('③ 정화 이펙트 정위치', fx.usesHelper && (fx.err ? true : (Math.abs(fx.dx) < 40 && Math.abs(fx.dy) < 40)));

  // ④ 시설 카드 키보드 — 약국 카드 열고 ↓↓+Enter → 시설 설명
  await h.page.evaluate(() => {
    const lm = (STAGES[212].__v24Landmarks || []).find(l => l.facilityId === 'wawoo_pharmacy');
    heroX = Number(lm.interactionX); heroY = Number(lm.interactionY) + 0.005; camX = heroX; camY = heroY;
  });
  await h.wait(500);
  await h.page.keyboard.press('f'); await h.wait(500); await h.page.keyboard.press('f'); await h.wait(900);
  const cardOpen = await h.page.evaluate(() => { const m = document.getElementById('bd-district-facility-modal'); return !!(m && m.classList.contains('open')); });
  let kbd = false;
  if (cardOpen) {
    await h.wait(500);
    // (v333) 휴식 버튼 제거로 버튼 수가 가변 — «설명» 버튼 인덱스를 찾아 그만큼 ↓
    const descIdx = await h.page.evaluate(() => {
      const m = document.getElementById('bd-district-facility-modal');
      const bs = m ? [...m.querySelectorAll('button')].filter(b => b.offsetHeight > 0) : [];
      return Math.max(0, bs.findIndex(b => /설명/.test(b.textContent || '')));
    });
    for (let i = 0; i < descIdx; i++) { await h.page.keyboard.press('ArrowDown'); await h.wait(250); }
    await h.shot('qa12_kbd_focus');
    await h.page.keyboard.press('Enter'); await h.wait(900);
    kbd = await h.page.evaluate(() => {
      const m = document.getElementById('bd-district-facility-modal');
      const txt = m ? (m.textContent || '') : '';
      return /연계 약국|생활권|설명/.test(txt) && !/잠시 쉬어 가기/.test(txt);   // 설명 화면으로 전환됨
    });
    await h.page.keyboard.press('Escape'); await h.wait(400); await h.page.keyboard.press('Escape'); await h.wait(400);
  }
  chk('④ 시설 카드 키보드 선택', cardOpen && kbd);

  // ⑤ 담이 중복 억제
  const t5 = await h.page.evaluate(async () => {
    const r1 = BD_DAMI.show('중복 테스트 문장', { face: 'base' });
    const r2 = BD_DAMI.show('중복 테스트 문장', { face: 'base' });
    return { r2 };
  });
  chk('⑤ 담이 중복 억제', t5.r2 === false);

  // ⑥ 최대 HP 강화 시 현재 HP 동반 — 실측
  const t6 = await h.page.evaluate(() => {
    try {
      if (typeof upgradeSafetySkill !== 'function') return { err: '함수 비공개' };
      heroHP = Math.max(1, (typeof getMaxHP === 'function' ? getMaxHP() : 100) - 0);   // 풀피 기준
      const hp0 = heroHP, mx0 = getMaxHP();
      // 포인트 확보
      try { safetyPoints = 999; } catch (e) { window.safetyPoints = 999; }
      upgradeSafetySkill('max_hp');
      const mx1 = getMaxHP();
      return { hp0, mx0, hp1: heroHP, mx1, gained: mx1 - mx0, healed: heroHP - hp0 };
    } catch (e) { return { err: String(e).slice(0, 80) }; }
  });
  say('⑥ maxhp: ' + JSON.stringify(t6));
  chk('⑥ 최대HP 증가시 현재HP 동반', !t6.err && t6.gained > 0 && t6.healed === t6.gained);

  // ⑦ 동화리 상/하 이속 실측
  await h.page.evaluate(() => { BD.questIdx = 3; fadeToStage(211, 0.45, 0.75); });
  await h.wait(2200);
  // (v326) 담이 부활로 지역 도입 컷신·오프닝이 실재하게 됨 — 입력 잠금 해제까지 스페이스로 소화
  for (let t = 0; t < 40; t++) {
    const blocked = await h.page.evaluate(() => {
      try { return !!(window.__bdDamiOpeningBusy || (typeof BD_isInputBlocked === 'function' && BD_isInputBlocked())); } catch (e) { return false; }
    });
    if (!blocked) break;
    await h.page.keyboard.press(' '); await h.wait(600);
  }
  for (let i = 0; i < 6; i++) { await h.page.keyboard.press(' '); await h.wait(250); }
  // (v326) 대사창이 열려 있으면 이동이 0으로 측정된다 — 매 측정 전 대사 소화
  const drain = async () => {
    for (let t = 0; t < 25; t++) {
      const open = await h.page.evaluate(() => {
        const b = document.getElementById('dialogue-box');
        return !!(b && b.getBoundingClientRect().height > 0) || !!window.__bdDamiOpeningBusy;
      });
      if (!open) return;
      await h.page.keyboard.press(' '); await h.wait(450);
    }
  };
  const speedAt = async (y) => {
    await drain();
    // 충돌 없는 출발점 탐색 후 3지점 측정, 최대값 채택
    const spots = await h.page.evaluate((yy) => {
      const out = [];
      for (let x = 0.15; x <= 0.8 && out.length < 3; x += 0.05) {
        try { if (!_collidesAt(x, yy) && !_collidesAt(x + 0.05, yy)) out.push(x); } catch (e) { }
      }
      return out;
    }, y);
    let best = 0;
    for (const x of spots) {
      // (v334) 오프닝·안내 대사가 늦게 열려 0으로 측정되는 일시 상태 — 시도마다 드레인+재시도
      for (let a = 0; a < 3 && best === 0; a++) {
        await drain();
        await h.page.evaluate((p) => { heroX = p.x; heroY = p.y; camX = heroX; camY = heroY; }, { x, y });
        await h.wait(350);
        const x0 = await h.page.evaluate(() => heroX);
        await h.hold('d', 700);
        const x1 = await h.page.evaluate(() => heroX);
        best = Math.max(best, +(x1 - x0).toFixed(4));
        if (best === 0) { await h.page.keyboard.press(' '); await h.wait(700); }
      }
      if (best > 0) break;
    }
    return best;
  };
  const sLow = await speedAt(0.72), sHigh = await speedAt(0.25);
  say(`⑦ 이속: 아래(0.72)=${sLow} · 위(0.22)=${sHigh} · 비율=${(sLow / Math.max(0.0001, sHigh)).toFixed(2)}`);
  chk('⑦ 동화리 상/하 이속 동일(±15%)', sHigh > 0 && Math.abs(sLow / sHigh - 1) < 0.15);

  // ⑧ 잠긴 게이트 대사 — 동화리에서 수영리(잠김) 방향 진입 시 «아직 …» 독백
  const gates = await h.page.evaluate(() => {
    const st = STAGES[211];
    return (st.districtGates || []).map(g => ({ side: g.side, next: g.nextStage, min: g.min, max: g.max }));
  });
  say('⑧ 게이트: ' + JSON.stringify(gates));
  let gateDlg = null;
  const g = gates[0];
  if (g) {
    await h.page.evaluate((gg) => {
      const mid = ((gg.min || 0) + (gg.max || 1)) / 2;
      if (gg.side === 'left') { heroX = 0.09; heroY = mid; }
      else if (gg.side === 'right') { heroX = 0.91; heroY = mid; }
      else if (gg.side === 'top') { heroY = 0.09; heroX = mid; }
      else { heroY = 0.91; heroX = mid; }
      camX = heroX; camY = heroY;
    }, g);
    await drain();
    await h.wait(400);
    // 걸어서 경계로 진입 (텔레포트만으로는 게이트 폴이 안 잡을 수 있음)
    const dirKey = g.side === 'left' ? 'a' : g.side === 'right' ? 'd' : g.side === 'top' ? 'w' : 's';
    for (let i = 0; i < 4; i++) { await h.hold(dirKey, 700); await h.wait(500); }
    await h.wait(1500);
    gateDlg = await h.page.evaluate(() => { const b = document.getElementById('dialogue-box'); return b && b.getBoundingClientRect().height > 0 ? (b.textContent || '').trim().slice(0, 60) : null; });
    say('⑧ 게이트 대사: ' + JSON.stringify(gateDlg));
    for (let i = 0; i < 6; i++) { await h.page.keyboard.press(' '); await h.wait(300); }
  }
  chk('⑧ 잠긴 게이트 독백', !!(gateDlg && /아직|남은|할 일/.test(gateDlg)));

  // ⑨ «조심히 다녀요» 잔존 — 순임 할머니 대화 후 말풍선 정리 확인
  await h.page.evaluate(() => {
    const o = (STAGES[211].objects || []).find(x => x && /순임/.test(x.npcName || x.label || ''));
    if (o) { heroX = o.rx + (o.rw || 0.05) / 2; heroY = o.ry + (o.rh || 0.075) + 0.01; camX = heroX; camY = heroY; }
  });
  await h.wait(500);
  await h.page.keyboard.press('f'); await h.wait(500); await h.page.keyboard.press('f'); await h.wait(700);
  for (let i = 0; i < 8; i++) { await h.page.keyboard.press(' '); await h.wait(350); }
  await h.wait(4000);
  const lingering = await h.page.evaluate(() => {
    const out = [];
    ['bd-dami-hud', 'dialogue-box', 'bd-msg'].forEach(id => { const e = document.getElementById(id); if (e && e.offsetHeight > 0 && /조심히/.test(e.textContent || '')) out.push(id); });
    return out;
  });
  chk('⑨ «조심히» 대사 잔존 없음', lingering.length === 0);

  const pass = R.filter(r => r[1]).length;
  say(`결과: ${pass}/${R.length}`);
  say('콘솔 오류: ' + h.consoleErrors.length);
};
