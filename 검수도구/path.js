// 게임의 _collidesAt 을 그대로 써서 BFS 길찾기 — 실제 플레이어가 돌아가는 경로를 재현
// 시작점에서 «닿을 수 있는 칸» 전체를 먼저 구한 뒤, 그중 목표에 가장 가까운 칸을 고른다.
module.exports = (h) => ({
  install: async () => {
    await h.page.evaluate(() => {
      if (window.__bdPathInstalled) return;
      window.__bdPathInstalled = true;
      const N = 160;
      window.__bdPath = function (tx, ty, opt) {
        opt = opt || {};
        // (v368) 지역 게이트 밴드(가장자리 0.035 이내)는 목표가 그 밴드 안일 때만 통행 — 아니면 실플레이어가 밟지 않는
        //        가장자리 차선을 «최단 경로»로 잡아 엉뚱한 지역 전환(210 우측 게이트 등)을 일으킨다
        const EDGE = 0.036, tgtInEdge = (tx < EDGE || tx > 1 - EDGE || ty < EDGE || ty > 1 - EDGE);
        const sx0 = heroX, sy0 = heroY;   // 시작점 주변(0.08)은 밴드라도 통행 — 게이트 도착 직후 가장자리에서 출발할 수 있어야 한다
        const blocked = (x, y) => {
          if (!tgtInEdge && (x < EDGE || x > 1 - EDGE || y < EDGE || y > 1 - EDGE) && Math.hypot(x - sx0, y - sy0) > 0.08) return true;
          try { return _collidesAt(x, y); } catch (e) { return false; }
        };
        const wk = (STAGES[currentStage] && STAGES[currentStage].walk) || {};
        const x0 = isFinite(wk.x0) ? wk.x0 : 0.01, y0 = isFinite(wk.y0) ? wk.y0 : 0.01;
        const x1 = isFinite(wk.x1) ? wk.x1 : 0.99, y1 = isFinite(wk.y1) ? wk.y1 : 0.99;
        const cv = i => i / N;
        const ci = v => Math.max(0, Math.min(N - 1, Math.round(v * N)));
        const key = (i, j) => i * N + j;
        const si = ci(heroX), sj = ci(heroY);

        const prev = new Map();
        const q = [];
        let head = 0;
        // 시작 칸이 격자 반올림 때문에 «막힌 칸»으로 잡히면 BFS 가 한 칸도 못 뻗는다.
        // 실제 위치 주변에서 열린 칸을 모두 씨앗으로 삼는다.
        if (!blocked(cv(si), cv(sj))) { prev.set(key(si, sj), null); q.push([si, sj]); }
        else {
          for (let r = 1; r <= 4 && !q.length; r++) {
            for (let di = -r; di <= r; di++) for (let dj = -r; dj <= r; dj++) {
              if (Math.max(Math.abs(di), Math.abs(dj)) !== r) continue;
              const i = si + di, j = sj + dj;
              if (i < 0 || j < 0 || i >= N || j >= N) continue;
              if (blocked(cv(i), cv(j))) continue;
              if (prev.has(key(i, j))) continue;
              prev.set(key(i, j), null); q.push([i, j]);
            }
          }
        }
        if (!q.length) return { ok: false, reason: 'hero-wedged', reach: 0 };
        const D = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
        while (head < q.length) {
          const [i, j] = q[head++];
          for (const [di, dj] of D) {
            const ni = i + di, nj = j + dj;
            if (ni < 0 || nj < 0 || ni >= N || nj >= N) continue;
            if (prev.has(key(ni, nj))) continue;
            const px = cv(ni), py = cv(nj);
            if (px < x0 || px > x1 || py < y0 || py > y1) continue;
            if (blocked(px, py)) continue;
            if (di && dj && (blocked(cv(i + di), cv(j)) || blocked(cv(i), cv(j + dj)))) continue;
            prev.set(key(ni, nj), [i, j]);
            q.push([ni, nj]);
          }
        }
        // 닿을 수 있는 칸 중 목표에 가장 가까운 칸
        let best = null, bestD = Infinity;
        for (const k of prev.keys()) {
          const i = Math.floor(k / N), j = k % N;
          const d = Math.hypot(cv(i) - tx, cv(j) - ty);
          if (d < bestD) { bestD = d; best = [i, j]; }
        }
        if (!best) return { ok: false, reason: 'no-open-cell', reach: prev.size };
        const lim = opt.limit != null ? opt.limit : 0.07;
        const path = [];
        let cur = best;
        while (cur) { path.push([cv(cur[0]), cv(cur[1])]); cur = prev.get(key(cur[0], cur[1])); }
        path.reverse();
        const way = [];
        for (let i = 1; i < path.length; i++) {
          const a = path[i - 1], b = path[i], c = path[i + 1];
          if (!c) { way.push(b); break; }
          const d1 = [Math.sign(b[0] - a[0]), Math.sign(b[1] - a[1])];
          const d2 = [Math.sign(c[0] - b[0]), Math.sign(c[1] - b[1])];
          if (d1[0] !== d2[0] || d1[1] !== d2[1]) way.push(b);
        }
        return {
          ok: bestD <= lim, dist: +bestD.toFixed(3), reach: prev.size,
          reason: bestD <= lim ? null : 'too-far(' + bestD.toFixed(3) + ')',
          end: [+cv(best[0]).toFixed(3), +cv(best[1]).toFixed(3)],
          len: path.length, way: way.slice(0, 80),
        };
      };
    });
  },

  probe: async (tx, ty, limit) => await h.page.evaluate(([x, y, l]) => window.__bdPath(x, y, { limit: l }), [tx, ty, limit]),

  walk: async (tx, ty, L, maxMs = 40000) => {
    const t0 = Date.now();
    const p = await h.page.evaluate(([x, y]) => window.__bdPath(x, y), [tx, ty]);
    if (!p.way || !p.way.length) return { ok: false, reason: p.reason || 'no-way', dist: p.dist };
    for (const [wx, wy] of p.way) {
      if (Date.now() - t0 > maxMs) return { ok: false, reason: 'walk-timeout' };
      const r = await L.moveTo(wx, wy, 5000, 0.008);
      if (!r.ok && String(r.reason || '').startsWith('mode=')) return { ok: false, reason: r.reason };
    }
    const r = await L.moveTo(tx, ty, 4000, 0.03);
    return { ok: p.ok, near: r.ok, reason: p.reason, dist: p.dist };
  },
});
