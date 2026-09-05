// 페이지 로드 전 주입: RAF / setInterval / setTimeout 콜백의 «호출 수 + 누적 실행 ms + 소스 조각» 스파이
(function () {
  const oR = window.requestAnimationFrame.bind(window), oI = window.setInterval.bind(window), oT = window.setTimeout.bind(window);
  const S = window.__rafSpy = { raf: {}, iv: {}, to: {}, on: false, reset() { S.raf = {}; S.iv = {}; S.to = {}; } };
  const key = f => { const s = String(f); const m = s.match(/^(?:async\s*)?function\s*([\w$]*)/); const n = (m && m[1]) || ''; return (n || '(anon)') + ' | ' + s.replace(/\s+/g, ' ').slice(0, 90); };
  const acc = (tbl, k, ms) => { const e = tbl[k] || (tbl[k] = { n: 0, ms: 0 }); e.n++; e.ms += ms; };
  const wrap = (tbl, f, ms) => function () { if (!S.on) return f.apply(this, arguments); const t = performance.now(); try { return f.apply(this, arguments); } finally { acc(tbl, key(f) + (ms != null ? ' @' + ms : ''), performance.now() - t); } };
  window.requestAnimationFrame = function (f) { return oR(wrap(S.raf, f)); };
  window.setInterval = function (f, ms) { return oI(typeof f === 'function' ? wrap(S.iv, f, ms) : f, ms); };
  window.setTimeout = function (f, ms) { return oT(typeof f === 'function' ? wrap(S.to, f, ms) : f, ms); };
  S.report = (n) => { const top = o => Object.entries(o).map(([k, v]) => ({ k, n: v.n, ms: +v.ms.toFixed(1) })).sort((a, b) => b.ms - a.ms).slice(0, n || 20); const sum = o => +Object.values(o).reduce((x, y) => x + y.ms, 0).toFixed(1); return { raf: top(S.raf), iv: top(S.iv), to: top(S.to), total: { raf: sum(S.raf), iv: sum(S.iv), to: sum(S.to) } }; };
})();
