/* (v398) 모바일 안내 개선 — 키보드 문구 치환 + 전체화면 유도 강화. 터치 기기에서만 동작.
 *
 * ── 문제 1: 키보드가 없는데 키보드로 안내한다 ─────────────────────
 *   «🔍 가까이에서 F 키를 눌러 조사해 보세요» · «E 키로 인벤토리를 열고»
 *   «W A S D / 방향키» · «Space 대화 진행» · «닫기 (ESC)» · «아무 키나 눌러 시작하기»
 *   확인 결과 미니게임 자체는 터치를 지원한다(0082 touchstart 5건, 0088 pointerdown 8건).
 *   즉 «기능»이 아니라 «문구»만 틀렸다. 그래서 코드는 건드리지 않고 화면에 나오는
 *   텍스트만 바꾼다.
 *
 *   텍스트 노드만 손대므로 HTML 구조·이벤트 핸들러는 그대로다.
 *
 * ── 문제 2: 전체화면 유도가 약하다 ────────────────────────────────
 *   현재 안내는 92x23px 알약 하나다(탭 타겟 기준 미달). 주소창이 차지하는 높이가
 *   폰 가로에서 결정적이므로 더 눈에 띄어야 한다.
 *   · 안드로이드: 전체화면 진입 후 가로 방향 잠금까지 시도한다.
 *   · 아이폰: Safari 가 Fullscreen API 를 지원하지 않는다(iPad 는 지원).
 *     자동 전환이 원천적으로 불가능하므로, «무엇을 하면 되는지»를 정확히 알려주는
 *     쪽으로 간다. 위로 살짝 쓸어 올리면 툴바가 접힌다는 안내가 실제로 유효하다.
 */
(function () {
  'use strict';

  function isTouch() {
    try { return (navigator.maxTouchPoints || 0) > 0 || matchMedia('(pointer: coarse)').matches; }
    catch (e) { return false; }
  }
  if (!isTouch()) return;

  /* ────────────────── 1. 키보드 문구 → 터치 문구 ────────────────── */

  /* 구체적인 것부터 먼저. 앞의 규칙이 뒤의 규칙 대상을 미리 먹지 않도록 순서가 중요하다. */
  var MAP = [
    [/W\/S\s*이동\s*·\s*A\/D\s*회전\s*·\s*Q\/E\s*좌우\s*이동\s*·\s*Space\s*발사/g,
      '화면 드래그로 이동 · 좌우 버튼으로 회전 · 화면 탭으로 발사'],
    [/가운데\s*칸에\s*오는\s*방향키를\s*순서대로/g, '가운데 칸에 오는 화살표를 순서대로 탭'],
    [/순서대로\s*방향키를\s*빠르게/g, '순서대로 화살표를 빠르게 탭'],
    [/가까이에서\s*F\s*키를\s*눌러/g, '가까이에서 조사 버튼을 눌러'],
    [/F\s*키를\s*눌러/g, '조사 버튼을 눌러'],
    [/F\s*버튼을\s*눌러/g, '조사 버튼을 눌러'],
    [/E\s*키로/g, '가방 버튼으로'],
    [/E\s*키/g, '가방 버튼'],
    [/아무\s*키나\s*눌러/g, '화면을 탭해'],
    [/스페이스\s*\/\s*엔터로도/g, '화면 탭으로도'],
    [/W\s*A\s*S\s*D\s*(\/|또는)\s*방향키/g, '화면 드래그'],
    [/WASD\s*(\/|또는)\s*방향키/g, '화면 드래그'],
    [/\[\s*정화\s*스티커\s*Q\s*\]/g, '[정화 스티커]'],
    [/클릭\s*\/\s*Space\s*\/\s*E\s*로\s*계속/g, '화면을 탭해서 계속'],
    [/\[\s*클릭\s*\/\s*Space\s*\/\s*F\s*\]/g, '[화면 탭]'],
    [/Space\s*\(또는\s*화면\)를/g, '화면을'],
    [/Space\s*\/\s*화면\s*탭/g, '화면 탭'],
    [/Space\s*로\s*일시정지/g, '화면 탭으로 일시정지'],
    [/닫기\s*\(\s*ESC\s*\)/g, '닫기'],
    [/ESC\s*—\s*/g, ''],
    [/확인했으면\s*E\s*나\s*ESC\s*로\s*가방을\s*닫아요/g, '확인했으면 닫기 버튼으로 가방을 닫아요'],
    [/<?\s*Spacebar\s*>?/g, '화면 탭'],
    [/\bSpace\b/g, '화면 탭'],
    [/\bESC\b/g, '닫기']
  ];

  var SKIP = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, INPUT: 1, CANVAS: 1, NOSCRIPT: 1 };

  function convert(s) {
    var out = s;
    for (var i = 0; i < MAP.length; i++) out = out.replace(MAP[i][0], MAP[i][1]);
    return out;
  }

  var busy = false;
  function sweep(root) {
    if (busy) return;
    busy = true;
    try {
      var w = document.createTreeWalker(root || document.body, NodeFilter.SHOW_TEXT, {
        acceptNode: function (n) {
          if (!n.nodeValue || n.nodeValue.length < 2) return NodeFilter.FILTER_REJECT;
          var p = n.parentElement;
          if (!p || SKIP[p.tagName]) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        }
      });
      var n, hits = [];
      while ((n = w.nextNode())) {
        var v = convert(n.nodeValue);
        if (v !== n.nodeValue) hits.push([n, v]);
      }
      for (var i = 0; i < hits.length; i++) hits[i][0].nodeValue = hits[i][1];
    } catch (e) {} finally { busy = false; }
  }

  /* <kbd>W</kbd><kbd>A</kbd>... 처럼 키 캡으로 쪼개진 표기는 통째로 치환한다 */
  function kbd() {
    try {
      var rows = document.querySelectorAll('tr');
      for (var i = 0; i < rows.length; i++) {
        var keys = rows[i].querySelectorAll('kbd');
        if (!keys.length) continue;
        var txt = rows[i].textContent.replace(/\s+/g, '');
        var cell = keys[0].parentElement;
        if (/^(W|A|S|D){2,}/.test(txt) || /WASD/.test(txt)) cell.textContent = '화면 드래그';
        else if (/Space/i.test(txt)) cell.textContent = '화면 탭';
        else if (/^E$/i.test(keys[0].textContent.trim())) cell.textContent = '가방 버튼';
        else if (/^F$/i.test(keys[0].textContent.trim())) cell.textContent = '조사 버튼';
      }
    } catch (e) {}
  }

  function run() { sweep(document.body); kbd(); }

  /* ────────────────── 2. 전체화면 유도 강화 ────────────────── */

  var IOS = (function () {
    try {
      return /iP(hone|od)/.test(navigator.platform || '') ||
        (/iPad|Macintosh/.test(navigator.userAgent) && (navigator.maxTouchPoints || 0) > 1);
    } catch (e) { return false; }
  })();

  function fsSupported() {
    var el = document.documentElement;
    return !!(el.requestFullscreen || el.webkitRequestFullscreen);
  }

  function enlargeOffer() {
    var b = document.getElementById('bd-fullscreen-return');
    if (!b || b.__bdBig) return;
    b.__bdBig = 1;
    /* 92x23 은 탭 타겟 기준(44)에 한참 못 미친다 — 눌리는 크기로 키운다 */
    b.style.minHeight = '40px';
    b.style.padding = '9px 16px';
    b.style.fontSize = '14px';
    b.style.fontWeight = '700';
    b.style.borderRadius = '999px';
  }

  /* 전체화면 진입 뒤에만 방향 잠금이 허용된다(안드로이드). 성공하면 «가로로 돌려주세요»
     오버레이 자체가 뜰 일이 없다. iOS 는 지원하지 않으므로 조용히 실패한다. */
  function lockLandscape() {
    try {
      if (screen.orientation && screen.orientation.lock) {
        screen.orientation.lock('landscape').catch(function () {});
      }
    } catch (e) {}
  }

  document.addEventListener('fullscreenchange', function () {
    if (document.fullscreenElement) { lockLandscape(); }
    else { setTimeout(enlargeOffer, 300); }   /* 나가면 다시 눈에 띄게 */
  });

  /* iOS: 자동 전체화면이 원천적으로 불가능하다. 대신 «툴바를 접는 법»을 알려준다.
     한 번 보여주고 다시 띄우지 않는다. */
  function iosHint() {
    if (!IOS || fsSupported()) return;
    try { if (sessionStorage.getItem('bd_ios_fs_hint')) return; sessionStorage.setItem('bd_ios_fs_hint', '1'); } catch (e) {}
    var d = document.createElement('div');
    d.style.cssText =
      'position:fixed;left:50%;bottom:14px;transform:translateX(-50%);z-index:2147483000;' +
      'background:rgba(13,19,36,.96);color:#ffd86b;border:1px solid rgba(255,216,107,.5);' +
      'border-radius:14px;padding:11px 16px;font-size:13px;line-height:1.5;max-width:88vw;' +
      'text-align:center;box-shadow:0 8px 24px rgba(0,0,0,.5);';
    d.innerHTML = '📱 화면을 <b>위로 살짝 쓸어올리면</b> 주소창이 접혀 더 넓게 보여요' +
      '<div style="margin-top:8px"><button style="padding:7px 18px;min-height:38px;border:0;border-radius:999px;' +
      'background:#ffd86b;color:#1b2136;font-weight:800;font-size:13px">알겠어요</button></div>';
    d.querySelector('button').addEventListener('click', function () { d.remove(); });
    setTimeout(function () { if (d.parentNode) d.remove(); }, 12000);
    (document.body || document.documentElement).appendChild(d);
  }

  /* ────────────────── 실행 ────────────────── */
  function boot() { run(); enlargeOffer(); setTimeout(iosHint, 2500); }

  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', boot);
  else boot();
  addEventListener('load', boot);

  /* 대사·안내는 게임 진행 중 계속 새로 그려진다 — 변경을 감시해 다시 훑는다 */
  if (window.MutationObserver) {
    var t = null;
    new MutationObserver(function () {
      if (busy) return;
      clearTimeout(t); t = setTimeout(run, 120);
    }).observe(document.documentElement, { childList: true, subtree: true, characterData: true });
  }

  window.BD_GUIDE = { run: run, ios: IOS, fsSupported: fsSupported() };
})();
