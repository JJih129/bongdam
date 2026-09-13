/* bd-pc-polish-v399 — PC 웹(마우스·키보드) 감사(PC웹_개선제안_v399.md)의 S·A·B 항목 구현.
 *
 * 판정: html.bd-pc = pointer:fine 이고 터치 포인트가 없는 환경. 터치 기기의 동작은 바꾸지 않는다.
 *
 * S-1  대화창(#dialogue-box) 클릭으로 대사 진행 + «▼ 클릭 · Space» 힌트 표시
 * S-3  ESC 는 «맨 위에 열린 창 하나»만 닫는다 — 설정(0054) 위에 일시정지가 겹쳐 열리던 문제
 * S-4  장소 발견 카드는 가방·지도·상점 등 패널이 열려 있는 동안 대기(0120 큐 재사용)
 * S-6  PC 는 첫 입력 자동 전체화면 끔(설정 ⛶·Shift+F·F11 만) · 상단 «전체화면» 필 숨김 · «탭하면» → «클릭하면»
 * A-1  키 안내바를 상시 표시(전투·타이틀 제외) + M 지도 · J 임무 · Esc 메뉴 · Shift+F 전체화면 추가
 * A-2  상단 바에 🎒 가방(E)·📋 임무(J) 버튼 · 위험요소/주민/상점 위에 커서·툴팁 · 대상 클릭 → F (아무 데나 클릭→F 는 끔)
 *      먼 곳 클릭은 0262(클릭 이동) 가 걷는다
 * A-3  좌상단 임무 HUD 에 반투명 패널(밝은 타일 위 판독 불가)
 * A-4  전투 «물러나기» 확인 — ESC·버튼 첫 입력은 안내만, 2.5초 안에 한 번 더 누르면 실행
 * A-5  가방 탭 줄바꿈 금지 · 업적/안전도 탭 글자색을 밝은 배경에 맞게 · 빈 상태 대비
 * A-6  닫기 버튼에 씌워지던 «타이틀로» 스킨 이미지 제거
 * A-7  설정 창 통합 — 일시정지·타이틀 「설정」도 ⚙ 설정(0054)을 열고, 거기에 UI 크기·길안내·튜토 다시보기 행을 넣는다.
 *      「조작법」 모달을 현행 키(J/M/ESC/Space/전투 Q/E/I/ESC)로 갱신
 * A-8  UI 크기 130% 에서 타이틀이 잘리던 문제 — 100vh 는 zoom 을 모르므로 --bd-zoom 으로 나눈다
 * A-9  Tab 포커스가 보이지 않는 요소(숨은 HUD·뒤에 깔린 설정)로 가던 문제 — 보이는 것만, 열린 모달 안에서만 순환
 * B-1  데스크톱 최소 글자 12px(미니맵·키바·HP 수치·전투 버튼 설명·임무 카운터·엔딩 카드)
 * B-2  1920 폭 대화창 — 본문 폭 상한·화자 이름을 본문 시작점에
 * B-9  J/M 키를 물리 키(e.code) 로도 (WASD/E/F 는 0017 소스에서 처리)
 *
 * 되돌리기: 이 블록 삭제. (0262 클릭 이동·0226 자가치유 판정·shell 옵션 모달 제거는 소스 편집 — git 참조)
 */
(function () {
  'use strict';
  if (window.__bdPcPolish399) return;
  window.__bdPcPolish399 = 1;

  var TOUCH = (navigator.maxTouchPoints || 0) > 0 || (window.matchMedia && matchMedia('(pointer: coarse)').matches);
  var FINE = !!(window.matchMedia && matchMedia('(pointer: fine)').matches) && !TOUCH;
  var root = document.documentElement;
  root.classList.toggle('bd-pc', FINE);

  function $(id) { return document.getElementById(id); }
  function vis(el) { try { if (!el) return false; var s = getComputedStyle(el); if (s.display === 'none' || s.visibility === 'hidden' || parseFloat(s.opacity) < 0.05) return false; var r = el.getBoundingClientRect(); return r.width > 1 && r.height > 1; } catch (e) { return false; } }
  function zoom() { try { var z = parseFloat(getComputedStyle(document.body).zoom); return (z > 0) ? z : 1; } catch (e) { return 1; } }
  function toast(t) { try { if (typeof bdToast === 'function') bdToast(t); else if (window.BD_toast) BD_toast(t); } catch (e) {} }
  function inBattle() { return !!(window.HSR && HSR.active); }
  function onTitle() { var t = $('bd-title-screen'); return !!(t && getComputedStyle(t).display !== 'none'); }
  function gameUp() { var gs = $('game-screen'); return !!(gs && gs.style.display === 'block') && !onTitle(); }

  /* ══════════ CSS ══════════ */
  var st = document.createElement('style');
  st.id = 'bd-pc-polish-v399-css';
  st.textContent =
    /* S-1 대화 진행 힌트 */
    'html.bd-pc #dialogue-next{opacity:.85!important;font-size:13px!important;color:#c9b27e!important}' +
    'html.bd-pc #dialogue-box{cursor:pointer}' +
    /* A-1 키바 — 0063 이 250ms 마다 inline display 를 다시 쓰므로 !important 클래스로 이긴다 */
    'html.bd-pc #bd-keybar.bd-pc-show{display:block!important}html.bd-pc #bd-keybar.bd-pc-hide{display:none!important}' +
    /* S-6 PC 에는 상단 전체화면 필을 두지 않는다 */
    'html.bd-pc #bd-fullscreen-return{display:none!important}' +
    /* A-3 임무 HUD 패널 */
    'html.bd-pc #bd-quest-hud{background:rgba(10,14,26,.62)!important;border:1px solid rgba(255,216,107,.22)!important;' +
      'border-radius:12px!important;padding:8px 12px 9px!important;-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px)}' +
    /* A-5 가방 */
    '.inv-tab{white-space:nowrap!important;min-width:60px!important;padding-left:12px!important;padding-right:12px!important}' +
    '#inv-panel .achieve-name,#inv-achieve-panel .achieve-name{color:#5b4127!important}' +
    '#inv-panel .achieve-card:not(.done) .achieve-name,#inv-achieve-panel .achieve-card:not(.done) .achieve-name{color:#8a7a66!important}' +
    '#inv-panel .achieve-desc,#inv-achieve-panel .achieve-desc{color:#6b5233!important;font-size:12.5px!important}' +
    '#inv-panel .safety-skill-name,#inv-safety-panel .safety-skill-name{color:#4a3520!important}' +
    '#inv-panel .safety-skill-desc,#inv-safety-panel .safety-skill-desc{color:#6b5233!important;font-size:12.5px!important}' +
    '#safety-level-text{color:#3d2c18!important;text-shadow:none!important}' +
    '.inv-empty{color:#7a5a35!important}' +
    /* A-6 닫기 버튼 스킨 */
    '.bd-modal-close,#bd-codex-close{background-image:none!important;background:rgba(120,80,30,.16)!important;' +
      'border:1px solid rgba(140,100,50,.55)!important;color:#4a3520!important;text-shadow:none!important;border-radius:10px!important;height:auto!important;padding:10px 14px!important}' +
    /* A-8 타이틀 — vh 는 zoom 을 모른다 */
    '#bd-title-screen{height:calc(100vh / var(--bd-zoom,1))!important;min-height:0!important;max-height:calc(100vh / var(--bd-zoom,1))!important;overflow:hidden!important}' +
    '#bd-title-screen .frame{height:calc(100vh / var(--bd-zoom,1))!important;min-height:0!important}' +
    /* A-2 상단 버튼·툴팁·커서 */
    'html.bd-pc #bd-pc-tip{position:fixed;display:none;pointer-events:none;z-index:821;padding:4px 10px;border-radius:8px;font-size:12.5px;font-weight:800;' +
      'background:rgba(16,24,44,.94);color:#ffe9a8;border:1px solid rgba(255,216,107,.6);box-shadow:0 4px 12px rgba(0,0,0,.4);white-space:nowrap}' +
    'html.bd-pc #game-canvas.bd-pc-hot{cursor:pointer}' +
    /* B-2 대화창 */
    'html.bd-pc #dialogue-text{max-width:1180px!important}' +
    'html.bd-pc #dialogue-name{left:4%!important}' +
    /* A-7 설정 추가 행 */
    '#bd-settings-modal .bd-pc-row{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:10px;color:#cbd5e1;font-size:13px}' +
    /* (v399e 검수) 라벨 «UI 크기»가 열 폭 부족으로 한 글자씩 세로 배열되던 문제 */
    '#bd-settings-modal .bd-pc-row>span:first-child{white-space:nowrap;flex:0 0 auto}' +
    '#bd-settings-modal .bd-pc-row .seg button{white-space:nowrap}' +
    '#bd-settings-modal .bd-pc-row .seg{display:flex;gap:4px}' +
    '#bd-settings-modal .bd-pc-row button{padding:6px 9px;border-radius:7px;cursor:pointer;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.2);color:#e7ecf5;font-size:12px}' +
    '#bd-settings-modal .bd-pc-row button.on{background:rgba(255,213,74,.2);border-color:#ffd54a;color:#ffd54a}' +
    '#bd-pc-help{position:fixed;inset:0;z-index:3700;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.55)}' +
    '#bd-pc-help .box{background:rgba(15,19,32,.98);border:1px solid #c8902a;border-radius:14px;padding:18px 22px;width:min(560px,92vw);color:#e7ecf5;font-size:14px;line-height:1.75;word-break:keep-all;overflow-wrap:anywhere}' +
    '#bd-pc-help kbd{display:inline-block;min-width:22px;text-align:center;padding:1px 6px;border-radius:5px;background:#1d2333;border:1px solid #556;color:#ffd86b;font-weight:800;font-size:12px;margin:0 2px}' +
    '#bd-pc-help h4{margin:10px 0 4px;color:#ffd54a;font-size:14px}' +
    '#bd-pc-help button{width:100%;margin-top:14px;padding:9px;border-radius:8px;cursor:pointer;background:rgba(255,213,74,.15);border:1px solid #ffd54a;color:#ffd54a;font-weight:700}';
  (document.head || root).appendChild(st);

  /* ══════════ S-6. PC 자동 전체화면 끔 ══════════ */
  if (FINE) {
    var fsWanted = 0;
    function want() { fsWanted = Date.now(); }
    /* 사용자가 «분명히» 전체화면을 요청한 경로에서만 허용: Shift+F·F11(0015 문서 리스너보다 먼저 도는 window 캡처), 설정 ⛶ 버튼 */
    window.addEventListener('keydown', function (e) { if (e.key === 'F11' || ((e.key === 'F' || e.key === 'f') && e.shiftKey && !e.ctrlKey && !e.altKey)) want(); }, true);
    document.addEventListener('click', function (e) { try { var t = e.target && e.target.closest && e.target.closest('#bd-set-full,#bd-fullscreen-return,#bd-fsr-v398,.bd-pc-fs'); if (t) want(); } catch (x) {} }, true);
    ['requestFullscreen', 'webkitRequestFullscreen'].forEach(function (name) {
      var orig = Element.prototype[name];
      if (typeof orig !== 'function') return;
      Element.prototype[name] = function () {
        if (Date.now() - fsWanted > 800) { try { return Promise.resolve(); } catch (e) { return; } }   /* 첫 입력 자동 요청(0015) — 조용히 무시 */
        return orig.apply(this, arguments);
      };
    });
    /* «화면을 탭하면 …» 베일(0260)의 문구 */
    new MutationObserver(function () {
      var v = $('bd-fsr-v398'); if (!v || v.__bdPc) return; v.__bdPc = 1;
      try { v.querySelectorAll('b').forEach(function (b) { b.textContent = b.textContent.replace('탭하면', '클릭하면'); }); } catch (e) {}
    }).observe(document.documentElement, { childList: true, subtree: true });
  }

  /* ══════════ S-1. 대화창 클릭 ══════════ */
  function wireDialogueClick() {
    var box = $('dialogue-box'); if (!box || box.__bdPcClick) return; box.__bdPcClick = 1;
    box.addEventListener('click', function (e) {
      try {
        if (typeof dialogueOpen !== 'undefined' && dialogueOpen && typeof advanceDialogue === 'function') { e.preventDefault(); e.stopPropagation(); advanceDialogue(); }
      } catch (x) {}
    });
    var nx = $('dialogue-next'); if (nx && FINE) nx.textContent = '▼ 클릭 · Space';
  }

  /* ══════════ S-3. ESC — 맨 위 창 하나만 ══════════ */
  function topModal() {
    var list = [];
    function add(el, close) { if (el && vis(el)) { var z = parseInt(getComputedStyle(el).zIndex, 10) || 0; list.push({ el: el, z: z, close: close }); } }
    var sm = $('bd-settings-modal');
    if (sm) add(sm, function () { if (sm.classList.contains('show')) sm.classList.remove('show'); else sm.remove(); });
    add($('bd-pc-help'), function () { $('bd-pc-help').remove(); });
    var fm = $('bd-district-facility-modal');
    if (fm && fm.classList.contains('open')) add(fm, function () { if (window.BD_closeDistrictFacility) BD_closeDistrictFacility(); else fm.classList.remove('open'); });
    var cx = $('bd-codex-ov'); if (cx && cx.classList.contains('show')) add(cx, function () { if (window.BD_codexClose) BD_codexClose(); else cx.classList.remove('show'); });
    var mp = $('bd-map-v342'); if (mp && mp.classList.contains('show')) add(mp, function () { if (window.BD_closeSafetyMap) BD_closeSafetyMap(); else mp.classList.remove('show'); });
    var inv = $('inv-overlay'); if (inv && inv.classList.contains('open')) add(inv, function () { if (typeof closeInventory === 'function') closeInventory(); else inv.classList.remove('open'); });
    var q = $('quest-overlay'); if (q && q.classList.contains('open')) add(q, function () { if (typeof closeQuestPanel === 'function') closeQuestPanel(); else q.classList.remove('open'); });
    var pc = $('bd-place-card'); if (pc) add(pc, function () { try { var b = pc.querySelector('button'); if (b) b.click(); else pc.remove(); } catch (e) { pc.remove(); } });
    document.querySelectorAll('.bd-modal.show').forEach(function (m) {
      if (m.id === 'bd-pause-modal' || m.id === 'bd-settings-modal') return;
      add(m, function () { m.classList.remove('show'); try { if (m.id === 'bd-shop-modal' && typeof window.shopOpen !== 'undefined') window.shopOpen = false; } catch (e) {} });
    });
    if (!list.length) return null;
    list.sort(function (a, b) { return b.z - a.z; });
    return list[0];
  }
  var fleeArmedAt = 0;
  /* 같은 ESC 한 번에 0051 과 0227 이 각각 BD_onFlee 를 부른다 — 0.4초 안의 재호출은 «같은 입력»으로 보고 무시, 0.4~2.5초가 «두 번째 누름» */
  function fleeArmed() { var dt = Date.now() - fleeArmedAt; return dt > 400 && dt < 2500; }
  function fleeDup() { var dt = Date.now() - fleeArmedAt; return dt >= 0 && dt <= 400; }
  function armFlee() { fleeArmedAt = Date.now(); toast('🏃 한 번 더 누르면 전투에서 물러나요 (ESC / 물러나기)'); }
  window.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape' || e.repeat) return;
    try {
      if (inBattle()) {                                         /* A-4 — 0051(문서 캡처)·0227 보다 먼저 도는 window 캡처 */
        /* 스킬 메뉴·미니게임이 «보일 때»만 양보한다 — 요소는 숨긴 채로 DOM 에 남아 있어(0227 은 존재만 보고 물러나 0051 이 즉시 도주) */
        if (!(window.HSR && HSR.state === 'player') || vis($('bd-mg-light')) || vis($('hsr-skill-menu'))) return;
        if (fleeDup()) { e.preventDefault(); e.stopImmediatePropagation(); return; }
        if (fleeArmed()) { fleeArmedAt = 0; return; }           /* 두 번째 — 그대로 흘려보내 물러난다 */
        e.preventDefault(); e.stopImmediatePropagation(); armFlee(); return;
      }
      if (window.__bdSceneActive) return;
      if ($('bd-choice') && $('bd-choice').classList.contains('show')) return;   /* 선택창은 자체 처리 */
      var top = topModal(); if (!top) return;
      e.preventDefault(); e.stopImmediatePropagation();
      top.close();
    } catch (x) {}
  }, true);

  /* ══════════ S-4. 장소 카드는 패널이 닫힌 뒤 ══════════ */
  function panelOpen() {
    try {
      if (document.body.classList.contains('bd-panel-open')) return true;
      if (vis($('bd-settings-modal')) || vis($('bd-pc-help'))) return true;
      var fm = $('bd-district-facility-modal'); if (fm && fm.classList.contains('open')) return true;
      if (document.querySelector('.bd-modal.show')) return true;
      var inv = $('inv-overlay'); if (inv && inv.classList.contains('open')) return true;
      var q = $('quest-overlay'); if (q && q.classList.contains('open')) return true;
      var mp = $('bd-map-v342'); if (mp && mp.classList.contains('show')) return true;
      var cx = $('bd-codex-ov'); if (cx && cx.classList.contains('show')) return true;
    } catch (e) {}
    return false;
  }
  function wirePlaceCard() {
    var f = window.BD_showPlaceCard; if (!f || !f.__v77 || f.__bdPc) return;
    var orig = f.__orig; if (typeof orig !== 'function') return;
    function queue(id, opt) { try { var Q = window.BD_placeCardQueue; if (Q && !Q.some(function (q) { return q.id === id; })) Q.push({ id: id, opt: opt }); } catch (e) {} }
    /* ① 0120 의 펌프는 __orig 를 부른다 — 패널이 열려 있으면 다시 큐 뒤로 */
    var gated = function (id, opt) { if (panelOpen()) { queue(id, opt); return true; } return orig.call(window, id, opt); };
    /* ② 직접 호출 경로는 0120 래퍼의 클로저 orig 를 타므로 바깥에서 한 번 더 감싼다 */
    var outer = function (id, opt) { if (panelOpen()) { queue(id, opt); return true; } return f.call(window, id, opt); };
    outer.__v77 = true; outer.__orig = gated; outer.__bdPc = 1;
    window.BD_showPlaceCard = outer;
  }

  /* ══════════ A-4. 물러나기 확인 ══════════ */
  /* «물러나기» 버튼 — 0051 의 onclick 이 onFlee 를 직접 부르므로 문서 캡처에서 먼저 잡는다 */
  document.addEventListener('click', function (e) {
    try {
      var b = e.target && e.target.closest && e.target.closest('.hsr-act.hsr-flee'); if (!b || !inBattle()) return;
      if (fleeDup()) { e.preventDefault(); e.stopImmediatePropagation(); return; }
      if (fleeArmed()) { fleeArmedAt = 0; return; }
      e.preventDefault(); e.stopImmediatePropagation(); armFlee();
    } catch (x) {}
  }, true);
  var fleeWired = false;
  function wireFlee() {
    if (fleeWired) return;
    var inner = window.BD_onFlee;
    if (typeof inner !== 'function') return;
    fleeWired = true;
    var wrapped = function () {
      /* 키·버튼 게이트를 지나온 호출(armed) 또는 프로그램 호출은 그대로, 아니면 안내만 */
      if (fleeDup()) return false;
      if (fleeArmed() || !(window.HSR && HSR.state === 'player')) { fleeArmedAt = 0; return inner.apply(this, arguments); }
      armFlee();
      return false;
    };
    wrapped.__bdPc = 1;
    /* 전투 시작 때 0051/0227 이 BD_onFlee 를 다시 대입한다 — 대입은 inner 로 받고, 읽기는 항상 래퍼를 준다 */
    try {
      Object.defineProperty(window, 'BD_onFlee', { configurable: true, enumerable: true,
        get: function () { return wrapped; },
        set: function (v) { if (typeof v === 'function' && v !== wrapped) inner = v; } });
    } catch (e) { window.BD_onFlee = wrapped; }
  }

  /* ══════════ A-1. 키 안내바 상시 ══════════ */
  var KEYBAR_HTML = '<kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> 이동&nbsp;&nbsp;<kbd>F</kbd> 조사·대화&nbsp;&nbsp;<kbd>Space</kbd> 대화 넘기기&nbsp;&nbsp;' +
    '<kbd>E</kbd> 가방&nbsp;&nbsp;<kbd>J</kbd> 임무&nbsp;&nbsp;<kbd>M</kbd> 안전지도&nbsp;&nbsp;<kbd>Esc</kbd> 메뉴&nbsp;&nbsp;<kbd>Shift+F</kbd> 전체화면';
  function keybarTick() {
    if (!FINE) return;
    var kb = $('bd-keybar'); if (!kb) return;
    if (!kb.__bdPc) { kb.__bdPc = 1; kb.innerHTML = KEYBAR_HTML; }
    var show = gameUp() && !inBattle();
    kb.classList.toggle('bd-pc-show', show); kb.classList.toggle('bd-pc-hide', !show);
  }

  /* ══════════ A-2. 상단 버튼 · 커서 · 툴팁 · 대상 클릭 ══════════ */
  function mkBtn(id, text, title, onclick) {
    var b = document.createElement('button');
    b.id = id; b.type = 'button'; b.textContent = text; b.title = title; b.setAttribute('data-bdmb', '1');
    b.style.cssText = 'background:rgba(16,24,44,.92);border:1px solid rgba(255,216,107,.5);color:#ffe9a8;border-radius:12px;padding:8px 12px;font-size:13px;font-weight:700;cursor:pointer;';
    b.onclick = onclick;
    return b;
  }
  function mountButtons() {
    if (!FINE) return;
    var bar = $('bd-menu-btns'); if (!bar) return;
    if (!$('bd-pc-bag')) bar.insertBefore(mkBtn('bd-pc-bag', '🎒 가방', '가방 (E)', function () { try { if (window.BD_isInputBlocked && BD_isInputBlocked() && !(typeof invOpen !== 'undefined' && invOpen)) return; if (typeof invOpen !== 'undefined' && invOpen) closeInventory(); else openInventory(); } catch (e) {} }), bar.firstChild);
    if (!$('bd-pc-quest')) bar.insertBefore(mkBtn('bd-pc-quest', '📋 임무', '임무 (J)', function () { try { document.dispatchEvent(new KeyboardEvent('keydown', { key: 'j', code: 'KeyJ', bubbles: true, cancelable: true })); } catch (e) {} }), $('bd-pc-bag').nextSibling);
  }
  /* 화면 좌표 → 사거리 안·마우스 아래 대상 */
  function objectsAt(cx, cy) {
    try {
      if (!window.BD_screenRectOfWorld || typeof STAGES === 'undefined' || typeof currentStage === 'undefined') return null;
      var stg = STAGES[Number(currentStage)]; if (!stg) return null;
      var hit = null;
      (stg.objects || []).forEach(function (o) {
        if (!o || o.hidden || o.__bdGone) return;
        var kind = null;
        if (o.interactable === 'hazard' && o.hazardId) { if (window.BD && BD.purified && BD.purified[o.hazardId]) return; kind = 'hazard'; }
        else if (o.resident) kind = 'resident';
        else if (o.interactable === 'shop' || o.interactable === 'bus_stop') kind = 'shop';
        else return;
        var r = BD_screenRectOfWorld(Number(o.rx || 0), Number(o.ry || 0), Number(o.rw || 0.04), Number(o.rh || 0.04)); if (!r) return;
        if (cx >= r.left && cx <= r.left + r.width && cy >= r.top && cy <= r.top + r.height) hit = { o: o, kind: kind };
      });
      return hit;
    } catch (e) { return null; }
  }
  var tipEl = null;
  function tip() { if (!tipEl) { tipEl = document.createElement('div'); tipEl.id = 'bd-pc-tip'; document.body.appendChild(tipEl); } return tipEl; }
  var lastMove = 0, hot = null;
  function onMove(ev) {
    if (!FINE) return;
    var now = Date.now(); if (now - lastMove < 60) return; lastMove = now;
    var cv = $('game-canvas'), t = tip();
    hot = null;
    if (!cv || !gameUp() || inBattle() || panelOpen() || (window.BD_isInputBlocked && BD_isInputBlocked())) { t.style.display = 'none'; if (cv) cv.classList.remove('bd-pc-hot'); return; }
    var h = objectsAt(ev.clientX, ev.clientY);
    if (!h) { t.style.display = 'none'; cv.classList.remove('bd-pc-hot'); return; }
    hot = h;
    var near = false; try { near = !!(window.BD_hasNearbyInteraction && BD_hasNearbyInteraction()); } catch (e) {}
    var label = h.kind === 'hazard' ? '🔍 조사' : h.kind === 'resident' ? '💬 대화' : (h.o.interactable === 'bus_stop' ? '🚌 정류장' : '🏪 상점');
    var name = h.o.label || h.o.npcName || '';
    t.textContent = label + (name ? ' · ' + name.replace(/^주민 · /, '') : '') + (near ? '  (F)' : '  — 클릭하면 걸어가요');
    var z = zoom();
    t.style.left = ((ev.clientX + 14) / z) + 'px'; t.style.top = ((ev.clientY + 16) / z) + 'px'; t.style.display = 'block';
    cv.classList.add('bd-pc-hot');
  }
  function wireCanvas() {
    var cv = $('game-canvas'); if (!cv || cv.__bdPc) return; cv.__bdPc = 1;
    if (!FINE) return;
    /* 0248 의 «사거리 안이면 화면 아무 데나 클릭 → F» 는 끈다(오조작). 그 블록은 이 플래그가 서 있으면 물러난다 */
    window.__bdFloatingTouchV387 = true;
    cv.addEventListener('mousemove', onMove);
    cv.addEventListener('mouseleave', function () { var t = tip(); t.style.display = 'none'; cv.classList.remove('bd-pc-hot'); hot = null; });
    var down = null;
    cv.addEventListener('pointerdown', function (e) { if (e.button !== 0) return; down = { x: e.clientX, y: e.clientY, t: Date.now() }; }, true);
    cv.addEventListener('pointerup', function (e) {
      if (!down) return; var d = down; down = null;
      if (Math.hypot(e.clientX - d.x, e.clientY - d.y) > 12 || Date.now() - d.t > 400) return;
      if (!gameUp() || inBattle() || panelOpen() || (window.BD_isInputBlocked && BD_isInputBlocked())) return;
      var h = objectsAt(e.clientX, e.clientY); if (!h) return;          /* 빈 곳 클릭은 0262(클릭 이동) 몫 */
      var near = false; try { near = !!(window.BD_hasNearbyInteraction && BD_hasNearbyInteraction()); } catch (x) {}
      if (!near) return;                                                 /* 멀면 0262 가 걸어가서 F 를 보낸다 */
      e.preventDefault(); e.stopImmediatePropagation();
      try { if (window.BD_touchInteract) BD_touchInteract(); else document.dispatchEvent(new KeyboardEvent('keydown', { key: 'f', code: 'KeyF', bubbles: true, cancelable: true })); } catch (x) {}
    }, true);
  }

  /* ══════════ A-7. 설정 통합 ══════════ */
  function helpModal() {
    var old = $('bd-pc-help'); if (old) old.remove();
    var d = document.createElement('div'); d.id = 'bd-pc-help';
    d.innerHTML = '<div class="box"><div style="color:#ffd54a;font-weight:800;font-size:17px;text-align:center">🎮 조작법</div>' +
      '<h4>필드</h4><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> / 방향키 이동 · <kbd>F</kbd> 조사·대화·상점·입장 · <kbd>Space</kbd> 대화 넘기기 · 마우스: 대상을 클릭하면 조사·대화, 빈 곳을 클릭하면 걸어가요' +
      '<h4>창</h4><kbd>E</kbd> 가방 · <kbd>J</kbd> 임무 · <kbd>M</kbd> 안전지도 · <kbd>Esc</kbd> 창 닫기 / 일시정지 · <kbd>Shift</kbd>+<kbd>F</kbd> 또는 <kbd>F11</kbd> 전체화면' +
      '<h4>전투</h4><kbd>Q</kbd> 정화 스티커(타이밍 링) · <kbd>E</kbd> 배지 스킬 · <kbd>I</kbd> 아이템 · <kbd>Esc</kbd> 물러나기(두 번) · 미니게임은 방향키·Space' +
      '<button type="button" id="bd-pc-help-close">닫기 (Esc)</button></div>';
    document.body.appendChild(d);
    d.querySelector('#bd-pc-help-close').onclick = function () { d.remove(); };
    d.addEventListener('click', function (e) { if (e.target === d) d.remove(); });
  }
  function decorateSettings() {
    var m = $('bd-settings-modal'); if (!m || m.__bdPc || !vis(m)) return;
    var box = m.querySelector('.bd-modal-box') || m.firstElementChild; if (!box) return;
    m.__bdPc = 1;
    /* 0054 의 조작법 → 현행 버전 */
    var help = m.querySelector('#bd-set-help'); if (help) help.onclick = function () { helpModal(); };
    var closeBtn = m.querySelector('#bd-set-close') || m.querySelector('.bd-modal-close');
    var wrap = document.createElement('div');
    var cur = 'auto'; try { cur = localStorage.getItem('bd_ui_scale_v353') || 'auto'; } catch (e) {}
    var guideOn = true; try { guideOn = (typeof QUEST_GUIDE_ON !== 'undefined') ? QUEST_GUIDE_ON : true; } catch (e) {}
    wrap.innerHTML =
      '<div class="bd-pc-row"><span>🖥 UI 크기</span><span class="seg">' +
        ['auto', '90', '100', '115', '130'].map(function (v) { return '<button type="button" data-uis="' + v + '"' + (cur === v ? ' class="on"' : '') + '>' + (v === 'auto' ? '자동' : v + '%') + '</button>'; }).join('') + '</span></div>' +
      '<div class="bd-pc-row"><span>🧭 길안내</span><button type="button" id="bd-pc-guide"' + (guideOn ? ' class="on"' : '') + '>' + (guideOn ? '켜짐' : '꺼짐') + '</button></div>' +
      '<div class="bd-pc-row"><span>📖 튜토리얼 다시 보기</span><button type="button" id="bd-pc-tuto">다시 보기</button></div>';
    if (closeBtn && closeBtn.parentNode === box) box.insertBefore(wrap, closeBtn); else box.appendChild(wrap);
    wrap.querySelectorAll('[data-uis]').forEach(function (b) {
      b.onclick = function () {
        try { if (window.BD_setUiScale) BD_setUiScale(b.getAttribute('data-uis')); } catch (e) {}
        wrap.querySelectorAll('[data-uis]').forEach(function (x) { x.classList.toggle('on', x === b); });
        syncZoomVar();
      };
    });
    var g = wrap.querySelector('#bd-pc-guide');
    g.onclick = function () { try { var on = (typeof window.BD_toggleQuestGuide === 'function') ? window.BD_toggleQuestGuide() : true; g.textContent = on ? '켜짐' : '꺼짐'; g.classList.toggle('on', !!on); } catch (e) {} };
    wrap.querySelector('#bd-pc-tuto').onclick = function () { try { if (window.BD_resetTutorial) BD_resetTutorial(); toast('📖 다음 «새로 시작»에서 튜토리얼이 처음부터 나와요'); } catch (e) {} };
  }
  /* 타이틀·일시정지의 「설정」도 같은 창으로 */
  function unifySettings() {
    if (window.BD_openTitleOptions && window.BD_openTitleOptions.__bdPc) return;
    var orig = window.BD_openTitleOptions;
    if (typeof orig !== 'function' || !$('bd-settings-btn')) return;
    /* 0054 의 openSettings 는 IIFE 안이라 전역이 아니다 — ⚙ 버튼(클로저 핸들러)을 눌러 같은 창을 연다 */
    var f = function () {
      var b = $('bd-settings-btn');
      try { var old = $('bd-settings-modal'); if (old && old.classList.contains('bd-modal')) old.classList.remove('show'); } catch (e) {}
      if (b) { try { b.click(); } catch (e) { orig.apply(this, arguments); } } else orig.apply(this, arguments);
      setTimeout(decorateSettings, 0);
    };
    f.__bdPc = 1; f.__v353 = true; f.__orig = orig;
    window.BD_openTitleOptions = f;
  }

  /* ══════════ A-8. zoom 변수 ══════════ */
  var lastZoomVar = '';
  function syncZoomVar() {
    try {
      var z = String(zoom());
      if (z === lastZoomVar) return;
      lastZoomVar = z;
      root.style.setProperty('--bd-zoom', z);
      /* 타이틀 버튼 좌표는 0053 이 배경 이미지 표시 영역 기준으로 계산한다 — 높이가 바뀌었으니 다시 맞추게 한다 */
      setTimeout(function () { try { window.dispatchEvent(new Event('resize')); } catch (e) {} }, 30);
    } catch (e) {}
  }

  /* ══════════ A-9. 포커스 ══════════ */
  function focusables(scope) {
    var sel = 'button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])';
    return Array.prototype.filter.call((scope || document).querySelectorAll(sel), function (el) {
      if (el.disabled || el.tabIndex < 0 && !el.hasAttribute('tabindex')) return false;
      if (!vis(el)) return false;
      var r = el.getBoundingClientRect(); var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      if (cx < 0 || cy < 0 || cx > innerWidth || cy > innerHeight) return false;
      var e = document.elementFromPoint(cx, cy);
      return !!(e && (e === el || el.contains(e) || e.contains(el)));
    });
  }
  window.addEventListener('keydown', function (e) {
    if (e.key !== 'Tab' || !FINE) return;
    try {
      if (window.__bdCreditsOpen) return;
      var top = topModal();
      var scope = top ? top.el : document;
      var list = focusables(scope); if (!list.length) return;
      var i = list.indexOf(document.activeElement);
      var n = e.shiftKey ? (i <= 0 ? list.length - 1 : i - 1) : (i < 0 || i >= list.length - 1 ? 0 : i + 1);
      e.preventDefault(); e.stopImmediatePropagation();
      list[n].focus();
    } catch (x) {}
  }, true);

  /* ══════════ B-1. 데스크톱 글자 하한 ══════════ */
  var FLOOR_SEL = ['#bd-district-minimap *', '#bd-keybar kbd', '#bd-keybar', '.xp-num', '.hsr-act .hsr-ad', '#bd-quest-hud .bd-hud-head',
    '#bd-quest-hud .bd-nav-guide-direction', '.bd-end-card-region', '.bd-end-card-name', '#bd-map-v342 .bd-map-foot', '#bd-map-v342 .bd-map-legend',
    '.bd-quest-icons', '#bd-hp-dom *', '.hsr-info *'].join(',');
  function floorTick() {
    if (!FINE || !gameUp()) return;
    var z = zoom(), MIN = 12;
    document.querySelectorAll(FLOOR_SEL).forEach(function (el) {
      try {
        if (!el.offsetHeight) return;
        var fs = parseFloat(getComputedStyle(el).fontSize) || 0; if (!fs) return;
        var screen = fs * z;
        if (screen < MIN - 0.2) { el.style.setProperty('font-size', (MIN / z).toFixed(2) + 'px', 'important'); el.__bdFloored = 1; }
      } catch (e) {}
    });
  }

  /* ══════════ B-9. J/M 물리 키 ══════════ */
  window.addEventListener('keydown', function (e) {
    try {
      if (e.__bdPcCode || e.ctrlKey || e.altKey || e.metaKey) return;
      var map = { KeyJ: 'j', KeyM: 'm' }; var want = map[e.code]; if (!want) return;
      if ((e.key || '').toLowerCase() === want) return;
      var ev = new KeyboardEvent('keydown', { key: want, code: e.code, bubbles: true, cancelable: true }); ev.__bdPcCode = 1;
      e.preventDefault(); e.stopImmediatePropagation(); document.dispatchEvent(ev);
    } catch (x) {}
  }, true);

  /* ══════════ 부팅·틱 ══════════ */
  function boot() {
    wireDialogueClick(); wirePlaceCard(); wireFlee(); mountButtons(); wireCanvas(); unifySettings(); syncZoomVar();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  window.addEventListener('load', boot);
  window.addEventListener('resize', syncZoomVar);
  /* B-7(최소) — 클리어 세이브가 있으면 타이틀에 완주 표식. 저장 슬롯을 덮어쓰기 전에 «이미 한 번 완주했다»가 보이게 */
  function titleBadge() {
    try {
      if (!onTitle()) return;
      var t = $('bd-title-screen'); if (!t || $('bd-pc-clear')) return;
      var cleared = !!(window.BD_PROGRESS && BD_PROGRESS.story && BD_PROGRESS.story.storyPhase === 'cleared');
      /* 클리어 상태는 슬롯(fantasyRPG_save 의 auto/0~2, bongdam_guardian_slot_N)의 story 스냅샷에 남는다 — 아무 슬롯이든 하나면 표식 */
      if (!cleared) {
        try {
          var keys = ['fantasyRPG_save', 'bongdam_guardian_v160', 'bongdam_guardian_slot_0', 'bongdam_guardian_slot_1', 'bongdam_guardian_slot_2'];
          for (var i = 0; i < keys.length && !cleared; i++) { var raw = localStorage.getItem(keys[i]); if (raw && /"storyPhase":"cleared"/.test(raw)) cleared = true; }
        } catch (e) {}
      }
      if (!cleared) return;
      var b = document.createElement('div'); b.id = 'bd-pc-clear';
      b.style.cssText = 'position:absolute;right:22px;bottom:16px;z-index:2;font-size:13px;font-weight:800;color:#ffe08a;background:rgba(10,14,26,.6);border:1px solid rgba(255,216,107,.5);border-radius:999px;padding:5px 12px;pointer-events:none';
      b.textContent = '✔ 봉담 안전지도 완성 — 이어하기로 자유 탐험';
      t.appendChild(b);
    } catch (e) {}
  }
  /* (v399e 검수) 타이틀 화면에서 연 설정에는 «← 메인 메뉴로 돌아가기»가 의미 없다(붉은 초기화 버튼 옆이라 위험 동작처럼 읽힘) — 열릴 때마다 판정 */
  function settingsMainBtn() { try { var m = $('bd-settings-modal'); if (!m || !vis(m)) return; var mainBtn = m.querySelector('#bd-set-main'); if (!mainBtn) return; var t = $('bd-title-screen'); var titleOn = !!(t && vis(t)); mainBtn.style.display = titleOn ? 'none' : ''; } catch (e) {} }
  var tick = function () { boot(); keybarTick(); floorTick(); decorateSettings(); settingsMainBtn(); titleBadge(); };
  if (window.BD_addTick) BD_addTick(tick, 400); else setInterval(tick, 400);

  window.BD_PC399 = { fine: FINE, topModal: topModal, panelOpen: panelOpen, help: helpModal, hot: function () { return hot; } };
})();
