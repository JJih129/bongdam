
// ── (v193) 새 심부름 퀘스트 캐치업 ──
// 이미 해당 장을 지난 세이브에서도 새로 추가된 주민 심부름(준호·영자·순임)이
// 배지 통신으로 도착하도록, 로드 후 진행도를 확인해 시간차를 두고 수락 처리한다.
(function(){
  function bdV193Catchup(){
    try{
      if(!window.BD || typeof BD.questIdx !== 'number' || typeof window.BD_acceptQuest !== 'function') return;
      const pending = [];
      if(BD.questIdx >= 1) pending.push('npc_junho');
      if(BD.questIdx >= 2) pending.push('npc_yeongja');
      if(BD.questIdx >= 3) pending.push('npc_sunim');
      pending.forEach(function(qid, i){
        setTimeout(function(){ try{ window.BD_acceptQuest(qid); }catch(e){} }, i * 2600);
      });
    }catch(e){}
  }
  if(document.readyState === 'complete') setTimeout(bdV193Catchup, 5000);
  else window.addEventListener('load', function(){ setTimeout(bdV193Catchup, 5000); });
})();
