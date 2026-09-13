/* UI 캡처 갤러리 생성 — node 검수도구/tools/shots_gallery.js <shotsDir> <out.html> [--review=review.json] [--run="완주 런 결과 한 줄"]
   결과 HTML 은 shots/ 하위의 jpg 를 상대 경로로 참조한다(아티팩트 files 로 같이 올린다). */
'use strict';
const fs = require('fs'), path = require('path');
const [, , DIR, OUT] = process.argv;
const opt = (k, d) => { const a = process.argv.find(x => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : d; };
const idx = JSON.parse(fs.readFileSync(path.join(DIR, 'index.json'), 'utf8'));
let review = { confirmed: [], refuted: [], mismatches: [] };
try { if (opt('review')) review = JSON.parse(fs.readFileSync(opt('review'), 'utf8')); } catch (e) { }
const RUN = opt('run', '');
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const groups = [];
for (const s of idx.shots) { let g = groups.find(x => x.name === s.group); if (!g) { g = { name: s.group, items: [] }; groups.push(g); } g.items.push(s); }
const byFile = {}; for (const f of review.confirmed || []) (byFile[f.file] = byFile[f.file] || []).push(f);
const sevN = { high: 0, medium: 0, low: 0 }; for (const f of review.confirmed || []) sevN[f.severity] = (sevN[f.severity] || 0) + 1;
const at = new Date(idx.at);
const dateStr = at.getFullYear() + '.' + String(at.getMonth() + 1).padStart(2, '0') + '.' + String(at.getDate()).padStart(2, '0') + ' ' + String(at.getHours()).padStart(2, '0') + ':' + String(at.getMinutes()).padStart(2, '0');
const slug = s => s.replace(/[^\w가-힣]+/g, '-');
const SEV = { high: '즉시', medium: '눈에 띔', low: '미세' };

const cards = g => g.items.map(s => {
  const fl = byFile[s.file] || [];
  const mobile = s.group === '모바일';
  return `<figure class="card${mobile ? ' mobile' : ''}" data-file="${esc(s.file)}" tabindex="0">
  <div class="shot"><img src="shots/${esc(s.file)}" alt="${esc(s.caption)}" loading="lazy" decoding="async"></div>
  <figcaption><span class="num">${esc(s.file.slice(0, 2))}</span><span class="cap">${esc(s.caption)}</span>${fl.length ? `<span class="flag ${esc(fl[0].severity)}" title="검수 메모 ${fl.length}건">${fl.length}</span>` : ''}</figcaption>
</figure>`;
}).join('\n');

const notes = (review.confirmed || []).length ? `<section id="notes" class="notes">
  <h2>검수 메모 <small>독립 반박 검증을 통과한 항목만 · 즉시 ${sevN.high} · 눈에 띔 ${sevN.medium} · 미세 ${sevN.low}</small></h2>
  <ol class="note-list">
  ${(review.confirmed || []).sort((a, b) => ({ high: 0, medium: 1, low: 2 }[a.severity] - { high: 0, medium: 1, low: 2 }[b.severity]) || a.file.localeCompare(b.file)).map(f => `<li class="note ${esc(f.severity)}">
    <span class="sev">${SEV[f.severity] || f.severity}</span>
    <a class="ref" href="#f-${esc(f.file.replace(/\W/g, ''))}" data-open="${esc(f.file)}">${esc(f.file.slice(0, 2))} · ${esc(f.group)}</a>
    <strong>${esc(f.title)}</strong>
    <p>${esc(f.detail)}</p>
  </li>`).join('\n')}
  </ol>
  ${(review.refuted || []).length ? `<details class="refuted"><summary>반박되어 제외한 지적 ${review.refuted.length}건</summary><ul>${review.refuted.map(r => `<li><b>${esc(r.file.slice(0, 2))}</b> ${esc(r.title)} — <span>${esc(r.reason)}</span></li>`).join('')}</ul></details>` : ''}
</section>` : `<section id="notes" class="notes"><h2>검수 메모</h2><p class="muted">시각 검수 결과를 기다리는 중 — 갤러리는 먼저 볼 수 있다.</p></section>`;

const html = `<title>봉담지킴이 UI 갤러리</title>
<meta name="description" content="봉담 안전지도 대작전 v399e PC 웹 빌드 — 화면별 스크린샷 ${idx.shots.length}장과 검수 메모">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Jua&family=Noto+Sans+KR:wght@400;500;700&display=swap">
<style>
:root{
  --bg:#f2f4f0; --panel:#ffffff; --ink:#1b2430; --muted:#66707d; --line:#dde3dc; --accent:#1f8a52; --accent-ink:#0f5c35; --amber:#c9971f; --red:#c2452d; --chip:#e8efe9; --shade:rgba(20,30,40,.55);
  --font-body:"Noto Sans KR",system-ui,"Apple SD Gothic Neo","Malgun Gothic",sans-serif; --font-display:"Jua","Noto Sans KR",system-ui,sans-serif;
}
@media (prefers-color-scheme: dark){ :root:not([data-theme="light"]){ --bg:#10161d; --panel:#171f28; --ink:#e6ebf0; --muted:#95a1ad; --line:#26313b; --accent:#58d39b; --accent-ink:#9ff0c8; --amber:#e7c25e; --red:#ef8a74; --chip:#1f2a33; --shade:rgba(0,0,0,.72); } }
:root[data-theme="dark"]{ --bg:#10161d; --panel:#171f28; --ink:#e6ebf0; --muted:#95a1ad; --line:#26313b; --accent:#58d39b; --accent-ink:#9ff0c8; --amber:#e7c25e; --red:#ef8a74; --chip:#1f2a33; --shade:rgba(0,0,0,.72); }
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.6 var(--font-body);font-variant-numeric:tabular-nums}
a{color:var(--accent-ink)}
header{padding:28px clamp(16px,4vw,48px) 12px;display:flex;flex-wrap:wrap;align-items:flex-end;gap:14px 28px;border-bottom:1px solid var(--line);background:var(--panel)}
header h1{font:32px/1.1 var(--font-display);margin:0;letter-spacing:.2px;text-wrap:balance}
header h1 small{display:block;font:500 13px/1.5 var(--font-body);color:var(--muted);letter-spacing:.06em;margin-bottom:6px}
.meta{display:flex;flex-wrap:wrap;gap:6px 18px;color:var(--muted);font-size:13px}
.meta b{color:var(--ink);font-weight:600}
.run{margin-left:auto;padding:8px 12px;border:1px solid var(--line);border-radius:10px;background:var(--chip);font-size:13px;max-width:44ch}
.run.ok{border-color:var(--accent)} .run.ng{border-color:var(--red)}
nav{position:sticky;top:0;z-index:5;background:var(--panel);border-bottom:1px solid var(--line);padding:8px clamp(16px,4vw,48px);display:flex;gap:8px;overflow-x:auto;scrollbar-width:thin}
nav a{white-space:nowrap;text-decoration:none;color:var(--ink);background:var(--chip);border-radius:999px;padding:4px 12px;font-size:13px;border:1px solid transparent}
nav a:hover,nav a:focus-visible{border-color:var(--accent);outline:none}
nav a .n{color:var(--muted);margin-left:4px}
main{padding:8px clamp(16px,4vw,48px) 64px;max-width:1500px;margin:0 auto}
section.group{padding:26px 0 8px;border-bottom:1px solid var(--line)}
section.group h2{font:24px/1.2 var(--font-display);margin:0 0 14px;display:flex;align-items:baseline;gap:10px}
section.group h2 small{font:500 13px var(--font-body);color:var(--muted)}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(360px,1fr));gap:18px}
.grid.mobile{grid-template-columns:repeat(auto-fill,minmax(220px,1fr))}
.card{margin:0;background:var(--panel);border:1px solid var(--line);border-radius:12px;overflow:hidden;cursor:zoom-in;transition:transform .12s ease,box-shadow .12s ease}
.card:hover,.card:focus-visible{transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,.12);outline:none;border-color:var(--accent)}
.shot{aspect-ratio:16/10;background:#0d1117;display:flex;align-items:center;justify-content:center;overflow:hidden}
.card.mobile .shot{aspect-ratio:390/844}
.shot img{width:100%;height:100%;object-fit:cover;display:block}
figcaption{display:flex;align-items:center;gap:10px;padding:10px 12px;font-size:13.5px;line-height:1.4}
.num{font:16px/1 var(--font-display);color:var(--accent);min-width:22px}
.cap{flex:1}
.flag{min-width:22px;height:22px;border-radius:999px;display:inline-flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#fff;background:var(--amber)}
.flag.high{background:var(--red)} .flag.low{background:var(--muted)}
.notes{padding:28px 0 8px}
.notes h2{font:24px/1.2 var(--font-display);margin:0 0 14px}
.notes h2 small{font:500 13px var(--font-body);color:var(--muted);margin-left:10px}
.note-list{list-style:none;margin:0;padding:0;display:grid;gap:10px;max-width:920px}
.note{display:grid;grid-template-columns:64px 120px 1fr;grid-template-areas:"sev ref title" "sev ref detail";gap:2px 12px;align-items:start;background:var(--panel);border:1px solid var(--line);border-left-width:4px;border-radius:10px;padding:10px 14px}
.note.high{border-left-color:var(--red)} .note.medium{border-left-color:var(--amber)} .note.low{border-left-color:var(--muted)}
.note .sev{grid-area:sev;font-size:12px;font-weight:700;color:var(--muted);letter-spacing:.06em}
.note.high .sev{color:var(--red)} .note.medium .sev{color:var(--amber)}
.note .ref{grid-area:ref;font-size:13px;text-decoration:none;font-weight:600}
.note strong{grid-area:title;font-weight:600}
.note p{grid-area:detail;margin:0;color:var(--muted);font-size:13.5px;max-width:70ch}
.refuted{margin-top:16px;color:var(--muted);font-size:13px;max-width:920px}
.refuted ul{padding-left:18px} .refuted li{margin:4px 0}
.muted{color:var(--muted)}
#lb{position:fixed;inset:0;background:var(--shade);display:none;align-items:center;justify-content:center;z-index:50;padding:24px}
#lb.on{display:flex}
#lb img{max-width:min(96vw,1440px);max-height:82vh;border-radius:8px;box-shadow:0 20px 60px rgba(0,0,0,.5);background:#000}
#lb .bar{position:absolute;left:0;right:0;bottom:18px;display:flex;justify-content:center;gap:12px;align-items:center;color:#fff;font-size:14px;text-shadow:0 1px 3px rgba(0,0,0,.7)}
#lb button{background:rgba(255,255,255,.14);color:#fff;border:1px solid rgba(255,255,255,.35);border-radius:999px;padding:6px 14px;font:inherit;cursor:pointer}
#lb button:hover,#lb button:focus-visible{background:rgba(255,255,255,.28);outline:none}
@media (prefers-reduced-motion: reduce){ .card{transition:none} }
@media (max-width:640px){ .note{grid-template-columns:1fr;grid-template-areas:"sev" "ref" "title" "detail"} header h1{font-size:26px} }
</style>
<header>
  <h1><small>봉담 안전지도 대작전 · v399e · PC 웹 빌드</small>봉담지킴이 UI 갤러리</h1>
  <div class="meta"><span>캡처 <b>${idx.shots.length}장</b></span><span>PC <b>1440×900</b> · 모바일 <b>iPhone 13</b></span><span>${esc(dateStr)}</span><span>${esc(idx.url)}</span></div>
  ${RUN ? `<div class="run ${/완주|엔딩|clear/i.test(RUN) ? 'ok' : 'ng'}">${esc(RUN)}</div>` : ''}
</header>
<nav>${groups.map(g => `<a href="#g-${slug(g.name)}">${esc(g.name)}<span class="n">${g.items.length}</span></a>`).join('')}<a href="#notes">검수 메모<span class="n">${(review.confirmed || []).length}</span></a></nav>
<main>
${groups.map(g => `<section class="group" id="g-${slug(g.name)}"><h2>${esc(g.name)} <small>${g.items.length}장</small></h2><div class="grid${g.name === '모바일' ? ' mobile' : ''}">${cards(g)}</div></section>`).join('\n')}
${notes}
</main>
<div id="lb" role="dialog" aria-label="스크린샷 크게 보기"><img alt=""><div class="bar"><button data-nav="-1">◀ 이전</button><span id="lb-cap"></span><button data-nav="1">다음 ▶</button><button data-close="1">닫기 (Esc)</button></div></div>
<script>
(function(){
  var shots = ${JSON.stringify(idx.shots.map(s => ({ file: s.file, caption: s.caption })))};
  var lb = document.getElementById('lb'), img = lb.querySelector('img'), cap = document.getElementById('lb-cap'), cur = -1;
  function open(i){ if (i < 0 || i >= shots.length) return; cur = i; img.src = 'shots/' + shots[i].file; img.alt = shots[i].caption; cap.textContent = shots[i].file.slice(0,2) + ' · ' + shots[i].caption; lb.classList.add('on'); }
  function close(){ lb.classList.remove('on'); cur = -1; }
  document.querySelectorAll('.card').forEach(function(c){ var f = c.getAttribute('data-file'); var i = shots.findIndex(function(s){ return s.file === f; }); c.id = 'f-' + f.replace(/\\W/g, ''); c.addEventListener('click', function(){ open(i); }); c.addEventListener('keydown', function(e){ if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(i); } }); });
  document.querySelectorAll('[data-open]').forEach(function(a){ a.addEventListener('click', function(e){ e.preventDefault(); var f = a.getAttribute('data-open'); open(shots.findIndex(function(s){ return s.file === f; })); }); });
  lb.addEventListener('click', function(e){ var b = e.target.closest('button'); if (b && b.dataset.nav) { open(cur + Number(b.dataset.nav)); return; } if (b && b.dataset.close) { close(); return; } if (e.target === lb) close(); });
  document.addEventListener('keydown', function(e){ if (!lb.classList.contains('on')) return; if (e.key === 'Escape') close(); else if (e.key === 'ArrowRight') open(cur + 1); else if (e.key === 'ArrowLeft') open(cur - 1); });
})();
</script>
`;
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, html, 'utf8');
console.log('gallery → ' + OUT + ' (' + idx.shots.length + ' shots, ' + (review.confirmed || []).length + ' notes)');
