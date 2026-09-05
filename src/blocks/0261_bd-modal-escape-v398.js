/* (v398) 좁은 화면 탈출구 보장 — 닫기 버튼이 화면 밖으로 밀려 갇히는 것을 막는다.
 *
 * 실측(874x300, 아이폰 가로 + 주소창):
 *   안전 수첩 : 카드 격자가 107px 잘리고 #bd-codex-close 가 top 466 / 뷰포트 300 —
 *               «완전히 화면 밖». ESC 키가 없는 모바일에서는 빠져나갈 수단이 사라진다.
 *   설정      : 저장·취소·조작법 확인·저장 데이터 초기화가 전부 화면 밖
 *
 * 처음에는 «모달을 찾아» 우상단에 ✕ 를 붙이려 했으나, 패널마다 클래스 규약이 달라
 * 셀렉터로 모달을 잡는 방식은 실패했다(보이는 모달 0개로 잡힘).
 * 그래서 모달을 식별하지 않고 «화면 밖으로 밀린 닫기 버튼»을 직접 찾는다.
 * 대상이 없으면 아무것도 하지 않으므로 평소 화면에는 영향이 없다.
 */
(function () {
  'use strict';

  var ID = 'bd-modal-escape-v398-btn';
  var SIZE = 44;

  function visible(el) {
    try {
      var s = getComputedStyle(el);
      if (s.display === 'none' || s.visibility === 'hidden' || parseFloat(s.opacity) < 0.15) return false;
      if (s.pointerEvents === 'none') return false;
      var r = el.getBoundingClientRect();
      if (r.width < 6 || r.height < 6) return false;
      for (var p = el.parentElement; p; p = p.parentElement) {
        var ps = getComputedStyle(p);
        if (ps.display === 'none' || ps.visibility === 'hidden' || parseFloat(ps.opacity) < 0.15) return false;
      }
      return true;
    } catch (e) { return false; }
  }

  function offScreen(el) {
    var r = el.getBoundingClientRect();
    /* 세로로 완전히 벗어났거나, 절반 이상 잘린 경우 */
    if (r.top >= innerHeight - 2 || r.bottom <= 2) return true;
    if (r.left >= innerWidth - 2 || r.right <= 2) return true;
    var visH = Math.min(r.bottom, innerHeight) - Math.max(r.top, 0);
    return visH < r.height * 0.6;
  }

  /* 지금 화면에서 «눌러야 하는데 못 누르는» 닫기 버튼 */
  function strandedClose() {
    var list = document.querySelectorAll('button, .bd-modal-close, .close-btn, [role=button]');
    var best = null;
    for (var i = 0; i < list.length; i++) {
      var c = list[i];
      var txt = ((c.textContent || '') + ' ' + (c.id || '')).trim();
      if (!/닫기|✕|×|close/i.test(txt)) continue;
      if (!visible(c)) continue;
      if (!offScreen(c)) return null;      /* 화면 안에 멀쩡한 닫기가 있으면 개입하지 않는다 */
      best = c;
    }
    return best;
  }

  function ensureBtn() {
    var b = document.getElementById(ID);
    if (b) return b;
    b = document.createElement('button');
    b.id = ID;
    b.type = 'button';
    b.textContent = '✕';
    b.setAttribute('aria-label', '닫기');
    /* 우상단은 설정(⚙️)과 겹치므로 좌상단에 둔다 */
    b.style.cssText =
      'position:fixed;left:8px;top:8px;z-index:2147483000;width:' + SIZE + 'px;height:' + SIZE + 'px;' +
      'border-radius:50%;border:1px solid rgba(255,216,107,.6);background:rgba(13,19,36,.96);' +
      'color:#ffd86b;font:800 19px/1 sans-serif;cursor:pointer;display:none;padding:0;' +
      'box-shadow:0 4px 14px rgba(0,0,0,.55);-webkit-tap-highlight-color:transparent;';
    b.addEventListener('click', function (ev) {
      ev.stopPropagation();
      var t = b.__bdTarget;
      /* .click() 만으로는 안 닫히는 패널이 있다(핸들러가 pointer/touch 에 걸려 있음).
         실제 입력과 같은 순서로 이벤트를 흘려 준다. */
      if (t) {
        try {
          var r = t.getBoundingClientRect();
          var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
          ['pointerdown', 'mousedown', 'touchstart', 'pointerup', 'mouseup', 'touchend', 'click'].forEach(function (type) {
            var E = type.indexOf('pointer') === 0 ? PointerEvent : (type.indexOf('touch') === 0 ? null : MouseEvent);
            if (!E) {
              try { t.dispatchEvent(new Event(type, { bubbles: true, cancelable: true })); } catch (e) {}
              return;
            }
            t.dispatchEvent(new E(type, { bubbles: true, cancelable: true, clientX: cx, clientY: cy, button: 0, pointerId: 1, isPrimary: true }));
          });
        } catch (e) { try { t.click(); } catch (e2) {} }
      }
      /* 그래도 안 닫히는 경우를 대비해 ESC 도 흘려 준다 */
      try {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, which: 27, bubbles: true }));
      } catch (e) {}
      b.style.display = 'none';
    });
    (document.body || document.documentElement).appendChild(b);
    return b;
  }

  function tick() {
    try {
      var t = strandedClose();
      var b = document.getElementById(ID);
      if (!t) { if (b) b.style.display = 'none'; return; }
      b = ensureBtn();
      b.__bdTarget = t;
      /* body 에 zoom 이 걸려 있어 44px 로 선언해도 화면상 24~29px 이 된다.
         탭 타겟은 «화면상» 44px 여야 하므로 zoom 으로 나눠 되돌린다. */
      var z = 1;
      try { z = parseFloat(getComputedStyle(document.body).zoom) || 1; if (!(z > 0)) z = 1; } catch (e) {}
      var px = Math.round(SIZE / z);
      b.style.width = px + 'px';
      b.style.height = px + 'px';
      b.style.fontSize = Math.round(19 / z) + 'px';
      b.style.left = Math.round(8 / z) + 'px';
      b.style.top = Math.round(8 / z) + 'px';
      b.style.display = 'block';
    } catch (e) {}
  }

  /* ── 스크롤 힌트 ──
     설정·안전지도·안전 수첩은 «스크롤이 되긴 한다». 실측:
       설정      보임 252 / 전체 536 (284px 숨음) — 저장 버튼은 스크롤하면 눌린다
       안전지도  보임 256 / 전체 312 (56px 숨음)
     즉 «못 누른다»가 아니라 «더 있다는 걸 알 방법이 없다»가 문제다.
     좁은 화면에서는 스크롤바도 안 보이고 잘린 카드 한 줄이 우연히 힌트가 될 뿐이다.
     그래서 숨은 내용이 있는 동안만 아래쪽에 표시를 띄운다. */
  var HINT_ID = 'bd-scroll-hint-v398';

  function biggestHidden() {
    var best = null, bestHidden = 24;      /* 이 정도는 잘림으로 안 친다 */
    var list = document.querySelectorAll('div,section');
    for (var i = 0; i < list.length; i++) {
      var el = list[i];
      if (!visible(el)) continue;
      var s = getComputedStyle(el);
      if (!/(auto|scroll)/.test(s.overflowY + ' ' + s.overflow)) continue;
      var hidden = el.scrollHeight - el.clientHeight - el.scrollTop;
      if (hidden <= bestHidden) continue;
      var r = el.getBoundingClientRect();
      if (r.width < 120 || r.height < 60) continue;
      if (r.bottom < 40 || r.top > innerHeight - 20) continue;
      bestHidden = hidden; best = el;
    }
    return best;
  }

  function ensureHint() {
    var d = document.getElementById(HINT_ID);
    if (d) return d;
    d = document.createElement('div');
    d.id = HINT_ID;
    d.textContent = '▾ 아래로 더 있어요';
    d.style.cssText =
      'position:fixed;z-index:2147482999;pointer-events:none;display:none;' +
      'background:rgba(13,19,36,.94);color:#ffd86b;border:1px solid rgba(255,216,107,.5);' +
      'border-radius:999px;padding:4px 12px;white-space:nowrap;' +
      'box-shadow:0 3px 10px rgba(0,0,0,.5);';
    (document.body || document.documentElement).appendChild(d);
    return d;
  }

  function hintTick() {
    try {
      var el = biggestHidden();
      var d = document.getElementById(HINT_ID);
      if (!el) { if (d) d.style.display = 'none'; return; }
      d = ensureHint();
      var z = 1;
      try { z = parseFloat(getComputedStyle(document.body).zoom) || 1; if (!(z > 0)) z = 1; } catch (e) {}
      d.style.fontSize = Math.round(12 / z) + 'px';
      var r = el.getBoundingClientRect();
      /* 컨테이너 하단 안쪽에 붙인다 */
      var w = d.getBoundingClientRect().width || 120;
      d.style.left = Math.round((r.left + r.width / 2 - w / 2) / z) + 'px';
      d.style.top = Math.round((Math.min(r.bottom, innerHeight) - 26) / z) + 'px';
      d.style.display = 'block';
    } catch (e) {}
  }

  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', function () { setInterval(tick, 500); setInterval(hintTick, 600); });
  else { setInterval(tick, 500); setInterval(hintTick, 600); }

  window.BD_MODAL_ESCAPE = { tick: tick, id: ID, find: strandedClose, hint: hintTick };
})();
