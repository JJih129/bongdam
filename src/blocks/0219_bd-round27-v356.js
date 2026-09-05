
/* (v356) 보스 2페이즈 · 조사 자가치유 · 증강-담이 겹침 — 상세는 패치 주석 */
(function(){
  'use strict';

  /* ── ① 최종보스 2페이즈 ── */
  var B = { init:false, phase:0 };
  function enemyWrap(){ return document.querySelector('.hsr-enemy'); }
  function bdUpdEnemyBar(){
    try{
      var t = document.getElementById('hsr-enemy-hptext');
      if (t) t.textContent = HSR.enemy.hp + ' / ' + HSR.enemy.maxhp;
      var bar = document.getElementById('hsr-enemy-hp');
      if (bar) bar.style.width = Math.max(0, Math.min(100, HSR.enemy.hp / HSR.enemy.maxhp * 100)) + '%';
    }catch(e){}
  }
  setInterval(function(){
    try{
      var inBoss = !!(window.HSR && HSR.active && HSR._isBoss);
      if (!inBoss){
        if (B.init){ B.init = false; B.phase = 0; window.__bdBossPhase = 0; }
        return;
      }
      if (!B.init){
        B.init = true; B.phase = 1;
        var orig = { maxhp: HSR.enemy.maxhp, atk: HSR.enemy.atk, spd: HSR.enemy.spd || 96, fam: HSR.enemy.bdFamily };
        HSR.enemy.maxhp = Math.max(60, Math.round(orig.maxhp * 0.5));
        HSR.enemy.hp = HSR.enemy.maxhp;
        HSR.enemy.atk = Math.max(4, Math.round(orig.atk * 0.8));
        HSR._pendingSecond = { maxhp: orig.maxhp, atk: orig.atk, spd: orig.spd, bdFamily: orig.fam };
        window.__bdBossPhase = 1;
        try{ var im1 = document.querySelector('#hsr-enemy-sprite img'); if (im1 && window.__BD_BOSS_P1) im1.src = window.__BD_BOSS_P1; }catch(eI1){}
        try{ if (typeof refreshEnemyUI === 'function') refreshEnemyUI(); }catch(e1){}
        try{ if (window.BD_refreshEnemy) BD_refreshEnemy(); }catch(e2){}
        bdUpdEnemyBar();
        setTimeout(function(){
          try{ if (window.BD_DAMI) BD_DAMI.show('…아직 완전한 모습이 아니에요. 힘을 다 모으기 전에 정화해요!', { face:'worried' }); }catch(e){}
        }, 1600);
        return;
      }
      /* 부화 감지: 연전 예약이 소비되고 HP가 만충으로 돌아옴 */
      if (B.phase === 1 && !HSR._pendingSecond && HSR.enemy.hp > 0 && HSR.enemy.maxhp > 200){
        B.phase = 2;
        window.__bdBossPhase = 2;
        var fl = document.getElementById('bd-egg-flash');
        if (!fl){ fl = document.createElement('div'); fl.id = 'bd-egg-flash'; document.body.appendChild(fl); }
        fl.classList.remove('on'); void fl.offsetWidth; fl.classList.add('on');
        try{ if (window.bdArenaShake) bdArenaShake(true); }catch(e3){}
        bdUpdEnemyBar();
        setTimeout(function(){
          try{ if (window.BD_DAMI) BD_DAMI.show('그림자가 진짜 모습을 드러냈어요…! 「쌓여있던 위험들」이에요. 마지막까지 힘내요!', { face:'worried' }); }catch(e){}
        }, 900);
      }
    }catch(e){}
  }, 400);

  /* ── ② 위험요소 조사 무반응 자가치유 ── */
  var wireHz = setInterval(function(){
    if (typeof window.BD_hazardInteract !== 'function' || window.BD_hazardInteract.__v356) return;
    clearInterval(wireHz);
    var o = window.BD_hazardInteract;
    window.BD_hazardInteract = function(obj){
      var r = o.apply(this, arguments);
      try{
        var oid = obj && obj.hazardId;
        if (oid && !window.__bd356Retry){
          setTimeout(function(){
            try{
              if (window.HSR && HSR.active) return;
              var d = document.getElementById('dialogue-box');
              if (d && d.getBoundingClientRect().height > 0) return;
              if (window.__bdChoiceState && __bdChoiceState.open) return;
              var m = document.querySelector('.bd-modal.show');
              if (m) return;
              if (window.BD && BD.purified && BD.purified[oid]) return;
              /* 아무 반응 없음 — 잔여 잠금 해제 후 1회 재시도 */
              window.__bdDamiOpeningBusy = false;
              window.__bd356Retry = true;
              try{ console.info('[v356] 조사 무반응 감지 — 잠금 해제 후 재시도(' + oid + ')'); }catch(eL){}
              try{ o.call(null, obj); }catch(eR){}
              setTimeout(function(){ window.__bd356Retry = false; }, 1500);
            }catch(eT){}
          }, 900);
        }
      }catch(eW){}
      return r;
    };
    window.BD_hazardInteract.__v356 = true;
  }, 300);

  /* ── ③ 증강 선택 중 담이 말풍선 숨김 ── */
  setInterval(function(){
    try{
      var ov = document.getElementById('bd-aug-overlay');
      var on = !!(ov && getComputedStyle(ov).display !== 'none');
      document.body.classList.toggle('bd-aug-on', on);
    }catch(e){}
  }, 300);
})();
