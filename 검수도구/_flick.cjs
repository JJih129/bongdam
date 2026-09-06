/* 프레임 시퀀스에서 «깜박임»을 수치로 찾는다.
 * 관심 영역(우상단 HUD 등)의 평균 밝기를 프레임마다 재고, 두 상태를 오가는 진동을 검출한다.
 * 사용: node _flick.cjs <프레임폴더>
 */
'use strict';
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');

const DIR = process.argv[2];
const files = fs.readdirSync(DIR).filter(f => /\.png$/.test(f)).sort();
if (!files.length) { console.error('프레임 없음'); process.exit(1); }

/* 관심 영역 — 비율(0~1) 기준이라 해상도와 무관 */
const ROIS = {
  '우상단HUD': [0.72, 0.00, 1.00, 0.18],
  '좌상단HP': [0.00, 0.00, 0.30, 0.18],
  '좌하단조이': [0.00, 0.70, 0.30, 1.00],
  '중앙': [0.30, 0.30, 0.70, 0.70],
  '전체': [0, 0, 1, 1]
};

(async () => {
  const b = await chromium.launch({ headless: true, channel: 'chrome' });
  const p = await (await b.newContext()).newPage();
  await p.goto('about:blank');

  const series = {};
  Object.keys(ROIS).forEach(k => series[k] = []);

  for (const f of files) {
    const buf = fs.readFileSync(path.join(DIR, f));
    const b64 = buf.toString('base64');
    const vals = await p.evaluate(async ([d, rois]) => {
      const img = new Image();
      await new Promise(r => { img.onload = r; img.onerror = r; img.src = 'data:image/png;base64,' + d; });
      const c = document.createElement('canvas');
      c.width = img.width; c.height = img.height;
      const x = c.getContext('2d', { willReadFrequently: true });
      x.drawImage(img, 0, 0);
      const out = {};
      for (const k of Object.keys(rois)) {
        const [a, b2, c2, d2] = rois[k];
        const rx = Math.round(a * img.width), ry = Math.round(b2 * img.height);
        const rw = Math.max(1, Math.round((c2 - a) * img.width)), rh = Math.max(1, Math.round((d2 - b2) * img.height));
        const px = x.getImageData(rx, ry, rw, rh).data;
        let s = 0;
        for (let i = 0; i < px.length; i += 16) s += px[i] + px[i + 1] + px[i + 2];
        out[k] = +(s / (px.length / 16) / 3).toFixed(2);
      }
      return out;
    }, [b64, ROIS]);
    Object.keys(vals).forEach(k => series[k].push(vals[k]));
  }
  await b.close();

  console.log('프레임 ' + files.length + '장 (2fps → ' + (files.length / 2).toFixed(0) + '초)');
  console.log('');
  for (const k of Object.keys(series)) {
    const v = series[k];
    const d = [];
    for (let i = 1; i < v.length; i++) d.push(Math.abs(v[i] - v[i - 1]));
    const mean = d.reduce((a, x) => a + x, 0) / d.length;
    /* 부호가 계속 뒤집히면 «두 상태를 오가는» 진동이다 */
    let flips = 0;
    for (let i = 2; i < v.length; i++) {
      const a = v[i - 1] - v[i - 2], b2 = v[i] - v[i - 1];
      if (Math.abs(a) > mean && Math.abs(b2) > mean && a * b2 < 0) flips++;
    }
    const top = d.map((x, i) => ({ i: i + 1, x })).sort((a, b2) => b2.x - a.x).slice(0, 3);
    console.log(k.padEnd(12) + ' 평균변화 ' + mean.toFixed(2)
      + ' · 진동 ' + flips + '회/' + d.length
      + ' · 큰변화 ' + top.map(t => 'f' + t.i + '(' + t.x.toFixed(1) + ')').join(' '));
  }
})().catch(e => { console.error(e.message); process.exit(1); });
