
/* (v94) 저장 키 이원화 수리
   · 슬롯 저장(autoSave/슬롯)은 'fantasyRPG_save', 진행 저장(bdSave/bdLoad)은 'bongdam_guardian_v160'
     서로 다른 키를 써서, 이어하기를 해도 진행(소지금·정화·퀘스트)이 복원되지 않았다.
   · 두 저장을 양방향으로 이어 준다: 어느 쪽이 저장되든 상대 키에도 최신 진행을 반영. */
(function(){
  'use strict';
  var SLOT_KEY = 'fantasyRPG_save';
  var PROG_KEY = 'bongdam_guardian_v160';
  var busy = false;
  var origSet = localStorage.setItem.bind(localStorage);

  function j(s){ try{ return JSON.parse(s||'null'); }catch(e){ return null; } }

  localStorage.setItem = function(k, v){
    var res = origSet(k, v);
    if (busy) return res;
    try{
      busy = true;
      if (k === SLOT_KEY){
        // 슬롯 저장 → 진행 저장에도 최신 값 반영 (이어하기 시 복원되도록)
        var slot = j(v);
        var snap = slot && (slot.auto || slot['1'] || slot['2'] || slot['3']);
        if (snap){
          var prog = j(localStorage.getItem(PROG_KEY)) || {};
          ['gold','hp','stage','heroX','heroY','level','exp','expMax','points',
           'inventory','facility','savedAt','hero','charId','location'].forEach(function(f){
            if (typeof snap[f] !== 'undefined') prog[f] = snap[f];
          });
          origSet(PROG_KEY, JSON.stringify(prog));
        }
      } else if (k === PROG_KEY){
        // 진행 저장 → 슬롯의 auto 에도 반영 (슬롯 목록에서 최신으로 보이도록)
        var prog2 = j(v);
        if (prog2 && typeof prog2.gold !== 'undefined'){
          var slotAll = j(localStorage.getItem(SLOT_KEY)) || {};
          slotAll.auto = Object.assign({}, slotAll.auto || {}, {
            gold: prog2.gold, hp: prog2.hp, savedAt: prog2.savedAt || Date.now(), auto: true
          });
          origSet(SLOT_KEY, JSON.stringify(slotAll));
        }
      }
    }catch(e){}
    finally{ busy = false; }
    return res;
  };
})();
