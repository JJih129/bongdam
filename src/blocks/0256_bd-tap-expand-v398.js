/* (v398) 터치 탭 보정 — 겉모습은 그대로 두고 «빗나간 탭»을 가까운 작은 버튼으로 보낸다.
 *
 * 왜 필요한가 (780x360 가로 실측):
 *   #bd-settings-btn 25x25 · #bd-touch-mapbtn 30x30 · #bd-mb-toggle 34x34 · #bd-bag-top 34x34
 *   화면에 보이는 클릭 요소 9개 중 8개가 44px 미만.
 *   (Apple HIG 44x44pt / Android Material 48x48dp 권장)
 *   유일하게 #tc-btn-f(51x51)만 정상 — 터치 컨트롤만 대응되고 HUD 크롬은 안 된 상태다.
 *
 * 왜 크기를 키우거나 ::after 를 덮지 않는가:
 *   · 우상단 버튼들은 간격이 0~14px 로 밀집해 있어 일괄로 키우면 서로 겹친다.
 *   · 투명 ::after 는 스태킹에 좌우된다. 실제로 #bd-mb-toggle 의 ::after 는
 *     #bd-title-frame 아래로 깔려 무효였고, z-index 를 올리면 이번엔 모달 위를 덮어
 *     정상 탭을 삼킬 위험이 생긴다.
 *
 * 그래서: 스태킹과 무관하게 «탭이 아무것도 아닌 곳에 떨어졌을 때만» 가장 가까운
 *   작은 버튼으로 클릭을 전달한다. 실제 UI 요소를 눌렀을 때는 절대 개입하지 않으므로
 *   기존 동작을 가로챌 일이 없다.
 *
 * 드래그 보호: 이 게임은 화면을 «누른 채 드래그»해서 이동한다. 그래서 짧고 움직임이
 *   적은 입력(탭)만 보정하고, 드래그로 판단되면 손대지 않는다.
 */
(function () {
  'use strict';

  var SLOP = 22;        // 버튼 경계에서 이만큼(화면상 px) 밖까지 탭을 주워 온다
  var MOVE_MAX = 10;    // 이보다 많이 움직이면 드래그로 보고 무시
  var TIME_MAX = 350;   // 이보다 오래 누르면 탭이 아님

  function isTouch() {
    try { return (navigator.maxTouchPoints || 0) > 0 || matchMedia('(pointer: coarse)').matches; }
    catch (e) { return false; }
  }
  if (!isTouch()) return;   /* 마우스 환경은 현재 크기로 충분하다 */

  /* 보정 대상 — 작아서 놓치기 쉬운 HUD 크롬 버튼들 */
  var SELECTORS = [
    '#bd-settings-btn', '#bd-touch-mapbtn', '#bd-mb-toggle',
    '#bd-bag-top', '#bd-fullscreen-return'
  ].join(',');

  /* 이미 상호작용 대상인가 — 이런 걸 눌렀으면 개입하지 않는다 */
  function interactive(el) {
    for (var e = el; e && e !== document.body; e = e.parentElement) {
      if (!e.tagName) break;
      var t = e.tagName.toLowerCase();
      if (t === 'button' || t === 'a' || t === 'input' || t === 'select' || t === 'textarea') return true;
      if (e.getAttribute && (e.getAttribute('role') === 'button' || e.hasAttribute('onclick'))) return true;
      if (e.className && /\b(btn|tc-btn|modal|bd-modal)\b/.test(String(e.className))) return true;
    }
    return false;
  }

  function visible(el) {
    try {
      var s = getComputedStyle(el), r = el.getBoundingClientRect();
      if (s.display === 'none' || s.visibility === 'hidden' || parseFloat(s.opacity) < 0.05) return false;
      if (s.pointerEvents === 'none') return false;
      return r.width > 2 && r.height > 2 && r.bottom > 0 && r.right > 0
          && r.top < innerHeight && r.left < innerWidth;
    } catch (e) { return false; }
  }

  /* 점에서 사각형까지의 거리(안이면 0) */
  function dist(x, y, r) {
    var dx = Math.max(r.left - x, 0, x - r.right);
    var dy = Math.max(r.top - y, 0, y - r.bottom);
    return Math.hypot(dx, dy);
  }

  function nearestSmall(x, y) {
    var best = null, bestD = SLOP + 1;
    var els = document.querySelectorAll(SELECTORS);
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (!visible(el)) continue;
      var r = el.getBoundingClientRect();
      if (r.width >= 44 && r.height >= 44) continue;   /* 이미 충분히 크면 보정 불필요 */
      var d = dist(x, y, r);
      if (d > 0 && d < bestD) { bestD = d; best = el; }   /* d>0: 진짜 빗나간 것만 */
    }
    return best;
  }

  var startX = 0, startY = 0, startT = 0, armed = false;

  addEventListener('pointerdown', function (e) {
    if (!e.isPrimary) { armed = false; return; }
    startX = e.clientX; startY = e.clientY; startT = Date.now();
    /* 시작부터 실제 UI 위였다면 아예 대상이 아니다 */
    armed = !interactive(e.target);
  }, true);

  addEventListener('pointerup', function (e) {
    if (!armed || !e.isPrimary) return;
    armed = false;
    if (Date.now() - startT > TIME_MAX) return;                       /* 길게 누름 */
    if (Math.hypot(e.clientX - startX, e.clientY - startY) > MOVE_MAX) return;  /* 드래그 */

    var under = document.elementFromPoint(e.clientX, e.clientY);
    if (under && interactive(under)) return;                          /* 이미 뭔가 눌렸다 */

    var target = nearestSmall(e.clientX, e.clientY);
    if (!target) return;

    var r = target.getBoundingClientRect();
    var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    try {
      target.dispatchEvent(new MouseEvent('click', {
        bubbles: true, cancelable: true, clientX: cx, clientY: cy, button: 0
      }));
    } catch (err) {}
  }, true);

  addEventListener('pointercancel', function () { armed = false; }, true);

  window.BD_TAP = {
    slop: SLOP,
    /* QA: 현재 보정 대상과 크기를 확인 */
    inspect: function () {
      return [].slice.call(document.querySelectorAll(SELECTORS)).filter(visible).map(function (el) {
        var r = el.getBoundingClientRect();
        return { id: el.id, size: Math.round(r.width) + 'x' + Math.round(r.height),
                 보정대상: r.width < 44 || r.height < 44 };
      });
    }
  };
})();
