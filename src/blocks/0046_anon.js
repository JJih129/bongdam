
/* (v240k) 파일 고정 바 — 저장·게시용 HTML·JSON 백업/복원을 배치 목록 하단에 항상 노출.
   원본 버튼(bge-save / bge-web-export / bge-export / bge-import-btn)을 프록시 클릭한다. */
(function () {
  'use strict';
  function init() {
    var H = document.getElementById('bge-hierarchy');
    if (!H) { setTimeout(init, 600); return; }
    // 저장된 드래그 위치(inline style)가 도킹 CSS를 덮지 않게 청소
    ['bge-hierarchy', 'bge-panel'].forEach(function (id) {
      var el = document.getElementById(id); if (!el) return;
      ['left','top','right','bottom','width','height'].forEach(function (k) { el.style[k] = ''; });
    });
    if (document.getElementById('bge-file-dock')) return;
    var f = document.createElement('div');
    f.id = 'bge-file-dock';
    // (v240m) 지금 적용된 맵 데이터의 저장 시각 표시 — "내가 보고 있는 배치가 언제 것인지"
    var stampTxt = '';
    try {
      var p2 = function(n){ return (n<10?'0':'')+n; };
      var fmt = function(ms){ var d=new Date(ms); return p2(d.getMonth()+1)+'/'+p2(d.getDate())+' '+p2(d.getHours())+':'+p2(d.getMinutes()); };
      var lsOk = true, raw = null;
      try { raw = localStorage.getItem('bongdam_rpg_editor_data_v5_2_quest'); } catch (eL) { lsOk = false; }
      var lsAt = 0; try { if (raw) lsAt = Date.parse(JSON.parse(raw).savedAt) || 0; } catch (e2) { }
      var bkAt = window.__BD_BAKED_AT || 0;
      // (v248) 진단 표기 — 로컬 저장분과 파일에 구운 시각을 함께 보여줘
      //  '저장했는데 재시작하면 옛것' 증상이 저장소 소실(시크릿/다른 브라우저)인지 즉석 판별 가능
      if (!lsOk) stampTxt = '⚠ 저장소 차단 환경 — 편집이 유지되지 않습니다 (구운 ' + (bkAt?fmt(bkAt):'-') + ' 표시 중)';
      else if (lsAt) stampTxt = fmt(lsAt) + ' 저장분' + (bkAt ? ' · 파일에 구운 것: ' + fmt(bkAt) : '');
      else if (bkAt) stampTxt = '구운 ' + fmt(bkAt) + ' (이 브라우저 첫 실행)';
      else stampTxt = '(기본 맵)';
    } catch (e) { }
    f.innerHTML =
        '<div id="bge-stage-tabs" style="flex:1 1 100%;display:flex;gap:4px;flex-wrap:wrap;margin-bottom:2px;"></div>'
      + '<div style="flex:1 1 100%;font-size:11px;color:#c9b98a;opacity:.9;">🗺 맵 데이터: ' + stampTxt + '</div>'
      + '<button type="button" data-proxy="bge-save">💾 저장</button>'
      + '<button type="button" class="bge-fd-pub" data-proxy="bge-web-export">🌐 게시용 HTML</button>'
      + '<button type="button" data-proxy="bge-export">⬇ JSON 백업</button>'
      + '<button type="button" data-proxy="bge-import-btn">⬆ JSON 복원</button>'
      + '<button type="button" id="bge-hide-bg-btn">🖼 배경 숨김</button>'
      + '<button type="button" id="bge-diag-btn" title="저장 이력·좌표 추적 기록을 파일로 저장">🩺 진단 로그</button>'
      + '<button type="button" id="bge-reset-btn" title="이 파일에 구운 배치로 완전히 초기화 (현재 브라우저 저장은 자동 백업)" style="color:#ffb3b3;">⟳ 이 파일 기준 초기화</button>';
    // (v254) 스테이지 즉시 전환 탭 — 모든 맵 한 클릭 이동
    try {
      var tabs = f.querySelector('#bge-stage-tabs');
      var sel = document.getElementById('bge-stage-select');
      if (tabs && sel) {
        var rebuild = function () {
          tabs.innerHTML = '';
          Array.prototype.forEach.call(sel.options, function (op) {
            var bt = document.createElement('button');
            bt.type = 'button'; bt.textContent = op.value; bt.title = op.textContent;
            bt.style.cssText = 'padding:2px 7px;font-size:11px;' + (op.value === sel.value ? 'background:#5a4a1e;' : '');
            bt.addEventListener('click', function () {
              sel.value = op.value;
              sel.dispatchEvent(new Event('change', { bubbles: true }));
              rebuild();
            });
            tabs.appendChild(bt);
          });
        };
        rebuild();
        sel.addEventListener('change', rebuild);
      }
    } catch (eTb) { }
    f.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      if (b.closest('#bge-stage-tabs')) return;   // (v255) 스테이지 탭은 자체 핸들러 사용
      if (b.id === 'bge-reset-btn') {
        if (!confirm('이 파일에 구워진 배치로 완전히 초기화할까요?\n(지금 브라우저에 저장된 맵은 _prev로 백업됩니다)')) return;
        try {
          var K = 'bongdam_rpg_editor_data_v5_2_quest';
          try { var old = localStorage.getItem(K); if (old) localStorage.setItem(K + '_prev', old); } catch (e1) { }
          localStorage.removeItem(K);
          localStorage.removeItem(K + '_bakeGen');
          // (v265) 구형 프로젝트 키(옛 배치 자동복원의 원흉)도 백업 후 정리
          try {
            var LK = 'bongdam_rpg_editor_project_v5_2_quest';
            var lv = localStorage.getItem(LK);
            if (lv) { localStorage.setItem(LK + '_prev', lv); localStorage.removeItem(LK); }
          } catch (eL) { }
        } catch (e0) { }
        location.reload();
        return;
      }
      if (b.id === 'bge-diag-btn') {
        try {
          var txt = '=== 저장 기록 (누가 언제 카페 rx를 얼마로 저장했나) ===\n'
            + JSON.stringify(window.__BD_SAVELOG || [], null, 1)
            + '\n\n=== 화면(메모리) 카페 rx 변화 ===\n'
            + JSON.stringify(window.__BD_LIVELOG || [], null, 1);
          var bl = new Blob([txt], { type: 'text/plain' });
          var a = document.createElement('a');
          a.href = URL.createObjectURL(bl);
          a.download = '봉담_진단로그_' + new Date().toISOString().slice(5,16).replace(/[:T]/g,'') + '.txt';
          a.click();
        } catch (err) { alert('진단 로그 저장 실패: ' + err); }
        return;
      }
      if (b.id === 'bge-hide-bg-btn') {
        // (v251) 배경 일러스트에 그려진 건물·소품과 실제 편집 오브젝트를 구분해 보는 모드
        window.__bgeHideBg = !window.__bgeHideBg;
        b.textContent = window.__bgeHideBg ? '🖼 배경 표시' : '🖼 배경 숨김';
        b.style.background = window.__bgeHideBg ? '#5a4a1e' : '';
        return;
      }
      var src = document.getElementById(b.getAttribute('data-proxy'));
      if (src) src.click();
      // (v261) 프록시 대상이 없으면 조용히 무시 (탭 등 자체 핸들러 버튼과의 충돌 경고 제거)
    });
    H.appendChild(f);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function(){ setTimeout(init, 900); });
  else setTimeout(init, 900);

  /* ── (v240k-2) 유니티식 씬 뷰: 에디터 ON 동안 캔버스를 독 사이 중앙에 비율 유지로 피팅 ── */
  var _cvBackup = null, _wasOn = false;
  function sceneFit() {
    var cv = document.getElementById('game-canvas'); if (!cv) return;
    var L = 332, R = 362, T = 92, B = 8;
    var gw = window.innerWidth - L - R, gh = window.innerHeight - T - B;
    if (gw < 120 || gh < 120) return;
    var ar = (cv.width && cv.height) ? (cv.width / cv.height) : (16 / 9);
    var w = gw, h = w / ar;
    if (h > gh) { h = gh; w = h * ar; }
    var x = L + (gw - w) / 2, y = T + (gh - h) / 2;
    cv.style.position = 'fixed';
    cv.style.left = Math.round(x) + 'px';
    cv.style.top = Math.round(y) + 'px';
    cv.style.width = Math.round(w) + 'px';
    cv.style.height = Math.round(h) + 'px';
    cv.style.right = 'auto'; cv.style.bottom = 'auto';
    cv.style.zIndex = '1';
    cv.style.boxShadow = '0 0 0 1px rgba(255,255,255,.08), 0 12px 34px rgba(0,0,0,.5)';
  }
  function sceneRestore() {
    var cv = document.getElementById('game-canvas'); if (!cv) return;
    if (_cvBackup !== null) cv.style.cssText = _cvBackup;
  }
  function watch() {
    var on = false;
    try { on = !!(window.BongdamEditor && BongdamEditor.state && BongdamEditor.state.enabled); } catch (e) { }
    if (on !== _wasOn) {
      _wasOn = on;
      document.body.classList.toggle('bge-editor-on', on);
      var cv = document.getElementById('game-canvas');
      if (on) { if (cv && _cvBackup === null) _cvBackup = cv.style.cssText; sceneFit();
        // 자료함(v3) 패널이 초기 상태로 열려 인스펙터를 덮는 것 방지 — 대화 탭에서만 연다
        try { var V = document.getElementById('bge-v3-panel');
          if (V && window.BongdamEditor.state.activeTab !== 'dialog') V.classList.remove('bge-open'); } catch (e) { }
      } else { sceneRestore(); }
    } else if (on) {
      sceneFit();   // 리사이즈·패널 변화 추종 (300ms 폴링이라 부담 없음)
    }
  }
  if (window.BD_addTick) BD_addTick(watch, 300);
  else setInterval(watch, 300);
  window.addEventListener('resize', function(){ if (_wasOn) sceneFit(); });
})();
