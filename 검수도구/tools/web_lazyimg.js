/* (v398) 웹판 이미지 지연 로딩 심 — webbuild.js 가 웹 빌드에만 주입한다.
 *
 * 배경:
 *   개발 빌드는 에셋이 data URI 라 최상위 스코프의 `new Image(); img.src = ...` 가
 *   네트워크 요청을 만들지 않는다. 그러나 웹 빌드는 externalize 로 `assets/NAME` URL 이
 *   되므로, 스크립트가 파싱되는 순간 수백 개 요청이 한꺼번에 발사된다.
 *   측정 결과 13KB 파일이 stalled 15초를 겪었다(download 는 1ms). 대역폭이 아니라
 *   메인 스레드/요청 큐 포화가 원인.
 *
 * 동작:
 *   1. `assets/` 로 시작하는 src 대입을 보류하고 목록에 넣는다.
 *   2. 실제로 그리려는 순간(drawImage) 또는 누군가 로드를 기다리기 시작하면 발사한다.
 *   3. 부팅이 끝난 뒤 유휴 시간에 남은 것을 조금씩 채운다(나중 장면 팝인 방지).
 *
 * 안전장치:
 *   onload/onerror 가 걸린 이미지는 부팅 로직이 완료를 기다리는 대상이므로
 *   절대 보류하지 않는다. (예: 0017 의 loadAllImages 는 remaining 카운터가 0이 될 때
 *   콜백을 부른다 — 하나라도 보류하면 게임이 영영 시작되지 않는다.)
 */
(function () {
  'use strict';
  if (window.__BD_LAZY) return;

  var proto = window.HTMLImageElement && window.HTMLImageElement.prototype;
  if (!proto) return;
  var dSrc = Object.getOwnPropertyDescriptor(proto, 'src');
  if (!dSrc || !dSrc.set || !dSrc.get) return;

  var EXT = /^assets\//;          // 외부화된 에셋만 대상 (data:·blob:·절대 URL 은 그대로)
  var PENDING = [];
  var stats = { deferred: 0, armed: 0, eager: 0 };

  function arm(img) {
    var u = img.__bdPend;
    if (u == null) return false;
    img.__bdPend = null;
    var i = PENDING.indexOf(img);
    if (i >= 0) PENDING.splice(i, 1);
    stats.armed++;
    try { dSrc.set.call(img, u); } catch (e) {}
    return true;
  }

  /* 완료를 기다리는 주체가 있는가 — 있으면 보류 금지 */
  function waited(img) { return !!(img.onload || img.onerror || img.__bdWait); }

  Object.defineProperty(proto, 'src', {
    configurable: true, enumerable: dSrc.enumerable,
    get: function () { return this.__bdPend != null ? this.__bdPend : dSrc.get.call(this); },
    set: function (v) {
      var s = String(v == null ? '' : v);
      /* 문서에 붙어 있는 <img> 는 캔버스로 그려지지 않으므로 drawImage 로 발사될 일이 없다.
         (예: #dialogue-portrait — 보류하면 대사 초상화가 영영 표시되지 않는다.) */
      if (EXT.test(s) && !waited(this) && !this.isConnected) {
        this.__bdPend = s; PENDING.push(this); stats.deferred++;
        return;
      }
      stats.eager++;
      dSrc.set.call(this, v);
    }
  });

  /* 보류 중인 이미지는 실제로 '완료되지 않은' 상태다 — complete 를 그렇게 보고해야
     `if (img.complete && img.naturalWidth)` 형태의 가드가 오작동하지 않는다. */
  var dCom = Object.getOwnPropertyDescriptor(proto, 'complete')
          || Object.getOwnPropertyDescriptor(window.HTMLImageElement.prototype, 'complete');
  if (dCom && dCom.get) {
    Object.defineProperty(proto, 'complete', {
      configurable: true, enumerable: dCom.enumerable,
      get: function () { return this.__bdPend != null ? false : dCom.get.call(this); }
    });
  }

  /* onload/onerror 가 나중에 걸리는 경우(src 를 먼저 대입한 코드)도 즉시 발사 */
  ['onload', 'onerror'].forEach(function (k) {
    var d = Object.getOwnPropertyDescriptor(proto, k)
         || (window.HTMLElement && Object.getOwnPropertyDescriptor(window.HTMLElement.prototype, k));
    if (!d || !d.set) return;
    Object.defineProperty(proto, k, {
      configurable: true, enumerable: d.enumerable,
      get: function () { return d.get ? d.get.call(this) : null; },
      set: function (v) { if (v) { this.__bdWait = 1; arm(this); } d.set.call(this, v); }
    });
  });

  /* addEventListener('load'|'error') 도 '기다리기 시작' 신호 */
  var addEL = proto.addEventListener;
  proto.addEventListener = function (type) {
    if (type === 'load' || type === 'error') { this.__bdWait = 1; arm(this); }
    return addEL.apply(this, arguments);
  };

  /* decode() 호출 = 지금 필요하다는 뜻 */
  if (proto.decode) {
    var oDec = proto.decode;
    proto.decode = function () { arm(this); return oDec.apply(this, arguments); };
  }

  /* 화면에 그리려는 순간 발사. 아직 안 받았으므로 이 프레임은 건너뛰고,
     로드되면 다음 프레임부터 정상 렌더된다. */
  var C = window.CanvasRenderingContext2D;
  if (C && C.prototype && C.prototype.drawImage) {
    var oDraw = C.prototype.drawImage;
    C.prototype.drawImage = function (im) {
      if (im && im.__bdPend != null) { arm(im); return; }
      return oDraw.apply(this, arguments);
    };
  }
  if (window.createImageBitmap) {
    var oBmp = window.createImageBitmap;
    window.createImageBitmap = function (im) { if (im && im.__bdPend != null) arm(im); return oBmp.apply(this, arguments); };
  }

  /* 부팅 후 유휴 시간에 남은 것을 조금씩 채운다.
     데이터 절약 모드·저속 회선에서는 하지 않는다(요청 시에만 로드). */
  var conn = navigator.connection || {};
  var thrifty = !!conn.saveData || /(^|-)2g$/.test(conn.effectiveType || '');
  var idle = window.requestIdleCallback || function (f) {
    return setTimeout(function () { f({ timeRemaining: function () { return 8; } }); }, 48);
  };
  function drain(dl) {
    var n = 0;
    while (PENDING.length && n < 3 && (!dl || dl.timeRemaining() > 4)) { arm(PENDING[0]); n++; }
    if (PENDING.length) idle(drain);
  }
  if (!thrifty) {
    addEventListener('load', function () { setTimeout(function () { idle(drain); }, 2500); });
  }

  /* 떨어진 상태로 src 가 지정된 뒤 나중에 문서에 삽입되는 <img> 도 놓치지 않는다. */
  if (window.MutationObserver) {
    new MutationObserver(function (recs) {
      for (var i = 0; i < recs.length; i++) {
        var added = recs[i].addedNodes;
        for (var j = 0; j < added.length; j++) {
          var n = added[j];
          if (!n || n.nodeType !== 1) continue;
          if (n.tagName === 'IMG') arm(n);
          else if (n.querySelectorAll) {
            var q = n.querySelectorAll('img');
            for (var k = 0; k < q.length; k++) arm(q[k]);
          }
        }
      }
    }).observe(document.documentElement, { childList: true, subtree: true });
  }

  window.__BD_LAZY = {
    stats: stats,
    pending: function () { return PENDING.length; },
    flush: function () { while (PENDING.length) arm(PENDING[0]); }   /* QA·디버그용 */
  };
})();
