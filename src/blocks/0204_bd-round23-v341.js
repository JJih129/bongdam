
(function(){
  'use strict';

  /* ── ② 라이트 미니게임 감시견 — 어떤 경로든 8초 넘게 남으면 제거 ── */
  setInterval(function(){
    try{
      var b = document.getElementById('bd-mg-light');
      if (!b) return;
      if (!b.__bdSeenAt) b.__bdSeenAt = Date.now();
      if (Date.now() - b.__bdSeenAt > 8000) b.remove();
    }catch(e){}
  }, 1000);

  /* ── ④ 상점별 상품 차이 — 상점 라벨 해시로 일부 품목을 «품절» 처리(첫 품목은 항상 유지) ── */
  function hashStr(s){ var x = 0; for (var i = 0; i < s.length; i++){ x = ((x << 5) - x + s.charCodeAt(i)) | 0; } return Math.abs(x); }
  function varyShop(){
    try{
      var ov = document.getElementById('shop-overlay');
      if (!ov || getComputedStyle(ov).display === 'none') return;
      var title = (document.getElementById('shop-title') || {}).textContent || '';
      var items = document.getElementById('shop-items');
      if (!items) return;
      var rows = [].slice.call(items.children);
      if (rows.length < 3) return;
      var hs = hashStr(title);
      rows.forEach(function(row, i){
        if (i === 0){ row.style.removeProperty('display'); return; }   /* 첫 품목(간식류)은 전 지점 공통 */
        var hide = ((hs + i * 7) % 10) < 3;                            /* 상점마다 다른 ~30% 품절 */
        if (hide){
          if (!row.__bdSold){
            row.__bdSold = true;
            row.style.opacity = '0.45';
            row.style.filter = 'grayscale(0.8)';
            var btn = row.querySelector('button');
            if (btn){ btn.disabled = true; btn.textContent = '품절'; }
            var tag = document.createElement('div');
            tag.textContent = '오늘은 품절이에요';
            tag.style.cssText = 'font-size:11px;color:#c8a15a;margin-top:2px;';
            row.appendChild(tag);
          }
        }
      });
    }catch(e){}
  }
  setInterval(varyShop, 700);

  /* ── ⑤ 엔딩 전용 축하 연출 — 콘페티 + 통계 ── */
  var fxDone = false;
  function stats(){
    var pur = 0, fac = 0;
    try{ pur = Object.keys((window.BD && BD.purified) || {}).length; }catch(e){}
    try{ fac = (window.BD_PROGRESS && BD_PROGRESS.facility && BD_PROGRESS.facility.facilityStampIds || []).length; }catch(e){}
    var min = 0;
    try{ var t0 = Number(localStorage.getItem('bd_play_started') || 0); if (t0) min = Math.max(1, Math.round((Date.now() - t0) / 60000)); }catch(e){}
    return { pur: pur, fac: fac, min: min };
  }
  function confetti(cv, ms){
    var ctx = cv.getContext('2d');
    var W = cv.width = cv.offsetWidth, H = cv.height = cv.offsetHeight;
    var COLORS = ['#ffd86b', '#7cc4ff', '#ff8fa0', '#8effa0', '#e8b4ff', '#ffe9a8'];
    var ps = [];
    for (var i = 0; i < 160; i++){
      ps.push({ x: Math.random() * W, y: -20 - Math.random() * H * 0.6, w: 6 + Math.random() * 7, h: 8 + Math.random() * 8,
        vy: 1.6 + Math.random() * 2.6, vx: -1 + Math.random() * 2, rot: Math.random() * 6.28, vr: -0.12 + Math.random() * 0.24,
        c: COLORS[i % COLORS.length] });
    }
    var t0 = Date.now();
    (function frame(){
      if (Date.now() - t0 > ms) { ctx.clearRect(0, 0, W, H); return; }
      ctx.clearRect(0, 0, W, H);
      ps.forEach(function(p){
        p.y += p.vy; p.x += p.vx + Math.sin((p.y + p.w) / 26); p.rot += p.vr;
        if (p.y > H + 20){ p.y = -20; p.x = Math.random() * W; }
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.c;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); ctx.restore();
      });
      requestAnimationFrame(frame);
    })();
  }
  /* (v399) 구 엔딩 연출 루프 삭제 — v345 부터 첫 줄이 return 이라 600ms 마다 아무것도 안 하고 돌았다.
     신형 엔딩 전용신(0211)이 담당한다. */
})();
