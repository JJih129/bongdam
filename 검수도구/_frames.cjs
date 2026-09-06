/* 영상 프레임 추출 — ffmpeg 없이 Chromium 디코더를 쓴다.
 * 사용: node frames.cjs <영상경로> <출력폴더> [초당장수]
 */
'use strict';
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');

const VID = process.argv[2];
const OUT = process.argv[3] || path.join(path.dirname(VID), '_frames');
const FPS = Number(process.argv[4] || 2);

if (!fs.existsSync(VID)) { console.error('영상 없음: ' + VID); process.exit(1); }
fs.mkdirSync(OUT, { recursive: true });

const dir = path.dirname(VID).replace(/\\/g, '/');
const name = path.basename(VID);
const htmlPath = path.join(path.dirname(VID), '_player.html');
fs.writeFileSync(htmlPath,
  '<!doctype html><meta charset="utf-8"><body style="margin:0;background:#000">' +
  '<video id="v" src="' + encodeURI(name) + '" muted playsinline></video>');

(async () => {
  const b = await chromium.launch({ headless: true, channel: 'chrome', args: ['--allow-file-access-from-files', '--autoplay-policy=no-user-gesture-required'] });
  const p = await (await b.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
  await p.goto('file:///' + htmlPath.replace(/\\/g, '/'), { waitUntil: 'load', timeout: 120000 });

  const meta = await p.evaluate(() => new Promise(res => {
    const v = document.getElementById('v');
    const done = () => res({ dur: v.duration, w: v.videoWidth, h: v.videoHeight });
    if (v.readyState >= 1) done(); else v.addEventListener('loadedmetadata', done, { once: true });
    setTimeout(() => res({ dur: v.duration || 0, w: v.videoWidth || 0, h: v.videoHeight || 0 }), 20000);
  }));
  console.log('길이 ' + (meta.dur || 0).toFixed(1) + 's · ' + meta.w + 'x' + meta.h);
  if (!meta.dur || !meta.w) { console.error('디코딩 실패 — 코덱 미지원일 수 있음'); await b.close(); process.exit(2); }

  const step = 1 / FPS;
  let n = 0;
  for (let t = 0; t < meta.dur; t += step) {
    const dataUrl = await p.evaluate(async (tt) => {
      const v = document.getElementById('v');
      await new Promise(r => { v.addEventListener('seeked', r, { once: true }); v.currentTime = tt; });
      const c = document.createElement('canvas');
      c.width = v.videoWidth; c.height = v.videoHeight;
      c.getContext('2d').drawImage(v, 0, 0);
      return c.toDataURL('image/png');
    }, t).catch(() => null);
    if (!dataUrl) continue;
    n++;
    const f = path.join(OUT, 'f' + String(n).padStart(3, '0') + '_' + t.toFixed(1) + 's.png');
    fs.writeFileSync(f, Buffer.from(dataUrl.split(',')[1], 'base64'));
  }
  console.log('추출 ' + n + '장 → ' + OUT);
  await b.close();
  try { fs.unlinkSync(htmlPath); } catch (e) {}
})().catch(e => { console.error(e.message); process.exit(1); });
