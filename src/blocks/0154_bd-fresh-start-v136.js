
/* (v136) 「시작하기」를 누르면 항상 이 파일에 구워진 배치로 시작한다.
   ────────────────────────────────────────────────────────────
   브라우저에 남은 옛 배치가 파일 배치를 덮어써서 위험요소 위치가 어긋나던 문제.
   («이 파일 기준 초기화» 버튼을 눌러야만 정상이 되던 증상)

   버튼과 동일한 정리를 새 게임 시작 시 자동으로 수행한다.
   · 에디터 저장본은 _prev 로 백업하므로 되돌릴 수 있다
   · 에디터에서 저장(💾)한 직후에는 그 작업을 지키기 위해 건너뛴다 */
(function(){
  'use strict';
  var K  = 'bongdam_rpg_editor_data_v5_2_quest';
  var LK = 'bongdam_rpg_editor_project_v5_2_quest';
  var KEEP = 'bd_editor_keep_until';     // 에디터 저장 직후 보호 시각

  function purgeToBaked(){
    try{
      // 에디터에서 방금 저장했다면(10분 이내) 사용자의 작업을 지킨다
      var keep = Number(localStorage.getItem(KEEP) || 0);
      if (keep && Date.now() < keep){
        try{ console.info('[v136] 에디터 저장 직후 — 파일 배치 초기화를 건너뜁니다.'); }catch(e){}
        return false;
      }
      var old = localStorage.getItem(K);
      if (old) localStorage.setItem(K + '_prev', old);
      localStorage.removeItem(K);
      localStorage.removeItem(K + '_bakeGen');
      var lv = localStorage.getItem(LK);
      if (lv){ localStorage.setItem(LK + '_prev', lv); localStorage.removeItem(LK); }
      try{ console.info('[v136] 이 파일에 구워진 배치로 시작합니다.'); }catch(e){}
      return true;
    }catch(e){ return false; }
  }
  window.BD_resetToBaked = purgeToBaked;

  /* (v325) 진행·세이브 완전 소거 — «시작하기»는 파일에 구워진 상태 그대로의 새 게임이어야 한다.
     유지: 에디터 배치·프로젝트·에셋(작업 보호), bd_bake_stamp(파일 스탬프), 사운드·설정. */
  function purgeProgress(){
    try{
      try{ localStorage.removeItem('fantasyRPG_save'); }catch(e1){}
      var kill = [];
      for (var i = 0; i < localStorage.length; i++){
        var k = localStorage.key(i);
        if (!k) continue;
        if (/^bd_/.test(k) && !/^(bd_bake_stamp|bd_editor_keep_until|bd_sound|bd_settings|bd_char_scales)/.test(k)) kill.push(k);   /* (v333) 스테이지 배율은 배치 성격 — 유지 */
        /* (v330→v331) BD 모듈 세이브·슬롯·레거시 전부 소거 — bdLoad 는 fantasyRPG_save 가
           아니라 bongdam_guardian_v160 을 읽는다(재시작 후 스킬 복원 잔존의 진범, 실측 스택).
           에디터 키는 bongdam_rpg_editor_* 접두라 이 정규식에 걸리지 않는다. */
        else if (/^bongdam_guardian/.test(k)) kill.push(k);
      }
      kill.forEach(function(k){ try{ localStorage.removeItem(k); }catch(e2){} });
      try{ console.info('[v325] 새 게임 — 진행·세이브 ' + (kill.length + 1) + '개 키를 정리했습니다.'); }catch(e3){}
    }catch(e){}
  }
  window.BD_purgeProgress = purgeProgress;

  /* 에디터 저장 버튼을 누르면 잠시 보호 */
  document.addEventListener('click', function(e){
    try{
      var b = e.target && e.target.closest && e.target.closest('button');
      if (!b) return;
      var t = (b.textContent || '');
      if (b.id === 'bge-save-btn' || /💾\s*저장/.test(t)){
        localStorage.setItem(KEEP, String(Date.now() + 10 * 60 * 1000));
      }
    }catch(err){}
  }, true);

  /* 「시작하기」(새 게임) → 파일 배치로 정리 후 시작
     정리는 배치를 읽기 전에 끝나야 하므로, 클릭을 가로채 한 번만 새로고침한다. */
  function hookStart(){
    try{
      var btn = document.getElementById('bd-title-start');
      if (!btn || btn.__bdFresh) return;
      btn.__bdFresh = true;
      btn.addEventListener('click', function(ev){
        try{
          /* (v325) 리로드 직후 자동 클릭·연타로 인한 무한 루프만 5초 디바운스로 막고,
             같은 세션의 «다시 시작»도 매번 완전 초기화한다 (기존 세션 1회 제한이 잔존 원인) */
          var last = Number(sessionStorage.getItem('bd_fresh_at') || 0);
          if (Date.now() - last < 5000) return;   /* 디바운스 중엔 원래 시작 동작을 그대로 */
          /* (v326) purge 후 reload 전에 원래 시작 핸들러·오토세이브가 세이브를 되살리는
             레이스 봉쇄 — 원래 핸들러 차단 + 저장 동결 후 리로드 */
          try{ ev.preventDefault(); ev.stopImmediatePropagation(); }catch(eb){}
          sessionStorage.setItem('bd_fresh_at', String(Date.now()));
          /* (v379) 전체화면 중이었다면 리로드 후 첫 입력에서 복원 (§3 — 시작하기가 리로드라 전체화면이 풀리던 문제) */
          try{ if (document.fullscreenElement || document.webkitFullscreenElement) sessionStorage.setItem('bd_refs', '1'); }catch(eF){}
          purgeToBaked();      /* 배치 — 에디터 10분 보호 존중 */
          purgeProgress();     /* 진행·세이브 — 항상 전부 */
          sessionStorage.setItem('bd_auto_open_start', '1');   /* (v329) 동결 «전»에 기록 — 동결이 bd_ 접두를 막는다 */
          window.__bdFreezeStore = true;   /* 리로드까지 진행 키 저장 금지 (v252 래퍼가 준수) */
          location.reload();
        }catch(e){}
      }, true);   // 캡처 단계 — 원래 동작보다 먼저
    }catch(e){}
  }
  var n = 0;
  var iv = setInterval(function(){ n++; hookStart(); if (n > 60) clearInterval(iv); }, 300);

  /* 정리 후 새로고침됐다면, 사용자가 다시 누르지 않아도 시작 화면으로 이어 준다 */
  try{
    if (sessionStorage.getItem('bd_auto_open_start') === '1'){
      sessionStorage.removeItem('bd_auto_open_start');
      var t = 0;
      var seen2 = false;
      var iv2 = setInterval(function(){
        t++;
        /* (v328) 1회 클릭 후 끝내지 않고, 캐릭터 선택(또는 게임 화면)으로 실제로
           넘어갈 때까지 재시도한다 — 준비 전 클릭 1회로 타이틀에 남던 문제.
           «버튼이 사라짐 = 시작됨» 판정은 버튼을 한 번이라도 본 뒤에만 유효 */
        var b = document.getElementById('bd-title-start');
        var m = document.getElementById('bd-startsetup-modal');
        if (b && b.offsetWidth > 0) seen2 = true;
        var started = (m && m.classList.contains('show')) || (seen2 && !(b && b.offsetWidth > 0));
        if (started || t > 120){ clearInterval(iv2); return; }
        if (b && b.offsetWidth > 0 && t >= 3){ try{ b.click(); }catch(e){} }
      }, 250);
    }
  }catch(e){}
})();
