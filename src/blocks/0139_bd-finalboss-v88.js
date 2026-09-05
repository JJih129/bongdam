
/* (v88) 최종 보스 연출 이식 — 전용 대사창(괴물 말투) → 결의 → 전투, 진입 시 궁극기 1회 지급 */
(function(){
  'use strict';
  var BOSS_LINES = [
    '…버, 려, 진…… 것…들…이…… 모, 여, 서…… 내, 가… 되었, 다……',
    '치, 워, 도…… 또…… 쌓, 인, 다…… 사, 람, 들, 은…… 금, 방…… 잊, 어, 버, 려……',
    '너, 도…… 곧…… 지, 칠… 거, 야…… 포, 기, 해……'
  ];
  var HERO_LINES = [
    '…혼자였으면 그랬을지도 몰라.',
    '하지만 이 동네 사람들이 알려줬어. 작은 것부터 같이 치우면 된다고.',
    '어떻게든 해결하자 — 마지막이야!'
  ];
  function ensureStyle(){
    if (document.getElementById('bd-bossdlg-style')) return;
    var st = document.createElement('style');
    st.id = 'bd-bossdlg-style';
    st.textContent =
      '#bd-boss-dlg{position:fixed;inset:0;z-index:6000;display:none;align-items:flex-end;justify-content:center;'
      + 'background:radial-gradient(ellipse at 50% 40%, rgba(60,10,80,.45), rgba(0,0,0,.86));cursor:pointer;}'
      + '#bd-boss-dlg.on{display:flex;}'
      + '#bd-boss-dlg .bx{width:min(860px,92vw);margin-bottom:8vh;padding:20px 24px;border-radius:16px;'
      + 'background:rgba(18,6,26,.94);border:2px solid #7d3ca8;box-shadow:0 0 40px rgba(150,60,220,.5);}'
      + '#bd-boss-dlg .nm{font-weight:800;font-size:15px;color:#e0a6ff;margin-bottom:8px;letter-spacing:1px;}'
      + '#bd-boss-dlg .tx{font-size:19px;line-height:1.7;color:#f3e6ff;text-shadow:0 0 12px rgba(190,110,255,.55);}'
      + '#bd-boss-dlg.hero .bx{background:rgba(8,16,30,.94);border-color:#3f7dc0;}'
      + '#bd-boss-dlg.hero .nm{color:#9fd0ff;} #bd-boss-dlg.hero .tx{color:#eaf4ff;text-shadow:none;}'
      + '#bd-boss-dlg .hint{margin-top:12px;font-size:12px;color:#b79ccc;text-align:right;}';
    document.head.appendChild(st);
  }
  function play(seq, done){
    ensureStyle();
    var ov = document.getElementById('bd-boss-dlg');
    if (!ov){
      ov = document.createElement('div'); ov.id = 'bd-boss-dlg';
      ov.innerHTML = '<div class="bx"><div class="nm"></div><div class="tx"></div><div class="hint">클릭 / Space 로 계속</div></div>';
      document.body.appendChild(ov);
    }
    var i = -1;
    function step(){
      i++;
      if (i >= seq.length){
        ov.classList.remove('on');
        document.removeEventListener('keydown', onKey, true);
        if (done) done();
        return;
      }
      var s = seq[i];
      ov.classList.toggle('hero', s.who === 'hero');
      ov.querySelector('.nm').textContent = (s.who === 'hero') ? '봉담지킴이' : '쌓여있던 위험들';
      ov.querySelector('.tx').textContent = s.t;
      ov.classList.add('on');
    }
    function onKey(e){
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'f' || e.key === 'F'){
        e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation(); step();
      }
    }
    ov.onclick = step;
    document.addEventListener('keydown', onKey, true);
    step();
  }
  window.BD_bossEncounter = function(obj, startFn){
    var seq = [];
    BOSS_LINES.forEach(function(t){ seq.push({ who:'boss', t:t }); });
    HERO_LINES.forEach(function(t){ seq.push({ who:'hero', t:t }); });
    play(seq, function(){ try{ startFn(); }catch(e){} });
    return true;
  };

  /* 보스 조사 가로채기 — 전용 대사 후 원래 조사 진행 */
  document.addEventListener('keydown', function(e){
    if (e.key !== 'f' && e.key !== 'F') return;
    try{
      if (window.HSR && HSR.active) return;
      var d = document.getElementById('dialogue-overlay'); if (d && d.offsetHeight) return;
      var ov = document.getElementById('bd-boss-dlg'); if (ov && ov.classList.contains('on')) return;
      var st = STAGES[Number(currentStage)]; if (!st) return;
      var boss = (st.objects||[]).find(function(o){ return o && o.isBoss && !o.hidden; });
      if (!boss || boss.__bdBossTalked) return;
      if (typeof window.BD_hazardLocked === 'function' && BD_hazardLocked(boss)) return;
      var R = (typeof HERO_WR !== 'undefined' ? HERO_WR : 0.022) * 2 * 1.6;
      var cx = boss.rx + (boss.rw||0)/2, cy = boss.ry + (boss.rh||0);
      if (Math.hypot(heroX-cx, heroY-cy) > R) return;
      e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
      boss.__bdBossTalked = true;
      BD_bossEncounter(boss, function(){
        try{ (window.BD_hazardInteract || window.hazardInteract)(boss); }catch(err){}
      });
    }catch(err){}
  }, true);

  /* (v392) 구 «보스전 진입 즉시 궁극기 100% 지급» 제거 —
     신형 설계(0089)는 보스전에서 4속성(W/G/M/N)을 모두 써야 해금되는데,
     이 레거시 지급이 먼저 돌아 시작부터 게이지가 가득 차 있었다. */
})();
