
/* ══════════════════════════════════════════════════════════════
   (v147) ① 시설을 이용해도 «방문»으로 기록되지 않던 문제
          ② 문화의집 안에서는 체력이 천천히 회복
          ③ 최종 보스 그림(👑 이모지 대체) 자체 제작
          ④ 터치 기기 안내 문구 치환이 동작하지 않던 문제
          ⑤ 멀리 있을 때도 남던 안내 말풍선 잔상 정리
   ══════════════════════════════════════════════════════════════ */
(function(){
  'use strict';

  function onScreen(e){
    try{
      if (!e) return false;
      var cs = getComputedStyle(e);
      if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity < 0.05) return false;
      var r = e.getBoundingClientRect();
      return r.width > 2 && r.height > 2;
    }catch(err){ return false; }
  }

  /* ───────── ① 시설 방문·스탬프 기록 ─────────
     완주해도 결과 리포트의 「방문한 시설」이 0/9 이었다.
     장소 카드를 띄우는 경로에서만 기록하고 있어서,
     휴식(F)·건물 진입으로 «실제로 이용»해도 아무것도 남지 않았다.
     (같은 이유로 v80 의 «시설 안내 전부 열람 보상»도 영영 발동하지 않았다) */
  function defs(){
    try{ return (window.BD_REGISTRY && BD_REGISTRY.FACILITY_DEFINITIONS) || null; }catch(e){ return null; }
  }
  function norm(s){ return String(s||'').replace(/[\s·・\-]/g,''); }

  /** 오브젝트 라벨 → 시설 정의 id */
  function facilityIdOf(o){
    try{
      if (!o) return null;
      if (Array.isArray(o.facilityIds) && o.facilityIds.length) return o.facilityIds[0];
      var D = defs(); if (!D) return null;
      var lab = norm(o.label);
      if (!lab) return null;
      var hit = null;
      Object.keys(D).forEach(function(k){
        if (hit) return;
        var f = D[k];
        var a = norm(f.displayName), b = norm(f.officialName);
        if ((a && (lab.indexOf(a) >= 0 || a.indexOf(lab) >= 0)) ||
            (b && (lab.indexOf(b) >= 0 || b.indexOf(lab) >= 0))) hit = k;
      });
      return hit;
    }catch(e){ return null; }
  }

  function credit(fid, why){
    try{
      if (!fid || !window.BD_PROGRESS) return false;
      var fp = BD_PROGRESS.facility; if (!fp) return false;
      var fresh = false;
      if (fp.visitedFacilityIds.indexOf(fid) < 0){ fp.visitedFacilityIds.push(fid); fresh = true; }
      if (fp.readFacilityGuideIds.indexOf(fid) < 0){ fp.readFacilityGuideIds.push(fid); fresh = true; }
      var stamped = false;
      try{ stamped = !!(window.BD_Facility && BD_Facility.grantStamp(fid)); }catch(e){}
      if (fresh || stamped){
        try{ if (typeof autoSave === 'function') autoSave('시설 이용 — ' + (why||'')); }catch(e){}
        try{
          var D = defs(), nm = (D && D[fid] && D[fid].displayName) || '시설';
          if (!stamped && window.BD_toast) BD_toast('📍 「' + nm + '」 방문 기록 — 장소수첩에 남겼어요');
        }catch(e){}
      }
      return fresh || stamped;
    }catch(e){ return false; }
  }
  window.BD_creditFacility = credit;

  /** 지금 가까이 있는 시설 오브젝트 */
  function nearFacility(lim){
    try{
      var st = STAGES[Number(currentStage)]; if (!st) return null;
      var best = null, bd = (lim || 0.14);
      (st.objects||[]).forEach(function(o){
        if (!o || o.hidden) return;
        var fid = facilityIdOf(o); if (!fid) return;
        var x0 = (o.rx||0), y0 = (o.ry||0);
        var x1 = x0 + (o.rw||0.05), y1 = y0 + (o.rh||0.05);
        var dx = Math.max(x0 - heroX, 0, heroX - x1);
        var dy = Math.max(y0 - heroY, 0, heroY - y1);
        var d = Math.sqrt(dx*dx + dy*dy);
        if (d < bd){ bd = d; best = { fid: fid, obj: o }; }
      });
      return best;
    }catch(e){ return null; }
  }

  /* 휴식·이용 대사가 뜨면 그 시설을 방문으로 기록한다 */
  var lastLine = '';
  setInterval(function(){
    try{
      var b = document.getElementById('dialogue-box');
      if (!onScreen(b)) return;
      var t = (b.textContent || '').replace(/\s+/g,' ').trim();
      if (!t || t === lastLine) return;
      lastLine = t;
      if (!/휴식|쉬었|회복됐|숨을 돌|물 한 잔/.test(t)) return;
      var n = nearFacility(0.2);
      if (n) credit(n.fid, '휴식');
    }catch(e){}
  }, 500);

  /* 실내(문화의집 3층)에 들어오면 그 시설을 방문으로 기록 */
  var lastStage = null;
  setInterval(function(){
    try{
      if (typeof currentStage === 'undefined') return;
      var sid = Number(currentStage);
      if (sid === lastStage) return;
      lastStage = sid;
      if (sid === 101 || sid === 201) credit('facility_youth_house', '문화의집 진입');
    }catch(e){}
  }, 600);

  /* ───────── ② 문화의집 안에서는 체력이 천천히 회복 ─────────
     "들어가 있으면 HP가 조금씩 차오른다" — 쉬어 가는 공간이라는 성격을 살린다. */
  setInterval(function(){
    try{
      if (typeof currentStage === 'undefined' || typeof heroHP === 'undefined') return;
      var st = STAGES[Number(currentStage)];
      if (!st || !st.interior) return;
      if (window.HSR && window.HSR.active) return;
      var max = (typeof getMaxHP === 'function') ? getMaxHP() : ((window.BD && BD.maxHp) || 100);
      if (heroHP >= max) return;
      heroHP = Math.min(max, heroHP + 1);
      try{ if (typeof window.BD_syncHP === 'function') window.BD_syncHP(heroHP, false); }catch(e){}
      if (heroHP >= max){
        try{ if (window.BD_toast) BD_toast('💚 문화의집에서 푹 쉬어 체력이 가득 찼어요'); }catch(e){}
      }
    }catch(e){}
  }, 1500);

  /* ───────── ③ 최종 보스 그림 ─────────
     전용 스프라이트가 없어 노란 👑 이모지로 대체되고 있었다.
     «버려진 것들이 모여서 생긴 덩어리»라는 설정에 맞춰 직접 그려 넣는다. */
  function makeBossSprite(){
    try{
      var S = 256;
      var c = document.createElement('canvas'); c.width = S; c.height = S;
      var g = c.getContext('2d');
      // 바닥 그림자
      g.fillStyle = 'rgba(20,6,32,.45)';
      g.beginPath(); g.ellipse(S/2, S*0.86, S*0.36, S*0.09, 0, 0, Math.PI*2); g.fill();
      // 검은 봉지 덩어리 3겹
      function blob(cx, cy, rx, ry, c1, c2){
        var grd = g.createRadialGradient(cx - rx*0.3, cy - ry*0.4, rx*0.15, cx, cy, rx);
        grd.addColorStop(0, c1); grd.addColorStop(1, c2);
        g.fillStyle = grd;
        g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, Math.PI*2); g.fill();
      }
      blob(S*0.32, S*0.66, S*0.22, S*0.19, '#4a4453', '#17141f');
      blob(S*0.70, S*0.68, S*0.21, S*0.18, '#443f4e', '#141119');
      blob(S*0.50, S*0.47, S*0.30, S*0.27, '#565064', '#1b1725');
      // 삐져나온 조각들 (유리·캔·종이)
      g.strokeStyle = 'rgba(190,200,215,.55)'; g.lineWidth = 4; g.lineCap = 'round';
      [[0.30,0.40,0.22,0.30],[0.72,0.44,0.80,0.34],[0.55,0.28,0.62,0.18],[0.40,0.72,0.32,0.80]]
        .forEach(function(p){
          g.beginPath(); g.moveTo(S*p[0], S*p[1]); g.lineTo(S*p[2], S*p[3]); g.stroke();
        });
      // 보라 오라
      var au = g.createRadialGradient(S/2, S*0.5, S*0.18, S/2, S*0.5, S*0.48);
      au.addColorStop(0, 'rgba(168,85,247,.0)');
      au.addColorStop(0.75, 'rgba(168,85,247,.22)');
      au.addColorStop(1, 'rgba(88,28,135,0)');
      g.fillStyle = au; g.fillRect(0, 0, S, S);
      // 눈
      function eye(cx, cy, r){
        var e = g.createRadialGradient(cx, cy, 1, cx, cy, r);
        e.addColorStop(0, '#fff6b0'); e.addColorStop(0.45, '#ffb020'); e.addColorStop(1, 'rgba(255,80,0,0)');
        g.fillStyle = e; g.beginPath(); g.arc(cx, cy, r, 0, Math.PI*2); g.fill();
      }
      eye(S*0.42, S*0.45, S*0.045);
      eye(S*0.60, S*0.45, S*0.045);
      return c.toDataURL('image/png');
    }catch(e){ return null; }
  }
  function installBossSprite(){
    try{
      if (!window.BD_ASSETS) return false;
      if (!BD_ASSETS.has('field.hazard.final_boss')){
        var url = makeBossSprite();
        if (!url) return false;
        BD_ASSETS.set('field.hazard.final_boss', url);
      }
      var done = false;
      Object.keys(STAGES || {}).forEach(function(sid){
        var st = STAGES[sid]; if (!st || !st.objects) return;
        st.objects.forEach(function(o){
          if (o && o.isBoss && !o.hazardVariant){ o.hazardVariant = 'final_boss'; done = true; }
        });
      });
      return done;
    }catch(e){ return false; }
  }
  installBossSprite();
  setTimeout(installBossSprite, 2000);
  setInterval(installBossSprite, 6000);

  /* ───────── ④ 터치 기기 안내 문구 치환 복구 ─────────
     v82 의 치환기는 root.offsetParent 로 표시 여부를 판정했다.
     안내 카드들은 position:fixed 라 offsetParent 가 항상 null —
     즉 «터치용 문구 치환»이 한 번도 실행되지 않았다. */
  var TOUCH = (function(){
    try{ return !!(window.matchMedia && matchMedia('(pointer: coarse)').matches); }catch(e){ return false; }
  })();
  if (TOUCH){
    var MAP = [
      [/\bW\s*A\s*S\s*D\s*(키)?(로)?\s*(나|이나)?\s*(방향키)?(로)?/g, '조이스틱으로'],
      [/방향키(로)?/g, '조이스틱으로'],
      [/\bF\s*키(를)?\s*(눌러|누르면)/g, '조사 버튼을 눌러'],
      [/\bF\s*키/g, '조사 버튼'],
      [/\[F\]/g, '[조사]'],
      [/\bE\s*키/g, '가방 버튼'],
      [/\bJ\s*키/g, '임무 버튼'],
      [/\bI\s*로/g, '가방 버튼으로'],
      [/Space를/g, '화면 탭을'],
      [/Space\s*(키)?(로)?/g, '화면 탭으로'],
      [/\(ESC\)/g, ''],
      [/ESC\s*(키)?/g, '닫기 버튼'],
      [/클릭/g, '탭']
    ];
    var IDS = ['bd-tut-card','bd-dami-hud','bd-dami-field-bubble','bd-place-card',
               'bd-tutorial','bd-guide-ov','bd-tip','bd-keybar','bd-quest-hud','bd-move-hint'];
    function retouch(root){
      try{
        if (!onScreen(root)) return;
        root.querySelectorAll('*').forEach(function(el){
          if (el.children.length) return;
          var t = el.textContent;
          if (!t || t.length > 160) return;
          var o = t;
          MAP.forEach(function(m){ t = t.replace(m[0], m[1]); });
          if (t !== o) el.textContent = t;
        });
      }catch(e){}
    }
    /* 튜토리얼 카드는 W·A·S·D 를 각각 «키캡 상자»로 나눠 그린다.
       그래서 글자 단위 치환으로는 «WASD» 라는 낱말을 잡을 수 없었다.
       카드 전체 문장을 보고 통째로 바꿔 준다. */
    var WHOLE = [
      [/WASD.*움직여.*대화는/, '👆 화면을 누른 채 드래그해서 움직여 보세요  ·  💬 화면을 탭하면 대사가 넘어가요'],
      [/WASD.*움직여/, '👆 화면을 누른 채 드래그해서 움직여 보세요'],
      [/대화는.*넘겨요/, '💬 화면을 탭하면 대사가 넘어가요'],
      [/안내데스크.*말을 걸/, '👆 안내데스크 앞에서 [조사] 버튼을 눌러요'],
      [/가방을 열어/, '🎒 [가방] 버튼을 눌러 배지를 확인해요'],
      [/엘리베이터로 걸어가/, '🛗 위쪽 엘리베이터로 걸어가요'],
      [/정화 스티커.*Q/, '✨ [정화] 버튼으로 위험 요소를 정화해요']
    ];
    function retouchWhole(el){
      try{
        if (!onScreen(el)) return;
        var t = (el.textContent || '').replace(/[ \t\n\r]+/g, ' ').trim();
        if (!t) return;
        for (var i = 0; i < WHOLE.length; i++){
          if (!WHOLE[i][0].test(t)) continue;
          var want = WHOLE[i][1];
          if (t === want) return;         // 이미 바뀌어 있으면 그대로
          el.textContent = want;          // 게임이 다시 그려도 매번 되돌린다
          return;
        }
      }catch(e){}
    }
    /* 튜토리얼 카드는 게임 틱이 매 프레임 다시 그린다.
       0.7초 간격으로 고치면 곧바로 원래 문구로 되돌아가 화면에는 그대로 키보드 안내가 보였다.
       → 그리기 직후마다(rAF) 다시 덧씌운다. */
    (function loop(){
      try{
        ['bd-tut-card','bd-move-hint'].forEach(function(id){ retouchWhole(document.getElementById(id)); });
      }catch(e){}
      requestAnimationFrame(loop);
    })();
    setInterval(function(){
      IDS.forEach(function(id){ retouch(document.getElementById(id)); });
    }, 700);
  }

  /* ───────── ⑤ 안내 말풍선 잔상 정리 ─────────
     오락실·노래방 툴팁이 «멀리 있을 때»도 display:block 인 채
     화면 밖(y>1000)에 남아 있었다. */
  setInterval(function(){
    try{
      ['bd-arcade-tip','bd-karaoke-tip'].forEach(function(id){
        var e = document.getElementById(id); if (!e) return;
        if (getComputedStyle(e).display === 'none') return;
        var r = e.getBoundingClientRect();
        if (r.top > innerHeight + 2 || r.bottom < -2 || r.left > innerWidth + 2 || r.right < -2){
          e.style.display = 'none';
        }
      });
    }catch(e){}
  }, 700);
})();
