
/* (v44) UI 전역 조정 — 대화 LD·대화창·전투 화면을 '수치 한 세트'로 일괄 오버라이드.
   화면을 띄워 둘 필요 없음: 값은 항상 저장되고, 해당 화면이 열리는 순간 자동 적용된다.
   전투는 구조가 모두 동일하므로 여기 값 하나가 모든 전투에 똑같이 적용된다. */
(function(){
  'use strict';
  var KEY = 'bd_ui_tune_v1';
  var DEFAULTS = {   // 배포 기본값 — 조정 후 [값 복사]로 주시면 여기 구워드립니다
    ldScale: 1.0, ldX: 0, ldY: 0,          // 대화 일러: 배율 / 가로·세로 이동(%)
    dlgFont: 1.0, dlgHeight: 1.0,           // 대화창: 글자·창 배율 / 최소 높이 배율
    btScene: 1.0, btHero: 1.0, btEnemy: 1.0, btUi: 1.0,   // 전투: 전체 / 주인공 / 적 / 명령 UI
    ldBy: {}                                 // 인물별 오버라이드 { 이름: {s,x,y} }
  };
  var T = null;
  function load(){
    try{ T = Object.assign({}, DEFAULTS, JSON.parse(localStorage.getItem(KEY) || '{}')); }
    catch(e){ T = Object.assign({}, DEFAULTS); }
    if (!T.ldBy || typeof T.ldBy !== 'object') T.ldBy = {};
  }
  function save(){ try{ localStorage.setItem(KEY, JSON.stringify(T)); }catch(e){} }
  load();
  window.BD_UI_TUNE = T;

  function speakerName(){
    var el = document.getElementById('dialogue-name') || document.querySelector('#dialogue-namebox, .dlg-name, [id*="dialogue"][id*="name"]');
    return el ? (el.textContent || '').trim() : '';
  }

  function apply(){
    try{
      // ── 대화 LD ──
      var p = document.getElementById('dialogue-portrait');
      if (p){
        var ov = T.ldBy[speakerName()] || null;
        var s = ov ? ov.s : T.ldScale, x = ov ? ov.x : T.ldX, y = ov ? ov.y : T.ldY;
        p.style.scale = String(s);
        p.style.translate = x + '% ' + y + '%';
        p.style.transformOrigin = 'left bottom';
      }
      // ── 대화창 ──
      var box = document.getElementById('dialogue-box');
      if (box){
        box.style.zoom = String(T.dlgFont);
        box.style.minHeight = (26 * T.dlgHeight / Math.max(0.2, T.dlgFont)) + '%';
      }
      // ── 전투 (모든 전투 공통 — 값 한 세트로 일괄) ──
      var bt = document.getElementById('hsr-battle');
      if (bt) bt.style.zoom = String(T.btScene);
      var hs = document.getElementById('hsr-hero-sprite');
      if (hs){ hs.style.scale = String(T.btHero); hs.style.transformOrigin = 'center bottom'; }
      var es = document.getElementById('hsr-enemy-sprite');
      if (es){ es.style.scale = String(T.btEnemy); es.style.transformOrigin = 'center bottom'; }
      var cmd = document.getElementById('hsr-cmd');
      if (cmd) cmd.style.zoom = String(T.btUi);
      // (v54) 스테이지가 바뀌면 떠 있던 모달(버스 목적지·시설 안내)을 닫는다 — 이동 후 모달 잔존 문제
      try{
        var curSt = (typeof currentStage !== 'undefined') ? Number(currentStage) : null;
        if (window.__bdTuneLastStage === undefined) window.__bdTuneLastStage = curSt;
        if (curSt !== null && window.__bdTuneLastStage !== curSt){
          window.__bdTuneLastStage = curSt;
          var bm = document.getElementById('bd-bus-modal');
          if (bm){ bm.remove(); window.__bdBusModalOpen = false; }
          var fm2 = document.getElementById('bd-district-facility-modal');
          if (fm2 && fm2.classList.contains('open')) fm2.classList.remove('open');
        }
      }catch(eStg){}
      // (v55) 전투 패널 재부모화는 bd-battle-ui-v53 레이어에 일원화 — 이중 관리로 스타일이
      //  틱마다 엎치락뒤치락하던 문제를 정리 (이 자리의 중복 구현 제거)
    }catch(e){}
  }
  setInterval(apply, 300);

  /* ── 조정 패널 ── */
  var FIELDS = [
    ['ldScale','대화 일러 크기', 0.5, 1.8, 0.02],
    ['ldX','대화 일러 좌우(%)', -40, 40, 1],
    ['ldY','대화 일러 상하(%)', -30, 30, 1],
    ['dlgFont','대화창 글자·창 배율', 0.7, 1.5, 0.02],
    ['dlgHeight','대화창 높이 배율', 0.6, 1.8, 0.05],
    ['btScene','전투 화면 전체', 0.7, 1.4, 0.02],
    ['btHero','전투 주인공 크기', 0.6, 1.8, 0.02],
    ['btEnemy','전투 적 크기', 0.6, 1.8, 0.02],
    ['btUi','전투 명령 UI 크기', 0.7, 1.5, 0.02]
  ];
  function buildPanel(){
    if (document.getElementById('bd-uitune-panel')) return;
    var btn = document.createElement('button');
    btn.id = 'bd-uitune-toggle'; btn.textContent = '🎛 UI 조정';
    btn.style.cssText = 'position:fixed;left:10px;bottom:56px;z-index:99998;background:#243244;color:#ffd77a;border:1px solid #ffd77a;border-radius:8px;padding:6px 10px;font-size:12px;cursor:pointer;';
    var pan = document.createElement('div');
    pan.id = 'bd-uitune-panel';
    pan.style.cssText = 'display:none;position:fixed;left:10px;bottom:100px;z-index:99999;background:#141c28;color:#efe6d0;border:1px solid #ffd77a;border-radius:10px;padding:12px 14px;width:262px;font-size:12px;box-shadow:0 8px 30px rgba(0,0,0,.5);max-height:72vh;overflow:auto;';
    var html = '<div style="font-weight:700;color:#ffd77a;margin-bottom:2px">UI 전역 조정</div>' +
      '<div style="opacity:.75;margin-bottom:8px;line-height:1.5">화면을 띄워 둘 필요 없이 값만 정하면, 이후 모든 대화·전투에 똑같이 적용됩니다.</div>';
    FIELDS.forEach(function(f){
      html += '<div style="margin:7px 0 2px">' + f[1] + ' <span id="bd-tv-' + f[0] + '" style="color:#ffd77a"></span></div>' +
        '<input type="range" id="bd-ti-' + f[0] + '" min="' + f[2] + '" max="' + f[3] + '" step="' + f[4] + '" style="width:100%">';
    });
    html += '<div style="display:flex;gap:6px;margin-top:10px;flex-wrap:wrap">' +
      '<button id="bd-tb-speaker" class="bdtb" title="지금 대화 중인 인물에게만 현재 일러 값(크기·위치)을 따로 저장">현재 인물에게만 저장</button>' +
      '<button id="bd-tb-copy" class="bdtb">값 복사</button>' +
      '<button id="bd-tb-reset" class="bdtb">초기화</button></div>' +
      '<style>.bdtb{background:#243244;color:#efe6d0;border:1px solid #56657d;border-radius:6px;padding:5px 8px;font-size:11px;cursor:pointer}.bdtb:hover{border-color:#ffd77a}</style>';
    pan.innerHTML = html;
    document.body.appendChild(btn); document.body.appendChild(pan);
    btn.addEventListener('click', function(){ pan.style.display = pan.style.display === 'none' ? 'block' : 'none'; sync(); });
    function sync(){
      FIELDS.forEach(function(f){
        var i = document.getElementById('bd-ti-' + f[0]); var v = document.getElementById('bd-tv-' + f[0]);
        if (i){ i.value = T[f[0]]; } if (v){ v.textContent = Number(T[f[0]]).toFixed(2).replace(/\.00$/,''); }
      });
    }
    FIELDS.forEach(function(f){
      var i = document.getElementById('bd-ti-' + f[0]);
      i.addEventListener('input', function(){
        T[f[0]] = Number(i.value); save(); apply(); sync();
      });
    });
    document.getElementById('bd-tb-speaker').addEventListener('click', function(){
      var n = speakerName();
      if (!n){ alert('지금 표시 중인 대화 인물이 없습니다. 대화를 띄운 상태에서 눌러 주세요.\n(전역 값은 대화를 안 띄워도 항상 적용됩니다)'); return; }
      T.ldBy[n] = { s: T.ldScale, x: T.ldX, y: T.ldY }; save(); apply();
      alert('「' + n + '」 전용 일러 값으로 저장했습니다. 다른 인물은 전역 값을 따릅니다.');
    });
    document.getElementById('bd-tb-copy').addEventListener('click', function(){
      var s = JSON.stringify(T, null, 1);
      try{ navigator.clipboard.writeText(s); }catch(e){}
      window.prompt('현재 조정값 (복사해서 전달하면 기본값으로 구워드립니다)', s);
    });
    document.getElementById('bd-tb-reset').addEventListener('click', function(){
      T = Object.assign({}, DEFAULTS); T.ldBy = {}; window.BD_UI_TUNE = T; save(); apply(); sync();
    });
    sync();
  }
  var bootIv = setInterval(function(){
    try{ if (document.body){ buildPanel(); clearInterval(bootIv); } }catch(e){}
  }, 800);
})();
