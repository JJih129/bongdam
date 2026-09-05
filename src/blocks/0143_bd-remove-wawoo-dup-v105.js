
/* (v105) 와우리(212)의 재현·재이 제거
   두 인물은 사용자가 복사해 다른 리로 옮긴 배치만 사용한다.
   와우리 원본 배치를 지워 중복 등장·중복 부탁을 없앤다. */
(function(){
  'use strict';
  var TARGET = ['bdnpc_jaehyun', 'bdnpc_jaei'];
  var NAMES  = ['재현', '재이'];
  /* (v110) 올바른 방법으로 교체 —
     NPC 재생성 코드는 st.deletedSysIds(삭제 툼스톤)를 이미 존중하도록 설계돼 있다.
     매 프레임 지우고 되살아나는 싸움 대신, 툼스톤에 등록해 애초에 다시 만들지 않게 한다. */
  function tombstone(){
    try{
      var st = STAGES && STAGES[212]; if (!st) return;
      if (!Array.isArray(st.deletedSysIds)) st.deletedSysIds = [];
      TARGET.forEach(function(id){
        if (st.deletedSysIds.indexOf(id) < 0) st.deletedSysIds.push(id);
      });
    }catch(e){}
  }
  tombstone();
  setInterval(tombstone, 2000);

  function purge(){
    try{
      tombstone();
      var st = STAGES && STAGES[212]; if (!st || !st.objects) return;
      for (var i = st.objects.length - 1; i >= 0; i--){
        var o = st.objects[i];
        if (!o || !o.resident) continue;
        var byId = o._editorId && TARGET.indexOf(o._editorId) >= 0;
        var byName = NAMES.indexOf(o.npcName) >= 0;
        if (byId || byName) st.objects.splice(i, 1);
      }
    }catch(e){}
  }
  /* (v105a) 런타임만 지우면 저장 데이터가 계속 되살린다 —
     에디터 저장본(localStorage)과 구운 원본에서도 함께 제거해 재삽입 자체를 막는다. */
  function purgeStore(){
    try{
      var KEY = 'bongdam_rpg_editor_data_v5_2_quest';
      var raw = localStorage.getItem(KEY); if (!raw) return;
      var d = JSON.parse(raw);
      var st = d && d.stages && d.stages['212'];
      if (!st || !st.objects) return;
      var before = st.objects.length;
      st.objects = st.objects.filter(function(o){
        if (!o || !o.resident) return true;
        var byId = o._editorId && TARGET.indexOf(o._editorId) >= 0;
        var byName = NAMES.indexOf(o.npcName) >= 0;
        return !(byId || byName);
      });
      if (st.objects.length !== before) localStorage.setItem(KEY, JSON.stringify(d));
    }catch(e){}
  }
  purgeStore();
  setTimeout(purgeStore, 2500);
  setInterval(purgeStore, 5000);

  purge();
  setTimeout(purge, 800);
  setTimeout(purge, 2000);
  setTimeout(purge, 5000);
  setTimeout(purge, 9000);
  setInterval(purge, 700);    // 저장 데이터가 주기적으로 재적용돼 되살아나므로 짧은 주기로 유지
})();
