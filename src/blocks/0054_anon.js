
// =====================================================================
// (v160) 설정 메뉴 · BGM 슬롯 · 세로화면 안내
// =====================================================================
(function(){
"use strict";
const SET_KEY = 'bongdam_settings_v160';
const DEF = { dlg:'normal', bgm:0.6, sfx:1.0 };
let S = Object.assign({}, DEF);
try{ const raw = localStorage.getItem(SET_KEY); if(raw) S = Object.assign({}, DEF, JSON.parse(raw)); }catch(e){}
function save(){ try{ localStorage.setItem(SET_KEY, JSON.stringify(S)); }catch(e){} }

// ── 전역 훅 ──
window.BD_dlgInterval = function(){ return { slow:48, normal:28, fast:12 }[S.dlg] || 28; };
window.BD_sfxVol = function(){ return Math.max(0, Math.min(1, S.sfx)); };

// ── BGM 슬롯 매니저 ──
//  각 슬롯에 음원 URL(또는 dataURI)만 넣으면 그 장면에서 자동 재생된다.
//  임시 음원이 없으면 무음 — 최종 음원 확보 시 여기만 교체하면 됨.
window.BD_BGM_SLOTS = {
  title:null, house:null, field:null, tension:null, battle:null, boss:null, ending:null,
};
const BDBgm = (function(){
  let audio = null, curSlot = null;
  function play(slot){
    curSlot = slot;
    const url = window.BD_BGM_SLOTS[slot];
    if(!audio){ audio = new Audio(); audio.loop = true; }
    if(!url){ try{ audio.pause(); }catch(e){} return; }
    if(audio.src !== url){ audio.src = url; }
    audio.volume = Math.max(0, Math.min(1, S.bgm));
    audio.play().catch(function(){});
  }
  function stop(){ if(audio){ try{ audio.pause(); }catch(e){} } curSlot=null; }
  function setVol(v){ S.bgm = v; save(); if(audio) audio.volume = Math.max(0, Math.min(1, v)); }
  return { play:play, stop:stop, setVol:setVol, cur:function(){return curSlot;} };
})();
window.BD_Bgm = BDBgm;
// 전투 진입/종료 훅 (기존 함수 래핑)
(function(){
  try{
    if(window.HSR && typeof HSR.start === 'function'){
      const _origStart = HSR.start;
      HSR.start = function(){ _origStart.apply(this, arguments); try{ BDBgm.play(HSR._isBoss ? 'boss' : 'battle'); }catch(e){} };
    }
  }catch(e){}
})();

// ── 설정 버튼 (우상단 고정 톱니) ──
const gear = document.createElement('button');
gear.id = 'bd-settings-btn';
gear.textContent = '⚙️';
gear.title = '설정';
gear.style.cssText = 'position:fixed;top:14px;right:14px;z-index:3500;width:38px;height:38px;border-radius:50%;'
  +'background:rgba(15,19,32,0.85);border:1px solid rgba(255,255,255,0.25);color:#e7ecf5;font-size:17px;cursor:pointer;';
document.body.appendChild(gear);

function pctBar(id, label, val){
  return '<div style="margin:10px 0 4px;color:#cbd5e1;font-size:13px;">'+label+' <span id="'+id+'-v" style="color:#ffd54a">'+Math.round(val*100)+'%</span></div>'
    + '<input id="'+id+'" type="range" min="0" max="100" value="'+Math.round(val*100)+'" style="width:100%;">';
}
// (v236) 네이티브 confirm()/alert() 대체 모달
//  샌드박스 iframe·일부 인앱 브라우저·'추가 대화상자 차단' 상태에서는 confirm()이
//  대화상자를 띄우지 않고 곧바로 false를 반환한다. 그러면 아래 초기화 버튼이
//  에러도 없이 아무 반응이 없어 "버튼이 안 눌린다"로 보인다. DOM 모달로 대체한다.
function bdSetModal(opts){
  var old = document.getElementById('bd-set-dialog');
  if(old) old.remove();
  var d = document.createElement('div');
  d.id = 'bd-set-dialog';
  d.style.cssText = 'position:fixed;inset:0;z-index:4200;background:rgba(0,0,0,0.62);'
    + 'display:flex;align-items:center;justify-content:center;padding:18px;';
  var yes = opts.onYes
    ? '<button id="bd-sd-yes" style="width:100%;padding:10px;border-radius:8px;cursor:pointer;'
      + 'background:rgba(120,30,30,0.45);border:1px solid rgba(255,120,120,0.5);color:#fca5a5;font-weight:700;">'
      + (opts.yesLabel || '확인') + '</button>'
    : '';
  d.innerHTML = '<div style="background:rgba(15,19,32,0.98);border:1px solid #c8902a;border-radius:14px;'
    + 'padding:22px;width:330px;max-height:80vh;overflow:auto;text-align:center;box-shadow:0 12px 50px rgba(0,0,0,0.6);">'
    + '<div style="color:#ffd54a;font-weight:800;font-size:17px;margin-bottom:10px;">' + opts.title + '</div>'
    + '<div style="color:#cbd5e1;font-size:13px;line-height:1.7;margin-bottom:16px;text-align:' + (opts.align || 'center') + ';">'
    + opts.body + '</div>'
    + yes
    + '<button id="bd-sd-no" style="width:100%;margin-top:8px;padding:10px;border-radius:8px;cursor:pointer;'
    + 'background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.2);color:#e7ecf5;">'
    + (opts.noLabel || '닫기') + '</button>'
    + '</div>';
  document.body.appendChild(d);
  d.addEventListener('click', function(e){ if(e.target === d) d.remove(); });
  d.querySelector('#bd-sd-no').onclick = function(){ d.remove(); };
  if(opts.onYes){
    d.querySelector('#bd-sd-yes').onclick = function(){
      d.remove();
      try { opts.onYes(); } catch(e){}
    };
  }
  return d;
}

function openSettings(){
  let m = document.getElementById('bd-settings-modal');
  if(m) m.remove();
  m = document.createElement('div');
  m.id = 'bd-settings-modal';
  m.style.cssText = 'position:fixed;inset:0;z-index:3600;background:rgba(0,0,0,0.55);display:flex;align-items:center;justify-content:center;';
  const spdBtn = (k, label)=>'<button class="bd-set-dlg" data-k="'+k+'" style="flex:1;padding:8px;border-radius:8px;cursor:pointer;'
    +'background:'+(S.dlg===k?'rgba(255,213,74,0.2)':'rgba(255,255,255,0.06)')+';border:1px solid '+(S.dlg===k?'#ffd54a':'rgba(255,255,255,0.2)')+';color:'+(S.dlg===k?'#ffd54a':'#e7ecf5')+';">'+label+'</button>';
  m.innerHTML = '<div style="background:rgba(15,19,32,0.98);border:1px solid #c8902a;border-radius:14px;padding:20px 22px;width:320px;max-height:85vh;overflow:auto;box-shadow:0 12px 50px rgba(0,0,0,0.6);">'
    + '<div style="color:#ffd54a;font-weight:800;font-size:17px;margin-bottom:12px;text-align:center;">⚙️ 설정</div>'
    + '<div style="color:#cbd5e1;font-size:13px;margin-bottom:4px;">대사 속도</div>'
    + '<div style="display:flex;gap:6px;">'+spdBtn('slow','느림')+spdBtn('normal','보통')+spdBtn('fast','빠름')+'</div>'
    + pctBar('bd-set-bgm','🎵 배경음 음량', S.bgm)
    + pctBar('bd-set-sfx','🔊 효과음 음량', S.sfx)
    + '<button id="bd-set-mute" style="width:100%;margin-top:12px;padding:9px;border-radius:8px;cursor:pointer;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.2);color:#e7ecf5;">'
      + (window.BDSound && BDSound.isEnabled() ? '🔇 전체 음소거' : '🔊 소리 켜기') + '</button>'
    + '<button id="bd-set-full" style="width:100%;margin-top:8px;padding:9px;border-radius:8px;cursor:pointer;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.2);color:#e7ecf5;">⛶ 전체 화면 전환</button>'
    + '<button id="bd-set-help" style="width:100%;margin-top:8px;padding:9px;border-radius:8px;cursor:pointer;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.2);color:#e7ecf5;">🎮 조작법 확인</button>'
    + '<button id="bd-set-reset" style="width:100%;margin-top:8px;padding:9px;border-radius:8px;cursor:pointer;background:rgba(120,30,30,0.35);border:1px solid rgba(255,120,120,0.4);color:#fca5a5;">🗑 저장 데이터 초기화</button>'
    + '<button id="bd-set-main" style="width:100%;margin:10px 0 4px;padding:9px;border-radius:9px;background:rgba(120,60,60,.35);border:1px solid rgba(255,140,120,.5);color:#ffb4a0;font-weight:700;cursor:pointer;">← 메인 메뉴로 돌아가기</button><button id="bd-set-close" style="width:100%;margin-top:12px;padding:9px;border-radius:8px;cursor:pointer;background:rgba(255,213,74,0.15);border:1px solid #ffd54a;color:#ffd54a;font-weight:700;">닫기</button>'
    + '</div>';
  document.body.appendChild(m);
  m.addEventListener('click', function(e){ if(e.target===m) m.remove(); });
  m.querySelectorAll('.bd-set-dlg').forEach(function(b){
    b.onclick = function(){ S.dlg = b.dataset.k; save(); openSettings(); };
  });
  const bgmEl = m.querySelector('#bd-set-bgm');
  bgmEl.oninput = function(){ BDBgm.setVol(bgmEl.value/100); m.querySelector('#bd-set-bgm-v').textContent = bgmEl.value+'%'; };
  const sfxEl = m.querySelector('#bd-set-sfx');
  sfxEl.oninput = function(){ S.sfx = sfxEl.value/100; save(); m.querySelector('#bd-set-sfx-v').textContent = sfxEl.value+'%';
    try{ if(window.BDSound && BDSound.select) BDSound.select(); }catch(e){} };
  m.querySelector('#bd-set-mute').onclick = function(){
    if(window.BDSound){ BDSound.setEnabled(!BDSound.isEnabled()); }
    openSettings();
  };
  m.querySelector('#bd-set-full').onclick = function(){
    try{
      if(typeof window.BD_toggleFullscreen === 'function') window.BD_toggleFullscreen();
      else if(document.fullscreenElement){ document.exitFullscreen(); }
      else { document.documentElement.requestFullscreen(); }
    }catch(e){}
  };
  m.querySelector('#bd-set-help').onclick = function(){
    // (v236) alert()도 차단 환경에서 무반응 — DOM 모달로 대체
    bdSetModal({
      title: '\uD83C\uDFAE \uC870\uC791\uBC95',
      align: 'left',
      body: '<b>[\uD544\uB4DC]</b><br>WASD/\uBC29\uD5A5\uD0A4: \uC774\uB3D9 &middot; F: \uC870\uC0AC/\uB300\uD654 &middot; E: \uC778\uBCA4\uD1A0\uB9AC<br>'
          + '\uBAA8\uBC14\uC77C: \uD654\uBA74 \uC870\uC774\uC2A4\uD2F1 + \uBC84\uD2BC<br><br>'
          + '<b>[\uC804\uD22C]</b><br>Q: \uAE30\uBCF8 \uACF5\uACA9 (SP +1)<br>E: \uBC30\uC9C0 \uC2A4\uD0AC (SP 1 \uC18C\uBE44)<br>'
          + 'I: \uC544\uC774\uD15C &middot; 1: \uD544\uC0B4\uAE30 (\uAC8C\uC774\uC9C0 100%)<br>'
          + '\uB3D9\uB8CC \uD544\uC0B4\uAE30: \uC67C\uCABD \uD30C\uD2F0 \uCE74\uB4DC\uC758 \u300C\uD544\uC0B4\u300D \uBC84\uD2BC<br>'
          + '\uBCF4\uC2A4\uC804: \uC624\uB978\uCABD \uBD80\uC704 \uCE74\uB4DC\uB97C \uB20C\uB7EC \uACF5\uACA9 \uB300\uC0C1 \uC120\uD0DD'
    });
  };
  m.querySelector('#bd-set-main').onclick = function(){
    // 저장 후 페이지를 다시 불러오면 전투/대화/일시정지 등 남은 레이어가 모두 정리되고
    // 초기 부팅 흐름에서 타이틀이 확실하게 다시 표시된다.
    try { m.remove(); } catch(e){}
    try { if (typeof window.BD_save === 'function') window.BD_save(); } catch(e){}
    try { window._gameSaved = true; } catch(e){}
    location.reload();
  };
  m.querySelector('#bd-set-reset').onclick = function(){
    // (v236) confirm() 2회 → DOM 모달 1회. confirm()이 차단된 환경에서
    //  버튼이 조용히 죽던 문제 수정.
    bdSetModal({
      title: '\uD83D\uDDD1 \uC800\uC7A5 \uB370\uC774\uD130 \uCD08\uAE30\uD654',
      body: '\uC800\uC7A5\uB41C \uBAA8\uB4E0 \uC9C4\uD589 \uC0C1\uD669\uC774 \uC0AC\uB77C\uC9C0\uBA70<br>\uB418\uB3CC\uB9B4 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.<br><br>\uC815\uB9D0 \uCD08\uAE30\uD654\uD560\uAE4C\uC694?',
      yesLabel: '\uCD08\uAE30\uD654',
      noLabel: '\uCDE8\uC18C',
      onYes: function(){
        try{ if(typeof window.BD_resetProgress === 'function') window.BD_resetProgress(true); }catch(e){}
        try{ localStorage.removeItem(SET_KEY); }catch(e){}
        try{ localStorage.removeItem('fantasyRPG_save'); }catch(e){}
        location.reload();
      }
    });
  };
  m.querySelector('#bd-set-close').onclick = function(){ m.remove(); };
}
gear.addEventListener('click', openSettings);

// ── 세로화면 안내 (모바일) ──
function checkOrientation(){
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.maxTouchPoints||0) > 1;
  const isPortrait = window.innerHeight > window.innerWidth;
  let ov = document.getElementById('bd-rotate-overlay');
  if(isMobile && isPortrait){
    if(!ov){
      ov = document.createElement('div');
      ov.id = 'bd-rotate-overlay';
      ov.style.cssText = 'position:fixed;inset:0;z-index:5000;background:rgba(8,10,18,0.97);display:flex;flex-direction:column;'
        +'align-items:center;justify-content:center;color:#e7ecf5;text-align:center;padding:24px;';
      ov.innerHTML = '<div style="font-size:56px;animation:bdrot 1.6s ease-in-out infinite;">📱</div>'
        + '<style>@keyframes bdrot{0%,100%{transform:rotate(0)}50%{transform:rotate(90deg)}}</style>'
        + '<div style="font-size:18px;font-weight:700;margin-top:16px;">기기를 가로로 돌려주세요</div>'
        + '<div style="font-size:13px;color:#9fb0c8;margin-top:8px;">봉담 지킴이는 가로 화면에 최적화되어 있어요</div>';
      document.body.appendChild(ov);
    }
    ov.style.display = 'flex';
  } else if(ov){
    ov.style.display = 'none';
  }
}
window.addEventListener('resize', checkOrientation);
window.addEventListener('orientationchange', checkOrientation);
checkOrientation();
})();
