
/* ══════════════════════════════════════════════════════════════════
   (v239) BD_ASSETS — 에셋 슬롯 레지스트리
   ------------------------------------------------------------------
   아트가 준비되지 않아도 개발이 멈추지 않도록, 그림이 필요한 모든 지점을
   "슬롯 키"로 추상화한다. 아트팀은 아래 BD_ASSET_CONFIG 에 URL 만 채우면
   게임 전체의 해당 그림이 교체된다. 미등록 슬롯은 지금의 플레이스홀더
   (절차 SVG·이모지)로 자동 폴백한다.

   슬롯 키 규약
     enemy.<variantId>   전투 적 일러스트   (예: enemy.trash, enemy.noise_bat)
     enemy.boss          최종 보스
     hero.battle         전투 주인공 일러스트
     npc.<npcId>         NPC 초상화        (예: npc.hyunji, npc.dohyun)
     ui.badge            담이(지킴이 배지) 아이콘
   ══════════════════════════════════════════════════════════════════ */

/* ▼▼▼ 아트팀 작업 구역 — URL 만 채우면 됩니다 (비워두면 기본 그림) ▼▼▼ */
window.BD_ASSET_CONFIG = {
  // (v240f) A-1 전투 적 일러스트 12종 — 납품본(800px, 투명 배경 확인) → 600px q82 최적화 인라인
  'enemy.bicycle': 'data:image/webp;base64,@@B64:ae2f3543_bicycle.webp@@',
  'enemy.bottle': 'data:image/webp;base64,@@B64:8e1504b5_bottle.webp@@',
  'enemy.cigarette': 'data:image/webp;base64,@@B64:a5d5db17_cigarette.webp@@',
  'enemy.dark_alley': 'data:image/webp;base64,@@B64:e74de50d_dark_alley.webp@@',
  'enemy.glass': 'data:image/webp;base64,@@B64:83b4dfb3_glass.webp@@',
  'enemy.graffiti': 'data:image/webp;base64,@@B64:795a39d1_graffiti.webp@@',
  'enemy.kickboard': 'data:image/webp;base64,@@B64:63cf3eb2_kickboard.webp@@',
  'enemy.noise_bat': 'data:image/webp;base64,@@B64:39dce2c3_noise_bat.webp@@',
  'enemy.road_crack': 'data:image/webp;base64,@@B64:299fbd28_road_crack.webp@@',
  'enemy.sign_ghost': 'data:image/webp;base64,@@B64:8f692507_sign_ghost.webp@@',
  'enemy.streetlight': 'data:image/webp;base64,@@B64:3d35cdd2_streetlight.webp@@',
  'enemy.trash': 'data:image/webp;base64,@@B64:f77209f6_trash.webp@@',
  // (v240h) 스킬 이펙트·피격·판정·소멸 + 플레이어 포즈 27종 — 납품본 최적화 인라인
  'fx.skill.sticker': 'data:image/webp;base64,@@B64:22e316b6_sticker.webp@@',
  'fx.skill.fan': 'data:image/webp;base64,@@B64:3310c082_fan.webp@@',
  'fx.skill.wash': 'data:image/webp;base64,@@B64:80d5f5b9_wash.webp@@',
  'fx.skill.light': 'data:image/webp;base64,@@B64:04a4107e_light.webp@@',
  'fx.skill.cheer': 'data:image/webp;base64,@@B64:a5e9a89c_cheer.webp@@',
  'fx.skill.ult': 'data:image/webp;base64,@@B64:fad6c6b6_ult.webp@@',
  'fx.hit.W': 'data:image/webp;base64,@@B64:1b08a341_asset.webp@@',
  'fx.hit.G': 'data:image/webp;base64,@@B64:f27dfa4b_asset.webp@@',
  'fx.hit.M': 'data:image/webp;base64,@@B64:765e38ca_asset.webp@@',
  'fx.hit.N': 'data:image/webp;base64,@@B64:2e5f284e_asset.webp@@',
  'fx.hit.crit': 'data:image/webp;base64,@@B64:50f09d65_crit.webp@@',
  'fx.judge.perfect': 'data:image/webp;base64,@@B64:2438c5c8_perfect.webp@@',
  'fx.purify': 'data:image/webp;base64,@@B64:810806ef_purify.webp@@',
  'hero.pose.f.sticker': 'data:image/webp;base64,@@B64:11cb2bea_sticker.webp@@',
  'hero.pose.f.fan': 'data:image/webp;base64,@@B64:5596a6ae_fan.webp@@',
  'hero.pose.f.wash': 'data:image/webp;base64,@@B64:5ab46e15_wash.webp@@',
  'hero.pose.f.light': 'data:image/webp;base64,@@B64:375dedae_light.webp@@',
  'hero.pose.f.cheer': 'data:image/webp;base64,@@B64:2ea19549_cheer.webp@@',
  'hero.pose.f.ult': 'data:image/webp;base64,@@B64:0a028f59_ult.webp@@',
  'hero.pose.f.hit': 'data:image/webp;base64,@@B64:8b357381_hit.webp@@',
  'hero.pose.m.sticker': 'data:image/webp;base64,@@B64:264bcda7_sticker.webp@@',
  'hero.pose.m.fan': 'data:image/webp;base64,@@B64:91e6c561_fan.webp@@',
  'hero.pose.m.wash': 'data:image/webp;base64,@@B64:f89d070c_wash.webp@@',
  'hero.pose.m.light': 'data:image/webp;base64,@@B64:d29e57b5_light.webp@@',
  'hero.pose.m.cheer': 'data:image/webp;base64,@@B64:933eba0b_cheer.webp@@',
  'hero.pose.m.ult': 'data:image/webp;base64,@@B64:2c8570d9_ult.webp@@',
  'hero.pose.m.hit': 'data:image/webp;base64,@@B64:8770fa62_hit.webp@@',
  // 'enemy.boss':      'assets/enemy_boss.png',   // 미도착
  // 'hero.battle':     'assets/hero_battle.png',
  // 'npc.hyunji':      'assets/npc_hyunji.png',
  // 'ui.badge':        'assets/dami.png',
};
/* ▲▲▲ 아트팀 작업 구역 끝 ▲▲▲ */

/* (v240i 스킨 롤백) 납품 UI 132종은 내부 반투명+자리표시가 구워진 목업형으로 확인되어 적용 철회.
   자리표시·반투명 없는 재납품 시 재적용 예정. */

(function () {
  'use strict';
  var LS_KEY = 'bd_assets_v1';
  var map = {};
  // 우선순위: 코드 설정(BD_ASSET_CONFIG) > localStorage(개발 중 콘솔 등록)
  try { Object.assign(map, JSON.parse(localStorage.getItem(LS_KEY) || '{}')); } catch (e) { }
  try { Object.assign(map, window.BD_ASSET_CONFIG || {}); } catch (e) { }

  var approxSize = 0, purged = false;
  function persist() {
    /* (v377) 내장(베이크) 대용량 dataURL 이 등록될 때마다 전체 맵을 재직렬화(수 MB × 호출 수)해
       저사양 기기에서 GC 폭풍·쿼터 예외를 만들던 문제 — 맵이 3MB 를 넘으면 저장하지 않는다
       (게시 빌드 에셋은 HTML 에 이미 내장돼 있어 저장할 이유가 없다). 기존 대용량 저장분은 1회 정리. */
    try {
      if (approxSize === 0) { for (var k in map) approxSize += (map[k] || '').length + k.length + 8; }
      if (approxSize > 3000000) {
        if (!purged) { purged = true; try { localStorage.removeItem(LS_KEY); } catch (e2) { } }
        return;
      }
      localStorage.setItem(LS_KEY, JSON.stringify(map));
    } catch (e) { }
  }

  window.BD_ASSETS = {
    /** 슬롯에 이미지 URL(또는 dataURL) 등록 */
    set: function (key, url) { approxSize += (url || '').length; map[key] = url; persist(); return true; },
    setMany: function (obj) { for (var k2 in (obj || {})) approxSize += (obj[k2] || '').length; Object.assign(map, obj || {}); persist(); },
    get: function (key) { return map[key] || null; },
    has: function (key) { return !!map[key]; },
    remove: function (key) { delete map[key]; persist(); },
    /** <img> HTML. 미등록이면 null → 호출부가 폴백을 그린다 */
    imgHTML: function (key, style, alt) {
      var u = map[key]; if (!u) return null;
      return '<img src="' + u + '" alt="' + (alt || key) + '" style="' + (style || 'object-fit:contain;display:block;width:100%;height:100%;') + '">';
    },
    /** drawImage 용 캐시 이미지. 미등록/로딩 전이면 null → 호출부가 기존 그림 폴백 */
    image: (function(){
      var cache = {};
      return function (key) {
        var u = map[key]; if (!u) return null;
        var c = cache[key];
        if (!c || c._src !== u) {
          c = new Image(); c._src = u; c.src = u; cache[key] = c;
        }
        return (c.complete && c.naturalWidth > 0) ? c : null;
      };
    })(),
    /** 게임이 요구하는 전체 슬롯 목록 (아트 체크리스트) */
    slots: function () {
      var out = ['hero.battle', 'enemy.boss', 'ui.badge',
                 'field.npc.hyunji', 'field.npc.dohyun'];
      try {
        Object.keys(HAZARD_VARIANTS).forEach(function (k) {
          if (k === 'dust') return;                     // noise_bat 의 별칭 — 중복 방지
          out.push('enemy.' + k);
          out.push('field.hazard.' + k);                // 맵 위 아이콘
        });
      } catch (e) { }
      try {
        (window.BD_NPCS || []).forEach(function (n) { out.push('npc.' + n.id.replace(/^npc_/, '')); });
      } catch (e) { }
      return out;
    },
    /** 등록/미등록 현황을 콘솔 표로 — 아트팀 인수인계용 */
    checklist: function () {
      var rows = this.slots().map(function (k) {
        return { slot: k, status: map[k] ? '✅ 등록됨' : '⬜ 미등록(기본 그림)', url: (map[k] || '').slice(0, 48) };
      });
      console.table(rows);
      return rows;
    }
  };
})();

/* ══════════════════════════════════════════════════════════════════
   (v239) 안전 수첩 (도감)
   ------------------------------------------------------------------
   정화한 위험요소가 수첩에 기록된다. HAZARD_VARIANTS 의 edu(교육 문구)를
   수집 보상으로 전환 — 아이에게는 모으는 재미, 선생님에게는 학습 결과물.
   에셋 불필요: 아이콘은 이모지, 그림이 등록되면 자동으로 교체 표시.
   ══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  function codex() {
    try { if (!window.BD) return {}; if (!BD.codex) BD.codex = {}; return BD.codex; } catch (e) { return {}; }
  }
  function variants() {
    var out = [];
    try {
      Object.keys(HAZARD_VARIANTS).forEach(function (k) {
        if (k === 'dust') return;
        var v = HAZARD_VARIANTS[k];
        if (v && v.name) out.push({ id: k, name: v.name, icon: v.icon || '❓', fam: v.fam, edu: v.edu || '' });
      });
    } catch (e) { }
    return out;
  }

  /** 정화 성공 시 호출 — 새 항목이면 true */
  window.BD_codexRecord = function (variantId) {
    if (!variantId) return false;
    if (variantId === 'dust') variantId = 'noise_bat';
    var c = codex();
    if (c[variantId]) return false;
    c[variantId] = Date.now();
    try { if (typeof bdSave === 'function') bdSave(); } catch (e) { }
    try {
      var v = HAZARD_VARIANTS[variantId];
      if (typeof bdToast === 'function') bdToast('📔 안전수첩에 「' + (v ? v.name : variantId) + '」 기록 완료!', 3200);
      if (window.BD_DAMI) BD_DAMI.show('수첩에 기록했어요! 위쪽 📔 버튼에서 언제든 다시 볼 수 있어요', { face: 'proud', once: 'dami_codex' });
    } catch (e) { }
    return true;
  };

  /* ── 수첩 UI ── */
  var css = ''
    + '#bd-codex-ov{position:fixed;inset:0;z-index:5200;display:none;align-items:center;justify-content:center;'
    +   'background:rgba(4,8,18,.8)}'
    + '#bd-codex-ov.show{display:flex}'
    + '#bd-codex{width:min(720px,92vw);max-height:84vh;overflow:auto;background:rgba(13,20,40,.98);'
    +   'border:1px solid rgba(255,216,77,.6);border-radius:16px;padding:18px 20px;color:#e8f2ff;'
    +   'font-family:system-ui,-apple-system,"Malgun Gothic",sans-serif}'
    + '#bd-codex h3{margin:0 0 4px;color:#ffd84d;font-size:20px}'
    + '#bd-codex .bd-cdx-sub{font-size:13px;color:#9fb0d0;margin-bottom:14px}'
    + '.bd-cdx-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px}'
    + '.bd-cdx-card{border:1px solid rgba(255,255,255,.14);border-radius:12px;padding:10px 12px;'
    +   'background:rgba(255,255,255,.04)}'
    + '.bd-cdx-card.on{border-color:rgba(255,216,77,.55);background:rgba(255,216,77,.07)}'
    + '.bd-cdx-head{display:flex;align-items:center;gap:8px;font-weight:800;font-size:15px}'
    + '.bd-cdx-ic{font-size:26px;width:34px;height:34px;display:flex;align-items:center;justify-content:center}'
    + '.bd-cdx-ic img{width:34px;height:34px;object-fit:contain;display:block}'
    + '.bd-cdx-edu{margin-top:7px;font-size:12.5px;line-height:1.55;color:#cfe0ff}'
    + '.bd-cdx-card:not(.on) .bd-cdx-edu{color:#64748b}'
    + '.bd-cdx-fam{margin-left:auto;font-size:11px;color:#9fb0d0}'
    + '#bd-codex-close{margin-top:14px;width:100%;padding:10px;border-radius:10px;border:1px solid rgba(255,255,255,.25);'
    +   'background:rgba(255,255,255,.08);color:#e8f2ff;font-size:14px;cursor:pointer}'
    + '#bd-codex-close:hover{background:rgba(255,255,255,.16)}';
  (function () { var s = document.createElement('style'); s.textContent = css; document.head.appendChild(s); })();

  var FAM_NAME = { smoke: '공기·연기', pollute: '오염·정리', dark: '시설·어둠' };

  function render() {
    var c = codex();
    var vs = variants();
    var got = vs.filter(function (v) { return c[v.id]; }).length;
    var rows = vs.map(function (v) {
      var on = !!c[v.id];
      var iconHtml = on
        ? ((window.BD_ASSETS && BD_ASSETS.imgHTML('enemy.' + v.id, 'width:34px;height:34px;object-fit:contain;')) || v.icon)
        : '❓';
      return '<div class="bd-cdx-card' + (on ? ' on' : '') + '">'
        + '<div class="bd-cdx-head"><span class="bd-cdx-ic">' + iconHtml + '</span>'
        + '<span>' + (on ? v.name : '???') + '</span>'
        + '<span class="bd-cdx-fam">' + (FAM_NAME[v.fam] || '') + '</span></div>'
        + '<div class="bd-cdx-edu">' + (on ? v.edu : '정화하면 안전 지식이 기록됩니다') + '</div>'
        + '</div>';
    }).join('');
    return '<h3>📔 안전 수첩</h3>'
      + '<div class="bd-cdx-sub">정화한 위험요소 ' + got + ' / ' + vs.length
      + ' — 봉담을 지키며 배운 안전 지식이 쌓여요</div>'
      + '<div class="bd-cdx-grid">' + rows + '</div>'
      + '<button id="bd-codex-close" type="button">닫기 (ESC)</button>';
  }

  function ensure() {
    var ov = document.getElementById('bd-codex-ov');
    if (!ov) {
      ov = document.createElement('div'); ov.id = 'bd-codex-ov';
      ov.innerHTML = '<div id="bd-codex"></div>';
      document.body.appendChild(ov);
      ov.addEventListener('click', function (e) { if (e.target === ov) window.BD_codexClose(); });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && ov.classList.contains('show')) { e.stopPropagation(); window.BD_codexClose(); }
      }, true);
    }
    return ov;
  }

  window.BD_codexOpen = function () {
    var ov = ensure();
    ov.querySelector('#bd-codex').innerHTML = render();
    var btn = ov.querySelector('#bd-codex-close');
    if (btn) btn.onclick = window.BD_codexClose;
    ov.classList.add('show');
  };
  window.BD_codexClose = function () {
    var ov = document.getElementById('bd-codex-ov');
    if (ov) ov.classList.remove('show');
  };

  // 상단 메뉴에 📔 버튼 추가 (기존 버튼 줄에 합류)
  function mountBtn() {
    var bar = document.getElementById('bd-menu-btns');
    if (!bar || document.getElementById('bd-codex-btn')) return;
    var b = document.createElement('button');
    b.id = 'bd-codex-btn'; b.type = 'button'; b.textContent = '🛡️ 안전수첩'; // (v390) 장소수첩과 이모지 충돌 해소
    b.onclick = function () { window.BD_codexOpen(); };
    bar.insertBefore(b, bar.firstChild);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountBtn);
  else mountBtn();
  setTimeout(mountBtn, 1500);
})();

