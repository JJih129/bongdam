/* (v399) 큰 이미지 에셋 재압축 — Chromium(Playwright) 내장 WebP 인코더로 다시 인코딩한다.
 *
 * 왜 브라우저로 하나: 이 PC 에 cwebp·sharp·ImageMagick 이 없고, 검수도구에는 Playwright 가 이미 있다.
 * Chromium 의 canvas.toBlob('image/webp', q) 는 libwebp 라 결과 품질도 같다.
 *
 * 무엇을 하나:
 *   1. 대상 파일을 페이지에서 디코드 → 캔버스 → 원하는 품질로 WebP 재인코딩 (크기는 유지, --scale 로 축소 가능)
 *   2. «원본 디코드 픽셀» 과 «재인코딩 디코드 픽셀» 의 PSNR 을 잰다 — 화질 손실을 숫자로 남긴다
 *   3. 조건(--min-gain 이상 작아지고 --min-psnr 이상)을 만족할 때만 채택
 *   4. 채택 시 src/assets 에 새 해시 이름으로 저장하고, 블록 안의 @@B64:옛이름@@ 토큰을 새 이름으로 바꾸고, 옛 파일은 지운다
 *      (에셋 이름은 내용 해시라 «내용이 바뀌면 이름이 바뀐다» 규칙을 지켜야 immutable 캐시가 낡은 파일을 내지 않는다)
 *
 * 사용: node 검수도구/tools/recompress_webp.cjs <src> <파일명|all|png> [--q=0.8] [--scale=1] [--min-gain=0.2] [--min-psnr=38] [--min-kb=] [--dry]
 *   all = src/assets 의 300KB 이상 이미지 전부 / png = 40KB 이상 PNG 전부(→ 손실 WebP + 알파, mime 접두어도 갱신)
 *
 * 2026-09-12 실측: 지도 WebP(이미 q85 손실)는 q0.8 재인코딩 이득이 11~21% 뿐이라 기각.
 *   PNG 건물 스프라이트(0097 41장·0002/0003 2장)는 90% 이상 줄어 채택.
 */
'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const { chromium } = require('playwright');

const args = process.argv.slice(2);
const SRC = args[0], TARGET = args[1];
if (!SRC || !TARGET) { console.error('사용: recompress_webp.cjs <src> <파일명|all> [--q=] [--scale=] [--min-gain=] [--min-psnr=] [--dry]'); process.exit(1); }
const opt = (k, d) => { const a = args.find(x => x.startsWith('--' + k + '=')); return a ? Number(a.slice(k.length + 3)) : d; };
const Q = opt('q', 0.8), SCALE = opt('scale', 1), MIN_GAIN = opt('min-gain', 0.2), MIN_PSNR = opt('min-psnr', 38);
const DRY = args.includes('--dry');
const ASSETS = path.join(SRC, 'assets'), BLOCKS = path.join(SRC, 'blocks');

const MIN_KB = opt('min-kb', TARGET === 'png' ? 40 : 300);
const bigger = re => fs.readdirSync(ASSETS).filter(f => re.test(f) && fs.statSync(path.join(ASSETS, f)).size >= MIN_KB * 1024);
const targets = TARGET === 'all' ? bigger(/\.(webp|png|jpe?g)$/i)
  : TARGET === 'png' ? bigger(/\.png$/i)
  : [TARGET];

/* 이름 규칙(unbundle.js:31-38): sha1(base64 본문) 앞 8자 + '_' + 힌트 + '.' + 확장자 */
function newName(oldName, buf) {
  const hint = oldName.replace(/^[0-9a-f]{8}_/, '').replace(/\.[^.]+$/, '');
  const hash = crypto.createHash('sha1').update(buf.toString('base64')).digest('hex').slice(0, 8);
  return hash + '_' + hint + '.webp';
}

/* 블록 본문은 latin1 로 읽고 쓴다(바이트 보존 관례) — 토큰은 ASCII 라 그대로 치환 가능 */
/* 형식이 바뀌면(png→webp) 토큰 앞의 mime 접두어도 같이 바꾼다 — data URI 는 선언된 mime 로 디코더를 고른다 */
function swapIn(s, oldName, name) {
  const tok = '@@B64:' + oldName + '@@';
  if (!s.includes(tok)) return null;
  let out = s.split('data:image/png;base64,' + tok).join('data:image/webp;base64,@@B64:' + name + '@@');
  out = out.split('data:image/jpeg;base64,' + tok).join('data:image/webp;base64,@@B64:' + name + '@@');
  out = out.split(tok).join('@@B64:' + name + '@@');
  return out;
}
function replaceRefs(oldName, name) {
  let hits = 0;
  const files = fs.readdirSync(BLOCKS).map(f => path.join(BLOCKS, f)).concat([path.join(SRC, 'shell.html')]);
  for (const p of files) {
    const s = fs.readFileSync(p).toString('latin1');
    const out = swapIn(s, oldName, name);
    if (out == null) continue;
    const n = s.split('@@B64:' + oldName + '@@').length - 1; hits += n;
    fs.writeFileSync(p, Buffer.from(out, 'latin1'));
    console.log('    참조 갱신 ' + path.basename(p) + ' ×' + n);
  }
  return hits;
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent('<html><body></body></html>');
  let saved = 0;
  for (const oldName of targets) {
    const p = path.join(ASSETS, oldName);
    if (!fs.existsSync(p)) { console.log('없음: ' + oldName); continue; }
    const orig = fs.readFileSync(p);
    const mime = /\.png$/i.test(oldName) ? 'image/png' : /\.jpe?g$/i.test(oldName) ? 'image/jpeg' : 'image/webp';
    const r = await page.evaluate(async ({ b64, mime, q, scale }) => {
      const load = src => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
      const img = await load('data:' + mime + ';base64,' + b64);
      const W = Math.round(img.naturalWidth * scale), H = Math.round(img.naturalHeight * scale);
      const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
      const cx = cv.getContext('2d'); cx.imageSmoothingQuality = 'high'; cx.drawImage(img, 0, 0, W, H);
      const blob = await new Promise(res => cv.toBlob(res, 'image/webp', q));
      const out = new Uint8Array(await blob.arrayBuffer());
      /* PSNR: 원본(같은 크기로 그린 것) vs 재인코딩 디코드 */
      const a = cx.getImageData(0, 0, W, H).data;
      const img2 = await load(URL.createObjectURL(blob));
      const cv2 = document.createElement('canvas'); cv2.width = W; cv2.height = H;
      const cx2 = cv2.getContext('2d'); cx2.drawImage(img2, 0, 0);
      const b = cx2.getImageData(0, 0, W, H).data;
      let se = 0, n = 0, sa = 0, na = 0;
      for (let i = 0; i < a.length; i += 4) {
        const w = a[i + 3] / 255;
        for (let k = 0; k < 3; k++) { const d = a[i + k] - b[i + k]; se += w * d * d; n += w; }
        const da = a[i + 3] - b[i + 3]; sa += da * da; na++;
      }
      const mse = n ? se / n : 0, psnr = mse === 0 ? 99 : 10 * Math.log10(255 * 255 / mse);
      const amse = sa / na, apsnr = amse === 0 ? 99 : 10 * Math.log10(255 * 255 / amse);
      let bin = ''; for (let i = 0; i < out.length; i += 0x8000) bin += String.fromCharCode.apply(null, out.subarray(i, i + 0x8000));
      return { w: img.naturalWidth, h: img.naturalHeight, W, H, b64: btoa(bin), psnr: +psnr.toFixed(2), apsnr: +apsnr.toFixed(2) };
    }, { b64: orig.toString('base64'), mime, q: Q, scale: SCALE });
    const out = Buffer.from(r.b64, 'base64');
    const gain = 1 - out.length / orig.length;
    const kb = x => Math.round(x / 1024);
    const accept = gain >= MIN_GAIN && r.psnr >= MIN_PSNR && r.apsnr >= MIN_PSNR;
    console.log((accept ? '✅ ' : '— ') + oldName + '  ' + r.w + 'x' + r.h + (SCALE !== 1 ? ' → ' + r.W + 'x' + r.H : '')
      + '  ' + kb(orig.length) + 'KB → ' + kb(out.length) + 'KB (' + Math.round(gain * 100) + '%)  PSNR ' + r.psnr + 'dB (알파 ' + r.apsnr + ')'
      + (accept ? '' : '  [기준 미달: 이득 ' + Math.round(MIN_GAIN * 100) + '% / PSNR ' + MIN_PSNR + ']'));
    if (!accept || DRY) continue;
    const name = newName(oldName, out);
    fs.writeFileSync(path.join(ASSETS, name), out);
    const hits = replaceRefs(oldName, name);
    if (!hits) { console.log('    ⚠ 참조가 없어 새 파일만 남김(옛 파일 유지): ' + name); continue; }
    fs.unlinkSync(p);
    console.log('    → ' + name);
    saved += orig.length - out.length;
  }
  await browser.close();
  console.log((DRY ? '[--dry] ' : '') + '절감 합계 ' + Math.round(saved / 1024) + 'KB');
})().catch(e => { console.error('실패: ' + e.message); process.exit(2); });
