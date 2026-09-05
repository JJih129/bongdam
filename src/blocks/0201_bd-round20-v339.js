
(function(){
  'use strict';
  /* ── 장난감(문구·취미) «가지고 놀기» — 가방 상세에 버튼 주입 ── */
  var LINES = [
    '우와, {n} 진짜 재밌겠다! 잠깐 쉬어 가는 것도 지킴이의 지혜예요!',
    '{n}(으)로 기분 전환! 다시 힘내서 봉담을 지켜요!',
    '저도 {n} 좋아해요! 한 번 더 해요?',
    '{n} 최고예요! 놀 땐 놀고, 지킬 땐 지키고!'
  ];
  var playN = 0;
  function burst(icon, x, y){
    try{
      /* (v379) §4 — body zoom(UI 배율) 미보정으로 이펙트가 버튼에서 벗어나던 문제 */
      var z = 1; try{ z = parseFloat(getComputedStyle(document.body).zoom) || 1; if (!(z > 0)) z = 1; }catch(eZ){}
      x /= z; y /= z;
      var host = document.createElement('div');
      host.className = 'bd-toy-burst';
      document.body.appendChild(host);
      for (var i = 0; i < 12; i++){
        var s = document.createElement('span');
        s.textContent = icon;
        s.style.left = x + 'px'; s.style.top = y + 'px';
        host.appendChild(s);
        (function(sp, ang){
          requestAnimationFrame(function(){
            var d = 90 + Math.floor(60 * ((ang * 37) % 10) / 10);
            sp.style.transform = 'translate(' + Math.cos(ang) * d + 'px,' + (Math.sin(ang) * d - 40) + 'px) rotate(' + (ang * 120) + 'deg)';
            sp.style.opacity = '0';
          });
        })(s, (i / 12) * Math.PI * 2);
      }
      setTimeout(function(){ host.remove(); }, 1200);
    }catch(e){}
  }
  window.BD_toyPlay = function(item, btn){
    try{
      var r = btn ? btn.getBoundingClientRect() : { left: innerWidth / 2, top: innerHeight / 2, width: 0, height: 0 };
      burst(item.icon || '🎲', r.left + r.width / 2, r.top + r.height / 2);
      try{ if (window.BDSound && BDSound.select) BDSound.select(); }catch(eS){}
      var line = LINES[playN++ % LINES.length].replace(/\{n\}/g, item.name || '장난감');
      try{ if (window.BD_DAMI) BD_DAMI.show(line, { face: 'proud' }); }catch(eD){}
      try{ (window.BD_toast || window.bdToast)(item.icon + ' ' + (item.name || '장난감') + '(으)로 잠깐 놀았어요!', 2200); }catch(eT){}
    }catch(e){}
  };
  setInterval(function(){
    try{
      var d = document.getElementById('inv-detail');
      if (!d || !d.offsetHeight) return;
      if (window.__bdToyV375){ var o2 = d.querySelector('#bd-toy-btn'); if (o2) o2.remove(); return; }   /* (v375) 장난감별 놀이 버튼(0242)으로 대체 */
      var it = null;
      try{ it = (typeof playerInventory !== 'undefined' && typeof selectedInvItemId !== 'undefined' && playerInventory[selectedInvItemId]) ? playerInventory[selectedInvItemId].item : null; }catch(e2){}
      var old = d.querySelector('#bd-toy-btn');
      var isToy = !!(it && (it.tab === 'misc' || (it.heal == null && it.tab !== 'equip' && !it.featured)));
      if (!isToy){ if (old) old.remove(); return; }
      if (old){ old.__bdItem = it; return; }
      var b = document.createElement('button');
      b.id = 'bd-toy-btn';
      b.textContent = '🎲 가지고 놀기';
      b.style.cssText = 'margin-top:8px;padding:8px 14px;border-radius:10px;border:1px solid rgba(255,216,107,.5);background:#22304f;color:#ffd86b;font-weight:700;cursor:pointer;';
      b.__bdItem = it;
      b.addEventListener('click', function(e){ e.stopPropagation(); window.BD_toyPlay(b.__bdItem || it, b); });
      d.appendChild(b);
    }catch(e){}
  }, 500);
})();
