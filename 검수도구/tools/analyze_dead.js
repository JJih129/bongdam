
'use strict';
const fs = require('fs');
const s = fs.readFileSync('D:/봉담/src/blocks/0002_anon.js', 'utf8');
const tag = 'window.__BD_BAKED_STAGE_RAW = ';
const i = s.indexOf(tag) + tag.length;
const j = s.indexOf('";', i) + 1;
const B = JSON.parse(JSON.parse(s.slice(i, j)));
const live = ['101', '210', '211', '212', '213'];
const dead = Object.keys(B.stages).filter(k => !live.includes(k));
console.log('bake stages:', Object.keys(B.stages).join(','));
console.log('dead:', dead.join(','));
let deadBytes = 0; const liveKeys = new Set();
for (const k of dead) deadBytes += JSON.stringify(B.stages[k]).length;
for (const k of live) (B.stages[k].objects || []).forEach(o => { if (o.key) liveKeys.add(String(o.key).replace('asset:', '')); if (o.assetId) liveKeys.add(o.assetId); });
console.log('dead bake bytes:', deadBytes, '/ live asset keys:', liveKeys.size);
fs.writeFileSync('D:/봉담/검수도구/tools/_livekeys.json', JSON.stringify([...liveKeys]));
