
/* (v301) 태블릿 대응 — 리듬(방향키) 미니게임은 터치 입력이 전혀 없었다.
   터치 모드에서 #bd-mg-ddr 아래에 화살표 버튼 4개(52px)를 붙여
   키보드 이벤트로 변환한다 (러너는 document keydown 캡처를 그대로 수신).
   라이트 미니게임 안내문도 터치 표기로 바꾼다. */
(function(){
  'use strict';
  function isTouch(){ return document.documentElement.classList.contains('bd-touch-mode'); }
  var st = document.createElement('style');
  st.textContent = '#bd-ddr-touch{display:flex;gap:14px;justify-content:center;margin-top:12px;}'
    + '#bd-ddr-touch button{width:56px;height:56px;border-radius:14px;font-size:26px;'
    + 'background:rgba(20,32,54,.92);color:#ffd86b;border:2px solid rgba(255,216,107,.55);'
    + 'touch-action:manipulation;}'
    + '#bd-ddr-touch button:active{background:rgba(255,216,107,.25);}';
  document.head.appendChild(st);
  var KEYS = [['\u25C0','ArrowLeft'],['\u25BC','ArrowDown'],['\u25B2','ArrowUp'],['\u25B6','ArrowRight']];
  setInterval(function(){
    try{
      var ddr = document.getElementById('bd-mg-ddr');
      if (ddr && isTouch() && !ddr.querySelector('#bd-ddr-touch')){
        var row = document.createElement('div');
        row.id = 'bd-ddr-touch';
        KEYS.forEach(function(k){
          var b = document.createElement('button');
          b.type = 'button'; b.textContent = k[0];
          b.addEventListener('pointerdown', function(ev){
            ev.preventDefault();
            document.dispatchEvent(new KeyboardEvent('keydown', { key: k[1], bubbles: true, cancelable: true }));
          });
          row.appendChild(b);
        });
        ddr.appendChild(row);
      }
      if (isTouch()){
        var lt = document.querySelector('#bd-mg-light .lt-title');
        if (lt && /마우스로/.test(lt.textContent)) lt.textContent = '\uD83D\uDD26 손가락으로 어두운 곳을 비춰 위험을 찾아요';
        var lh = document.querySelector('#bd-mg-light .lt-hint');
        if (lh && /클릭/.test(lh.textContent)) lh.textContent = '밝아지면 탭!';
      }
    }catch(e){}
  }, 300);
})();
