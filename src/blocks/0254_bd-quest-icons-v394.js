/* (v394) 퀘스트 HUD 아이콘 진행도 — 초등학생도 «몇 개 했고 몇 개 남았는지» 그림으로.
   renderQuestHud(0053)는 클로저라 직접 못 감싼다 → .bd-obj 가 다시 그려질 때마다
   MutationObserver 로 «(2/3)» 숫자를 종류 아이콘 + ✔◻ 핍 줄로 바꿔 준다.
   need 가 9 이상이면 핍이 길어져 오히려 읽기 어려우니 숫자 표기를 유지한다. */
(function(){
  'use strict';

  function iconFor(text){
    if (/정화|조사/.test(text)) return '🔍';
    if (/대화|인사|말|이야기/.test(text)) return '💬';
    if (/방문|이동|가 보|들러|찾아가/.test(text)) return '🏛️';
    if (/스탬프|도장/.test(text)) return '🏅';
    if (/배지/.test(text)) return '🎖️';
    if (/구매|사 오|상점/.test(text)) return '🏪';
    return '⭐';
  }

  function decorate(obj){
    try{
      if (!obj || obj.querySelector('.bd-qi-row')) return;   /* 이미 변환됨 */
      var m = (obj.textContent||'').match(/^(.*?)\s*\((\d+)\s*\/\s*(\d+)\)\s*$/);
      if (!m) return;
      var label = m[1], cur = Math.min(+m[2], +m[3]), need = +m[3];
      if (!(need >= 1)) return;
      var pips = '';
      if (need <= 8){
        for (var i = 0; i < need; i++)
          pips += '<span style="' + (i < cur
            ? 'color:#8effa0;'
            : 'color:rgba(255,255,255,.28);') + 'font-size:14px;">' + (i < cur ? '✔' : '◻') + '</span>';
      } else {
        pips = '<b style="color:#ffd86b;">' + cur + ' / ' + need + '</b>';
      }
      obj.innerHTML = label
        + '<span class="bd-qi-row" style="display:flex;align-items:center;gap:3px;margin-top:3px;">'
        + '<span style="font-size:13px;">' + iconFor(label) + '</span>' + pips
        + (need <= 8 ? '<span style="margin-left:4px;font-size:10.5px;color:#9fb3d1;">' + cur + '/' + need + '</span>' : '')
        + '</span>';
    }catch(e){}
  }

  function arm(){
    var hud = document.getElementById('bd-quest-hud');
    if (!hud || hud.__bdQiV394) return;
    var obj = hud.querySelector('.bd-obj');
    if (!obj) return;
    hud.__bdQiV394 = true;
    new MutationObserver(function(){ decorate(obj); }).observe(obj, { childList:true, characterData:true, subtree:true });
    decorate(obj);
  }
  if (window.BD_addTick) BD_addTick(arm, 900); else setInterval(arm, 900);
})();
