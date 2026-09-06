/* 인라인 JS 를 외부 파일 하나로 빼고 defer 로 불러온다.
 *
 * ── 왜 ────────────────────────────────────────────────────────────
 *   블록별 실행 시간을 재 보니 «실행»은 다 합쳐 513ms 인데 마지막 블록이 끝나는 건
 *   3124ms 였다(CPU 4배 감속). 2.6초 중 2.1초가 «파싱»이다.
 *   인라인 <script> 는 HTML 파서를 세운 채로 그 자리에서 파싱·실행된다.
 *   외부 파일 + defer 로 빼면
 *     · HTML 파싱이 스크립트에 막히지 않는다
 *     · 스크립트는 HTML 을 읽는 동안 병렬로 내려받힌다
 *     · 브라우저가 별도 스레드에서 미리 파싱·컴파일할 수 있다
 *     · 실행 순서는 문서 순서 그대로 유지된다(defer 의 보장)
 *
 *   재방문에도 크게 이득이다. 지금은 index.html 이 no-cache 라 매번 2.7MB 를 다시 받는다.
 *   빼내면 index.html 은 ~90KB 만 남고, 파일명에 내용 해시가 붙은 JS 는 1년 캐시된다.
 *
 * ── 안전 ──────────────────────────────────────────────────────────
 *   document.write · document.currentScript · script[id] 조회가 하나도 없음을 확인하고 한다.
 *   (셋 중 하나라도 있으면 이 변환은 조용히 동작을 바꾼다.)
 *   블록들은 원래도 같은 전역을 공유하므로 이어 붙여도 스코프는 같다.
 *   다만 «한 블록이 예외를 던져도 다음 블록은 실행되던» 성질은 사라진다.
 *   지금 콘솔 에러가 0 이라 문제 없지만, 그래서 빌드 후 반드시 검증한다.
 *
 * 사용: node splitjs.js <outdir>
 */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const OUT = process.argv[2];
if (!OUT) { console.error('사용: node splitjs.js <outdir>'); process.exit(1); }

const file = path.join(OUT, 'index.html');
let html = fs.readFileSync(file).toString('latin1');

/* 이 변환이 안전한지 다시 확인한다 — 소스가 바뀌어 조건이 깨질 수 있다 */
const unsafe = [];
if (/document\s*\.\s*write/.test(html)) unsafe.push('document.write');
if (/currentScript/.test(html)) unsafe.push('document.currentScript');
if (/querySelector\s*\(\s*["']script/.test(html)) unsafe.push('script 조회');
if (unsafe.length) {
  console.log('  · JS 외부 분리 건너뜀 — ' + unsafe.join(', ') + ' 가 있어 동작이 달라질 수 있음');
  process.exit(0);
}

const RE = /<script([^>]*)>([\s\S]*?)<\/script>/g;
const bodies = [];
let firstAt = -1, m, parts = [], last = 0, kept = 0;

while ((m = RE.exec(html))) {
  const attrs = m[1] || '', body = m[2] || '';
  const isJs = !/\bsrc\s*=/.test(attrs) &&
    (!/\btype\s*=/.test(attrs) || /type\s*=\s*["']?(text\/javascript|application\/javascript)/.test(attrs));
  /* 모듈·JSON·외부 스크립트는 그대로 둔다 */
  if (!isJs) { kept++; continue; }
  parts.push(html.slice(last, m.index));
  last = m.index + m[0].length;
  if (firstAt < 0) firstAt = parts.length;      /* 첫 스크립트 자리 기억 */
  bodies.push(body);
}
parts.push(html.slice(last));

if (!bodies.length) { console.log('  · 뺄 인라인 스크립트가 없음'); process.exit(0); }

/* 순서를 지켜 이어 붙인다. 블록 사이에 개행과 세미콜론을 넣어
   «세미콜론 없이 끝난 블록 + 다음 블록 첫 줄» 이 한 문장으로 붙는 사고를 막는다. */
/* 부팅이 끝나면 입력 잠금을 푼다 — 번들의 맨 끝에 붙인다.
   (한 블록이 던져도 여기까지 오도록 try 로 감싸지 않는다 — 감싸면 스코프가 달라진다.
    대신 브라우저가 스크립트 실행을 멈추는 경우를 대비해 아래 head 쪽에 안전장치를 둔다.) */
const UNLOCK = '\n;document.documentElement.classList.remove("bd-booting");';
const js = bodies.join('\n;\n') + UNLOCK;
const buf = Buffer.from(js, 'latin1');
const hash = crypto.createHash('sha1').update(buf).digest('hex').slice(0, 8);
const name = hash + '_game.js';
fs.writeFileSync(path.join(OUT, 'assets', name), buf);

/* defer 로 넣는다 — 문서 파싱을 막지 않고, 실행은 문서 순서대로 파싱이 끝난 뒤.
   defer 를 빼고 «첫 스크립트 자리에서 막는» 방식도 시도했는데 더 나빴다.
   원래 인라인 블록들은 문서 여기저기에 흩어져 있어 뒤쪽 블록은 자기 앞의 마크업이
   만들어진 뒤에 실행됐다. 하나로 합쳐 앞에서 막으면 그 순서가 무너져
   appendChild(null) 이 난다. defer 는 «전부 DOM 이 준비된 뒤»라 그 조건을 만족한다.

   다만 defer 는 «정적 마크업이 JS 보다 먼저 눌릴 수 있는» 창을 만든다.
   shell.html 의 캐릭터 카드는 onclick="selectCharacter(1)" 을 마크업에 들고 있어,
   번들 실행 전에 누르면 ReferenceError 가 난다(검증에서 3/3 재현).
   그래서 부팅이 끝날 때까지 입력을 막는다 — 아래 BOOT_GUARD. */
const tag = '<script defer src="assets/' + name + '"></script>';
parts.splice(firstAt, 0, tag);

/* BOOT_GUARD — 번들이 실행되기 전에는 아무것도 눌리지 않게 한다.
   defer 로 얻은 «파싱이 막히지 않는» 이득을 지키면서, 그 대가로 생기는
   «핸들러 없는 마크업이 눌리는» 창을 없앤다.
   번들 끝에서 클래스를 지운다. 혹시 번들이 실행되지 못하는 상황(네트워크 실패 등)에도
   화면이 영영 잠기지 않게 8초 뒤에는 스스로 푼다. */
const guard = '<script>document.documentElement.classList.add("bd-booting");'
  + 'setTimeout(function(){document.documentElement.classList.remove("bd-booting");},8000);</script>'
  + '<style>html.bd-booting{pointer-events:none!important}</style>';
const headAt = html.indexOf('<head>');
if (headAt >= 0) {
  /* parts 는 이미 잘려 있으므로 첫 조각에 끼워 넣는다 */
  parts[0] = parts[0].replace('<head>', '<head>' + guard);
}

const result = parts.join('');
fs.writeFileSync(file, Buffer.from(result, 'latin1'));

/* 서비스워커의 캐시 버전은 webbuild 가 «분리 전» index.html 로 계산했다.
   최종 산출물 기준으로 다시 매긴다 — 안 그러면 내용이 바뀌었는데 버전이 그대로일 수 있다. */
try {
  const swPath = path.join(OUT, 'sw.js');
  let sw = fs.readFileSync(swPath, 'utf8');
  const ver = crypto.createHash('sha1')
    .update(Buffer.from(result, 'latin1')).update(buf).digest('hex').slice(0, 10);
  const before = sw;
  sw = sw.replace(/const CACHE="bongdam-[0-9a-f]+"/, 'const CACHE="bongdam-' + ver + '"');
  if (sw !== before) { fs.writeFileSync(swPath, sw); console.log('  · sw 캐시 버전 갱신 ' + ver); }
} catch (e) { console.error('  ⚠ sw 버전 갱신 실패: ' + e.message); }

const kb = x => Math.round(x / 1024);
console.log('  · JS 외부 분리: ' + bodies.length + '개 블록 → assets/' + name + ' (' + kb(buf.length) + 'KB)'
  + (kept ? ' · 그대로 둔 스크립트 ' + kept : ''));
console.log('  · index.html ' + kb(html.length) + 'KB → ' + kb(result.length) + 'KB');
