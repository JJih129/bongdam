
/* ══ (v199) 쉬운 플레이 지원 — 키 힌트 바 · 유휴 힌트 · 목표 방향 안내 ══ */
(function(){
  'use strict';
  let lastInput = Date.now();
  let hint1Done = false, hint2On = false;
  ['keydown','mousedown','wheel','touchstart'].forEach(function(t){
    document.addEventListener(t, function(){
      lastInput = Date.now(); hint1Done = false;
      if (hint2On){ hint2On = false; hideEl('bd-goal-down'); }
    }, true);
  });

  function el(id){ return document.getElementById(id); }
  function hideEl(id){ const d = el(id); if (d) d.style.display = 'none'; }
  function gameUp(){
    const gs = el('game-screen');
    if (!(gs && gs.offsetHeight > 0 && getComputedStyle(gs).display !== 'none')) return false;
    const tb = el('bd-title-start');
    if (tb && tb.offsetParent !== null) return false;
    if (window.HSR && HSR.active) return false;
    if (window.__bdSceneActive) return false;
    if (window.BD_isInputBlocked && window.BD_isInputBlocked()) return false;
    const vn = el('dialogue-box');
    if (vn && vn.offsetHeight > 0 && parseFloat(getComputedStyle(vn).opacity) > 0.05) return false;
    const dlg = el('bd-dialog'); if (dlg && dlg.classList.contains('show')) return false;
    const ch = el('bd-choice'); if (ch && ch.classList.contains('show')) return false;
    return true;
  }
  function purifiedCount(){
    try{ return Object.keys((window.BD && BD.purified) || {}).length; }catch(e){ return 0; }
  }
  function bdHazardOk(o){
    if (!o || o.interactable !== 'hazard' || !o.hazardId || o.bdOptional) return false;
    if ((window.BD && BD.purified && BD.purified[o.hazardId]) || o._purified) return false;
    if (window.BD_hazardLocked && BD_hazardLocked(o)) return false;   // (v225) 잠긴 보스 제외
    return true;
  }
  // (v225) 현재 임무 장의 위험요소 접두사
  function bdQuestPrefix(){
    try{
      // QUESTS 배열은 이 스코프에서 보이지 않으므로 고정 순서(프롤로그→1~4장→최종장) 인덱스로 매핑
      const idx = (window.BD && typeof BD.questIdx === 'number') ? BD.questIdx : 0;
      return ['tutorial_', 'ch1_', 'ch2_', 'ch3_', 'ch4_', 'final_'][idx] || null;
    }catch(e){ return null; }
  }
  function goalHazard(){
    try{
      const st = STAGES[currentStage]; if (!st) return null;
      const pfx = bdQuestPrefix();
      let best = null, bd2 = 1e9;
      // 1) 현재 지역 안: 현재 장 위험요소 우선, 없으면 아무 미정화 위험요소
      [true, false].some(function(strict){
        st.objects.forEach(function(o){
          if (!bdHazardOk(o)) return;
          if (strict && pfx && String(o.hazardId).indexOf(pfx) !== 0) return;
          const cx = o.rx + (o.rw||0.08)/2, cy = o.ry + (o.rh||0.08)/2;
          const d2 = (cx-heroX)*(cx-heroX) + (cy-heroY)*(cy-heroY);
          if (d2 < bd2){ bd2 = d2; best = { o:o, cx:cx, cy:cy, d:Math.sqrt(d2) }; }
        });
        return !!best;
      });
      if (best) return best;
      // 2) 다른 지역에 목표가 있으면: 그 지역으로 가는 출구를 가리킨다 (광장 허브 1홉 + 경유)
      if (!pfx || !st.exits) return null;
      let targetStage = null;
      Object.keys(STAGES).forEach(function(sid){
        if (targetStage !== null) return;
        const s2 = STAGES[sid]; if (!s2 || !s2.objects) return;
        if (s2.objects.some(function(o){ return bdHazardOk(o) && String(o.hazardId).indexOf(pfx) === 0; }))
          targetStage = +sid;
      });
      if (targetStage === null || targetStage === currentStage) return null;
      const EXIT_POS = { top:[0.5,0.05], bottom:[0.5,0.95], left:[0.05,0.5], right:[0.95,0.5] };
      let via = null;
      Object.keys(st.exits).forEach(function(dir){
        const ex = st.exits[dir];
        if (ex && ex.active && ex.nextStage === targetStage) via = dir;
      });
      if (!via){   // 직행 출구가 없으면 광장(1) 경유
        Object.keys(st.exits).forEach(function(dir){
          const ex = st.exits[dir];
          if (!via && ex && ex.active && ex.nextStage === 1) via = dir;
        });
      }
      if (!via) return null;
      const p = EXIT_POS[via];
      return { o:null, cx:p[0], cy:p[1], d:9, exit:true };
    }catch(e){ return null; }
  }
  function toScreen(mx, my){
    try{
      const cv = el('game-canvas'); if (!cv) return null;
      const rect = cv.getBoundingClientRect();
      const px = ((((mx-camX)/VIEWPORT_W + 0.5)*BASE_W) - BASE_W/2)*currentScale + cv.width/2;
      const py = ((((my-camY)/VIEWPORT_H + 0.5)*BASE_H) - BASE_H/2)*currentScale + cv.height/2;
      return { x: rect.left + px/(cv.width/rect.width), y: rect.top + py/(cv.height/rect.height) };
    }catch(e){ return null; }
  }

  /* ── ① 키 힌트 바: 첫 정화 전까지 표시 ── */
  function ensureKeybar(){
    let d = el('bd-keybar');
    if (!d){
      d = document.createElement('div'); d.id = 'bd-keybar';
      d.innerHTML = '<kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> 이동&nbsp;&nbsp;'
        + '<kbd>F</kbd> 조사·대화&nbsp;&nbsp;<kbd>E</kbd> 가방&nbsp;&nbsp;<kbd>Space</kbd> 대화 넘기기';
      document.body.appendChild(d);
    }
    return d;
  }

  /* ── ③ 목표 방향 안내 ── */
  function ensureArrow(id, txt){
    let d = el(id);
    if (!d){ d = document.createElement('div'); d.id = id; d.textContent = txt; document.body.appendChild(d); }
    return d;
  }
  window.__bdGoalDbg = goalHazard;   // 진단용 노출 (무해)
  function updateGoal(){
    const arrow = ensureArrow('bd-goal-arrow', '\u27A4');
    const down  = ensureArrow('bd-goal-down', '\u25BC');
    if (!gameUp()){ arrow.style.display='none'; down.style.display='none'; return; }
    const g = goalHazard();
    if (!g){ arrow.style.display='none'; down.style.display='none'; return; }
    const p = toScreen(g.cx, g.cy);
    if (!p){ arrow.style.display='none'; return; }
    const W = innerWidth, H = innerHeight, M = 26;
    const inView = p.x > M && p.x < W-M && p.y > M+70 && p.y < H-M;
    if (inView){
      arrow.style.display = 'none';
      // (v225) 목표가 화면 안이면 항상 ▼ 표시 (유휴 대기 없이 상시 안내)
      const top = g.o ? toScreen(g.o.rx + (g.o.rw||0.08)/2, g.o.ry)
                      : toScreen(g.cx, Math.max(0, g.cy - 0.03));
      if (top){ down.style.display='block'; down.style.left=top.x+'px'; down.style.top=(top.y-30)+'px'; }
      else down.style.display = 'none';
    } else {
      down.style.display = 'none';
      // 화면 가장자리에 클램프 + 방향 회전
      const cx = W/2, cy = H/2;
      const dx = p.x - cx, dy = p.y - cy;
      const t = Math.max(Math.abs(dx)/(W/2 - M), Math.abs(dy)/(H/2 - M)) || 1;
      const ex = cx + dx/t, ey = cy + dy/t;
      const ang = Math.atan2(dy, dx) * 180/Math.PI;
      arrow.style.display = 'block';
      arrow.style.left = (ex-13) + 'px';
      arrow.style.top  = (ey-13) + 'px';
      arrow.style.transform = 'rotate(' + ang.toFixed(0) + 'deg)';
    }
  }

  /* ── ② 유휴 힌트 ── */
  function idleCheck(){
    if (!gameUp()) { lastInput = Date.now(); return; }   // 대화·전투 중엔 카운트 리셋
    const idle = Date.now() - lastInput;
    if (idle > 10000 && !hint1Done){
      hint1Done = true;
      const g = goalHazard();
      try{
        if (window.BD_TUT2_HINT) bdToast(window.BD_TUT2_HINT);
        else if (g && g.d < 0.16) bdToast('\uD83D\uDD0D 가까이에서 F 키를 눌러 조사해 보세요');
        else if (g) bdToast('\uD83D\uDCD4 왼쪽 위 「추적 중인 임무」를 참고해 보세요');
        else bdToast('\uD83D\uDEAA 지도 가장자리로 가면 다음 동네로 이동해요');
      }catch(e){}
    }
    if (idle > 20000 && !hint2On){ hint2On = true; }
  }

  /* ── 메인 틱 ── */
  window.BD_addTick(function(){
    // 키 힌트 바: 게임 중 + 아직 한 번도 정화 안 했을 때만
    const kb = ensureKeybar();
    const show = gameUp() && purifiedCount() === 0 && (!window.BD || (BD.questIdx||0) < 2);
    kb.style.display = show ? 'block' : 'none';
    updateGoal();
    idleCheck();
  }, 250);
})();
