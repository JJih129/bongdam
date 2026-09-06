/* 에디터 저장본(JSON) → 게임 데이터로 «배치»를 옮긴다.
 *
 * ── 배경 ──────────────────────────────────────────────────────────
 *   저장소 루트의 bongdam_rpg_editor_data_v5_2_quest.json 은 «에디터 저장 파일»이고
 *   빌드는 이 파일을 읽지 않는다. 게임이 실제로 쓰는 배치는 블록에 들어 있다.
 *     0097  지역 월드(210~213) 건물·부지·장식의 bounds 와 asset_id
 *     0099  지역 위험요소 좌표(하드코딩)
 *     0017  STAGES — 1·101 등 단일 스테이지의 objects
 *   0097 은 2026-08-04 자 다른 JSON 에서 생성됐고 그 뒤로 에디터에서 바꾼 것이
 *   한 번도 반영되지 않았다. 그래서 «에디터에서 옮겼는데 게임은 그대로»가 됐다.
 *
 * ── 하는 일 ───────────────────────────────────────────────────────
 *   기본은 «검사만»(dry-run). --write 를 줘야 실제로 쓴다.
 *   id 매핑: 에디터의 bdv24_facility_<id> / bdv24_site_<id> / bdv24_decor_<id> /
 *            bdv24_boundary_<id> 를 0097 landmark 의 <id> 에 맞춘다.
 *
 * 사용: node sync_placement.js <에디터JSON> [--write]
 */
'use strict';
const fs = require('fs');
const path = require('path');

const SRC = process.argv[2];
const WRITE = process.argv.includes('--write');
if (!SRC) { console.error('사용: node sync_placement.js <에디터JSON> [--write]'); process.exit(1); }

const ROOT = path.resolve(__dirname, '..', '..');
const P97 = path.join(ROOT, 'src', 'blocks', '0097_bd-district-world-v19-data.js');

const editor = JSON.parse(fs.readFileSync(SRC, 'utf8'));

/* 0097 에는 대입이 «두 개» 있다 — _CONFIG 다음에 _MAPS.
   그래서 «= 뒤 전부»를 JSON 으로 읽으면 실패한다(실제로 한 번 걸렸다).
   중괄호 짝을 세어 첫 객체의 끝을 정확히 찾는다. 문자열 안의 괄호를 세지 않도록
   따옴표와 이스케이프를 함께 본다. */
function sliceObject(s, from) {
  let depth = 0, inStr = false, esc = false;
  for (let i = from; i < s.length; i++) {
    const ch = s[i];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === '\\') esc = true;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') { inStr = true; continue; }
    if (ch === '{') depth++;
    else if (ch === '}') { depth--; if (depth === 0) return i + 1; }
  }
  throw new Error('객체의 끝을 찾지 못했습니다');
}

function load97() {
  const raw = fs.readFileSync(P97, 'utf8');
  const key = '__BD_DISTRICT_WORLD_V24_CONFIG';
  const at = raw.indexOf(key);
  if (at < 0) throw new Error('0097 에서 ' + key + ' 를 찾지 못했습니다');
  const open = raw.indexOf('{', at);
  const end = sliceObject(raw, open);
  return {
    head: raw.slice(0, open),
    tail: raw.slice(end),
    config: JSON.parse(raw.slice(open, end))
  };
}

const { head, tail, config } = load97();

/* 에디터 오브젝트 색인.
   id 접두사로만 찾으면 4건이 새 나갔다(라벨이 «봉담와우도서관·청소년문화의집» vs
   «…·봉담청소년문화의집» 처럼 미묘하게 달라 라벨 매칭도 실패).
   에디터 오브젝트에는 facilityId / siteFor 필드가 있고 이것이 landmark 의 id 와 같다 —
   그쪽을 우선 키로 쓴다. */
function indexStage(sid) {
  const byId = new Map(), byFacility = new Map();
  const objs = (editor.stages[String(sid)] && editor.stages[String(sid)].objects) || [];
  for (const o of objs) {
    const id = o.id || o._editorId;
    if (id) byId.set(id, o);
    const f = o.facilityId || o.siteFor;
    /* 같은 facility 에 건물과 부지가 둘 다 있을 수 있다 — 건물(사각 스프라이트)을 우선한다 */
    if (f && (!byFacility.has(f) || o.type === 'building')) byFacility.set(f, o);
  }
  return { byId, byFacility, objs };
}

const PREFIXES = ['bdv24_facility_', 'bdv24_site_', 'bdv24_decor_', 'bdv24_boundary_', ''];
function findFor(map, landmarkId) {
  for (const p of PREFIXES) {
    const k = p + landmarkId;
    if (map.byId.has(k)) return { key: k, obj: map.byId.get(k) };
  }
  if (map.byFacility.has(landmarkId)) {
    const o = map.byFacility.get(landmarkId);
    return { key: (o.id || o._editorId || '(facilityId)'), obj: o };
  }
  return null;
}

/* --info : 구조와 미매칭 항목을 들여다본다(고칠 것을 정하기 전에) */
if (process.argv.includes('--info')) {
  for (const st of config.stages) {
    const arrs = Object.keys(st).filter(k => Array.isArray(st[k]));
    console.log(st.id + ' 배열: ' + arrs.map(k => k + '(' + st[k].length + ')').join(' '));
  }
  console.log('');
  console.log('■ 매칭 실패 항목의 에디터 쪽 후보 (라벨로 찾기)');
  for (const st of config.stages) {
    const map = indexStage(st.id);
    const objs = [...map.byId.entries()];
    for (const lm of (st.landmarks || [])) {
      if (findFor(map, lm.id)) continue;
      const byLabel = objs.filter(([k, o]) => o.label && lm.label
        && (o.label === lm.label || o.label.indexOf(lm.label) >= 0 || lm.label.indexOf(o.label) >= 0));
      console.log('  ' + st.id + ' ' + lm.id + ' «' + (lm.label || '') + '»');
      if (byLabel.length) byLabel.slice(0, 3).forEach(([k, o]) =>
        console.log('      후보 id=' + k + '  label=«' + o.label + '»  asset=' + (o.assetId || o.key || '-')));
      else console.log('      후보 없음');
    }
  }
  process.exit(0);
}

const EPS = 0.0005;
let totalMoved = 0, totalAsset = 0, totalMiss = 0, totalDecor = 0;
const report = [];

for (const st of config.stages) {
  const map = indexStage(st.id);
  let moved = 0, asset = 0, miss = 0, decorMoved = 0;
  const missIds = [];
  /* 건물을 옮기면 그 앞의 장식(볼라드·화단·안내판)도 같이 가야 한다.
     각 장식에 follows_building_translation:true 와 decoration_for 가 있으므로
     부모 건물의 이동량만큼 평행 이동시킨다. 이걸 빼먹으면 장식만 원래 자리에 남는다. */
  const decorsOf = new Map();
  for (const d of (st.buildingDecorations || [])) {
    if (!d || !d.decoration_for) continue;
    if (!decorsOf.has(d.decoration_for)) decorsOf.set(d.decoration_for, []);
    decorsOf.get(d.decoration_for).push(d);
  }
  for (const lm of (st.landmarks || [])) {
    const f = findFor(map, lm.id);
    if (!f) { miss++; if (missIds.length < 5) missIds.push(lm.id); continue; }
    const o = f.obj;
    const b = lm.bounds || [0, 0, 0, 0];
    const nb = [o.rx, o.ry, o.rw, o.rh];
    if (nb.some(v => typeof v !== 'number')) continue;

    const dm = Math.abs(nb[0] - b[0]) > EPS || Math.abs(nb[1] - b[1]) > EPS
            || Math.abs(nb[2] - b[2]) > EPS || Math.abs(nb[3] - b[3]) > EPS;
    if (dm) {
      moved++;
      if (WRITE) {
        /* 충돌 박스는 원래 bounds 와의 «상대 관계»를 유지한 채 함께 옮긴다.
           collider 는 건물 그림 안쪽에 조금 들어와 있는 값이라 절대 좌표로 덮으면
           히트박스가 어긋난다. */
        if (Array.isArray(lm.collider_bounds) && lm.collider_bounds.length === 4 && b[2] && b[3]) {
          const c = lm.collider_bounds;
          const relx = (c[0] - b[0]) / b[2], rely = (c[1] - b[1]) / b[3];
          const relw = c[2] / b[2], relh = c[3] / b[3];
          lm.collider_bounds = [
            +(nb[0] + relx * nb[2]).toFixed(8), +(nb[1] + rely * nb[3]).toFixed(8),
            +(relw * nb[2]).toFixed(8), +(relh * nb[3]).toFixed(8)
          ];
        }
        /* 상호작용·라벨 점도 같은 방식으로 따라간다 */
        for (const k of ['interaction', 'label_point']) {
          const pt = lm[k];
          if (Array.isArray(pt) && pt.length === 2 && b[2] && b[3]) {
            const rx = (pt[0] - b[0]) / b[2], ry = (pt[1] - b[1]) / b[3];
            lm[k] = [+(nb[0] + rx * nb[2]).toFixed(8), +(nb[1] + ry * nb[3]).toFixed(8)];
          }
        }
        /* 장식은 «평행 이동만» 따라간다(follows_building_resize 는 false).
           건물 중심의 이동량을 그대로 더한다. */
        const dxc = (nb[0] + nb[2] / 2) - (b[0] + b[2] / 2);
        const dyc = (nb[1] + nb[3] / 2) - (b[1] + b[3] / 2);
        for (const d of (decorsOf.get(lm.id) || [])) {
          if (d.follows_building_translation === false) continue;
          if (Array.isArray(d.bounds) && d.bounds.length === 4) {
            d.bounds = [+(d.bounds[0] + dxc).toFixed(8), +(d.bounds[1] + dyc).toFixed(8),
                        d.bounds[2], d.bounds[3]];
            decorMoved++;
          }
          if (Array.isArray(d.collider_bounds) && d.collider_bounds.length === 4) {
            d.collider_bounds = [+(d.collider_bounds[0] + dxc).toFixed(8),
                                 +(d.collider_bounds[1] + dyc).toFixed(8),
                                 d.collider_bounds[2], d.collider_bounds[3]];
          }
        }
        lm.bounds = [+nb[0].toFixed(8), +nb[1].toFixed(8), +nb[2].toFixed(8), +nb[3].toFixed(8)];
      } else {
        /* 검사(dry-run)에서도 «몇 개가 따라갈지»는 세어 둔다 */
        decorMoved += (decorsOf.get(lm.id) || []).length;
      }
    }

    /* 스프라이트 배정 */
    const aid = o.assetId || (typeof o.key === 'string' && o.key.indexOf('asset:') === 0 ? o.key.slice(6) : null);
    if (aid && lm.asset_id && aid !== lm.asset_id) {
      asset++;
      report.push('    스프라이트 ' + lm.id + ': ' + lm.asset_id + ' → ' + aid + '  (' + (lm.label || '') + ')');
      if (WRITE) lm.asset_id = aid;
    }
  }
  totalMoved += moved; totalAsset += asset; totalMiss += miss; totalDecor += decorMoved;
  console.log(String(st.id) + ' ' + String(st.district || '').padEnd(5)
    + ' landmarks ' + String((st.landmarks || []).length).padStart(3)
    + ' · 위치변경 ' + String(moved).padStart(3)
    + ' · 스프라이트변경 ' + String(asset).padStart(2)
    + ' · 장식이동 ' + String(decorMoved).padStart(3) + ' · 매칭실패 ' + miss + (missIds.length ? ' (' + missIds.join(',') + ')' : ''));
}

if (report.length) { console.log(''); console.log('■ 스프라이트 배정 차이'); report.forEach(r => console.log(r)); }
console.log('');
console.log('합계 위치 ' + totalMoved + ' · 장식 ' + totalDecor + ' · 스프라이트 ' + totalAsset + ' · 매칭실패 ' + totalMiss);

if (WRITE) {
  /* source 메타에 «무엇으로부터 갱신했는지»를 남긴다 — 다음 사람이 추적할 수 있게 */
  config.source = config.source || {};
  config.source.userJson = path.basename(SRC);
  config.source.userSavedAt = editor.savedAt || '';
  config.source.syncedAt = new Date().toISOString();
  fs.writeFileSync(P97, head + JSON.stringify(config) + tail, 'utf8');
  console.log('0097 갱신 완료');
} else {
  console.log('(검사만 — 실제로 쓰려면 --write)');
}
