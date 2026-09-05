
/* (v332) 라운드 15 — 본문 주석은 파일 상단 패치 설명 참조 */
(function(){
  'use strict';

  /* ── ⑥ deltaTime 기반 이동 — 프레임 낙하 시에도 실제 이동 속도 유지 ── */
  (function(){
    var last = 0;
    function tick(t){
      if (last){
        /* (v368) 게임 루프가 60fps 상한(누적기)으로 돌므로 RAF 간격이 아니라 «로직 프레임 간격»을 기준으로 잰다.
           (RAF 간격을 쓰면 144Hz 에서 K=0.5 로 눌려 이동이 절반 속도가 된다) */
        var dt = (typeof window.__bdLogicDt === 'number' && window.__bdLogicDt > 0) ? window.__bdLogicDt : (t - last);
        /* 60fps=1.0 기준. 상한 2.0 — 저FPS에서 한 프레임에 벽을 통과하지 않게 */
        window.__bdFrameK = Math.max(0.5, Math.min(2.0, dt / 16.6667));
      }
      last = t;
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
    var iv = setInterval(function(){
      if (typeof window.getMoveSpeed !== 'function' || window.getMoveSpeed.__v332) return;
      clearInterval(iv);
      var o = window.getMoveSpeed;
      window.getMoveSpeed = function(){ return o.apply(this, arguments) * (window.__bdFrameK || 1); };
      window.getMoveSpeed.__v332 = true;
    }, 300);
  })();

  /* ── ⑦ VN(LD) 대화 중 body.bd-vn-on 토글 ── */
  setInterval(function(){
    try{
      var ov = document.getElementById('dialogue-overlay');
      var on = !!(ov && getComputedStyle(ov).display !== 'none');
      document.body.classList.toggle('bd-vn-on', on);
    }catch(e){}
  }, 250);

  /* ── ⑤ 휴식 가능 판정 — canRest 플래그 우선, 없으면 대형 문화·공공 라벨 ── */
  var MAJOR_RX = /문화의집|청소년문화의집|도서관|문화센터|어린이문화센터|체육센터|체육관|주민센터|복지관|문화회관|생활문화|캠퍼스|보건소/;
  window.BD_canRestAt = function(l){
    try{
      if (!l) return false;
      if (typeof l.canRest === 'boolean') return l.canRest;
      /* 랜드마크 ↔ 오브젝트 이중 사본: 오브젝트 쪽 지정도 확인 */
      try{
        var st = STAGES[Number(currentStage)];
        var list = (st && st.objects) || [];
        for (var i = 0; i < list.length; i++){
          var o = list[i]; if (!o) continue;
          var same = (o.facilityId && l.facilityId) ? o.facilityId === l.facilityId
            : (o.label && l.label && o.label === l.label);
          if (same && typeof o.canRest === 'boolean') return o.canRest;
        }
      }catch(e2){}
      return MAJOR_RX.test(String(l.label || l.name || ''));
    }catch(e){ return false; }
  };

  /* ── ③ 이동 목표 «도착» 판정 — 반경(기본 120px, obj.questRadius) 진입 시 1회 안내 ── */
  var arrived = {};
  setInterval(function(){
    try{
      if (typeof currentStage === 'undefined' || !STAGES[currentStage]) return;
      if (window.HSR && HSR.active) return;
      var db = document.getElementById('dialogue-box');
      if (db && db.getBoundingClientRect().height > 0) return;
      if (typeof BD_screenRectOfWorld !== 'function') return;
      /* BD_screenRectOfWorld 는 화면 4px 미만 사각형에 null — 넉넉한 엡실론(0.01)로 점 좌표 변환 */
      var hr = BD_screenRectOfWorld(heroX - 0.005, heroY - 0.005, 0.01, 0.01);
      if (!hr) return;
      var hx = hr.left + hr.width / 2, hy = hr.top + hr.height / 2;
      var list = (STAGES[currentStage].objects || []).filter(function(o){
        return o && o.hazardId && !o.hidden && !o.__bdGone
          && !(window.BD && BD.purified && BD.purified[o.hazardId])
          && !(typeof BD_hzQuestGate === 'function' && BD_hzQuestGate(o));
      });
      var best = null, bd2 = 1e18;
      list.forEach(function(o){
        var r = BD_screenRectOfWorld(o.rx, o.ry, Math.max(o.rw || 0, 0.02), Math.max(o.rh || 0, 0.02));
        if (!r) return;
        var dx = (r.left + r.width / 2) - hx, dy = (r.top + r.height / 2) - hy;
        var d = Math.hypot(dx, dy);
        if (d < bd2){ bd2 = d; best = o; }
      });
      if (!best) return;
      var rad = Number(best.questRadius) > 0 ? Number(best.questRadius) : 120;
      if (bd2 <= rad && !arrived[best.hazardId]){
        arrived[best.hazardId] = true;
        try{ if (window.BDSound && BDSound.select) BDSound.select(); }catch(eS){}
        try{ (window.BD_toast || window.bdToast)('📍 목적지 도착! 가까이에서 F로 조사해 보세요', 2600); }catch(eT){}
      }
    }catch(e){}
  }, 500);

  /* ── ② 스테이지별 캐릭터 배율 — 기본: 야외 4개 리(210~213) 0.85 ── */
  window.__bdCharScales = window.__bdCharScales || {};
  function loadCharScales(){
    var merge = function(m){ try{ Object.keys(m||{}).forEach(function(k){ if (window.__bdCharScales[k] == null) window.__bdCharScales[k] = Number(m[k]); }); }catch(e){} };
    try{
      var K = 'bongdam_rpg_editor_data_v5_2_quest';
      var raw = localStorage.getItem(K) || window.__BD_BAKED_STAGE_RAW || null;
      if (raw){ var j = JSON.parse(raw); if (j && j.__charScales) merge(j.__charScales); }
    }catch(e){}
    /* (v333) 에디터 전용 키 — K가 없는 세션에서도 배율이 살아남게 */
    try{ merge(JSON.parse(localStorage.getItem('bd_char_scales_v332') || '{}')); }catch(e2){}
  }
  function charScaleOf(sid){
    var v = window.__bdCharScales[sid];
    if (v == null || !(v > 0)) v = (sid >= 210 && sid <= 213) ? 0.85 : 1;
    return v;
  }
  window.BD_charScaleOf = charScaleOf;
  var wire = setInterval(function(){
    if (typeof window.BD_applyViewScale !== 'function' || window.BD_applyViewScale.__v332) return;
    clearInterval(wire);
    loadCharScales();
    var o = window.BD_applyViewScale;
    window.BD_applyViewScale = function(){
      var r = o.apply(this, arguments);
      try{
        var v = charScaleOf(Number(currentStage));
        if (v && v !== 1){ window.BD_SPR *= v; window.BD_RES *= v; }
      }catch(e){}
      return r;
    };
    window.BD_applyViewScale.__v332 = true;
    try{ window.BD_applyViewScale(); }catch(e){}
  }, 300);

  /* 저장 시 K 루트에 __charScales 동봉 — 에디터 «내보내기»·베이크에 그대로 실림 */
  (function(){
    if (window.__bdCharSaveWrapOn) return;
    window.__bdCharSaveWrapOn = true;
    var K = 'bongdam_rpg_editor_data_v5_2_quest';
    var oSet = Storage.prototype.setItem;
    Storage.prototype.setItem = function(k, v){
      if (k === K){
        try{
          var j = JSON.parse(v);
          if (j && typeof j === 'object' && Object.keys(window.__bdCharScales || {}).length){
            j.__charScales = window.__bdCharScales;
            v = JSON.stringify(j);
          }
        }catch(e){}
      }
      return oSet.call(this, k, v);
    };
  })();

  /* ── 에디터 확장 — 스테이지 «플레이어 배율», 위험요소 «감지 반경», 시설 «휴식 가능» ── */
  function $(id){ return document.getElementById(id); }
  function edStage(){
    try{
      var sel = $('bge-stage-select') || $('bge-stage');
      var sid = sel ? Number(sel.value) : Number(currentStage);
      if (!sid || !STAGES[sid]) sid = Number(currentStage);
      return sid;
    }catch(e){ return Number(currentStage); }
  }
  function matchSel(){
    try{
      var rx = parseFloat(($('bge-obj-rx')||{}).value), ry = parseFloat(($('bge-obj-ry')||{}).value);
      var rw = parseFloat(($('bge-obj-rw')||{}).value), rh = parseFloat(($('bge-obj-rh')||{}).value);
      if (isNaN(rx) || isNaN(ry)) return null;
      var list = (STAGES[edStage()] && STAGES[edStage()].objects) || [];
      for (var i = 0; i < list.length; i++){
        var o = list[i]; if (!o) continue;
        if (Math.abs(Number(o.rx)-rx) < 0.0015 && Math.abs(Number(o.ry)-ry) < 0.0015
          && Math.abs(Number(o.rw)-rw) < 0.0015 && Math.abs(Number(o.rh)-rh) < 0.0015) return o;
      }
      return null;
    }catch(e){ return null; }
  }
  function mirrorLm(o, key){
    try{
      var lms = (STAGES[edStage()] || {}).__v24Landmarks || [];
      var lm = lms.find(function(l){ return l && ((o.facilityId && l.facilityId === o.facilityId) || (l.label && l.label === o.label)); });
      if (lm){ if (o[key] === undefined) delete lm[key]; else lm[key] = o[key]; }
    }catch(e){}
  }
  setInterval(function(){
    try{
      if (!(window.BongdamEditor && BongdamEditor.state && BongdamEditor.state.enabled)) return;
      /* 스테이지 «플레이어 배율» — 스테이지 선택 옆 */
      var sel = $('bge-stage-select') || $('bge-stage');
      if (sel && !$('bd-charscale-box')){
        var sb = document.createElement('div');
        sb.id = 'bd-charscale-box';
        sb.style.cssText = 'margin-top:6px;padding:6px;border:1px dashed rgba(140,200,255,.5);border-radius:6px;';
        sb.innerHTML = '<label style="font-size:11px;">🧍 플레이어 배율(스테이지) <small>비우면 기본(야외 0.85)</small></label>'
          + '<input id="bd-charscale-input" type="number" min="0.4" max="2" step="0.05" style="width:80px;">';
        (sel.closest('div') || sel.parentElement).appendChild(sb);
        $('bd-charscale-input').addEventListener('change', function(){
          try{
            var sid = edStage();
            var v = Number(this.value);
            if (v > 0) window.__bdCharScales[sid] = v; else delete window.__bdCharScales[sid];
            try{ window.BD_applyViewScale(); }catch(e2){}
            try{ localStorage.setItem('bd_char_scales_v332', JSON.stringify(window.__bdCharScales)); }catch(eK){}   /* (v333) 전용 키 영속 */
            if (BongdamEditor.save) BongdamEditor.save();
            try{ bdToast('🧍 플레이어 배율 저장: ' + (v > 0 ? '×' + v : '기본')); }catch(e3){}
          }catch(e){}
        });
      }
      if ($('bd-charscale-input') && document.activeElement !== $('bd-charscale-input')){
        var cur = window.__bdCharScales[edStage()];
        $('bd-charscale-input').value = (cur == null ? '' : cur);
      }
      /* 오브젝트 «감지 반경»·«휴식 가능» — 좌표 폼 하단 */
      var rxIn = $('bge-obj-rx');
      var host = rxIn ? (rxIn.closest('#bge-obj-form') || rxIn.closest('div').parentElement) : null;
      if (host && !$('bd-r15-box')){
        var box = document.createElement('div');
        box.id = 'bd-r15-box';
        box.style.cssText = 'margin-top:6px;padding:6px;border:1px dashed rgba(255,170,120,.5);border-radius:6px;';
        box.innerHTML = '<div id="bd-qr-row"><label style="font-size:11px;">📍 감지 반경(px) <small>이동 도착 판정 · 비우면 120</small></label>'
          + '<input id="bd-qr-input" type="number" min="40" max="500" step="10" style="width:80px;"></div>'
          + '<div id="bd-cr-row" style="margin-top:4px;"><label style="font-size:11px;">💗 휴식 가능</label> '
          + '<select id="bd-cr-sel" style="width:110px;"><option value="">기본(자동)</option><option value="1">허용</option><option value="0">금지</option></select></div>';
        host.appendChild(box);
        $('bd-qr-input').addEventListener('change', function(){
          try{
            var o = matchSel(); if (!o) return;
            var v = Number(this.value);
            if (v > 0) o.questRadius = v; else delete o.questRadius;
            if (BongdamEditor.save) BongdamEditor.save();
            try{ bdToast('📍 감지 반경 저장: ' + (v > 0 ? v + 'px' : '기본 120')); }catch(e3){}
          }catch(e){}
        });
        $('bd-cr-sel').addEventListener('change', function(){
          try{
            var o = matchSel(); if (!o) return;
            if (this.value === '') delete o.canRest; else o.canRest = this.value === '1';
            mirrorLm(o, 'canRest');
            if (BongdamEditor.save) BongdamEditor.save();
            try{ bdToast('💗 휴식 가능: ' + (this.value === '' ? '기본(자동)' : (this.value === '1' ? '허용' : '금지'))); }catch(e3){}
          }catch(e){}
        });
      }
      var box2 = $('bd-r15-box');
      if (box2){
        var o2 = matchSel();
        box2.style.display = o2 ? 'block' : 'none';
        if (o2){
          $('bd-qr-row').style.display = o2.hazardId ? 'block' : 'none';
          $('bd-cr-row').style.display = (o2.facilityId || o2.interactable === 'facility' || o2.type === 'building') ? 'block' : 'none';
          if (document.activeElement !== $('bd-qr-input')) $('bd-qr-input').value = o2.questRadius || '';
          if (document.activeElement !== $('bd-cr-sel')) $('bd-cr-sel').value = (typeof o2.canRest === 'boolean') ? (o2.canRest ? '1' : '0') : '';
        }
      }
    }catch(e){}
  }, 700);

  /* ── ⑧ HP UI — 캔버스 판타지 패널 → 다크 DOM 패널 ── */
  var hpWire = setInterval(function(){
    if (typeof window.renderHP !== 'function' || window.renderHP.__v332) return;
    clearInterval(hpWire);
    window.renderHP = function(ctx, canvas){
      try{
        try{ if (typeof _hpFlashTimer === 'number' && _hpFlashTimer > 0) _hpFlashTimer--; }catch(eF){}
        var p = document.getElementById('bd-hp-dom');
        if (!p){
          p = document.createElement('div');
          p.id = 'bd-hp-dom';
          p.innerHTML = '<div class="hp-row"><span class="hp-heart">❤️</span>'
            + '<div class="hp-track"><div class="hp-fill" style="width:100%"></div></div>'
            + '<span class="hp-num"></span></div>'
            + '<div class="xp-row"><span class="xp-lv"></span>'
            + '<div class="xp-track"><div class="xp-fill" style="width:0%"></div></div>'
            + '<span class="xp-num"></span></div>';
          document.body.appendChild(p);
        }
        var mx = (typeof getMaxHP === 'function') ? getMaxHP() : 100;
        var hp = (typeof heroHP === 'number') ? Math.max(0, heroHP) : mx;
        var ratio = mx > 0 ? hp / mx : 1;
        p.classList.toggle('hp-mid', ratio <= 0.6 && ratio > 0.35);
        p.classList.toggle('hp-low', ratio <= 0.35);
        var flash = false;
        try{ flash = typeof _hpFlashTimer === 'number' && _hpFlashTimer > 0; }catch(eF2){}
        p.classList.toggle('hp-flash', flash);
        p.querySelector('.hp-fill').style.width = Math.round(ratio * 100) + '%';
        p.querySelector('.hp-num').textContent = hp + ' / ' + mx;
        var lv = (typeof safetyLevel !== 'undefined') ? safetyLevel : 1;
        p.querySelector('.xp-lv').textContent = '🛡 Lv.' + lv;
        var xr = 0, xTxt = '';
        try{
          if (typeof safetyXP !== 'undefined' && typeof safetyXP_MAX !== 'undefined' && safetyXP_MAX > 0){
            xr = Math.min(1, safetyXP / safetyXP_MAX);
            xTxt = safetyXP + '/' + safetyXP_MAX;
          }
        }catch(eX){}
        p.querySelector('.xp-fill').style.width = Math.round(xr * 100) + '%';
        p.querySelector('.xp-num').textContent = xTxt;
        /* 퀘스트 HUD 위치 계산용 — DOM 패널 하단을 캔버스 좌표로 환산 */
        try{
          var r = p.getBoundingClientRect();
          var cr = canvas.getBoundingClientRect();
          if (cr.height > 0) window.__bdExpBarBottom = (r.bottom - cr.top) * (canvas.height / cr.height);
          window.__bdExpBarLeft = 14;
        }catch(eB){}
      }catch(e){}
    };
    window.renderHP.__v332 = true;
  }, 300);
})();
