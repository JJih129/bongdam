/* (v398) 우상단 HUD 버튼 통합 + 안내 강조.
 *
 * ── 문제 1: 지도 버튼이 «두 개»라 가방과 겹친다 ────────────────────
 *   조사 결과 같은 일을 하는 지도 버튼이 둘이었다.
 *     #bd-mb-map        shell.html 의 메뉴줄 항목. onclick=BD_openSafetyMap        ← 후속(v390)
 *     #bd-touch-mapbtn  0190(v316)이 만드는 떠 있는 버튼. 같은 BD_openSafetyMap    ← 레거시
 *
 *   메뉴줄 #bd-menu-btns 는 right:62px 에서 항목이 늘 때마다 왼쪽으로 자라 62~158 을 쓰는데,
 *   레거시 버튼은 right:134px 에 고정이라 134~158 이 겹친다.
 *   실측(780x360): 가방 (657,11,34x34) · 레거시 지도 (663,9,30x30) — 거의 완전히 포개진다.
 *
 *   0252 헤더에 «같은 #bd-menu-btns 를 0078·0219·0245 가 나눠 만지던 것을 통합»이라고
 *   적혀 있다. 지도만 그 통합에서 빠져 옛 버튼이 남았다. 여기서 레거시를 걷어내 완성한다.
 *   (처음에는 레거시 버튼을 줄 «안»으로 옮기려 했으나, 그러면 줄에 지도가 둘이 된다.
 *    줄에 이미 항목이 있다는 것을 확인하고 방향을 바꿨다.)
 *
 * ── 문제 2: 튜토리얼이 «가방/지도»를 말해도 어느 버튼인지 모른다 ────
 *   안내 문구에 그 단어가 나오면 해당 버튼을 잠깐 강조한다.
 *   특정 튜토리얼 시스템에 묶지 않고 «화면에 그 말이 보이면»으로 판단하므로,
 *   담이·토스트·대사창 어디서 나오든 동작한다.
 */
(function () {
  'use strict';

  var ROW = 'bd-menu-btns';
  var MAP = 'bd-touch-mapbtn';
  var BAG = 'bd-bag-top';

  function el(id) { return document.getElementById(id); }
  function seen(e) {
    if (!e) return false;
    try {
      var s = getComputedStyle(e);
      if (s.display === 'none' || s.visibility === 'hidden') return false;
      var r = e.getBoundingClientRect();
      return r.width > 2 && r.height > 2;
    } catch (err) { return false; }
  }

  /* ── ① 중복된 지도 버튼 정리 ──
     조사해 보니 지도 버튼이 «두 개»였다.
       #bd-touch-mapbtn  0190(v316) 이 만드는 떠 있는 버튼 (position:fixed; right:134px)
       #bd-mb-map        shell.html 의 메뉴줄 항목, onclick 이 같은 BD_openSafetyMap
     후속인 메뉴바(v390)가 지도·장비·수첩을 줄 항목으로 통합했는데 0190 의 옛 버튼만 남아,
     줄이 왼쪽으로 자라면서 겹쳐 버렸다(줄 62~158 / 옛 버튼 134~180).

     그래서 옛 버튼을 숨기고 «메뉴줄의 지도 항목»을 쓴다. 다만 그 항목은 ☰ 를 접으면
     같이 접히므로, 가방(#bd-bag-top)처럼 항시 노출로 승격해 한 번에 누를 수 있게 한다.
     0190 은 700ms 마다 옛 버튼의 display 를 되돌리므로 이 블록도 계속 눌러 준다. */
  var MB_MAP = 'bd-mb-map';
  function consolidate() {
    try {
      var legacy = el(MAP);
      var mbMap = el(MB_MAP);
      var row = el(ROW);
      if (!row) return;

      /* 옛 떠 있는 지도 버튼은 숨긴다 — 메뉴줄 항목이 대신한다 */
      if (legacy && mbMap && legacy.style.display !== 'none') legacy.style.display = 'none';

      /* 지도 항목을 «항시 노출»로 승격한다.
         0252 의 접기 로직은 #bd-mb-toggle 과 #bd-bag-top 만 예외로 두고 나머지를 숨기는데,
         그 판정이 id 하드코딩이라 밖에서 목록에 낄 수가 없다. 인라인 style 로 되돌리면
         0252 가 다음 주기에 다시 숨겨 서로 싸운다. 그래서 CSS !important 로 이긴다.
         전투 중에는 원래대로 숨겨야 하므로 <html> 클래스로 켜고 끈다. */
      var gs = document.getElementById('game-screen');
      var playing = !!(gs && gs.style.display === 'block');
      var inBattle = !!(window.HSR && window.HSR.active);
      var on = playing && !inBattle && !!mbMap;
      var de = document.documentElement;
      if (on !== de.classList.contains('bd-map-always')) de.classList.toggle('bd-map-always', on);
    } catch (e) {}
  }

  /* ── ② 안내 문구에 맞춰 버튼 강조 ── */
  var CSS_ID = 'bd-hud-hilite-v398';
  function css() {
    if (document.getElementById(CSS_ID)) return;
    var st = document.createElement('style');
    st.id = CSS_ID;
    st.textContent =
      '@keyframes bdHudPulse{0%,100%{box-shadow:0 0 0 0 rgba(255,216,107,.85)}' +
      '50%{box-shadow:0 0 0 8px rgba(255,216,107,0)}}' +
      '.bd-hud-hilite{animation:bdHudPulse 1.1s ease-out infinite;' +
      'border-color:rgba(255,216,107,1)!important;position:relative;z-index:1201;}' +
      /* 지도 항목 항시 노출 — 0252 의 접기(인라인 display:none)를 이겨야 하므로 !important */
      'html.bd-map-always #bd-mb-map{display:inline-flex!important;align-items:center;' +
      'justify-content:center;width:44px;height:44px;padding:0;flex:0 0 auto;}';
    (document.head || document.documentElement).appendChild(st);
  }

  function setHilite(id, on) {
    var b = el(id);
    if (!b) return;
    if (on) b.classList.add('bd-hud-hilite');
    else b.classList.remove('bd-hud-hilite');
  }

  /* 화면에 실제로 «보이는» 안내 문구를 모은다 — 대사·토스트·담이·힌트 어디든 */
  function visibleGuideText() {
    var out = '';
    var sel = '#bd-dami-hud,#bd-toast,#dialogue-overlay,#dialogue-box,#bd-keybar,.bd-toast,#bd-quest-hud';
    var list = document.querySelectorAll(sel);
    for (var i = 0; i < list.length; i++) if (seen(list[i])) out += ' ' + (list[i].textContent || '');
    return out;
  }

  var until = { bag: 0, map: 0 };
  function hiliteTick() {
    try {
      css();
      var t = visibleGuideText();
      var now = Date.now();
      /* «가방/인벤토리/스킬 장착» 이 보이면 가방을, «지도/안전지도» 면 지도를 */
      if (/가방|인벤토리/.test(t)) until.bag = now + 4000;
      if (/안전지도|지도를|지도에서|지도 버튼/.test(t)) until.map = now + 4000;
      setHilite(BAG, now < until.bag && seen(el(BAG)));
      setHilite('bd-mb-map', now < until.map && seen(el('bd-mb-map')));
    } catch (e) {}
  }

  function run() { css(); consolidate(); hiliteTick(); }

  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', run);
  else run();
  addEventListener('load', run);
  /* 0190 이 700ms 주기로 버튼을 다시 만들 수 있어 그보다 촘촘히 확인한다 */
  setInterval(run, 500);
  addEventListener('resize', function () { setTimeout(consolidate, 80); });

  window.BD_HUD = {
    consolidate: consolidate,
    hilite: function (which, ms) {                    /* 외부에서 직접 강조할 때 */
      var t = Date.now() + (ms || 4000);
      if (which === 'bag') until.bag = t;
      if (which === 'map') until.map = t;
      hiliteTick();
    },
    rects: function () {
      var o = {};
      [ROW, MB_MAP, MAP, BAG, 'bd-mb-toggle', 'bd-settings-btn'].forEach(function (id) {
        var e = el(id); if (!e) { o[id] = '없음'; return; }
        var r = e.getBoundingClientRect();
        o[id] = { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height),
                  부모: e.parentElement ? (e.parentElement.id || e.parentElement.tagName) : '-' };
      });
      return o;
    }
  };
})();
