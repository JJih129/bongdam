
/* (v80) ① 상호작용 가능 대상 반짝임 ② 시설 정보 모두 열람 시 보상 ③ 동화리 재현 위치 보정 */
(function(){
  'use strict';

  /* ── ③ 재현은 낙서 벽보다 위쪽에 서야 자연스럽다 (겹쳐 보이던 문제) ── */
  var fixed = false;
  setInterval(function(){
    try{
      if (fixed) return;
      var st = STAGES[211]; if (!st) return;
      var j = (st.objects||[]).find(function(o){ return o && o.npcName==='재현'; });
      var g = (st.objects||[]).find(function(o){ return o && o.hazardVariant==='graffiti'; });
      if (!j || !g) return;
      if (j.__bdMoved) { fixed = true; return; }
      // 낙서 벽 바로 위(살짝 오른쪽)로 — 벽을 등지고 선 구도
      j.rx = g.rx + (g.rw||0.05) * 0.75;
      j.ry = g.ry - (j.rh||0.06) * 0.35;
      if (j.cx != null){ j.cx = j.rx; j.cy = j.ry; }
      j.__bdMoved = true; fixed = true;
    }catch(e){}
  }, 1200);

  /* ── ① 상호작용 가능 범위에 들어온 대상 반짝임 ── */
  function radius(){ return (typeof HERO_WR !== 'undefined' ? HERO_WR : 0.022) * 2 * 1.2; }
  window.BD_interactGlowTarget = function(){
    try{
      var st = STAGES[Number(currentStage)];
      if (!st || (window.HSR && HSR.active)) return null;
      var R = radius(), best = null, bd = 1e9;
      (st.objects||[]).forEach(function(o){
        if (!o || o.hidden) return;
        var ok = (o.interactable==='shop' || o.interactable==='facility' ||
                  /문화의집|도서관|약국|편의점|마트|문구/.test(String(o.label||'')));
        if (!ok) return;
        var inX = heroX >= (o.rx||0) - R && heroX <= (o.rx||0) + (o.rw||0) + R;
        var dy  = heroY - ((o.ry||0) + (o.rh||0));
        if (!(inX && dy >= -0.02 && dy < R * 2.6)) return;
        var d = Math.abs(dy);
        if (d < bd){ bd = d; best = o; }
      });
      return best;
    }catch(e){ return null; }
  };
  /* 캔버스 위에 은은한 반짝임 오버레이 (원형 표시는 혼잡하므로 건물 테두리 발광) */
  (function glow(){
    var el = null;
    function ensure(){
      if (el) return el;
      el = document.createElement('div');
      el.id = 'bd-interact-glow';
      el.style.cssText = 'position:fixed;pointer-events:none;z-index:36;border-radius:14px;'
        + 'box-shadow:0 0 0 3px rgba(255,224,130,.85), 0 0 26px 6px rgba(255,214,90,.45);'
        + 'opacity:0;transition:opacity .18s ease;';
      document.body.appendChild(el);
      return el;
    }
    setInterval(function(){
      try{
        var e = ensure();
        var o = BD_interactGlowTarget();
        var cv = document.getElementById('game-canvas');
        if (!o || !cv){ e.style.opacity = '0'; return; }
        /* (v368) 좌표 변환을 BD_screenRectOfWorld(카메라·줌·DPR 정합, CSS px)로 — toScreenX/Y 는 캔버스 백버퍼 px 라
           고DPI(모바일 dpr 2)·UI 배율에서 테두리가 건물 안쪽/엉뚱한 곳에 그려졌다 (QA ISSUE-04 파출소 강조 위치) */
        var wr = (typeof window.BD_screenRectOfWorld === 'function')
          ? BD_screenRectOfWorld(Number(o.rx||0), Number(o.ry||0), Number(o.rw||0.04), Number(o.rh||0.04)) : null;
        var z = 1; try{ z = parseFloat(getComputedStyle(document.body).zoom) || 1; if (!(z > 0)) z = 1; }catch(eZ){}   /* (v369) UI 배율 보정 */
        if (wr){
          e.style.left = (wr.left / z) + 'px'; e.style.top = (wr.top / z) + 'px';
          e.style.width = Math.max(20, wr.width / z) + 'px'; e.style.height = Math.max(20, wr.height / z) + 'px';
        } else {
          var rc = cv.getBoundingClientRect(), dpr = (cv.width && rc.width) ? (cv.width / rc.width) : 1;
          var x1 = toScreenX(o.rx, cv) / dpr, x2 = toScreenX(o.rx + (o.rw||0), cv) / dpr;
          var y1 = toScreenY(o.ry, cv) / dpr, y2 = toScreenY(o.ry + (o.rh||0), cv) / dpr;
          e.style.left = (rc.left + Math.min(x1,x2)) + 'px';
          e.style.top  = (rc.top  + Math.min(y1,y2)) + 'px';
          e.style.width  = Math.max(20, Math.abs(x2-x1)) + 'px';
          e.style.height = Math.max(20, Math.abs(y2-y1)) + 'px';
        }
        e.style.opacity = (0.55 + 0.45*Math.abs(Math.sin(Date.now()/520))).toFixed(2);
      }catch(err){}
    }, 180);
  })();

  /* ── ② 시설 안내를 모두 읽으면 보상 ── */
  var REWARD_KEY = 'bd_facility_all_read_v80';
  function readCount(){
    try{ var f = BD_PROGRESS && BD_PROGRESS.facility;
      return f ? ((f.readFacilityGuideIds||[]).length) : 0; }catch(e){ return 0; }
  }
  function totalFacilities(){
    try{
      var n = 0;
      [212,213,211,210].forEach(function(sid){
        var st = STAGES[sid]; if (!st) return;
        n += ((st.__v24Landmarks||[]).filter(function(o){ return o && o.facilityId; }).length);
      });
      return n;
    }catch(e){ return 0; }
  }
  setInterval(function(){
    try{
      if (localStorage.getItem(REWARD_KEY) === '1') return;
      var tot = totalFacilities(); if (!tot) return;
      var read = readCount();
      if (read < tot) return;
      localStorage.setItem(REWARD_KEY, '1');
      try{ if (typeof playerGold !== 'undefined') playerGold += 500; }catch(e1){}
      // (v80a) 최대 체력은 고정값이라 대신 '체력 완전 회복 + 회복 아이템'으로 보상
      try{ if (typeof heroHP !== 'undefined'){ heroHP = (typeof getMaxHP==='function')?getMaxHP():100; if (window.BD_syncHP) BD_syncHP(heroHP, true); } }catch(e2){}
      try{ BD.items = BD.items||{}; BD.items.potion = (BD.items.potion||0) + 3; BD.items.snack = (BD.items.snack||0) + 3; }catch(e2b){}
      try{ if (window.BD_addSafetyXP) BD_addSafetyXP(40); }catch(e3){}
      try{ if (typeof bdSave === 'function') bdSave(); }catch(e4){}
      if (typeof showDialog === 'function'){
        showDialog('담이', [
          '봉담의 시설 안내를 전부 읽었어요! 이제 어디에 뭐가 있는지 다 알겠죠?',
          '지역을 잘 아는 지킴이에게 주는 선물이에요 — 소지금 +500G, 회복약 3개, 간식 3개, 안전도 경험치 +40! 체력도 가득 채웠어요.'
        ]);
      }
      try{ bdToast('🏅 시설 안내 완독 보상! +500G · 회복약 3 · 간식 3 · 안전도 경험치 +40', 5200); }catch(e5){}
    }catch(e){}
  }, 2000);
})();
