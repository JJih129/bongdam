/* (v400) 캡처 기준선 비교 — 두 폴더의 같은 이름 이미지를 픽셀 단위로 비교해 달라진 비율을 보고
 *   node 검수도구/tools/shots_diff.cjs <baseDir> <newDir> [--threshold=0.02] [--tol=40]
 *   달라진 픽셀 비율(0~1)이 threshold 를 넘으면 «변경»으로 표시. 외부 의존 없이 Chromium 캔버스로 디코딩.
 *   기준선 만들기: 검수도구/s_shots_ui_v399.cjs --out=검수도구/shots_baseline */
'use strict';
const { chromium } = require(require('path').join(__dirname, '..', 'node_modules', 'playwright'));
const fs = require('fs'), path = require('path');
const [, , A, B] = process.argv;
const opt = (k, d) => { const a = process.argv.find(x => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : d; };
const TH = Number(opt('threshold', '0.02')), TOL = Number(opt('tol', '40'));
if (!A || !B) { console.error('사용: node shots_diff.cjs <baseDir> <newDir> [--threshold=0.02] [--tol=40]'); process.exit(2); }
const files = fs.readdirSync(A).filter(f => /\.(jpe?g|png)$/i.test(f) && fs.existsSync(path.join(B, f)));
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  await p.setContent('<canvas id="c1"></canvas><canvas id="c2"></canvas>');
  const rows = []; let changed = 0;
  for (const f of files) {
    const da = 'data:image/' + (/png$/i.test(f) ? 'png' : 'jpeg') + ';base64,' + fs.readFileSync(path.join(A, f)).toString('base64');
    const db = 'data:image/' + (/png$/i.test(f) ? 'png' : 'jpeg') + ';base64,' + fs.readFileSync(path.join(B, f)).toString('base64');
    const r = await p.evaluate(async ([da, db, tol]) => {
      const load = src => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
      const [ia, ib] = await Promise.all([load(da), load(db)]);
      if (ia.width !== ib.width || ia.height !== ib.height) return { ratio: 1, note: 'size ' + ia.width + 'x' + ia.height + ' vs ' + ib.width + 'x' + ib.height };
      const w = ia.width, h = ia.height;
      const c1 = document.getElementById('c1'), c2 = document.getElementById('c2'); c1.width = c2.width = w; c1.height = c2.height = h;
      const x1 = c1.getContext('2d'), x2 = c2.getContext('2d'); x1.drawImage(ia, 0, 0); x2.drawImage(ib, 0, 0);
      const A = x1.getImageData(0, 0, w, h).data, Bd = x2.getImageData(0, 0, w, h).data;
      let diff = 0, n = w * h;
      for (let i = 0; i < A.length; i += 4) { if (Math.abs(A[i] - Bd[i]) > tol || Math.abs(A[i + 1] - Bd[i + 1]) > tol || Math.abs(A[i + 2] - Bd[i + 2]) > tol) diff++; }
      return { ratio: diff / n, note: '' };
    }, [da, db, TOL]);
    const mark = r.ratio > TH ? '≠' : '=';
    if (r.ratio > TH) changed++;
    rows.push(mark + ' ' + f.padEnd(34) + (r.ratio * 100).toFixed(1).padStart(6) + '%' + (r.note ? '  ' + r.note : ''));
  }
  await b.close();
  console.log(rows.join('\n'));
  console.log('비교 ' + files.length + '장 · 변경 ' + changed + '장 (기준 ' + (TH * 100) + '%)');
  process.exit(0);
})().catch(e => { console.error('실패: ' + e.message); process.exit(2); });
