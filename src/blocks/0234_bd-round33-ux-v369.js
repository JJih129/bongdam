/* (v369-ux) UX QA 반영: ① 담이 말풍선이 하단 키 안내바를 가리면 키바를 말풍선 위로(반복 보정) ② 임무 창의 빈 «전설/월드 임무 — 없음» 숨김 */
(function(){
  'use strict';
  function zoom(){ try{ var z = parseFloat(getComputedStyle(document.body).zoom) || 1; return z > 0 ? z : 1; }catch(e){ return 1; } }
  /* ① 키바 ↔ 말풍선 겹침 회피 — 겹치면 키바를 말풍선 위로, 안 겹치면(말풍선 사라짐) 원위치 */
  setInterval(function(){
    try{
      var kb = document.getElementById('bd-keybar'); if (!kb) return;
      var ks = getComputedStyle(kb); if (ks.display === 'none' || +ks.opacity < 0.05) return;
      var bb = document.getElementById('bd-dami-bubble');
      var on = bb && bb.classList.contains('on') && getComputedStyle(bb).visibility !== 'hidden' && +getComputedStyle(bb).opacity > 0.05;
      if (!on){ if (kb.style.bottom){ kb.style.bottom = ''; } return; }
      var rk = kb.getBoundingClientRect(), rb = bb.getBoundingClientRect();
      var xOverlap = !(rb.right < rk.left || rb.left > rk.right);
      if (!xOverlap){ if (kb.style.bottom) kb.style.bottom = ''; return; }
      var yOverlap = !(rb.bottom < rk.top || rb.top > rk.bottom);
      if (yOverlap){
        var cur = parseFloat(kb.style.bottom) || (parseFloat(ks.bottom) || 0);
        var need = (rk.bottom - rb.top + 8) / zoom();          /* 겹친 만큼 + 여백 */
        kb.style.transition = 'bottom .18s ease';
        kb.style.bottom = (cur + need) + 'px';
      }
    }catch(e){}
  }, 300);
  /* ② 임무 창 빈 섹션 숨김 */
  setInterval(function(){
    try{
      var m = document.getElementById('bd-questlog-modal'); if (!m || !m.classList.contains('show')) return;
      var els = [...m.querySelectorAll('div,span,p,li')].filter(function(e){ return e.children.length === 0 && (e.textContent||'').trim() === '없음'; });
      els.forEach(function(e){
        e.style.display = 'none';
        var p = e.previousElementSibling;
        if (p && /임무/.test(p.textContent||'') && !/메인/.test(p.textContent||'')) p.style.display = 'none';
      });
    }catch(e){}
  }, 500);
})();
/* (v369-ux) U-08 지도 열림 감지 → body.bd-map-open */
(function(){
  setInterval(function(){
    try{
      var m = document.getElementById('bd-map-v342');
      var open = !!(m && getComputedStyle(m).display !== 'none' && m.getBoundingClientRect().height > 0);
      if (document.body.classList.contains('bd-map-open') !== open) document.body.classList.toggle('bd-map-open', open);
    }catch(e){}
  }, 250);
})();
