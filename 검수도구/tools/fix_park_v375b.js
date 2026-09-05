// (v375b) 들녘오름공원 — 세로 스프라이트(decoration) 숨김, 바닥 아트(fb_park_deulnyeok) 복원. 랜드마크는 바닥 사각형 기준.
'use strict';
const fs = require('fs');
const JSON_P = 'D:/봉담/bongdam_rpg_editor_data_v5_2_quest.json';
const BLK = 'D:/봉담/src/blocks/0002_anon.js';
function apply(J){
  const st = J.stages && J.stages['213']; if (!st) return 'no 213';
  const objs = st.objects || [];
  const ground = objs.find(o => o && o.key === 'asset:fb_park_deulnyeok');
  const deco = objs.find(o => o && /들녘오름공원/.test(o.label || '') && o.type === 'decoration');
  const log = [];
  if (ground){ ground.hidden = false; log.push('ground shown'); }
  if (deco){
    deco.key = 'asset:bdv16_db8fa535182cf3'; deco.assetId = 'bdv16_db8fa535182cf3'; delete deco.__v375park;
    deco.hidden = true; deco.__v375hidden = '바닥 아트(fb_park_deulnyeok)로 대체 — 세로 스프라이트 숨김';
    log.push('deco hidden');
  }
  (st.__v24Landmarks || []).forEach(l => {
    if (l && /들녘오름공원/.test(l.label || '')){
      l.key = 'asset:bdv16_db8fa535182cf3'; l.assetId = 'bdv16_db8fa535182cf3';
      if (ground){ l.rx = ground.rx; l.ry = ground.ry; l.rw = ground.rw; l.rh = ground.rh; }
      log.push('lm synced');
    }
  });
  return log.join(',');
}
const J = JSON.parse(fs.readFileSync(JSON_P, 'utf8')); console.log('JSON', apply(J)); fs.writeFileSync(JSON_P, JSON.stringify(J));
let src = fs.readFileSync(BLK, 'utf8');
const m = src.match(/window\.__BD_BAKED_STAGE_RAW = ("(?:[^"\\]|\\.)*");/);
const B = JSON.parse(JSON.parse(m[1])); console.log('BAKE', apply(B));
src = src.replace(m[0], 'window.__BD_BAKED_STAGE_RAW = ' + JSON.stringify(JSON.stringify(B)) + ';');
fs.writeFileSync(BLK, src);
