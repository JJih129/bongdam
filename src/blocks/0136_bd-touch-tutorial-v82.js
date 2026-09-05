
/* (v82) 태블릿·터치 전용 안내 — PC 키보드 기준 문구를 터치 조작 기준으로 교체 */
(function(){
  'use strict';
  function isTouch(){
    try{
      return !!(window.matchMedia && matchMedia('(pointer: coarse)').matches);
    }catch(e){ return false; }
  }
  if (!isTouch()) return;
  document.documentElement.classList.add('bd-touch-mode');

  /* ① 하단 조작 힌트 바를 터치용으로 교체 */
  function swapHintBar(){
    try{
      var bar = document.getElementById('bd-keybar');
      if (!bar) return;
      var want = '👆 화면을 <b>누른 채 드래그</b>해 이동&nbsp;&nbsp;⌨️ <b>외장 키보드 이동</b>도 지원'
               + '&nbsp;&nbsp;💬 가까운 NPC를 <b>탭</b>하거나 <b>F</b>&nbsp;&nbsp;🎒 가방 버튼';
      if (bar.innerHTML !== want){ bar.innerHTML = want; bar.style.fontSize = '13px'; }
    }catch(e){}
  }
  setInterval(swapHintBar, 900);

  /* ② 대화 중 이동 안내 문구도 터치 기준으로 */
  setInterval(function(){
    try{
      var e = document.getElementById('bd-move-hint');
      if (e && !/탭/.test(e.textContent)) e.textContent = '💬 대화 중에는 움직일 수 없어요 — 화면을 탭해 넘겨 주세요';
    }catch(err){}
  }, 1200);

  /* ③ 튜토리얼·담이 안내의 키 표기를 터치 표기로 치환 */
  var MAP = [
    [/\bW\s*A\s*S\s*D\s*(키)?(로)?\s*(나|이나)?\s*(방향키)?(로)?/g, '조이스틱으로'],
    [/방향키(로)?/g, '조이스틱으로'],
    [/\bF\s*키(를)?\s*(눌러|누르면)/g, 'F 버튼을 눌러'],
    [/\bF\s*키/g, 'F 버튼'],
    [/\bE\s*키/g, '가방 버튼'],
    [/\bJ\s*키/g, '임무 버튼'],
    [/Space를/g, '화면 탭을'],
    [/Space(\s*키)?(로)?\s*(넘기기|넘겨)?/g, '화면 탭으로 넘기기'],
    [/\(ESC\)/g, ''],
    [/ESC(\s*키)?/g, '닫기 버튼'],
    [/클릭/g, '탭']
  ];
  function retouch(root){
    try{
      if (!root || !root.offsetParent) return;
      root.querySelectorAll('*').forEach(function(el){
        if (el.children.length) return;
        var t = el.textContent;
        if (!t || t.length > 120) return;
        var o = t;
        MAP.forEach(function(m){ t = t.replace(m[0], m[1]); });
        if (t !== o) el.textContent = t;
      });
    }catch(e){}
  }
  setInterval(function(){
    ['bd-tutorial','bd-dami','bd-guide-ov','bd-tip','bd-place-card'].forEach(function(id){
      retouch(document.getElementById(id));
    });
  }, 800);
})();
