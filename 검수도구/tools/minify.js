/* 배포 산출물의 인라인 JS 최소화 — 주석과 들여쓰기를 뺀다.
 *
 * ── 왜 ────────────────────────────────────────────────────────────
 *   index.html 3.58MB 중 92%(3.29MB)가 인라인 <script> 다. 그 안에
 *   주석 160KB + 들여쓰기 195KB = 354KB 가 배포본까지 실려 간다.
 *   내려받는 양(brotli 후)도 줄지만, 더 큰 것은 «파싱 시간»이다 —
 *   CPU 4배 감속(중급 폰 흉내)에서 파싱·실행에 2,386ms 가 걸린다.
 *
 * ── 왜 정규식으로 안 하나 ─────────────────────────────────────────
 *   «//» 로 시작하는 줄을 지우는 식의 처리는 템플릿 리터럴·정규식 안의 문자열을
 *   건드려 조용히 코드를 깨뜨린다. 그래서 실제 파서(terser)를 쓴다.
 *
 *   이름 축약(mangle)과 코드 변형(compress)은 «끄고» 시작한다.
 *   217개 블록이 전역을 공유하므로 이름을 바꾸면 블록 사이 참조가 끊긴다.
 *   주석·공백만 빼도 목표한 354KB 는 회수된다.
 *
 * ── 안전장치 ──────────────────────────────────────────────────────
 *   블록 하나라도 파싱에 실패하면 그 블록은 원본 그대로 두고 보고한다.
 *   조용히 깨진 산출물을 내보내는 것보다 낫다.
 *   terser 가 없으면 아무것도 하지 않고 넘어간다(리포만으로 빌드가 되게).
 *
 * 사용: node minify.js <outdir>
 */
'use strict';
const fs = require('fs');
const path = require('path');

const OUT = process.argv[2];
if (!OUT) { console.error('사용: node minify.js <outdir>'); process.exit(1); }

let terser = null;
try { terser = require('terser'); }
catch (e) {
  console.log('  · terser 없음 — 최소화 건너뜀 (npm i terser 로 설치)');
  process.exit(0);
}

const file = path.join(OUT, 'index.html');
const html = fs.readFileSync(file).toString('latin1');

/* 본문 전체가 latin1 표현이다. 최소화는 «문자열»에 대해 해야 하므로
   블록마다 latin1 → utf8 → (최소화) → latin1 로 되돌린다.
   이 변환을 빼먹으면 한글이 깨진다(이 저장소에서 이미 한 번 겪었다). */
const toUtf8 = s => Buffer.from(s, 'latin1').toString('utf8');
const toLatin1 = s => Buffer.from(s, 'utf8').toString('latin1');

const RE = /<script([^>]*)>([\s\S]*?)<\/script>/g;

(async () => {
  let before = 0, after = 0, n = 0, skipped = 0, failed = [];
  const parts = [];
  let last = 0, m;

  while ((m = RE.exec(html))) {
    parts.push(html.slice(last, m.index));
    last = m.index + m[0].length;
    const attrs = m[1] || '', body = m[2] || '';

    /* 외부 스크립트나 JS 가 아닌 블록은 건드리지 않는다 */
    const isJs = !/\bsrc\s*=/.test(attrs) &&
      (!/\btype\s*=/.test(attrs) || /type\s*=\s*["']?(text\/javascript|application\/javascript|module)/.test(attrs));
    if (!isJs || body.trim().length < 40) {
      parts.push(m[0]); skipped++; continue;
    }

    before += body.length;
    let out = body;
    try {
      const r = await terser.minify(toUtf8(body), {
        compress: false,
        mangle: false,
        format: { comments: false },
        sourceMap: false
      });
      if (r && typeof r.code === 'string') {
        /* 결과가 비는 것이 «정상»인 경우가 있다 — STRIP 된 에디터 블록은 내용이
           주석 한 줄뿐이라 최소화하면 당연히 빈 문자열이 된다.
           원본에 «코드»가 있었는지로 갈라야 한다. 그러지 않고 빈 결과를 무조건
           실패로 보다가 정상 블록 13개를 실패로 셌다. */
        const hadCode = /[^\s]/.test(
          toUtf8(body).replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/^\s*\/\/.*$/gm, ' ')
        );
        if (r.code.length || !hadCode) out = toLatin1(r.code);
        else throw new Error('코드가 있는데 결과가 비었다');
      } else throw new Error('결과 없음');
      n++;
    } catch (e) {
      /* 못 줄이면 원본 그대로 — 깨뜨리지 않는 것이 우선이다 */
      failed.push((attrs.match(/id\s*=\s*["']([^"']+)/) || [, '(id없음)'])[1] + ': ' + String(e.message).slice(0, 60));
      out = body;
    }
    after += out.length;
    parts.push('<script' + attrs + '>' + out + '</script>');
  }
  parts.push(html.slice(last));

  const result = parts.join('');
  fs.writeFileSync(file, Buffer.from(result, 'latin1'));

  const kb = x => Math.round(x / 1024);
  console.log('  · JS 최소화: ' + n + '개 블록 ' + kb(before) + 'KB → ' + kb(after) + 'KB'
    + ' (-' + kb(before - after) + 'KB)' + (skipped ? ' · 건너뜀 ' + skipped : ''));
  console.log('  · index.html ' + kb(html.length) + 'KB → ' + kb(result.length) + 'KB');
  if (failed.length) {
    console.log('  ⚠ 최소화 실패(원본 유지) ' + failed.length + '개:');
    failed.slice(0, 5).forEach(f => console.log('      ' + f));
  }
})().catch(e => { console.error('최소화 실패: ' + e.message); process.exit(1); });
