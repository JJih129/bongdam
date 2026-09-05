// (v375) ① 신규 주민 4명 크기 — 같은 리의 기존 주민 평균 rw/rh 로 맞춤
//        ② 들녘오름공원 — 세로로 선 스프라이트(bdv16_db8fa535182cf3) 대신 바닥 정방향 부지(bdv19_site_park_c32152c4971dae)로 교체,
//           구 바닥 아트(fb_park_deulnyeok)는 숨김. 배치 JSON + 베이크 동시 갱신 → restamp 필요.
'use strict';
const fs = require('fs');
const JSON_P = 'D:/봉담/bongdam_rpg_editor_data_v5_2_quest.json';
const BLK = 'D:/봉담/src/blocks/0002_anon.js';
function apply(J){
  const log = [];
  for (const sid of ['210','211','212','213']){
    const st = J.stages && J.stages[sid]; if (!st) continue;
    const objs = st.objects || [];
    const olds = objs.filter(o => o && o.resident && !o.__v370);
    const news = objs.filter(o => o && o.resident && o.__v370);
    if (olds.length && news.length){
      const rw = olds.reduce((a, o) => a + Number(o.rw || 0), 0) / olds.length;
      const rh = olds.reduce((a, o) => a + Number(o.rh || 0), 0) / olds.length;
      news.forEach(o => { o.rw = +rw.toFixed(4); o.rh = +rh.toFixed(4); log.push(sid + ' ' + (o.npcName || o.label) + ' → ' + o.rw + 'x' + o.rh); });
    }
    if (sid === '213'){
      const ground = objs.find(o => o && o.key === 'asset:fb_park_deulnyeok');
      const deco = objs.find(o => o && /들녘오름공원/.test(o.label || '') && o.type === 'decoration');
      if (deco){
        const rect = ground ? { rx: ground.rx, ry: ground.ry, rw: ground.rw, rh: ground.rh } : { rx: 0, ry: 0.473, rw: 0.111, rh: 0.51 };
        deco.key = 'asset:bdv19_site_park_c32152c4971dae'; deco.assetId = 'bdv19_site_park_c32152c4971dae';
        deco.rx = rect.rx; deco.ry = rect.ry; deco.rw = rect.rw; deco.rh = rect.rh;
        deco.__v375park = true;
        log.push('213 들녘오름공원 decoration → site asset ' + JSON.stringify(rect));
      }
      if (ground){ ground.hidden = true; log.push('213 fb_park_deulnyeok hidden'); }
      (st.__v24Landmarks || []).forEach(l => {
        if (l && /들녘오름공원/.test(l.label || '')){
          l.key = 'asset:bdv19_site_park_c32152c4971dae'; l.assetId = 'bdv19_site_park_c32152c4971dae';
          if (ground){ l.rx = ground.rx; l.ry = ground.ry; l.rw = ground.rw; l.rh = ground.rh; }
          log.push('213 들녘오름공원 landmark synced');
        }
      });
    }
  }
  return log;
}
const J = JSON.parse(fs.readFileSync(JSON_P, 'utf8'));
console.log('JSON:', apply(J).join(' | '));
fs.writeFileSync(JSON_P, JSON.stringify(J));
let src = fs.readFileSync(BLK, 'utf8');
const m = src.match(/window\.__BD_BAKED_STAGE_RAW = ("(?:[^"\\]|\\.)*");/);
const B = JSON.parse(JSON.parse(m[1]));
console.log('BAKE:', apply(B).join(' | '));
src = src.replace(m[0], 'window.__BD_BAKED_STAGE_RAW = ' + JSON.stringify(JSON.stringify(B)) + ';');
fs.writeFileSync(BLK, src);
console.log('→ restamp 필요');
