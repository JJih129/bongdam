
/* (v110) 임무 설명의 주민 이름 하드코딩 해소
   원본은 "와우리 주민(은지·세아·재현)"처럼 이름을 직접 적어 두었는데,
   배치를 바꾸면(예: 와우리에서 재현·재이 제거) 설명과 실제가 어긋난다.
   → 실제로 부탁을 주는 주민 목록으로 설명을 자동 갱신한다. (원문 형식은 그대로 유지) */
(function(){
  'use strict';
  var CH = { ch1:{ sid:212, name:'와우리' }, ch2:{ sid:213, name:'상리' },
             ch3:{ sid:211, name:'동화리' }, ch4:{ sid:210, name:'수영리' } };
  function quests(){ return window.QUESTS || window.BD_QUESTS; }
  function sync(){
    try{
      var Q = quests(); if (!Q || typeof STAGES === 'undefined') return;
      Object.keys(CH).forEach(function(qid){
        var c = CH[qid];
        var q = Q.find(function(x){ return x && x.id === qid; });
        if (!q || !q.desc) return;
        var names = [];
        try{
          names = (window.BD_hzQuestMap ? BD_hzQuestMap(c.sid) : []).map(function(m){ return m.npc; });
        }catch(e){}
        if (!names.length) return;
        var uniq = names.filter(function(v,i,a){ return a.indexOf(v)===i; });
        var want = '❗ 표시가 있는 ' + c.name + ' 주민(' + uniq.join('·') + ')에게 말을 걸어 '
                 + '부탁을 듣고, 위험 요소를 정화해 주자. 해결하면 다시 찾아가 알려 주자.';
        if (q.desc !== want) q.desc = want;
      });
    }catch(e){}
  }
  setTimeout(sync, 2500);
  setInterval(sync, 3000);
})();
