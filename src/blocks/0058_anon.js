
/* (v199) 첫 필드 진입 시 조작 안내 오버레이 — 아무 키/클릭으로 닫힘, 세이브당 1회 */
(function(){
  'use strict';
  const SEEN_KEY = 'bd_controls_seen_v1';
  let shown = false, open = false;
  function build(){
    if (document.getElementById('bd-controls-ov')) return;
    const d = document.createElement('div');
    d.id = 'bd-controls-ov';
    d.innerHTML = '<div class="bd-ct-box"><h2>\uD83C\uDFAE 조작 방법</h2><table>'
      + '<tr><td><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> / 방향키</td><td>이동</td></tr>'
      + '<tr><td><kbd>F</kbd></td><td>조사 · 대화 · 상점 · 입장</td></tr>'
      + '<tr><td><kbd>E</kbd></td><td>가방 · 배지 스킬</td></tr>'
      + '<tr><td><kbd>Space</kbd></td><td>대화 진행</td></tr>'
      + '</table><div class="bd-ct-close">아무 키나 눌러 시작하기</div></div>';
    document.body.appendChild(d);
  }
  function close(){
    if (!open) return;
    open = false;
    const d = document.getElementById('bd-controls-ov');
    if (d) d.style.display = 'none';
    try{ localStorage.setItem(SEEN_KEY, '1'); }catch(e){}
  }
  let clearTicks = 0;   // (v199) 프롤로그 대사 사이 순간 틈에 뜨지 않게 연속 2틱 안정 요구
  function anyDialogVisible(){
    // VN 상자(dialogue-box)는 display:block을 유지한 채 opacity 0/높이 0으로 숨는다
    const vn = document.getElementById('dialogue-box');
    if (vn && vn.offsetHeight > 0 && parseFloat(getComputedStyle(vn).opacity) > 0.05) return true;
    const dlg = document.getElementById('bd-dialog');
    if (dlg && dlg.classList.contains('show')) return true;
    const ch = document.getElementById('bd-choice');
    if (ch && ch.classList.contains('show')) return true;
    return false;
  }
  function tryShow(){
    if (shown) return;
    try{ if (localStorage.getItem(SEEN_KEY) === '1') { shown = true; return; } }catch(e){}
    const gs = document.getElementById('game-screen');
    const gsUp = gs && gs.offsetHeight > 0 && getComputedStyle(gs).display !== 'none';
    const titleBtn = document.getElementById('bd-title-start');
    const titleUp = titleBtn && titleBtn.offsetParent !== null;   // 타이틀 화면이면 아직 아님
    // (v76) 프롤로그·튜토리얼 진행 중에는 조작 안내를 띄우지 않는다 —
    //  대사 사이 짧은 틈에 끼어들어 오프닝 대사창을 가리던 문제
    let inPrologue = false;
    try{ inPrologue = localStorage.getItem('bd_tut2_done') !== '1'; }catch(ePr){}
    let tutorRunning = false;
    try{ tutorRunning = !!(window.BD_TUTOR && BD_TUTOR.isRunning && BD_TUTOR.isRunning()); }catch(eTr){}
    const busy = !gsUp || titleUp || inPrologue || tutorRunning
      || (window.BD_isInputBlocked && window.BD_isInputBlocked())
      || window.__bdSceneActive
      || !!window.__bdDamiOpeningBusy || !!window.__bdDamiIntroBusy
      || (window.HSR && HSR.active)
      || anyDialogVisible()
      || !!document.getElementById('bd-place-card');
    if (busy){ clearTicks = 0; return; }
    if (++clearTicks < 2) return;
    shown = true; open = true;
    build();
    document.getElementById('bd-controls-ov').style.display = 'block';
  }
  // 닫기: 아무 키·클릭 (캡처 단계에서 소비해 게임 입력으로 안 새게)
  document.addEventListener('keydown', function(e){
    if (open){ e.preventDefault(); e.stopPropagation(); close(); }
  }, true);
  document.addEventListener('mousedown', function(e){
    if (open){ e.preventDefault(); e.stopPropagation(); close(); }
  }, true);
  setInterval(tryShow, 800);
})();
