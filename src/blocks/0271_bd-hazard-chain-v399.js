/* bd-hazard-chain-v399 — BD_hazardInteract 래퍼 5겹을 한 곳에서 «정해진 순서»로 설치한다.
 *
 * 종전: 0202(v340 마지막 위험요소 기록) · 0219(v356 무반응 재시도) · 0230(v366 오프닝 대사 폐기) ·
 *       0240(v375 전투 이중 진입 차단) · 0250(v388 튜토 게이트)이 각자 300ms 프로브로 감쌌다.
 *       설치 순서 = 프로브가 도는 순서라 코드 어디에도 적혀 있지 않았다. 0240·0250 은 파싱 시점에 즉시(동기)
 *       설치되고 나머지 셋은 300ms 뒤 등록 순으로 설치되므로, 실제 체인은
 *         (바깥 → 안)  0230 폐기 → 0219 재시도 → 0202 기록 → 0250 게이트 → 0240 이중진입 → 0053 원본
 *       이었다. 이 블록은 그 순서를 그대로 한 함수로 옮긴다 — 동작은 같고, 순서가 코드에 적혀 있다.
 *
 * 되돌리기: 이 블록을 지우고 다섯 블록의 «(v399) 0271 체인으로 이관» 자리에 원래 래퍼를 복원한다(git).
 */
(function(){
  'use strict';
  function install(){
    var base = window.BD_hazardInteract;
    if (typeof base !== 'function' || base.__v399chain) return false;

    /* 안쪽 체인: 0202 기록 → 0250 튜토 게이트 → 0240 이중 진입 차단 → 원본 */
    function inner(self, args){
      var obj = args[0];
      try{ if (obj && obj.hazardId) window.__bdLastHz = obj; }catch(e){}                                  /* v340 */
      try{                                                                                              /* v388 — 보스는 자체 개방 조건이 있어 제외 */
        if (!(window.HSR && HSR.active) && obj && !obj.isBoss && window.BD_TUTGATE
            && !window.BD_TUTGATE.allowAction('hazard')){
          window.BD_TUTGATE.nudgeAction('hazard');
          return true;                                            /* 입력을 소비 — 조사창을 열지 않는다 */
        }
      }catch(e){}
      try{                                                                                              /* v375 */
        if (window.HSR && HSR.active) return true;                /* 전투 중 — 무시 */
        var t = Number(window.__bdInvestAt || 0);
        if (t && Date.now() - t < 6000) return true;             /* 「조사한다」 확정 뒤 전투 대기 중 — 무시 */
      }catch(e){}
      return base.apply(self, args);
    }

    window.BD_hazardInteract = function(obj){
      try{ if (window.__bdDamiOpeningBusy) window.__bdDamiCancelLines = true; }catch(e){}                /* v366 */
      var self = this, args = arguments;
      var r = inner(self, args);
      try{                                                                                              /* v356 무반응 자가치유 */
        var oid = obj && obj.hazardId;
        if (oid && !window.__bd356Retry){
          setTimeout(function(){
            try{
              if (window.HSR && HSR.active) return;
              var d = document.getElementById('dialogue-box');
              if (d && d.getBoundingClientRect().height > 0) return;
              if (window.__bdChoiceState && __bdChoiceState.open) return;
              if (document.querySelector('.bd-modal.show')) return;
              if (window.BD && BD.purified && BD.purified[oid]) return;
              /* 아무 반응 없음 — 잔여 잠금 해제 후 1회 재시도 (재시도도 게이트·이중진입 검사를 지난다) */
              window.__bdDamiOpeningBusy = false;
              window.__bd356Retry = true;
              try{ console.info('[v356] 조사 무반응 감지 — 잠금 해제 후 재시도(' + oid + ')'); }catch(eL){}
              try{ inner(null, [obj]); }catch(eR){}
              setTimeout(function(){ window.__bd356Retry = false; }, 1500);
            }catch(eT){}
          }, 900);
        }
      }catch(eW){}
      return r;
    };
    var w = window.BD_hazardInteract;
    w.__v399chain = true;
    /* 옛 마커도 켜 둔다 — «이미 감쌌는가»를 이 이름으로 확인하는 코드가 남아 있어도 이중 설치가 없게 */
    w.__v340 = w.__v356 = w.__v366 = w.__v375 = w.__tutgate388 = true;
    return true;
  }
  if (!install()){ var iv = setInterval(function(){ if (install()) clearInterval(iv); }, 300); }
})();
