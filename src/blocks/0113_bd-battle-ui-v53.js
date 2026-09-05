
/* (v53) 전투 정보 패널 안정화
   ① 적 체력 패널이 적 스프라이트 '머리 위' 배치라 화면 위로 밀려 이름이 잘리던 문제 → 화면 안으로 클램프
   ② 공격·피격 연출이 유닛(스프라이트)을 흔들 때 자식인 정보 패널까지 함께 움직이던 문제
      → 패널을 전투 루트로 옮겨(재부모화) 스프라이트 연출과 완전 분리 */
(function(){
  'use strict';
  function fixOne(unitId, place){
    var unit = document.getElementById(unitId); if (!unit) return;
    var info = unit.querySelector('.hsr-info'); if (!info) return;
    var battle = document.getElementById('hsr-battle'); if (!battle) return;
    if (info.__bdDetached) { place(info); return; }
    var r = info.getBoundingClientRect(), rb = battle.getBoundingClientRect();
    if (!info.id) info.id = 'bd-info-' + unitId;   // (v55) 재부모화 후에도 적/아군 info 식별
    battle.appendChild(info);
    info.style.position = 'absolute';
    info.style.zIndex = '30';
    info.style.margin = '0';
    // (v54) 재부모화로 '.hsr-unit .hsr-info' 스킨 셀렉터가 풀리는 문제 — 화이트 스킨 인라인 유지
    info.style.setProperty('background', '#fefdf9', 'important');
    info.style.setProperty('background-image', 'none', 'important');
    info.style.setProperty('border', '1px solid #e4ddcf', 'important');
    info.style.setProperty('border-radius', '14px', 'important');
    info.style.setProperty('box-shadow', '0 8px 22px rgba(0,0,0,0.25)', 'important');
    info.style.setProperty('color', '#3a2c18', 'important');
    info.querySelectorAll('*').forEach(function(el){
      try{ var cs = getComputedStyle(el); if (cs && parseInt(cs.fontSize) > 0) el.style.textShadow = 'none'; }catch(eS){}
    });
    info.__bdRect = { left: r.left - rb.left, top: r.top - rb.top, width: r.width };
    info.style.setProperty('width', Math.round(r.width) + 'px', 'important');   // (v54) 재부모화 후 폭 유지 (텍스트 줄바꿈·겹침 방지)
    info.style.boxSizing = 'border-box';
    // (v78) HP 바 색상 유지 — 색은 '.hsr-enemy .hsr-hpbar > i' 처럼 부모 클래스로 결정되는데
    //  재부모화로 그 문맥이 끊겨 주인공 바까지 적(빨강)으로 보이던 문제. 인라인으로 고정한다.
    try{
      var fill = info.querySelector('.hsr-hpbar > i');
      if (fill){
        var isEnemy = (unitId === 'hsr-u-enemy');
        fill.style.setProperty('background',
          isEnemy ? 'linear-gradient(90deg,#f87171,#dc2626)' : 'linear-gradient(90deg,#4ade80,#22c55e)',
          'important');
      }
    }catch(eHp){}
    info.__bdDetached = true;
    place(info);
  }
  /* (v53) 프롤로그 — 배지를 받은 뒤 '엘리베이터로 나가기' 단계에서 캐릭터 하단 추적 화살표 */
  function elevatorGuide(){
    try{
      var st = window.BD_PROGRESS && BD_PROGRESS.story;
      var in101 = (typeof currentStage !== 'undefined') && Number(currentStage) === 101;
      var flags = st && st.tutorialFlags;
      var cur = window.__bdNavOverride;
      // (v55) 배지를 아직 안 받았으면 '선생님에게 가기'부터 유도 — 첫 목표 안내 공백 해소
      // (v76) 대화·컷신·배지 연출 중에는 다음 목표 화살표를 띄우지 않는다
      var talking = false;
      try{
        var db = document.getElementById('dialogue-box');
        talking = !!(db && db.offsetHeight && parseFloat(getComputedStyle(db).opacity) > 0.05)
          || !!window.__bdSceneActive
          || !!(document.getElementById('bd-badge-ov') && document.getElementById('bd-badge-ov').offsetHeight);
      }catch(eTk){}
      var pre = !talking && in101 && flags && !flags.badgeGiven;
      var on  = !talking && in101 && flags && flags.badgeGiven && !st.badgeAwakened;
      if (talking && cur && cur.__ele){ window.__bdNavOverride = null; return; }
      if (pre){
        var t = (typeof STAGES !== 'undefined' && STAGES[101] && STAGES[101].objects || []).find(function(o){ return o && o._tut2npc; });
        if (t){
          // (v76) 소비부는 rx/ry/rw/rh 형식 — x/y로 넣어 (0,0)을 가리키던 버그 (v59와 동일 유형)
          if (!cur || cur.__ele) window.__bdNavOverride = {
            rx: (t.rx || 0), ry: (t.ry || 0), rw: (t.rw || 0.04), rh: (t.rh || 0.08),
            label: '선생님', __ele: true };
          return;
        }
      }
      if (on){
        // (v59) 화살표 소비부는 rx/ry/rw/rh 형식 — x/y로 넣어 (0,0)을 가리키던 버그 수정
        if (!cur || cur.__ele) window.__bdNavOverride = { rx: 0.688, ry: 0.080, rw: 0.024, rh: 0.020, label: '엘리베이터', __ele: true };
      } else if (cur && cur.__ele){
        window.__bdNavOverride = null;
      }
    }catch(e){}
  }
  function tick(){
    elevatorGuide();
    try{
      if (!(window.HSR && HSR.active)) return;
      fixOne('hsr-u-enemy', function(info){
        var r = info.__bdRect || { left: 0, top: 0 };
        info.style.left = 'auto';
        info.style.right = '18px';
        info.style.top = Math.max(12, r.top) + 'px';   // (v53) 화면 위 잘림 클램프
        info.style.bottom = 'auto';
      });
      fixOne('hsr-u-hero', function(info){
        var r = info.__bdRect || { left: 0, top: 0 };
        info.style.left = Math.max(8, r.left) + 'px';
        info.style.top = Math.max(12, r.top) + 'px';
        info.style.right = 'auto'; info.style.bottom = 'auto';
      });
    }catch(e){}
  }
  setInterval(tick, 250);
})();
