/* (v398) 한글 폰트 서브셋 생성기 — 게임이 실제로 쓰는 글자만 담은 woff2 를 만든다.
 *
 * 왜 필요한가:
 *   임베드된 Noto Serif KR 3종(400/700/900)은 KS X 1001 2350자 기준 903KB 로,
 *   최적화 후 남은 초기 전송량의 대부분을 차지한다. 실제 사용 글자는 1000자 남짓이다.
 *
 * 서브셋에 없는 글자는 어떻게 되는가:
 *   #hero-name 입력란으로 플레이어가 임의의 한글 이름을 넣을 수 있다.
 *   그래서 서브셋 @font-face 에 unicode-range 로 «담당 글자»를 명시한다.
 *   범위 밖 글자는 이 폰트가 아예 관여하지 않고 폰트 스택의 다음 항목으로 넘어간다.
 *   게임의 스택은 `"Noto Serif KR", serif` 이므로 시스템 한글 명조로 정상 렌더된다
 *   (두부 □ 가 아니다). 모양만 조금 다를 뿐이고, 흔치 않은 음절에서만 발생한다.
 *
 *   ※ 전체 폰트를 unicode-range 없이 함께 선언하면 안 된다. 두 face 가 같은 글자를
 *     중복 담당해 브라우저가 6종을 모두 내려받는다(실측 1,407KB — 개선이 아니라 악화).
 *
 * 필요 환경: Python + fonttools + brotli  (빌드에는 불필요 — 텍스트가 크게 바뀔 때만 실행)
 *   py -m pip install --user fonttools brotli
 *
 * 사용: node 검수도구/tools/font_subset.js <srcdir>
 *   → src/assets/ 에 서브셋 woff2 생성 + 붙여넣을 @font-face CSS 를 출력
 */
'use strict';
const fs = require('fs'), path = require('path'), cp = require('child_process'), crypto = require('crypto');

const SRC = process.argv[2] || 'src';
const ASSETS = path.join(SRC, 'assets');

/* 폰트 원본과 굵기 — 0005_bd-embedded-font.css 의 선언과 일치해야 한다.
   (v398) 900 을 뺐다. 세 벌이 504KB 로 첫 로딩 전송량의 절반 가까이였고,
   셋 다 unicode-range 가 같아 «하나라도 쓰이면 전부» 내려받는다.
   900 은 136KB 인데 쓰이는 곳이 46군데뿐이고, 빼면 CSS 폰트 매칭 규칙에 따라
   700 로 대체된다 — 이미 굵은 벌이라 합성 볼드도 필요 없다.
   표시용 명조라 굵기 한 단계 차이는 화면에서 거의 구분되지 않는다. */
const FONTS = [
  { file: '4bd3ac43_url.woff2', weight: 400 },
  { file: 'c6e1a804_url.woff2', weight: 700 },
];

/* ── 1. 소스 전체에서 실제 사용 문자 수집 ── */
function collect() {
  const set = new Set();
  const eat = txt => { for (const ch of txt) { const c = ch.codePointAt(0); if (c >= 0x20 && c !== 0xFFFD) set.add(ch); } };
  eat(fs.readFileSync(path.join(SRC, 'shell.html'), 'utf8'));
  for (const f of fs.readdirSync(path.join(SRC, 'blocks'))) {
    if (/\.(js|css)$/.test(f)) eat(fs.readFileSync(path.join(SRC, 'blocks', f), 'utf8'));
  }
  /* ASCII 전체는 항상 포함(숫자·기호가 동적으로 조합된다) */
  for (let c = 0x20; c < 0x7F; c++) set.add(String.fromCharCode(c));
  return [...set].sort((a, b) => a.codePointAt(0) - b.codePointAt(0));
}

/* ── 2. 코드포인트 목록을 CSS unicode-range 로 압축 ── */
function toRanges(chars) {
  const cps = chars.map(c => c.codePointAt(0));
  const out = [];
  let s = cps[0], p = cps[0];
  const hex = n => 'U+' + n.toString(16).toUpperCase();
  for (let i = 1; i <= cps.length; i++) {
    const c = cps[i];
    if (c === p + 1) { p = c; continue; }
    out.push(s === p ? hex(s) : hex(s) + '-' + p.toString(16).toUpperCase());
    s = p = c;
  }
  return out.join(',');
}

/* ── 3. 서브셋 생성 ── */
const chars = collect();
const listFile = path.join(ASSETS, '_charset.tmp.txt');
fs.writeFileSync(listFile, chars.join(''), 'utf8');
console.log('사용 문자 ' + chars.length + '자 수집 (한글 음절 '
  + chars.filter(c => { const v = c.codePointAt(0); return v >= 0xAC00 && v <= 0xD7A3; }).length + '자)');

const made = [];
for (const f of FONTS) {
  const src = path.join(ASSETS, f.file);
  if (!fs.existsSync(src)) { console.error('✖ 원본 폰트 없음: ' + src); process.exit(1); }
  const tmp = path.join(ASSETS, '_sub.tmp.woff2');
  const r = cp.spawnSync('py', ['-m', 'fontTools.subset', src, '--text-file=' + listFile,
    '--flavor=woff2', '--layout-features=*', '--output-file=' + tmp], { encoding: 'utf8' });
  if (r.status !== 0) {
    console.error('✖ pyftsubset 실패 (py + fonttools + brotli 필요)\n' + (r.stderr || r.stdout || r.error));
    process.exit(2);
  }
  const buf = fs.readFileSync(tmp);
  const hash = crypto.createHash('sha1').update(buf).digest('hex').slice(0, 8);
  const name = hash + '_sub' + f.weight + '.woff2';
  fs.renameSync(tmp, path.join(ASSETS, name));
  const before = fs.statSync(src).size;
  made.push({ ...f, name, size: buf.length });
  console.log('  w' + f.weight + ': ' + (before / 1024).toFixed(0) + 'KB → ' + (buf.length / 1024).toFixed(0)
    + 'KB (' + Math.round((1 - buf.length / before) * 100) + '% 감소)');
}
fs.unlinkSync(listFile);

/* ── 4. 붙여넣을 CSS 출력 ── */
const range = toRanges(chars);
const css = made.map(m =>
  "@font-face{font-family:'Noto Serif KR';font-style:normal;font-weight:" + m.weight
  + ";font-display:swap;src:url(data:font/woff2;base64,@@B64:" + m.name + "@@) format('woff2');"
  + "unicode-range:" + range + ";}"
).join('\n');

const outCss = path.join(ASSETS, '..', '..', '_font_face.generated.css');
fs.writeFileSync(outCss, css, 'utf8');
console.log('\n합계 ' + (made.reduce((a, m) => a + m.size, 0) / 1024).toFixed(0) + 'KB');
console.log('CSS 생성: ' + outCss + '  → 0005_bd-embedded-font.css 에 반영하세요');
console.log('unicode-range 구간 수: ' + range.split(',').length);
