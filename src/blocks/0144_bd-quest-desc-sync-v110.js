
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
        /* (v400) 이름 집합이 원문과 같으면 원문의 서술 순서를 지킨다 — 짝 고정(hzTarget) 순서가 바뀌어도 «서연·순임 할머니·재이» 를 유지 */
        var cur = (q.desc.match(/주민\(([^)]*)\)/) || [])[1];
        if (cur && cur.split('·').length === uniq.length && uniq.every(function(n){ return cur.split('·').indexOf(n) >= 0; })) return;
        /* (v399e) 문장 전체를 1장 형식으로 덮지 않고 괄호 안 이름만 바꾼다 — 2~4장의 장별 서술(공원길·아이들이 다니는 거리·어두운 귀갓길)이 지워지던 문제 */
        var want = /주민\([^)]*\)/.test(q.desc)
          ? q.desc.replace(/주민\([^)]*\)/, '주민(' + uniq.join('·') + ')')
          : ('❗ 표시가 있는 ' + c.name + ' 주민(' + uniq.join('·') + ')에게 말을 걸어 '
             + '부탁을 듣고, 위험 요소를 정화해 주자. 해결하면 다시 찾아가 알려 주자.');
        if (q.desc !== want) q.desc = want;
      });
    }catch(e){}
  }
  setTimeout(sync, 2500);
  setInterval(sync, 3000);
})();
