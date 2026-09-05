
/* (v46) 전투 배경 10종 — 전투가 벌어진 '실제 위치'의 주변 지형·시설에 맞는 배경을 자동 선택.
   판정은 좌표 하드코딩이 아니라 근접 랜드마크·건물 라벨 기반이라, 에디터로 배치를 옮겨도 따라간다. */
(function(){
  'use strict';
  var BG = {"park": "data:image/webp;base64,@@B64:818b4091_park.webp@@", "school": "data:image/webp;base64,@@B64:611e2c89_school.webp@@", "stream": "data:image/webp;base64,@@B64:4e054b06_stream.webp@@", "alley": "data:image/webp;base64,@@B64:6c9de72d_alley.webp@@", "apart": "data:image/webp;base64,@@B64:785e8aa0_apart.webp@@", "busroad": "data:image/webp;base64,@@B64:a5ec968f_busroad.webp@@", "plaza": "data:image/webp;base64,@@B64:554f6c4a_plaza.webp@@", "overpass": "data:image/webp;base64,@@B64:079011a0_overpass.webp@@", "hill": "data:image/webp;base64,@@B64:83c199ea_hill.webp@@", "sports": "data:image/webp;base64,@@B64:765cbbff_sports.webp@@"};
  var STAGE_DEFAULT = { 212:'busroad', 213:'busroad', 211:'busroad', 210:'hill', 1:'school', 2:'school', 3:'stream', 4:'alley', 5:'hill' };

  function battlePos(){
    try{
      var o = window.BD && BD._pendingHazard && BD._pendingHazard.obj;
      if (o && isFinite(o.rx)) return { x: (o.rx||0)+(o.rw||0)/2, y: (o.ry||0)+(o.rh||0)/2 };
    }catch(e){}
    return { x: (typeof heroX!=='undefined'?heroX:0.5), y: (typeof heroY!=='undefined'?heroY:0.5) };
  }
  function isBossBattle(){
    try{
      var o = BD._pendingHazard && BD._pendingHazard.obj;
      return !!(o && (o.isBoss || /쌓여있던/.test(o.label||'')));
    }catch(e){ return false; }
  }
  function nearInfo(sid, p){
    var st = (typeof STAGES!=='undefined') && STAGES[sid]; if (!st) return null;
    var pool = (st.objects||[]).concat(st.__v24Landmarks||[]);
    var best = null, bd = 0.17;
    pool.forEach(function(o){
      if (!o) return;
      var tag = null;
      var fid = String(o.facilityId||''), lb = String(o.label||'');
      if (fid || /도서관|문화|캠퍼스|센터|체육|공원|약국|문구|마트|슈퍼|아파트|주택|정류장/.test(lb)){
        if (/sports|체육/.test(fid+lb)) tag = 'sports';
        else if (/eco|생태|하천/.test(fid+lb)) tag = 'stream';
        else if (/park|공원/.test(fid+lb)) tag = 'park';
        else if (/pharmacy|약국|문구|마트|슈퍼|상가/.test(fid+lb)) tag = 'alley';
        else if (/아파트|주택|단지/.test(lb)) tag = 'apart';
        else if (/정류장/.test(lb)) tag = 'busroad';
        else if (/library|culture|campus|center|도서관|문화|캠퍼스|센터/.test(fid+lb)) tag = 'plaza';
      }
      if (!tag) return;
      // (v46b) 사각형까지의 거리 기준 — 대형 건물(아파트·문화의집)도 '건물 앞'이면 정확히 잡힌다
      var dx = Math.max((o.rx||0) - p.x, 0, p.x - ((o.rx||0)+(o.rw||0)));
      var dy = Math.max((o.ry||0) - p.y, 0, p.y - ((o.ry||0)+(o.rh||0)));
      var d = Math.hypot(dx, dy);
      var lim = (tag === 'apart') ? 0.055 : 0.12;   // 주거는 건물 코앞만
      if (d > lim) return;
      if (d < bd){ bd = d; best = tag; }
    });
    return best;
  }
  function pickKey(){
    var sid = Number(typeof currentStage!=='undefined' ? currentStage : -1);
    if (isBossBattle()) return 'apart';                        // 최종 보스 = 아파트 단지 앞 (배치 기준)
    var p = battlePos();
    var near = nearInfo(sid, p);
    if (near === 'apart' && sid === 210) near = 'hill';   // (v46b) 수영리 주택은 저층 언덕 주택가 그림이 맞다
    if (near) return near;
    return STAGE_DEFAULT[sid] || 'busroad';
  }
  window.BD_pickBattleBg = pickKey;   // 진단·검증용

  var appliedFor = null;   // 전투 세션당 1회 적용
  function tick(){
    try{
      var active = window.HSR && HSR.active;
      var el = document.getElementById('hsr-arena') || document.getElementById('hsr-battle');
      if (!el) return;
      if (!active){ appliedFor = null; return; }
      if (appliedFor === el.__bdBgKey && el.__bdBgKey) return;
      var key = pickKey();
      var url = BG[key] || BG.busroad;
      el.style.backgroundImage = 'linear-gradient(rgba(8,12,20,0.30), rgba(8,12,20,0.52)), url("' + url + '")';
      el.style.backgroundSize = 'cover';
      el.style.backgroundPosition = 'center center';
      // (v68) 실사 배경일 때는 기본 지면·언덕 장식을 끈다 — 장식이 하단을 덮어
      //  배경이 화면 위쪽만 차지하는 것처럼 보이던 문제
      try{ document.body.classList.add('bd-battle-photo-bg'); }catch(ePB){}
      el.__bdBgKey = key; appliedFor = key;
    }catch(e){}
  }
  setInterval(tick, 300);
})();
