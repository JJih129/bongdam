
/* (v126) 검수용 관측 장치 — develop-web-game 스킬 규격
   ────────────────────────────────────────────────────────────
   · window.render_game_to_text()  현재 상태를 JSON 문자열로
   · window.advanceTime(ms)        시간을 결정적으로 진행
   게임 로직에는 관여하지 않고 '읽기'와 '진행'만 담당한다. */
(function(){
  'use strict';

  function safe(fn, dflt){ try{ var v = fn(); return (v === undefined ? dflt : v); }catch(e){ return dflt; } }
  function txt(el){ try{ return el && el.offsetHeight ? (el.textContent||'').replace(/\s+/g,' ').trim().slice(0,90) : null; }catch(e){ return null; } }
  /* (v147) offsetParent 는 position:fixed 요소에서 항상 null —
     캐릭터 선택·증강 선택·장소 카드가 관측에 전혀 잡히지 않던 원인. */
  function vis(id){ try{
    var e = document.getElementById(id); if (!e) return false;
    var cs = getComputedStyle(e);
    if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity < 0.05) return false;
    var r = e.getBoundingClientRect();
    return r.width > 2 && r.height > 2;
  }catch(e){ return false; } }

  /** 현재 화면 모드 판별 — 무엇을 하고 있는 상태인가 */
  function mode(){
    if (safe(function(){ return !!(window.HSR && HSR.active); }, false)) return 'battle';
    if (vis('bd-title-screen') || safe(function(){
      return document.getElementById('bd-title-screen').classList.contains('show'); }, false)) return 'title';
    if (vis('bd-char-1')) return 'charSelect';
    if (vis('bd-aug-overlay')) return 'augment';
    if (vis('bd-place-card')) return 'placeCard';
    if (safe(function(){ var b=document.getElementById('dialogue-box'); return !!(b && b.offsetHeight); }, false)) return 'dialogue';
    return 'field';
  }

  window.render_game_to_text = function(){
    var sid = safe(function(){ return Number(currentStage); }, null);
    var st  = safe(function(){ return STAGES[sid]; }, null);
    var Q   = safe(function(){ return window.QUESTS || window.BD_QUESTS; }, null);
    var q   = safe(function(){ return Q[BD.questIdx]; }, null);

    var payload = {
      /* 좌표계: rx/ry 는 맵 기준 0~1 비율. 원점 좌상단, x→오른쪽, y→아래 */
      coords: 'normalized 0..1 per stage; origin top-left; x→right, y→down',
      mode: mode(),
      stage: { id: sid, name: safe(function(){ return st.name; }, null) },
      hero: {
        x: safe(function(){ return +heroX.toFixed(3); }, null),
        y: safe(function(){ return +heroY.toFixed(3); }, null),
        hp: safe(function(){ return heroHP; }, null),
        gold: safe(function(){ return playerGold; }, null)
      },
      quest: q ? {
        id: q.id, title: q.title,
        objective: safe(function(){ return q.objectives[0].t; }, null),
        cur: safe(function(){ return q.objectives[0].cur; }, 0),
        need: safe(function(){ return q.objectives[0].need; }, 0)
      } : null,
      hazards: safe(function(){
        return (st.objects||[]).filter(function(o){
          return o && o.interactable==='hazard' && !o.hidden;
        }).map(function(o){
          return { id:o.hazardId||null, label:o.label,
                   x:+(o.rx||0).toFixed(3), y:+(o.ry||0).toFixed(3),
                   purified: !!(window.BD && BD.purified && BD.purified[o.hazardId]),
                   locked: safe(function(){ return !!BD_hazardLocked(o); }, false) };
        });
      }, []),
      npcs: safe(function(){
        return (st.objects||[]).filter(function(o){ return o && o.resident; })
          .map(function(o){ return { name:o.npcName,
            x:+(o.rx||0).toFixed(3), y:+(o.ry||0).toFixed(3),
            state:o.__bdHzQuestLines||null }; });
      }, []),
      battle: safe(function(){
        if (!(window.HSR && HSR.active)) return null;
        return {
          enemy: safe(function(){ return HSR.enemy.name; }, null),
          enemyHp: safe(function(){ return HSR.enemy.hp; }, null),
          enemyMax: safe(function(){ return HSR.enemy.maxhp; }, null),
          heroHp: safe(function(){ return HSR.hero.hp; }, null),
          state: safe(function(){ return HSR.state; }, null),
          minigame: vis('bd-mg') || vis('bd-mg-ddr') || vis('bd-mg-light')
        };
      }, null),
      ui: {
        dialogue: txt(document.getElementById('dialogue-box')),
        speaker: txt(document.getElementById('dialogue-name')),
        choice: safe(function(){
          var c = document.getElementById('bd-choice');
          if (!(c && c.offsetHeight)) return null;
          return Array.from(c.querySelectorAll('[id^="bd-ch-"]')).map(function(e){
            return e.textContent.replace(/\s+/g,' ').trim().slice(0,20); });
        }, null),
        placeCard: vis('bd-place-card'),
        augment: vis('bd-aug-overlay'),
        damiBubble: vis('bd-dami-hud')
      },
      events: safe(function(){ return BD_EVENTS.debug(); }, null),
      guide: safe(function(){ var g = BD_currentGuide(); return g ? g.label : null; }, null),
      items: safe(function(){ return BD.items || {}; }, {}),
      augments: safe(function(){ return (BD._augments||[]).slice(); }, [])
    };
    return JSON.stringify(payload);
  };

  /* 시간 진행 훅 — 게임이 rAF 기반이라 '기다림'을 대체하기보다
     타이머·애니메이션이 흐르도록 프레임을 촉진하는 역할 */
  /* (v147) window.__bdTick 은 이 빌드에 «존재하지 않는» 함수였다.
     그래서 advanceTime(ms) 는 호출해도 프레임이 한 칸도 나아가지 않았고,
     자동 검수는 실제 대기(setTimeout)에만 의존해 결과가 흔들렸다.
     → 게임의 프레임 함수(gameLoop)를 직접 원하는 횟수만큼 돌린다.
       도는 동안에는 requestAnimationFrame 예약을 막아 «체인 중복»을 만들지 않는다
       (체인이 겹치면 한 프레임에 이동이 두세 번 처리돼 속도가 배가된다 — v178 참고). */
  window.advanceTime = function(ms){
    var steps = Math.max(1, Math.round((ms||0) / (1000/60)));
    var realRaf = window.requestAnimationFrame;
    var wasAlive = window.__gameLoopChainAlive;
    try{
      window.requestAnimationFrame = function(){ return 0; };
      for (var i = 0; i < steps; i++){
        try{ if (typeof gameLoop === 'function') gameLoop(true); }catch(e){}
        try{ if (typeof window.__bdTick === 'function') window.__bdTick(1/60); }catch(e){}
      }
    } finally {
      window.requestAnimationFrame = realRaf;
      window.__gameLoopChainAlive = wasAlive;
      // 원래 체인이 없었다면 멈춰 있지 않도록 한 프레임 되살린다
      try{
        if (!wasAlive && typeof gameLoop === 'function'){
          window.__gameLoopChainAlive = true;
          window.requestAnimationFrame(function(){ gameLoop(true); });
        }
      }catch(e){}
    }
    return steps;
  };
})();
