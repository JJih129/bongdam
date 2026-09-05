// 분수광장 방문 루프 원인 실측
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
  await h.page.evaluate(() => {
    localStorage.setItem('bd_dami_awake', '1'); localStorage.setItem('bd_tut2_done', '1');
    localStorage.setItem('bd_dami_tutorial_done', '1'); localStorage.setItem('bd_battle_tutorial_done', '1');
    if (window.fadeToStage) fadeToStage(211, 0.892, 0.345);
  });
  await h.wait(2500);
  for (let i = 0; i < 6; i++) { await h.page.keyboard.press(' '); await h.wait(300); }
  const info = await h.page.evaluate(() => {
    heroX = 0.892; heroY = 0.345; camX = heroX; camY = heroY;
    const st = STAGES[211]; const bw = st.bgW, bh = st.bgH;
    const out = { near: (window.BD_v24NearestFacility() || {}).label };
    (st.__v24Landmarks || []).forEach(l => {
      if (!l || !l.majorFacility) return;
      const px = heroX * bw, py = heroY * bh;
      const rl = l.rx * bw, rt = l.ry * bh, rr = rl + l.rw * bw, rb = rt + l.rh * bh;
      const dx = Math.max(rl - px, 0, px - rr), dy = Math.max(rt - py, 0, py - rb);
      const rect = Math.round(Math.sqrt(dx * dx + dy * dy));
      const pt = Math.round(Math.hypot((heroX - l.interactionX) * bw, (heroY - l.interactionY) * bh) * 0.8);
      if (Math.min(rect, pt) < 200) out[l.label.slice(0, 12)] = { fid: l.facilityId, rect, pt };
    });
    return out;
  });
  say('실측: ' + JSON.stringify(info));
  await h.key('f', 1, 300); await h.wait(1200);
  const after = await h.page.evaluate(() => ({
    title: (() => { const m = document.getElementById('bd-district-facility-modal'); return m && m.classList.contains('open') ? (m.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 50) : null; })(),
    visits: (() => { try { return JSON.parse(localStorage.getItem('bd_concept_facility_visits_v1')).visitedFacilityIds; } catch (e) { return []; } })(),
  }));
  say('F 후: ' + JSON.stringify(after));
  await h.shot('fountain');
};
