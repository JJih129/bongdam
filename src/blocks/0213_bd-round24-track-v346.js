
/* (v346) 지도 클릭 길찾기 추적 — 상세는 패치 주석 */
(function(){
  'use strict';
  function chip(){
    var c = document.getElementById('bd-track-chip');
    if (c) return c;
    c = document.createElement('div');
    c.id = 'bd-track-chip';
    c.innerHTML = '<span class="tk-arrow">➤</span><span class="tk-label"></span><span class="tk-x">(누르면 해제)</span>';
    c.addEventListener('click', function(){ window.BD_mapTrackClear('추적을 해제했어요'); });
    document.body.appendChild(c);
    return c;
  }
  /* (v369) 실제 길안내 연결 — 칩(방향 화살표)만으로는 «추적한다는 문구만 뜨고 추적이 안 된다»는 제보.
     같은 스테이지면 즉시, 다른 스테이지면 도착하는 순간 발밑 화살표·미니맵 목표(__bdNavOverride)를 건다.
     시설(랜드마크)이면 v289 의 __bdMapTrackFid 도 함께 걸어 «문(지정 지점)» 으로 안내한다. */
  function applyNav(t){
    try{
      var st = STAGES[Number(currentStage)]; if (!st) return;
      var norm = function(s){ return String(s||'').replace(/[\s_()\-·]/g,''); };
      var lm = (st.__v24Landmarks||[]).find(function(l){ return l && l.label && norm(l.label) === norm(t.label); });
      var rx = t.wx - 0.02, ry = t.wy - 0.03;
      if (lm && isFinite(Number(lm.interactionX))){ rx = Number(lm.interactionX) - 0.02; ry = Number(lm.interactionY) - 0.03; window.__bdMapTrackFid = lm.facilityId; t.ix = Number(lm.interactionX); t.iy = Number(lm.interactionY); }
      window.__bdNavOverride = { rx: rx, ry: ry, rw: 0.04, rh: 0.04, label: '📍 ' + t.label, _guideLabel: '지도에서 고른 곳 — 화살표를 따라가요', __mapTrack: true };
      t.applied = Number(currentStage);
    }catch(e){}
  }
  window.BD_mapTrackStart = function(sid, label, wx, wy){
    window.__bdTrack = { sid: sid, label: label, wx: wx, wy: wy, applied: null };
    try{ bdToast('📍 「' + label + '」 길찾기 추적 시작! 화살표를 따라가요'); }catch(e){}
    try{ if (window.BD_closeSafetyMap) BD_closeSafetyMap(); }catch(e){}
    chip();
    if (Number(currentStage) === Number(sid)) applyNav(window.__bdTrack);
  };
  window.BD_mapTrackClear = function(msg){
    window.__bdTrack = null;
    try{ if (window.__bdNavOverride && window.__bdNavOverride.__mapTrack) window.__bdNavOverride = null; }catch(e0){}
    try{ window.__bdMapTrackFid = null; }catch(e1){}
    var c = document.getElementById('bd-track-chip');
    if (c) c.classList.remove('on');
    if (msg){ try{ bdToast(msg); }catch(e){} }
  };
  var NAME = { 210:'수영리', 211:'동화리', 212:'와우리', 213:'상리' };
  setInterval(function(){
    try{
      var t = window.__bdTrack;
      var c = document.getElementById('bd-track-chip');
      if (!t){ if (c) c.classList.remove('on'); return; }
      c = chip();
      var inBattle = !!(window.HSR && HSR.active);
      if (inBattle){ c.classList.remove('on'); return; }
      c.classList.add('on');
      var lb = c.querySelector('.tk-label'), ar = c.querySelector('.tk-arrow');
      if (Number(currentStage) !== t.sid){
        lb.textContent = t.label + ' — ' + (NAME[t.sid] || '다른 동네') + ' 방향 (버스·길목 이용)';
        ar.style.transform = 'none'; ar.textContent = '🚌';
        return;
      }
      ar.textContent = '➤';
      /* (v369) 도착한 스테이지가 목표 스테이지면 길안내를 (재)적용 — 다른 오버라이드(퀘스트 안내 등)에 밀렸어도 다시 건다 */
      if (t.applied !== Number(currentStage) || !window.__bdNavOverride) applyNav(t);   /* 다른 안내(회복 등)가 걸려 있으면 양보 */
      var dx = t.wx - heroX, dy = t.wy - heroY;
      var dist = Math.hypot(dx, dy);
      if (isFinite(t.ix)) dist = Math.min(dist, Math.hypot(t.ix - heroX, t.iy - heroY));   /* (v369) 문(지정 지점) 도착도 인정 */
      if (dist < 0.045){
        window.BD_mapTrackClear('📍 「' + t.label + '」 도착! F로 살펴봐요');
        return;
      }
      lb.textContent = t.label + ' 추적 중';
      ar.style.transform = 'rotate(' + Math.round(Math.atan2(dy, dx) * 180 / Math.PI) + 'deg)';
    }catch(e){}
  }, 400);
})();
