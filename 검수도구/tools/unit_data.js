// 데이터 무결성 유닛 테스트 (데몬 :47814 사용, 게임 무수정)
//  T1 시설 지정 상호작용 지점이 반경 안 «서 있을 수 있는 자리»를 갖는가 (문 앞에서 F 가 통하는가)
//  T2 문 앞 최적 지점에서 BD_v24NearestFacility 가 «그 시설»을 고르는가 (이웃 시설 경합)
//  T3 위험요소 hazardId 유일성 / 주민 퀘스트 짝(BD_hzQuestMap) 존재
//  T4 QUESTS 체인: 각 장의 지역/스테이지 참조가 실존
'use strict';
const path = require('path'), { spawnSync } = require('child_process');
const QA = path.resolve(__dirname, '..');
const env = { ...process.env, BDD_PORT: process.env.BDD_PORT || '47814', SHOTS_DIR: 'shots_unit' };
const bd = (...a) => { const r = spawnSync(process.execPath, [path.join(QA, 'bd.js'), ...a], { encoding: 'utf8', env, cwd: QA }); try { return JSON.parse((r.stdout || '').trim().split('\n').pop()); } catch (e) { return { error: (r.stdout || '') + (r.stderr || '') }; } };
const STAGES = [210, 211, 212, 213];
let fails = 0, total = 0;
const ok = (cond, msg) => { total++; if (!cond) { fails++; console.log('  ✖ ' + msg); } };
(async () => {
  bd('quit');
  bd('boot', 'skip=1', 'to=212', 'x=0.5', 'y=0.5'); bd('advance', 'max=10');
  for (const sid of STAGES) {
    bd('tp', 'stage=' + sid, 'x=0.5', 'y=0.5'); bd('advance', 'max=10');
    const r = bd('eval', 'js=' + `return (function(){
      const st = STAGES[currentStage]; const bw = st.bgW||1448, bh = st.bgH||1086;
      const out = { sid: Number(currentStage), name: st.name, lms: [], hz: [] };
      const lms = (st.__v24Landmarks||[]).filter(l => l && l.majorFacility && !l.hidden);
      const saveX = heroX, saveY = heroY;
      for (const L of lms) {
        const lim = Number(L.interactionRadius)>0 ? Number(L.interactionRadius) : 110;
        const ix = Number(L.interactionX), iy = Number(L.interactionY);
        // 문 앞 후보: 게임 규칙(사각형 가장자리 거리 ≤lim 또는 지정지점 거리×0.8 ≤lim)을 만족하는 «충돌 없는» 지점을
        // 지정 지점에 가까운 순으로 격자 탐색 (12px 간격)
        let stand = null;
        const rl = L.rx*bw, rt = L.ry*bh, rr = (L.rx+L.rw)*bw, rb = (L.ry+L.rh)*bh;
        const cand = [];
        const R = lim / 0.8 + 2;   // 지정지점 ×0.8 가중까지 포함한 최대 반경
        const y0 = Math.min(rt - lim, iy*bh - R), y1 = Math.max(rb + lim, iy*bh + R), x0 = Math.min(rl - lim, ix*bw - R), x1 = Math.max(rr + lim, ix*bw + R);
        for (let py = y0; py <= y1; py += 12) for (let px = x0; px <= x1; px += 12) {
          const dx = Math.max(rl - px, 0, px - rr), dy = Math.max(rt - py, 0, py - rb);
          const rectD = Math.hypot(dx, dy); const ipD = Math.hypot(px - ix*bw, py - iy*bh);
          if (Math.min(rectD, ipD*0.8) <= lim) cand.push([px/bw, py/bh, ipD]);
        }
        cand.sort((a, b) => a[2] - b[2]);
        for (const c of cand) { if (c[0] < 0.02 || c[0] > 0.98 || c[1] < 0.02 || c[1] > 0.98) continue; try { if (!_collidesAt(c[0], c[1])) { stand = c; break; } } catch(e) { stand = c; break; } }
        let pick = null, pickV = null;
        if (stand) {
          heroX = stand[0]; heroY = stand[1];
          try { const p = BD_v24NearestFacility(); pick = p ? (p.label||p.displayName) : null; } catch(e){ pick = 'ERR ' + e.message; }
          // 전부 방문한 상태(v311 후순위 페널티)에서도 문 앞이면 그 시설이어야 한다 (v368 규칙)
          const keep = BD_PROGRESS.facility.visitedFacilityIds;
          try { BD_PROGRESS.facility.visitedFacilityIds = lms.map(x => x.facilityId); const p2 = BD_v24NearestFacility(); pickV = p2 ? (p2.label||p2.displayName) : null; } catch(e){ pickV = 'ERR ' + e.message; }
          BD_PROGRESS.facility.visitedFacilityIds = keep;
        }
        out.lms.push({ l: L.label||L.displayName, id: L.facilityId, hasIP: isFinite(ix)&&isFinite(iy), stand: stand ? [+stand[0].toFixed(3), +stand[1].toFixed(3)] : null, pick, pickV });
      }
      heroX = saveX; heroY = saveY;
      const seen = {};
      (st.objects||[]).forEach(o => { if (o && o.hazardId) { out.hz.push({ id: o.hazardId, l: o.label, dup: !!seen[o.hazardId], boss: !!(o.isBoss || String(o.hazardId).indexOf('final_boss')===0), opt: !!o.bdOptional, q: (function(){ try { const m = BD_hzQuestMap(Number(currentStage)); return !!(m && m.find(x => x.id === o.hazardId)); } catch(e) { return 'n/a'; } })() }); seen[o.hazardId] = 1; } });
      return out; })()`);
    const o = r.out; if (!o) { console.log('stage', sid, 'eval 실패', JSON.stringify(r).slice(0, 200)); fails++; continue; }
    console.log(`\n■ ${o.sid} ${o.name} — 시설 ${o.lms.length} · 위험요소 ${o.hz.length}`);
    for (const L of o.lms) {
      ok(L.hasIP, `${L.l}: 지정 상호작용 지점 없음`);
      ok(L.stand, `${L.l}: 지정 지점 반경 안에 설 자리 없음`);
      ok(!L.stand || L.pick === L.l, `${L.l}: 문 앞(${L.stand})에서 F 가 «${L.pick}» 을 고름`);
      ok(!L.stand || L.pickV === L.l, `${L.l}: (전부 방문 상태) 문 앞에서 F 가 «${L.pickV}» 을 고름`);
    }
    for (const H of o.hz) {
      ok(!H.dup, `hazardId 중복 ${H.id}`);
      if (H.q !== 'n/a' && !H.boss) { if (H.opt || !H.q) console.log(`  ℹ ${H.l}(${H.id}): 주민 부탁 짝 ${H.q ? '있음' : '없음'}${H.opt ? ' (선택 위험요소)' : ''}`); }
    }
  }
  const q = bd('eval', 'js=' + `const QQ = (typeof QUESTS!=='undefined') ? QUESTS : (window.BD_QUESTS||[]); return QQ.map(q => ({ id: q.id, ch: q.chapter, ok: !q.nextStage || !!STAGES[q.nextStage] }))`).out || [];
  console.log('\n■ QUESTS ' + q.length + '개'); q.forEach(x => ok(x.ok, `퀘스트 ${x.id}: nextStage 참조 없음`));
  console.log(`\n결과: ${total - fails}/${total} 통과` + (fails ? ` — 실패 ${fails}` : ' ✅'));
  bd('quit');
  process.exit(fails ? 1 : 0);
})();
