// 주민 크기·들녘오름공원 배치 덤프 (베이크 기준)
'use strict';
const fs = require('fs');
const s = fs.readFileSync('D:/봉담/src/blocks/0002_anon.js', 'utf8');
const m = s.match(/window\.__BD_BAKED_STAGE_RAW = ("(?:[^"\\]|\\.)*");/);
const B = JSON.parse(JSON.parse(m[1]));
for (const sid of ['210', '211', '212', '213']) {
  const st = B.stages[sid];
  const res = (st.objects || []).filter(o => o.resident).map(o => [(o.npcName || o.label).slice(0, 8), +o.rw.toFixed(4), +o.rh.toFixed(4), o.__v370 ? 'NEW' : '', o.key]);
  console.log(sid, JSON.stringify(res));
  (st.objects || []).filter(o => /들녘/.test(o.label || '')).forEach(o => console.log(' 들녘', o.type, o.key, o.assetId, o.rx, o.ry, o.rw, o.rh, o.label));
  (st.__v24Landmarks || []).filter(o => /들녘/.test(o.label || '')).forEach(o => console.log(' 들녘LM', o.key, o.assetId, o.rx, o.ry, o.rw, o.rh));
}
for (const sid of ['210','211','212','213']) {
  const st = B.stages[sid];
  (st.objects || []).filter(o => /공원|park/i.test((o.label || '') + (o.key || ''))).forEach(o => console.log(sid, o.type, o.key, '|', o.label, '|', [o.rx, o.ry, o.rw, o.rh].map(v => +Number(v).toFixed(3)).join(','), o.collider ? 'col' : '', o.layer || '', o.zBelow || ''));
}
