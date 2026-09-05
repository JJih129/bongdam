// (v378) 웹 게시판 빌더 — src 트리에서 «작은 index.html + 외부 assets/» 구조 생성
//  · data:…;base64,@@B64:NAME@@ → assets/NAME (base64 인라인 제거: 파싱·메모리·전송량 대폭 감소)
//  · PWA: sw.js(캐시·오프라인·새버전 알림) + manifest.webmanifest + 아이콘
//  · OG 태그·파비콘 주입. 출력: 웹게시/ (푸시는 release.js --web 이 담당)
// 사용: node webbuild.js <srcdir> <outdir>
'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const [, , SRC, OUT] = process.argv;
if (!SRC || !OUT) { console.error('usage: node webbuild.js <srcdir> <outdir>'); process.exit(1); }
fs.mkdirSync(path.join(OUT, 'assets'), { recursive: true });
const rd = rel => fs.readFileSync(path.join(SRC, rel)).toString('latin1');
/* 소스 본문은 UTF-8 바이트를 latin1 문자열로 보존한다. 빌더가 새로 만드는 한글 문자열도
   같은 표현으로 바꿔야 마지막 latin1 쓰기에서 PWA 배너·OG 문구가 깨지지 않는다. */
const utf8AsLatin1 = text => Buffer.from(text, 'utf8').toString('latin1');
const used = new Set();
function externalize(text) {
  return text.replace(/data:[a-z0-9/+.-]+;base64,@@B64:([^@]+)@@/gi, (_, name) => { used.add(name); return 'assets/' + name; });
}
let html = externalize(rd('shell.html'));
const files = fs.readdirSync(path.join(SRC, 'blocks'));
const byIdx = new Map();
for (const f of files) { const m = f.match(/^(\d{4})_/); if (m) byIdx.set(m[1], f); }
// (v395) 웹판 경량화 — 인게임 에디터·개발 도구 블록을 비운다.
//  작업용 빌드에는 그대로 남으며(에디터 유지 방침), 웹 산출물에서만 제외된다.
//  주의: 0025(에셋 저장소)는 런타임 필수라 절대 제외 금지.
const STRIP = new Set(['0023','0036','0037','0038','0040','0041','0042','0043','0044','0045',
  '0047','0048','0049','0064','0065','0102','0143','0161','0177','0194','0249']);
html = html.replace(/@@BLOCK:(\d{4})@@/g, (_, idx) => {
  if (STRIP.has(idx)) return '/* 웹판 — 에디터/개발 블록 ' + idx + ' 제외 */';
  return externalize(rd('blocks/' + byIdx.get(idx)));
});
// 남은 토큰 검사 (data: 프리픽스 없는 예외 발견용)
const leftover = html.match(/@@B64:[^@]+@@/g);
if (leftover) { console.error('✖ 외부화 안 된 토큰: ' + leftover.slice(0, 5).join(', ')); process.exit(2); }
/* (v398) 이미지 지연 로딩 심 주입 — 웹판 전용.
   외부화 때문에 최상위 스코프의 `new Image(); img.src=...` 가 부팅 즉시 수백 개 요청을
   발사한다. 심은 그 요청을 실제 사용 시점으로 미룬다. 개발 빌드(bundle.js)는 data URI 라
   해당 문제가 없으므로 주입하지 않는다. 반드시 첫 블록보다 먼저 실행돼야 한다. */
{
  const at = html.indexOf('<head>');
  if (at < 0 || at > 200) { console.error('<head> 를 문서 앞부분에서 찾지 못했습니다 (idx ' + at + ')'); process.exit(3); }
  const shim = utf8AsLatin1('<script id="bd-web-lazyimg-v398">'
    + fs.readFileSync(path.join(__dirname, 'web_lazyimg.js'), 'utf8') + '\n</script>');
  html = html.slice(0, at + 6) + shim + html.slice(at + 6);
}
// 에셋 복사
let bytes = 0;
for (const name of used) {
  const src = path.join(SRC, 'assets', name);
  const dst = path.join(OUT, 'assets', name);
  fs.copyFileSync(src, dst);
  bytes += fs.statSync(src).size;
}
// <head> 주입: OG·파비콘·매니페스트 (기존 title 은 유지)
const SITE = 'https://jjih129.github.io/bongdam/';
const headInject = utf8AsLatin1([
  '<link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🛡️</text></svg>">',
  '<link rel="manifest" href="manifest.webmanifest">',
  '<meta name="theme-color" content="#0f1526">',
  '<meta property="og:title" content="봉담 안전지도 대작전">',
  '<meta property="og:description" content="봉담 네 동네를 돌며 위험을 정화하는 청소년 안전 교육 RPG — 브라우저에서 바로 플레이!">',
  '<meta property="og:image" content="' + SITE + 'icon-512.png">',
  '<meta property="og:url" content="' + SITE + '">',
  '<meta property="og:type" content="website">',
].join('\n'));
html = html.replace('</head>', headInject + '\n</head>');
// 기존 manifest 참조 중복 제거(구 ./manifest.webmanifest)
html = html.replace('<link rel="manifest" href="./manifest.webmanifest">', '');
// SW 등록 + 새 버전 알림 (http(s) 에서만)
const swReg = utf8AsLatin1('<script>(function(){if(!("serviceWorker" in navigator)||location.protocol==="file:")return;'
  + 'addEventListener("load",function(){navigator.serviceWorker.register("sw.js").then(function(reg){'
  + 'reg.addEventListener("updatefound",function(){var w=reg.installing;if(!w)return;w.addEventListener("statechange",function(){'
  + 'if(w.state==="installed"&&navigator.serviceWorker.controller){try{var d=document.createElement("div");'
  + 'd.style.cssText="position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:2147483000;background:#1d2333;color:#ffd86b;padding:10px 18px;border-radius:12px;border:1px solid #ffd86b;font-size:14px;cursor:pointer;box-shadow:0 6px 18px rgba(0,0,0,.5)";'
  + 'd.textContent="🔄 새 버전이 있어요 — 눌러서 새로고침";d.onclick=function(){location.reload();};document.body.appendChild(d);}catch(e){}}});});'
  + '}).catch(function(){});});})();</script>');
{ /* 본문 코드 안에 '</body>' 문자열(HTML 내보내기 기능)이 있어 첫 매치 삽입은 게임 코드를 깨뜨린다 — 실제 문서 끝(마지막 매치)에 삽입 */
  const at = html.lastIndexOf('</body>');
  html = html.slice(0, at) + swReg + html.slice(at);
}
fs.writeFileSync(path.join(OUT, 'index.html'), Buffer.from(html, 'latin1'));
// PWA 파일들
const ver = crypto.createHash('sha1').update(html).digest('hex').slice(0, 10);
const assetList = ['index.html'].concat([...used].map(n => 'assets/' + n));
fs.writeFileSync(path.join(OUT, 'sw.js'),
  'const CACHE="bongdam-' + ver + '";\n'
  + 'const CORE=' + JSON.stringify(['index.html', 'manifest.webmanifest']) + ';\n'
  + 'self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()));});\n'
  + 'self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});\n'
  + '// 에셋은 요청 시 캐시(런타임 캐싱) — 첫 설치를 가볍게, 재방문·오프라인은 빠르게\n'
  + 'self.addEventListener("fetch",e=>{if(e.request.method!=="GET")return;\n'
  + ' e.respondWith(caches.open(CACHE).then(async c=>{const hit=await c.match(e.request,{ignoreSearch:true});\n'
  + '  if(hit)return hit;\n'
  + '  try{const r=await fetch(e.request);if(r.ok&&(new URL(e.request.url).origin===location.origin))c.put(e.request,r.clone());return r;}\n'
  + '  catch(err){if(e.request.mode==="navigate"){const idx=await c.match("index.html");if(idx)return idx;}throw err;}}));});\n');
fs.writeFileSync(path.join(OUT, 'manifest.webmanifest'), JSON.stringify({
  name: '봉담 안전지도 대작전', short_name: '안전지도 대작전', description: '봉담 청소년 안전 교육 RPG',
  start_url: '.', display: 'fullscreen', display_override: ['fullscreen', 'standalone'], orientation: 'landscape',
  background_color: '#0f1526', theme_color: '#0f1526',
  icons: [{ src: 'icon-192.png', sizes: '192x192', type: 'image/png' }, { src: 'icon-512.png', sizes: '512x512', type: 'image/png' }]
}));
console.log('웹판 빌드: index.html ' + (fs.statSync(path.join(OUT, 'index.html')).size / 1048576).toFixed(2) + 'MB + assets ' + used.size + '개 ' + (bytes / 1048576).toFixed(1) + 'MB · sw ' + ver);
