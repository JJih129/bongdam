module.exports = [
  {
    name: 'v147-53 콜라이더 수동 편집이 900ms 앵커 동기화에 되돌려지던 문제',
    from: `    if (object._colliderFollowsResize && object.colliderAnchorX != null) {
      object.cx = x + width * Number(object.colliderAnchorX);
      object.cy = y + height * Number(object.colliderAnchorY);
      object.cw = width * Number(object.colliderAnchorW);
      object.ch = height * Number(object.colliderAnchorH);
    }
    return object;
  }`,
    to: `    if (object._colliderFollowsResize && object.colliderAnchorX != null) {
      /* (v147) 이 동기화는 900ms마다(rebuildRegistries) «앵커 비율 × 본체 사각형»으로
         콜라이더를 다시 쓴다. 그래서 에디터에서 콜라이더를 옮기거나 크기를 바꿔도
         1초 안에 원위치로 되돌아갔다 — «콜라이더가 안 움직인다»의 진짜 원인.
         → 에디터가 열려 있을 때 콜라이더가 앵커 예상값과 다르면
           «사용자가 손으로 만진 것»이므로, 콜라이더를 진실로 삼아 앵커를 역산한다.
           (본체를 옮기거나 리사이즈하면 에디터가 콜라이더도 함께 옮기므로
            비율이 유지돼 이 분기에 걸리지 않는다 — 기존 «따라가기»는 그대로 동작) */
      const _ecx = x + width * Number(object.colliderAnchorX);
      const _ecy = y + height * Number(object.colliderAnchorY);
      const _ecw = width * Number(object.colliderAnchorW);
      const _ech = height * Number(object.colliderAnchorH);
      let _editing = false;
      try { _editing = !!(window.BongdamEditor && BongdamEditor.state && BongdamEditor.state.enabled); } catch (e) {}
      const _touched = object.cx !== undefined &&
        (Math.abs(Number(object.cx) - _ecx) > 0.0004 || Math.abs(Number(object.cy) - _ecy) > 0.0004 ||
         Math.abs(Number(object.cw) - _ecw) > 0.0004 || Math.abs(Number(object.ch) - _ech) > 0.0004);
      if (_editing && _touched && width > 0 && height > 0) {
        object.colliderAnchorX = (Number(object.cx) - x) / width;
        object.colliderAnchorY = (Number(object.cy) - y) / height;
        object.colliderAnchorW = Number(object.cw) / width;
        object.colliderAnchorH = Number(object.ch) / height;
      } else {
        object.cx = _ecx;
        object.cy = _ecy;
        object.cw = _ecw;
        object.ch = _ech;
      }
    }
    return object;
  }`,
  },
  {
    name: 'v147-54a 정화 후 그림도 렉트를 따르게',
    from: `        try{ ctx.drawImage(_imC, cx - _s/2, cy - _s/2, _s, _s); }catch(e){ _imC = null; }`,
    to: `        if (obj.hzRectV147){
          /* (v147) 렉트 그대로 그리기 — 에디터에서 바꾼 크기·비율이 그대로 보인다 */
          const _dx = toScreenX(obj.rx, canvas), _dy = toScreenY(obj.ry, canvas);
          const _dw = toScreenW(obj.rw, canvas), _dh = toScreenH(obj.rh, canvas);
          try{ ctx.drawImage(_imC, _dx, _dy, _dw, _dh); }catch(e){ _imC = null; }
        } else {
          try{ ctx.drawImage(_imC, cx - _s/2, cy - _s/2, _s, _s); }catch(e){ _imC = null; }
        }`,
  },
  {
    name: 'v147-54b 위험요소 그림이 렉트(가로·세로·비율)를 따르게',
    from: `        var _im = _hzIm;
        if(_im){
          var _s = rad * 2.1;   // (v240) 데칼형 스프라이트 — 바닥까지 그려져 있어 여유 있게
          try{ ctx.drawImage(_im, cx - _s/2, cy - _s/2, _s, _s); }catch(e){ _im = null; }
        }`,
    to: `        var _im = _hzIm;
        if(_im && obj.hzRectV147){
          /* (v147) 예전에는 max(rw,rh) 기준 «정사각형»으로만 그려
             에디터에서 가로·세로를 따로 바꿔도 화면이 그대로였다.
             hzRectV147 마이그레이션(부팅 시 1회, 기존 화면 크기를 렉트로 굽기) 후에는
             렉트를 그대로 그린다 — 이제 크기·비율 조절이 눈에 보인다. */
          const _dx = toScreenX(obj.rx, canvas), _dy = toScreenY(obj.ry, canvas);
          const _dw = toScreenW(obj.rw, canvas), _dh = toScreenH(obj.rh, canvas);
          try{ ctx.drawImage(_im, _dx, _dy, _dw, _dh); }catch(e){ _im = null; }
        } else if(_im){
          var _s = rad * 2.1;   // (v240) 데칼형 스프라이트 — 바닥까지 그려져 있어 여유 있게
          try{ ctx.drawImage(_im, cx - _s/2, cy - _s/2, _s, _s); }catch(e){ _im = null; }
        }`,
  },
  {
    name: 'v147-55 v147 투명벽 자동교정이 에디터 편집과 싸우지 않게',
    from: `  var fixedOnce = {};
  function repairColliders(){
    try{
      if (typeof STAGES === 'undefined') return;`,
    to: `  var fixedOnce = {};
  function repairColliders(){
    try{
      if (typeof STAGES === 'undefined') return;
      /* (v147-55) 에디터가 열려 있는 동안엔 교정하지 않는다 —
         콜라이더를 본체 밖으로 일부러 옮기는 편집을 되돌려 버리면 안 된다 */
      try{ if (window.BongdamEditor && BongdamEditor.state && BongdamEditor.state.enabled) return; }catch(eEd){}`,
  },
];
