module.exports = [
  {
    name: 'v147 위험요소 렉트 마이그레이션 레이어',
    type: 'append_before_body_end',
    id: 'bd-hazard-rect-v147',
    html: `
<script id="bd-hazard-rect-v147">
/* (v147) 위험요소 «보이는 대로 편집(WYSIWYG)» 마이그레이션
   ────────────────────────────────────────────────────────────
   기존 렌더는 렉트와 무관하게 max(rw,rh) 기준 정사각형으로 그렸다.
   그래서 에디터에서 가로·세로·비율을 바꿔도 화면은 그대로였고,
   선택 상자(점선)와 실제 그림이 어긋나 있었다.

   여기서는 «현재 화면에 그려지던 크기»를 렉트에 한 번 구워 넣는다(hzRectV147).
   이후 렌더는 렉트를 그대로 그리므로:
   · 기존 배치의 화면 모습은 변하지 않고
   · 에디터의 크기·비율 조절이 즉시 화면에 반영된다.
   변환은 화면 변환식이 준비된 «현재 스테이지»에서만, 오브젝트당 1회. */
(function(){
  'use strict';

  function hasArt(o){
    try{
      if (!o || !o.hazardVariant || !window.BD_ASSETS) return false;
      return !!(BD_ASSETS.image('field.hazard.' + o.hazardVariant) ||
                BD_ASSETS.image('field.hazard_clean.' + o.hazardVariant));
    }catch(e){ return false; }
  }

  function migrateCurrentStage(){
    try{
      if (typeof STAGES === 'undefined' || typeof currentStage === 'undefined') return;
      if (typeof toScreenW !== 'function' || typeof toScreenH !== 'function') return;
      var cv = document.getElementById('game-canvas');
      if (!cv || !cv.width) return;
      var st = STAGES[Number(currentStage)];
      if (!st || !Array.isArray(st.objects)) return;
      /* 화면 변환이 이 스테이지 기준으로 잡혀 있어야 정확하다 */
      var pxW = toScreenW(1, cv), pxH = toScreenH(1, cv);
      if (!(pxW > 0) || !(pxH > 0)) return;
      st.objects.forEach(function(o){
        if (!o || o.interactable !== 'hazard' || o.hzRectV147) return;
        if (!hasArt(o)) return;                       // 그림 없는 위험요소는 그대로(⚠️ 폴백)
        var rw = Number(o.rw) || 0.05, rh = Number(o.rh) || 0.05;
        var sqPx = Math.max(rw * pxW, rh * pxH) * 1.05;   // 기존 렌더의 정사각형 한 변
        var newW = sqPx / pxW, newH = sqPx / pxH;
        var cx0 = (Number(o.rx) || 0) + rw / 2;
        var cy0 = (Number(o.ry) || 0) + rh / 2;
        o.rx = Math.max(0, Math.min(1 - newW, cx0 - newW / 2));
        o.ry = Math.max(0, Math.min(1 - newH, cy0 - newH / 2));
        o.rw = newW; o.rh = newH;
        o.hzRectV147 = 1;                             // 저장에도 함께 남는 순수 필드
      });
    }catch(e){}
  }

  setInterval(migrateCurrentStage, 1200);
  setTimeout(migrateCurrentStage, 2500);
})();
</script>`,
  },
];
