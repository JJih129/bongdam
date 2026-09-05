
/* (v119) 플레이어 공격 모션이 보이지 않던 문제
   · 공격 포즈 컷으로 바꿔도 전투 UI가 다시 그려지며 곧바로 기본 이미지로 덮여
     실제로는 거의 정지 상태처럼 보였다.
   · 이미지 교체와 별개로, 요소 자체에 확실한 동작(전진·기울기·잔상·타격 섬광)을 준다.
     다시 그려져도 클래스는 유지되므로 안정적으로 보인다. */
(function(){
  'use strict';
  function css(){
    if (document.getElementById('bd-atk-motion-css')) return;
    var st = document.createElement('style');
    st.id = 'bd-atk-motion-css';
    st.textContent =
      // (v120) 박치기처럼 몸을 던지던 연출 제거 —
      //  이제 공격 컷(그림)이 바뀌므로, 몸통 이동 없이 살짝 힘주는 느낌만 준다.
      '@keyframes bdAtkSwing{'
      + '0%{transform:scale(1);}'
      + '25%{transform:scale(1.035);}'
      + '55%{transform:scale(1.02);}'
      + '100%{transform:scale(1);}}'
      + '.bd-atk-swing{ animation:bdAtkSwing .7s ease-out; '
      + 'filter:drop-shadow(0 0 20px rgba(255,236,160,.9)); }'
      + '@keyframes bdAtkFlash{0%{opacity:0;}20%{opacity:.85;}100%{opacity:0;}}'
      + '.bd-atk-flash{ position:absolute; inset:0; pointer-events:none; z-index:5;'
      + 'background:radial-gradient(circle at 70% 45%, rgba(255,255,255,.9), transparent 60%);'
      + 'animation:bdAtkFlash .4s ease; }'
      + '@keyframes bdHitShake{0%,100%{transform:translate(0,0);}'
      + '20%{transform:translate(-9px,3px);}40%{transform:translate(8px,-3px);}'
      + '60%{transform:translate(-6px,2px);}80%{transform:translate(5px,-2px);}}'
      + '.bd-hit-shake{ animation:bdHitShake .42s ease; }';
    document.head.appendChild(st);
  }

  function play(){
    try{
      css();
      var hero = document.querySelector('.hsr-hero');
      if (hero){
        hero.classList.remove('bd-atk-swing');
        void hero.offsetWidth;              // 애니메이션 재시작
        hero.classList.add('bd-atk-swing');
        setTimeout(function(){ try{ hero.classList.remove('bd-atk-swing'); }catch(e){} }, 820);
      }
      // 타격 섬광 + 적 흔들림
      setTimeout(function(){
        try{
          var arena = document.getElementById('hsr-arena') || document.getElementById('hsr-battle');
          if (arena){
            var f = document.createElement('div');
            f.className = 'bd-atk-flash';
            arena.appendChild(f);
            setTimeout(function(){ try{ f.remove(); }catch(e){} }, 420);
          }
          var foe = document.querySelector('.hsr-enemy');
          if (foe){
            foe.classList.remove('bd-hit-shake');
            void foe.offsetWidth;
            foe.classList.add('bd-hit-shake');
            setTimeout(function(){ try{ foe.classList.remove('bd-hit-shake'); }catch(e){} }, 440);
          }
        }catch(e){}
      }, 300);
    }catch(e){}
  }
  window.BD_playAttackMotion = play;

  /* (v119a) 적 체력이 줄어드는 순간을 직접 감시해 재생한다.
     공격 경로가 여러 갈래라 특정 함수만 훅하면 놓치는 경우가 있다. */
  (function watchDamage(){
    var lastHp = null;
    setInterval(function(){
      try{
        if (!(window.HSR && HSR.active && HSR.enemy)) { lastHp = null; return; }
        var hp = Number(HSR.enemy.hp);
        if (lastHp == null){ lastHp = hp; return; }
        if (hp < lastHp) play();          // 데미지가 들어간 순간 = 공격 성공
        lastHp = hp;
      }catch(e){}
    }, 150);
  })();

  /* 공격 포즈가 호출되는 순간에 함께 재생한다 */
  var n = 0;
  var t = setInterval(function(){
    n++;
    try{
      if (typeof window.bdHeroAtkPose === 'function' && !window.bdHeroAtkPose.__bdMotion){
        var orig = window.bdHeroAtkPose;
        window.bdHeroAtkPose = function(){ try{ play(); }catch(e){} return orig.apply(this, arguments); };
        window.bdHeroAtkPose.__bdMotion = true;
        clearInterval(t);
      }
    }catch(e){}
    if (n > 80) clearInterval(t);
  }, 300);
})();
