module.exports = [
  {
    name: 'v147-57 에디터 편집 중에는 일시정지 금지',
    from: `function openPause(){
  if(_bdPaused) return;
  if(!isInGame()) return;`,
    to: `function openPause(){
  if(_bdPaused) return;
  if(!isInGame()) return;
  /* (v147) 에디터가 열려 있을 때 ESC가 여기까지 내려와 게임 루프를 죽였다.
     (에디터의 자체 ESC 닫기는 v51에서 Ctrl+Q로 바뀌며 사라졌고,
      일시정지 모달은 에디터 UI 뒤에 가려 유령 모달 청소기가 조용히 닫아 버려
      «루프 정지» 상태만 남았다 — 에디터를 닫아도 게임이 멈춰 있던 원인) */
  try { if (window.BongdamEditor && BongdamEditor.state && BongdamEditor.state.enabled) return; } catch(e){}`,
  },
  {
    name: 'v147-58 유령 일시정지 모달은 «정식 재개»로 닫는다',
    from: `      var gm = ghostModals();
      if (gm.length){
        gm.forEach(function(m){ try{ m.classList.remove('show'); }catch(e){} });
        try{ console.info('[v145] 유령 모달 ' + gm.length + '개 정리 — 조작을 복구했습니다.'); }catch(e){}
      }`,
    to: `      var gm = ghostModals();
      if (gm.length){
        gm.forEach(function(m){
          try{
            /* (v147) 일시정지 모달을 클래스만 벗겨 버리면 게임 루프가 멈춘 채 남는다.
               정식 재개 경로(BD_resumeGame)로 닫아야 루프까지 되살아난다. */
            if (m.id === 'bd-pause-modal' && typeof window.BD_resumeGame === 'function') window.BD_resumeGame();
            else m.classList.remove('show');
          }catch(e){}
        });
        try{ console.info('[v145] 유령 모달 ' + gm.length + '개 정리 — 조작을 복구했습니다.'); }catch(e){}
      }`,
  },
  {
    name: 'v147-59 에디터 ESC 복원 + 게임 루프 소생 감시자',
    type: 'append_before_body_end',
    id: 'bd-editor-esc-v147',
    html: `
<script id="bd-editor-esc-v147">
/* (v147) 에디터 ESC 닫기 복원 + 게임 루프 소생 감시자
   ────────────────────────────────────────────────────────────
   · ESC로 에디터가 닫히는 원래 동작을 window 캡처(모든 처리보다 먼저)에서 복원한다.
     아래 게임 일시정지 핸들러까지 이벤트가 내려가지 않게 확실히 끊는다.
   · 어떤 경로로든 게임 루프(RAF 체인)가 죽은 채 방치되면 —
     화면은 게임인데 일시정지 모달도 없고 전투도 아니라면 — 루프를 되살린다. */
(function(){
  'use strict';

  function onScreen(e){
    try{
      if (!e) return false;
      var cs = getComputedStyle(e);
      if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity < 0.05) return false;
      var r = e.getBoundingClientRect();
      return r.width > 2 && r.height > 2;
    }catch(err){ return false; }
  }

  /* ── ① ESC = 에디터 닫기 ── */
  window.addEventListener('keydown', function(e){
    try{
      if (e.key !== 'Escape') return;
      var ed = window.BongdamEditor;
      if (!(ed && ed.state && ed.state.enabled)) return;
      e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
      var btn = document.getElementById('bge-toggle');
      if (btn) btn.click();                      // 정식 토글 경로로 닫는다
    }catch(err){}
  }, true);

  /* ── ② 루프 소생 감시자 ── */
  var deadSince = 0;
  setInterval(function(){
    try{
      if (window.__gameLoopChainAlive){ deadSince = 0; return; }
      var gs = document.getElementById('game-screen');
      if (!gs || getComputedStyle(gs).display === 'none'){ deadSince = 0; return; }
      /* 정당하게 멈춰 있는 경우들은 존중한다 */
      var pm = document.getElementById('bd-pause-modal');
      if (pm && pm.classList.contains('show') && onScreen(pm)){ deadSince = 0; return; }
      var go = document.getElementById('gameover-screen');
      if (go && go.classList.contains('show')){ deadSince = 0; return; }
      try{ if (window.HSR && HSR.active){ deadSince = 0; return; } }catch(e2){}
      var t = document.getElementById('bd-title-screen');
      if (t && t.classList.contains('show')){ deadSince = 0; return; }

      if (!deadSince){ deadSince = Date.now(); return; }
      if (Date.now() - deadSince < 1200) return;
      deadSince = 0;
      /* 일시정지 잔여 상태도 함께 정리 — BD_resumeGame 은 닫힌 상태에서 불러도 안전하다 */
      try{ if (typeof window.BD_resumeGame === 'function') window.BD_resumeGame(); }catch(e3){}
      try{ if (!window.__gameLoopChainAlive && typeof gameLoop === 'function') gameLoop(); }catch(e4){}
      try{ console.info('[v147] 멈춰 있던 게임 루프를 되살렸습니다.'); }catch(e5){}
    }catch(e){}
  }, 600);
})();
</script>`,
  },
];
