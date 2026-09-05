
/* (v120) 전투 대기·공격 컷 교체 (배경 제거본)
   · 제공된 남/여 «LD전투», «LD전투공격» 4장을 크로마키 제거 후 등록한다.
   · 공격 순간에는 공격 컷으로 바뀌고, 끝나면 대기 컷으로 돌아온다. */
(function(){
  'use strict';
  var IMG = {
    f_idle: 'data:image/webp;base64,@@B64:77c9678b_f_idle.webp@@',
    f_atk:  'data:image/webp;base64,@@B64:fca821fb_f_atk.webp@@',
    m_idle: 'data:image/webp;base64,@@B64:9c17716c_m_idle.webp@@',
    m_atk:  'data:image/webp;base64,@@B64:4717c302_m_atk.webp@@'
  };
  window.BD_BATTLE_POSE = IMG;

  function gender(){
    try{ return (typeof selectedCharacter !== 'undefined' && selectedCharacter === 2) ? 'm' : 'f'; }
    catch(e){ return 'f'; }
  }
  window.BD_battleIdleSrc = function(){ return IMG[gender() + '_idle']; };
  window.BD_battleAtkSrc  = function(){ return IMG[gender() + '_atk'];  };

  /* 전투 화면의 주인공 이미지를 새 대기 컷으로 유지 */
  setInterval(function(){
    try{
      if (!(window.HSR && HSR.active)) return;
      var img = document.getElementById('hsr-hero-img');
      if (!img) return;
      if (window.__bdHeroPoseUntil && Date.now() < window.__bdHeroPoseUntil) return;  // 공격 중이면 두기
      var want = window.BD_battleIdleSrc();
      if (want && img.src !== want) img.src = want;
    }catch(e){}
  }, 200);
})();
