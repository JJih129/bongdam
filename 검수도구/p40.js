module.exports = [
  {
    name: 'v147-56 손으로 만진 콜라이더는 플레이 중 자동교정에서도 제외',
    from: `      if (_editing && _touched && width > 0 && height > 0) {
        object.colliderAnchorX = (Number(object.cx) - x) / width;
        object.colliderAnchorY = (Number(object.cy) - y) / height;
        object.colliderAnchorW = Number(object.cw) / width;
        object.colliderAnchorH = Number(object.ch) / height;
      } else {`,
    to: `      if (_editing && _touched && width > 0 && height > 0) {
        object.colliderAnchorX = (Number(object.cx) - x) / width;
        object.colliderAnchorY = (Number(object.cy) - y) / height;
        object.colliderAnchorW = Number(object.cw) / width;
        object.colliderAnchorH = Number(object.ch) / height;
        object.userColliderV147 = 1;   // 자동교정(투명벽 복구)이 건드리지 않게 표시
      } else {`,
  },
  {
    name: 'v147-56b 자동교정에서 사용자 편집 콜라이더 제외',
    from: `          var hasC = o.cx !== undefined && o.cy !== undefined && o.cw !== undefined && o.ch !== undefined;
          if (!hasC) return;
          if (!(o.cw > 0) || !(o.ch > 0)) return;        // 의도적으로 꺼 둔 콜라이더는 존중`,
    to: `          var hasC = o.cx !== undefined && o.cy !== undefined && o.cw !== undefined && o.ch !== undefined;
          if (!hasC) return;
          if (o.userColliderV147) return;                // (v147-56) 에디터에서 손으로 만진 콜라이더는 존중
          if (!(o.cw > 0) || !(o.ch > 0)) return;        // 의도적으로 꺼 둔 콜라이더는 존중`,
  },
];
