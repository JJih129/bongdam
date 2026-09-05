
/* (v142) 첫 전투 튜토리얼이 한 단계에서 멈춰 전투가 끝나지 않던 문제
   ────────────────────────────────────────────────────────────
   증상: 담이가 «「정화 스티커」를 눌러요 (Q)»에서 더 진행되지 않고,
        강조 마스크가 Q 버튼만 열어 둔 채 나머지 조작을 계속 막는다.
        → 공격은 되지만 다음 단계로 못 넘어가 전투가 영원히 안 끝난다.

   원인: 다음 단계로 넘기는 신호(진행 이벤트)를 놓치면 복구 수단이 없다.
        (건너뛰기 기능을 없앤 뒤로 사용자가 직접 빠져나올 방법도 사라졌다)

   해법: «진행이 멈춘 상태»를 감지해 자동으로 다음 단계로 넘긴다.
        - 같은 안내가 오래 유지되고
        - 그 사이 실제로 행동이 일어났다면(적 체력이 줄었다면)
        → 신호를 놓친 것으로 보고 튜토를 다음으로 진행시킨다. */
(function(){
  'use strict';
  var lastText = '';
  var sameSince = 0;
  var lastEnemyHp = null;
  var actedSince = 0;

  function damiText(){
    try{
      var d = document.getElementById('bd-dami-hud');
      if (!d) return '';
      var cs = getComputedStyle(d);
      if (cs.display === 'none' || +cs.opacity < 0.05) return '';
      return (d.textContent || '').replace(/\s+/g, ' ').trim();
    }catch(e){ return ''; }
  }

  function clearMask(){
    try{
      /* (v287) hole을 영구 display:none으로 만들지 않는다 —
         이후 스포트라이트가 다시는 안 보이고 투명 차단막만 남던 문제 */
      var spot = document.getElementById('bd-spot');   if (spot) spot.remove();
      var block = document.getElementById('bd-spot-block'); if (block) block.remove();
      var tut = document.getElementById('bd-tutorial'); if (tut) tut.style.display = 'none';
    }catch(e){}
  }

  setInterval(function(){
    try{
      if (!(window.HSR && HSR.active)) { sameSince = 0; actedSince = 0; return; }
      if (!(window.BD_TUTOR && BD_TUTOR.isRunning && BD_TUTOR.isRunning())) return;

      var now = Date.now();
      var t = damiText();

      // 같은 안내가 계속 떠 있는지
      if (t && t === lastText){
        if (!sameSince) sameSince = now;
      } else {
        lastText = t; sameSince = 0;
      }

      // 실제로 행동이 일어났는지 (적 체력 변화)
      var hp = null;
      try{ hp = HSR.enemy ? Number(HSR.enemy.hp) : null; }catch(e){}
      if (hp != null && lastEnemyHp != null && hp < lastEnemyHp){
        actedSince = now;               // 방금 공격이 성공했다
      }
      if (hp != null) lastEnemyHp = hp;

      // ① 행동했는데도 3초 넘게 같은 안내면 → 신호를 놓친 것
      // (v142a) 첫 전투가 73초까지 늘어져 복구 대기를 줄인다 (3초 → 1.4초)
      if (actedSince && sameSince && (now - actedSince) > 1400 && (now - sameSince) > 1400){
        try{ if (BD_TUTOR.force) BD_TUTOR.force(); }catch(e){}
        try{ console.info('[v142] 튜토리얼 진행 신호 유실 — 다음 단계로 넘깁니다.'); }catch(e){}
        sameSince = now; actedSince = 0;
        return;
      }

      // ② 정말 오래 멈춰 있을 때만 정리 — 입력 대기 단계(Q 눌러보기 등)에서 튜토를 죽이지 않는다
      try{
        var __mg = document.getElementById('bd-mg');
        if (__mg && __mg.offsetHeight) { sameSince = now; return; }   /* (v293) 미니게임 진행 중 */
        var __aug = document.getElementById('bd-aug-overlay');
        if (__aug && __aug.offsetHeight) { sameSince = now; return; }
      }catch(eB){}
      if (sameSince && (now - sameSince) > 30000){   // (v293) 6초 → 30초
        try{ if (window.BD_TUTOR && BD_TUTOR.skip) BD_TUTOR.skip(); }catch(e){}   /* (v287) done()은 getter — skip()이 정식 종료 */
        clearMask();
        try{ localStorage.setItem('bd_battle_tutorial_seen', '1'); }catch(e){}
        try{ console.info('[v142] 튜토리얼이 멈춰 있어 종료하고 조작을 복구했습니다.'); }catch(e){}
        sameSince = 0; actedSince = 0;
      }
    }catch(e){}
  }, 700);

  /* 전투가 끝났는데 강조 마스크가 남아 있으면 즉시 정리 */
  var wasBattle = false;
  setInterval(function(){
    try{
      var inb = !!(window.HSR && HSR.active);
      if (wasBattle && !inb) clearMask();
      wasBattle = inb;
    }catch(e){}
  }, 500);
})();
